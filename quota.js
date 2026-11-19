import { DurableObject } from "cloudflare:workers";

const WINDOW_MS = 10_000;
const HOLD_SECONDS = 300;
const RECEIPT_SECONDS = 60;

// One SQLite database per verified key. Operators add orders in Data Studio.
export class KeyQuota extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.limit = Number(env.PAID_REQUESTS_PER_10_SECONDS);
    if (!Number.isSafeInteger(this.limit) || this.limit < 1) {
      throw new Error("Invalid paid request limit");
    }
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS account (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        credited INTEGER NOT NULL DEFAULT 0 CHECK (credited BETWEEN 0 AND 9007199254740991),
        used INTEGER NOT NULL DEFAULT 0 CHECK (used BETWEEN 0 AND credited),
        held INTEGER NOT NULL DEFAULT 0 CHECK (held BETWEEN 0 AND credited - used),
        recent TEXT NOT NULL DEFAULT '[]'
      ) STRICT;
      INSERT OR IGNORE INTO account (id) VALUES (1);
      CREATE TABLE IF NOT EXISTS topups (
        order_id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(order_id)) > 0),
        credits INTEGER NOT NULL CHECK (credits > 0)
      ) STRICT;
      CREATE TRIGGER IF NOT EXISTS existing_topup BEFORE INSERT ON topups
        WHEN EXISTS (SELECT 1 FROM topups WHERE order_id = NEW.order_id)
        BEGIN SELECT RAISE(IGNORE); END;
      CREATE TRIGGER IF NOT EXISTS immutable_topup BEFORE UPDATE ON topups
        BEGIN SELECT RAISE(ABORT, 'Top-ups are append-only'); END;
      CREATE TRIGGER IF NOT EXISTS keep_topup BEFORE DELETE ON topups
        BEGIN SELECT RAISE(ABORT, 'Top-ups are append-only'); END;
      CREATE TRIGGER IF NOT EXISTS credit_topup AFTER INSERT ON topups BEGIN
        UPDATE account SET credited = credited + NEW.credits WHERE id = 1;
      END;
      CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expires_at INTEGER NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS reservation_expiry ON reservations (expires_at);
      CREATE TABLE IF NOT EXISTS charge_receipts (
        id INTEGER PRIMARY KEY, expires_at INTEGER NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS charge_receipt_expiry ON charge_receipts (expires_at);
      CREATE VIEW IF NOT EXISTS balance AS
        SELECT credited, used, reserved, credited - used - reserved AS remaining
        FROM (SELECT credited, used, held - (SELECT count(*) FROM reservations
              WHERE expires_at <= unixepoch()) AS reserved FROM account WHERE id = 1);
    `);
  }

  admit(balanceOnly) {
    return this.ctx.storage.transactionSync(() => {
      const now = Date.now();
      this.sql.exec("DELETE FROM charge_receipts WHERE expires_at <= unixepoch()");
      const expired = this.sql.exec(
        "DELETE FROM reservations WHERE expires_at <= unixepoch() RETURNING id",
      ).toArray().length;
      if (expired) {
        this.sql.exec("UPDATE account SET held = held - ? WHERE id = 1", expired);
      }
      const { remaining, recent } = this.sql.exec(
        "SELECT credited - used - held AS remaining, recent FROM account WHERE id = 1",
      ).one();
      if (remaining === 0) return { remaining };

      const window = JSON.parse(recent).filter((time) => time > now - WINDOW_MS);
      if (window.length >= this.limit) {
        const next = window[window.length - this.limit] + WINDOW_MS;
        return { remaining, retryAfter: Math.ceil((next - now) / 1000) };
      }
      window.push(now);
      this.sql.exec(
        "UPDATE account SET recent = ?, held = held + ? WHERE id = 1",
        JSON.stringify(window), balanceOnly ? 0 : 1,
      );
      if (balanceOnly) return { remaining };

      const hold = this.sql.exec(
        "INSERT INTO reservations (expires_at) VALUES (unixepoch() + ?) RETURNING id, expires_at",
        HOLD_SECONDS,
      ).one();
      return { remaining: remaining - 1, hold };
    });
  }

  async run(prepare) {
    const admission = this.admit(false);
    if (!admission.hold) return admission;
    // The data stream stays at the requesting edge. This object decides the HTTP
    // status and commits its debit before its response headers can leave.
    const head = await prepare(admission.hold);
    const remaining = this.settle(admission.hold, head.ok || head.status === 404);
    if (remaining === null) return { unavailable: true };
    const result = new Response(null, head);
    result.headers.set("X-Quota-Remaining", String(remaining));
    return result;
  }

  settle(hold, charge) {
    return this.ctx.storage.transactionSync(() => {
      const pending = this.sql.exec(
        "DELETE FROM reservations WHERE id = ? AND expires_at > unixepoch() RETURNING expires_at", hold.id,
      ).toArray()[0];
      if (!pending) return charge && !this.#hasReceipt(hold.id) ? null : this.#remaining();
      if (charge) {
        this.sql.exec("INSERT INTO charge_receipts VALUES (?, ?)", hold.id, pending.expires_at + RECEIPT_SECONDS);
      }
      this.sql.exec("UPDATE account SET held = held - 1, used = used + ? WHERE id = 1", charge ? 1 : 0);
      return this.#remaining();
    });
  }

  // Read a durable debit or cancel the pending hold before any late settlement can spend it.
  resolve(hold) {
    return this.ctx.storage.transactionSync(() => {
      if (this.#hasReceipt(hold.id)) return { charged: true, remaining: this.#remaining() };
      if (Date.now() >= (hold.expires_at + RECEIPT_SECONDS) * 1000) return null;
      if (this.sql.exec("DELETE FROM reservations WHERE id = ? RETURNING id", hold.id).toArray().length) {
        this.sql.exec("UPDATE account SET held = held - 1 WHERE id = 1");
      }
      return { charged: false, remaining: this.#remaining() };
    });
  }

  #hasReceipt(id) {
    return this.sql.exec("SELECT id FROM charge_receipts WHERE id = ?", id).toArray().length > 0;
  }

  #remaining() {
    return this.sql.exec("SELECT remaining FROM balance").one().remaining;
  }
}
