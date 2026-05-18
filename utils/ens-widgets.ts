type Row = Record<string, unknown>;

export type EnsWidgetItem = {
  name?: string;
  url?: string | string[];
  desc?: string;
  emoji?: string;
  widget?: string;
};

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

const urlField = (v: unknown): string | string[] | null => {
  if (typeof v === "string") return str(v);
  if (!Array.isArray(v)) return null;
  const urls = v
    .filter((x): x is string => typeof x === "string")
    .map((x) => str(x))
    .filter((u): u is string => u != null);
  if (!urls.length) return null;
  return urls.length === 1 ? urls[0] : urls;
};

const compact = (row: {
  name: string | null;
  url: string | string[] | null;
  desc: string | null;
  emoji: string | null;
  widget: string | null;
}): EnsWidgetItem | null => {
  const item: EnsWidgetItem = {};
  if (row.name) item.name = row.name;
  if (row.url != null) item.url = row.url;
  if (row.desc) item.desc = row.desc;
  if (row.emoji) item.emoji = row.emoji;
  if (row.widget) item.widget = row.widget;
  return Object.keys(item).length ? item : null;
};

const parseRow = (o: Row, shortKeys: boolean): EnsWidgetItem | null => {
  const name = shortKeys ? str(o.n ?? o.t ?? o.name) : str(o.name);
  const url = urlField(shortKeys ? (o.u ?? o.url) : o.url);
  const desc = str(
    shortKeys ? (o.d ?? o.desc ?? o.description) : (o.desc ?? o.description),
  );
  const emoji = str(shortKeys ? (o.e ?? o.emoji) : o.emoji);
  const widget = shortKeys ? str(o.w) : null;
  if (!name && !url && !widget && !desc && !emoji) return null;
  if (!shortKeys && !name) return null;
  return compact({ name, url, desc, emoji, widget });
};

const mergeItems = (prev: EnsWidgetItem, next: EnsWidgetItem): EnsWidgetItem => ({
  name: prev.name ?? next.name,
  url: next.url ?? prev.url,
  desc: next.desc ?? prev.desc,
  emoji: next.emoji ?? prev.emoji,
  widget: prev.widget ?? next.widget,
});

const upsertByName = (
  items: EnsWidgetItem[],
  nameIdx: Map<string, number>,
  row: EnsWidgetItem,
  merge = false,
) => {
  const name = row.name;
  if (!name) {
    items.push(row);
    return;
  }
  const i = nameIdx.get(name);
  if (i !== undefined) {
    items[i] = merge ? mergeItems(items[i], row) : row;
  } else {
    nameIdx.set(name, items.length);
    items.push(row);
  }
};

export const serializeEnsWidgetsFromTexts = (
  texts: Record<string, string> | undefined,
): EnsWidgetItem[] | null => {
  if (!texts) return null;

  const items: EnsWidgetItem[] = [];
  const nameIdx = new Map<string, number>();

  for (const x of jsonArr(texts["widgets"])) {
    if (!x || typeof x !== "object") continue;
    const row = parseRow(x as Row, true);
    if (row) upsertByName(items, nameIdx, row);
  }

  for (const x of jsonArr(texts.links)) {
    if (!x || typeof x !== "object") continue;
    const row = parseRow(x as Row, false);
    if (row) upsertByName(items, nameIdx, row, true);
  }

  return items.length ? items : null;
};
