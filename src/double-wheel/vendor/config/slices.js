import { weight, sliceIndex } from "../model/units.js";
const WEIGHT_RE = /\[\s*([0-9]*\.?[0-9]+)\s*(%)?\s*\]\s*$/;
const DEFAULT_WEIGHT = 1;
const EPSILON_WEIGHT = 1e-4;
function parseSliceList(raw) {
  const parts = raw.split(",").map((p) => p.trim()).filter((p) => p.length > 0);
  if (parts.length === 0) return { kind: "error", errors: [{ kind: "empty-slice-list" }] };
  const errors = [];
  const entries = [];
  parts.forEach((entry, i) => {
    const m = WEIGHT_RE.exec(entry);
    let kind = "default";
    let rawWeight = DEFAULT_WEIGHT;
    let text = entry;
    if (m) {
      const parsed = Number(m[1]);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        errors.push({ kind: "bad-weight", entry, raw: m[1] });
        return;
      }
      kind = m[2] === "%" ? "percent" : "relative";
      rawWeight = parsed;
      text = entry.slice(0, m.index).trim();
    } else if (/\[[^\]]*\]\s*$/.test(entry)) {
      errors.push({ kind: "bad-weight", entry, raw: entry });
      return;
    }
    entries.push({ index: sliceIndex(i), text, kind, rawWeight });
  });
  if (errors.length > 0) return { kind: "error", errors };
  return { kind: "ok", value: entries };
}
function resolveWeights(entries, normalizeWeights) {
  if (normalizeWeights) {
    return entries.map((e) => ({ index: e.index, text: e.text, weight: weight(e.rawWeight) }));
  }
  const percentEntries = entries.filter((e) => e.kind === "percent");
  const nonPercentEntries = entries.filter((e) => e.kind !== "percent");
  const totalPercent = percentEntries.reduce((sum, e) => sum + e.rawWeight, 0);
  const shares = /* @__PURE__ */ new Map();
  if (nonPercentEntries.length === 0 && totalPercent < 100) {
    for (const e of percentEntries) {
      shares.set(e.index, totalPercent > 0 ? e.rawWeight / totalPercent * 100 : 100 / percentEntries.length);
    }
  } else {
    const scale = totalPercent > 100 ? 100 / totalPercent : 1;
    const remaining = Math.max(0, 100 - Math.min(totalPercent, 100));
    const relativeTotal = nonPercentEntries.reduce((sum, e) => sum + e.rawWeight, 0);
    for (const e of percentEntries) shares.set(e.index, e.rawWeight * scale);
    for (const e of nonPercentEntries) {
      shares.set(e.index, relativeTotal > 0 ? remaining * (e.rawWeight / relativeTotal) : 0);
    }
  }
  return entries.map((e) => {
    const share = shares.get(e.index) ?? 0;
    return { index: e.index, text: e.text, weight: weight(share > 0 ? share : EPSILON_WEIGHT) };
  });
}
export {
  EPSILON_WEIGHT,
  parseSliceList,
  resolveWeights
};
