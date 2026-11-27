import {randomInt as browserRandom, randomUUID} from './random.js';

const SAFE_ID = /^[-\w]{1,80}$/;
const CONTROLS = /[\u0000-\u001f\u007f]/;
const HALF_WHEEL = [0, 30, 5, 35, 10, 40, 15, 50, 20, 70, 25, 90];

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

export const DEFAULT_ROULETTE = freeze({
  id: 'velvet-roulette', name: 'Velvet Roulette',
  amounts: [...HALF_WHEEL, ...HALF_WHEEL], duration: 26, volume: 65,
});

function plainText(value, label, optional = false) {
  if (typeof value !== 'string' || value.length > 40 || CONTROLS.test(value) || (!optional && !value.trim())) {
    throw new Error(`${label} must be ${optional ? 'up to 40' : '1-40'} characters of plain text.`);
  }
  return value.trim();
}

function timestamp(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Use a valid round timestamp.');
  return value;
}

export function validateRoulette(config) {
  if (!config || typeof config.id !== 'string' || !SAFE_ID.test(config.id)) throw new Error('Use a valid saved roulette ID.');
  const name = plainText(config.name, 'The game name');
  if (!Array.isArray(config.amounts) || config.amounts.length < 6 || config.amounts.length > 36 ||
    !Array.from(config.amounts).every(amount => Number.isInteger(amount) && amount >= 0 && amount <= 10000)) {
    throw new Error('Use 6-36 whole-dollar pocket amounts from $0 to $10,000.');
  }
  if (!Number.isInteger(config.duration) || config.duration < 20 || config.duration > 60) throw new Error('Choose a whole round duration from 20 to 60 seconds.');
  if (!Number.isInteger(config.volume) || config.volume < 0 || config.volume > 100) throw new Error('Choose a whole volume from 0 to 100.');
  return {id: config.id, name, amounts: [...config.amounts], duration: config.duration, volume: config.volume};
}

export function stats(config) {
  const {amounts} = validateRoulette(config);
  return {min: Math.min(...amounts), max: Math.max(...amounts), mean: amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length, count: amounts.length};
}

export function createRouletteRound(config, viewer = '', now = Date.now(), random = browserRandom) {
  const snapshot = validateRoulette(config), name = plainText(viewer, 'The viewer name', true);
  timestamp(now);
  const durationMs = snapshot.duration * 1000, endAt = timestamp(now + durationMs);
  if (typeof random !== 'function') throw new Error('The random pocket source must be a function.');
  const index = random(snapshot.amounts.length);
  if (!Number.isInteger(index) || index < 0 || index >= snapshot.amounts.length) throw new Error('The random pocket source returned an invalid pocket index.');
  return freeze({
    id: randomUUID(), viewer: name, config: snapshot, index, amount: snapshot.amounts[index],
    startAt: now, endAt, durationMs, phase: 'spinning',
  });
}

export function validateRouletteRound(round) {
  if (!round || typeof round.id !== 'string' || !SAFE_ID.test(round.id)) throw new Error('The saved roulette round has an invalid ID.');
  const config = validateRoulette(round.config), viewer = plainText(round.viewer, 'The viewer name', true);
  if (!Number.isInteger(round.index) || round.index < 0 || round.index >= config.amounts.length || round.amount !== config.amounts[round.index]) {
    throw new Error('The saved roulette result does not match its pocket.');
  }
  if (round.durationMs !== config.duration * 1000 || timestamp(round.endAt) !== timestamp(round.startAt) + round.durationMs) {
    throw new Error('The saved roulette timing does not match its settings.');
  }
  if (round.phase !== 'spinning' && round.phase !== 'complete') throw new Error('The saved roulette phase is invalid.');
  return freeze({
    id: round.id, viewer, config, index: round.index, amount: round.amount,
    startAt: round.startAt, endAt: round.endAt, durationMs: round.durationMs, phase: round.phase,
  });
}

export function advanceRoulette(round, now = Date.now()) {
  if (round == null) return round;
  timestamp(now);
  const checked = validateRouletteRound(round);
  if (checked.phase === 'complete' || now < checked.endAt) return round;
  return freeze({...checked, phase: 'complete'});
}

export function publicRoulette(round) {
  return round == null ? null : validateRouletteRound(round);
}
