type Row = Record<string, unknown>;

const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;

const jsonArr = (raw?: string): unknown[] => {
  if (!raw) return [];
  try {
    const x = JSON.parse(raw);
    return Array.isArray(x) ? x : [];
  } catch {
    return [];
  }
};

type Item = {
  name: string | null;
  url: string | null;
  desc: string | null;
  emoji: string | null;
  widget: string | null;
};

const urlField = (v: unknown): string | null => {
  if (typeof v === "string") return str(v);
  if (!Array.isArray(v)) return null;
  const urls: string[] = [];
  for (const x of v) {
    if (typeof x !== "string") continue;
    const u = str(x);
    if (u) urls.push(u);
  }
  return urls.length ? JSON.stringify(urls) : null;
};

const linkRow = (o: Row): Item | null => {
  const name = str(o.name);
  if (!name) return null;
  return {
    name,
    url: str(o.url),
    desc: str(o.desc ?? o.description),
    emoji: str(o.emoji),
    widget: null,
  };
};

const bioRow = (o: Row): Item | null => {
  const widget = str(o.w);
  const name = str(o.n ?? o.t ?? o.name);
  const url = urlField(o.u ?? o.url);
  const desc = str(o.d ?? o.desc ?? o.description);
  const emoji = str(o.e ?? o.emoji);
  if (!name && !url && !widget && !desc && !emoji) return null;
  return { name, url, desc, emoji, widget };
};

export const serializeEnsWidgetsFromTexts = (
  texts: Record<string, string> | undefined,
): { widgets: string | null } => {
  if (!texts) return { widgets: null };

  const items: Item[] = [];
  const nameIdx = new Map<string, number>();

  for (const x of jsonArr(texts["web3.bio.widgets"])) {
    if (!x || typeof x !== "object") continue;
    const row = bioRow(x as Row);
    if (!row) continue;
    if (row.name) {
      const i = nameIdx.get(row.name);
      if (i !== undefined) items[i] = row;
      else {
        nameIdx.set(row.name, items.length);
        items.push(row);
      }
    } else {
      items.push(row);
    }
  }

  for (const x of jsonArr(texts.links)) {
    if (!x || typeof x !== "object") continue;
    const L = linkRow(x as Row);
    if (!L) continue;
    const linkName = L.name;
    if (!linkName) continue;
    const i = nameIdx.get(linkName);
    if (i !== undefined) {
      const P = items[i];
      items[i] = {
        name: P.name,
        url: L.url ?? P.url,
        desc: P.desc ?? L.desc,
        emoji: L.emoji ?? P.emoji,
        widget: P.widget,
      };
    } else {
      nameIdx.set(linkName, items.length);
      items.push(L);
    }
  }

  return {
    widgets: items.length ? JSON.stringify(items) : null,
  };
};
