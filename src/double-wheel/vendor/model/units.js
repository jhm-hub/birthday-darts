const deg = (n) => n;
const turns = (n) => n;
const weight = (n) => {
  if (!Number.isFinite(n) || n <= 0) throw new RangeError(`weight must be finite and > 0, got ${n}`);
  return n;
};
const sliceIndex = (n) => {
  if (!Number.isInteger(n) || n < 0) throw new RangeError(`sliceIndex must be a non-negative integer, got ${n}`);
  return n;
};
const normalizeDeg = (d) => (d % 360 + 360) % 360;
const turnsToDeg = (t) => t * 360;
export {
  deg,
  normalizeDeg,
  sliceIndex,
  turns,
  turnsToDeg,
  weight
};
