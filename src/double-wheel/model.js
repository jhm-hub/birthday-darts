import { layout, sliceCenterDeg, sliceAtAngle } from "./vendor/model/geometry.js";
import { deg, normalizeDeg, sliceIndex, weight } from "./vendor/model/units.js";
const DEFAULTS = { outer: [5, 4, 9, 5, 6, 7, 8, 10], inner: [6, 7, 4, 3, 4, 5], duration: 6.2, operation: "add", palette: "landaire" };
const normalize = (n) => normalizeDeg(deg(n));
const wheelLayout = (values) => layout(values.map((value, index) => ({ index: sliceIndex(index), text: String(value), weight: weight(1) })));
function parseValues(raw) {
  const tokens = raw.trim().split(/[\s,]+/);
  if (tokens.length < 2 || tokens.length > 24 || tokens.some((v) => !/^\d{1,4}(\.\d{1,2})?$/.test(v))) throw new Error("Enter 2 to 24 numbers from 0 to 9999.99, with up to two decimal places, separated by commas.");
  return tokens.map(Number);
}
function readConfig(value) {
  const c = value && typeof value === "object" ? value : {};
  const values = (v, fallback) => Array.isArray(v) && v.length >= 2 && v.length <= 24 && v.every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 9999.99 && Math.abs(n * 100 - Math.round(n * 100)) < 1e-6) ? [...v] : [...fallback];
  return {
    outer: values(c.outer, DEFAULTS.outer),
    inner: values(c.inner, DEFAULTS.inner),
    duration: typeof c.duration === "number" && Number.isFinite(c.duration) && c.duration >= 2 && c.duration <= 15 ? c.duration : DEFAULTS.duration,
    operation: ["multiply", "add", "pair"].includes(c.operation ?? "") ? c.operation : DEFAULTS.operation,
    palette: ["landaire", "sweetheart", "reference"].includes(c.palette ?? "") ? c.palette : DEFAULTS.palette
  };
}
function indexAtPointer(values, rotation) {
  return sliceAtAngle(wheelLayout(values), deg(normalize(-rotation)));
}
function targetRotation(current, values, index, direction, turns) {
  const center = sliceCenterDeg(wheelLayout(values)[index]);
  const target = normalize(-center);
  const travel = direction === 1 ? normalize(target - current) : normalize(current - target);
  return current + direction * (turns * 360 + travel);
}
function randomIndex(length) {
  const sample = new Uint32Array(1);
  const limit = Math.floor(4294967296 / length) * length;
  do {
    crypto.getRandomValues(sample);
  } while (sample[0] >= limit);
  return sample[0] % length;
}
function planSpin(config, from, choose = randomIndex) {
  const oi = choose(config.outer.length), ii = choose(config.inner.length);
  const outer = config.outer[oi], inner = config.inner[ii];
  const a = Math.round(outer * 100), b = Math.round(inner * 100);
  const result = config.operation === "multiply" ? a * b / 1e4 : config.operation === "add" ? (a + b) / 100 : null;
  return {
    from: { ...from },
    to: { outer: targetRotation(from.outer, config.outer, oi, -1, 5), inner: targetRotation(from.inner, config.inner, ii, 1, 6) },
    duration: config.duration * 1e3,
    round: { outer, inner, result, operation: config.operation }
  };
}
function frameAt(plan, elapsed) {
  const t = Math.max(0, Math.min(1, elapsed / plan.duration));
  const eased = t === 1 ? 1 : 10 * t * t - 20 * t ** 3 + 15 * t ** 4 - 4 * t ** 5;
  return {
    outer: plan.from.outer + (plan.to.outer - plan.from.outer) * eased,
    inner: plan.from.inner + (plan.to.inner - plan.from.inner) * eased,
    done: t === 1
  };
}
export {
  DEFAULTS,
  frameAt,
  indexAtPointer,
  normalize,
  parseValues,
  planSpin,
  randomIndex,
  readConfig,
  targetRotation,
  wheelLayout
};
