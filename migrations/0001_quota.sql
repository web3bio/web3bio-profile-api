CREATE TABLE api_keys (
  key_hash TEXT PRIMARY KEY NOT NULL,
  remaining INTEGER NOT NULL CHECK (remaining BETWEEN 0 AND 9007199254740991)
) STRICT;

CREATE TABLE topups (
  order_id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(order_id)) > 0),
  key_hash TEXT NOT NULL,
  credits INTEGER NOT NULL CHECK (credits > 0)
) STRICT;

CREATE TRIGGER credit_order AFTER INSERT ON topups BEGIN
  INSERT INTO api_keys (key_hash, remaining) VALUES (NEW.key_hash, NEW.credits)
  ON CONFLICT (key_hash) DO UPDATE SET remaining = remaining + excluded.remaining;
END;

CREATE TRIGGER ignore_repeat_order BEFORE INSERT ON topups
WHEN EXISTS (SELECT 1 FROM topups WHERE order_id = NEW.order_id) BEGIN
  SELECT RAISE(IGNORE);
END;
CREATE TRIGGER immutable_order BEFORE UPDATE ON topups BEGIN
  SELECT RAISE(ABORT, 'Top-ups are append-only');
END;
CREATE TRIGGER keep_order BEFORE DELETE ON topups BEGIN
  SELECT RAISE(ABORT, 'Top-ups are append-only');
END;

-- Recent admissions enforce the rolling limit. A decision also identifies a retried debit.
CREATE TABLE quota_requests (
  id TEXT PRIMARY KEY NOT NULL,
  key_hash TEXT NOT NULL,
  started_at REAL NOT NULL DEFAULT 0,
  billable INTEGER CHECK (billable IN (0, 1)),
  expires_at REAL NOT NULL DEFAULT 0
) STRICT;
CREATE INDEX quota_window ON quota_requests (key_hash, started_at);
CREATE INDEX quota_expiry ON quota_requests (expires_at);

CREATE TRIGGER charge_request AFTER UPDATE OF billable ON quota_requests
WHEN OLD.billable IS NULL AND NEW.billable = 1 BEGIN
  UPDATE api_keys SET remaining = remaining - 1
  WHERE key_hash = NEW.key_hash AND remaining > 0;
END;
