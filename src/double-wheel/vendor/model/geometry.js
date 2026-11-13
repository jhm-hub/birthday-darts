import { deg, turns, normalizeDeg } from "./units.js";
function layout(slices) {
  let total = 0;
  for (const s of slices) total += s.weight;
  const out = [];
  let cursor = 0;
  for (const s of slices) {
    const size = s.weight / total;
    out.push({ index: s.index, startTurn: turns(cursor), sizeTurn: turns(size) });
    cursor += size;
  }
  return out;
}
function sliceCenterDeg(l) {
  return normalizeDeg(deg((l.startTurn + l.sizeTurn / 2) * 360));
}
function sliceAtAngle(layouts, d) {
  const a = normalizeDeg(d);
  for (const l of layouts) {
    const start = l.startTurn * 360;
    const end = start + l.sizeTurn * 360;
    if (a >= start && a < end) return l.index;
  }
  return layouts[layouts.length - 1].index;
}
function nearestSeam(layouts, d) {
  const a = normalizeDeg(d);
  const n = layouts.length;
  let best = Infinity;
  let bi = 0;
  for (let i = 0; i < n; i++) {
    const seam2 = layouts[i].startTurn * 360;
    let dd = Math.abs(a - seam2);
    dd = Math.min(dd, 360 - dd);
    if (dd < best) {
      best = dd;
      bi = i;
    }
  }
  const prevL = layouts[(bi - 1 + n) % n];
  const nextL = layouts[bi];
  const seam = normalizeDeg(deg(nextL.startTurn * 360));
  return { dist: deg(best), between: [prevL.index, nextL.index], seam, prevSizeTurn: prevL.sizeTurn, nextSizeTurn: nextL.sizeTurn };
}
const MAX_SEAM_FRACTION = 0.35;
function effectiveSeamBandDeg(prevSizeTurn, nextSizeTurn, configuredBandDeg) {
  const smallerArcDeg = Math.min(prevSizeTurn, nextSizeTurn) * 360;
  return Math.min(configuredBandDeg, MAX_SEAM_FRACTION * smallerArcDeg);
}
export {
  MAX_SEAM_FRACTION,
  effectiveSeamBandDeg,
  layout,
  nearestSeam,
  sliceAtAngle,
  sliceCenterDeg
};
