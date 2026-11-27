import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_ROULETTE, validateRoulette, stats, createRouletteRound, advanceRoulette, publicRoulette, validateRouletteRound} from '../src/roulette-game.js';
import {randomInt} from '../src/random.js';

const config = overrides => ({...DEFAULT_ROULETTE, amounts: [...DEFAULT_ROULETTE.amounts], ...overrides});
const spin = (index = 0, overrides = {}) => createRouletteRound(config(overrides), 'FaithFan', 1000, () => index);

test('default roulette has 24 equal pockets and exact average $32.50 with whole-dollar results', () => {
  assert.deepEqual(stats(DEFAULT_ROULETTE), {min: 0, max: 90, mean: 32.5, count: 24});
  assert.equal(DEFAULT_ROULETTE.duration, 26);
  assert.equal(DEFAULT_ROULETTE.volume, 65);
  const counts = new Map();
  for (const amount of DEFAULT_ROULETTE.amounts) counts.set(amount, (counts.get(amount) ?? 0) + 1);
  assert.deepEqual([...counts.keys()].sort((a, b) => a - b), [0, 5, 10, 15, 20, 25, 30, 35, 40, 50, 70, 90]);
  assert.ok([...counts.values()].every(count => count === 2));
  assert.throws(() => { DEFAULT_ROULETTE.amounts[0] = 100; }, TypeError);
  assert.throws(() => { DEFAULT_ROULETTE.name = 'Changed'; }, TypeError);
});

test('configuration validates bounds, strips private data and returns independent editable copies', () => {
  const source = config({name: '  Friday Roulette  ', room: 'secret', round: {viewer: 'private'}, editKey: 'secret'});
  const first = validateRoulette(source), second = validateRoulette(source);
  assert.equal(first.name, 'Friday Roulette');
  assert.deepEqual(Object.keys(first).sort(), ['amounts', 'duration', 'id', 'name', 'volume']);
  first.amounts[0] = 99;
  assert.equal(source.amounts[0], 0);
  assert.equal(second.amounts[0], 0);
  for (const length of [6, 36]) for (const duration of [20, 60]) for (const volume of [0, 100]) {
    assert.deepEqual(stats(config({amounts: Array(length).fill(10000), duration, volume})), {min: 10000, max: 10000, mean: 10000, count: length});
  }
  assert.equal(stats(config({amounts: Array(6).fill(0)})).mean, 0);
});

test('invalid IDs, text, cents, arrays, timing and volume fail instead of silently changing settings', () => {
  for (const id of ['', 'a'.repeat(81), '../secret', '<img>', null]) assert.throws(() => validateRoulette(config({id})), /ID/);
  for (const name of ['', ' ', 'x'.repeat(41), 'A\nB', null]) assert.throws(() => validateRoulette(config({name})), /plain text/);
  for (const amounts of [null, [], Array(6), Array(5).fill(1), Array(37).fill(1), [0, 1, 2, 3, 4, .5], [0, 1, 2, 3, 4, -1], [0, 1, 2, 3, 4, 10001], [0, 1, 2, 3, 4, NaN], [0, 1, 2, 3, 4, '5']]) {
    assert.throws(() => validateRoulette(config({amounts})), /whole-dollar/);
  }
  for (const duration of [19, 61, 26.5, '26', NaN, Infinity]) assert.throws(() => validateRoulette(config({duration})), /duration/);
  for (const volume of [-1, 101, 65.5, '65', NaN]) assert.throws(() => validateRoulette(config({volume})), /volume/);
});

test('each injected pocket selects its actual configured amount, including both index endpoints', () => {
  for (let index = 0; index < 24; index++) {
    let calls = 0;
    const round = createRouletteRound(DEFAULT_ROULETTE, '', 1000, count => { calls++; assert.equal(count, 24); return index; });
    assert.equal(calls, 1);
    assert.equal(round.index, index);
    assert.equal(round.amount, DEFAULT_ROULETTE.amounts[index]);
    assert.equal(round.phase, 'spinning');
    assert.equal(round.startAt, 1000);
    assert.equal(round.endAt, 27000);
    assert.equal(round.durationMs, 26000);
  }
  for (const index of [-1, 24, .5, '0', NaN, Infinity]) assert.throws(() => spin(index), /invalid pocket/);
  assert.throws(() => createRouletteRound(DEFAULT_ROULETTE, '', 1000, null), /function/);
});

test('browser random uses rejection sampling instead of biased modulo mapping', () => {
  const cryptoObject = globalThis.crypto, original = cryptoObject.getRandomValues;
  const values = [4294967295, 7];
  let calls = 0;
  cryptoObject.getRandomValues = array => { array[0] = values[calls++]; return array; };
  try {
    assert.equal(randomInt(24), 7);
    assert.equal(calls, 2);
  } finally { cryptoObject.getRandomValues = original; }
  const round = createRouletteRound(DEFAULT_ROULETTE, '', 1000);
  assert.ok(round.index >= 0 && round.index < 24);
  assert.equal(round.amount, round.config.amounts[round.index]);
});

test('round snapshots are deeply frozen and unaffected by later settings changes', () => {
  const source = config(), before = structuredClone(source);
  const round = createRouletteRound(source, '  FaithFan  ', 1000, () => 23);
  assert.deepEqual(source, before);
  assert.equal(round.viewer, 'FaithFan');
  source.amounts[23] = 9999; source.duration = 60; source.name = 'Next viewer';
  assert.equal(round.amount, 90);
  assert.deepEqual(round.config, before);
  for (const value of [round, round.config, round.config.amounts]) assert.ok(Object.isFrozen(value));
  assert.throws(() => { round.phase = 'complete'; }, TypeError);
  assert.throws(() => { round.config.amounts[23] = 5; }, TypeError);
  assert.notEqual(spin().id, spin().id);
});

test('viewer is optional plain text and timestamp checks happen before drawing', () => {
  assert.equal(createRouletteRound(DEFAULT_ROULETTE, undefined, 1000, () => 0).viewer, '');
  assert.equal(createRouletteRound(DEFAULT_ROULETTE, 'x'.repeat(40), 0, () => 0).viewer.length, 40);
  const rng = () => { throw Error('Should not draw'); };
  for (const viewer of ['x'.repeat(41), 'Line\nBreak', '\u0000', {}, 42, null]) assert.throws(() => createRouletteRound(DEFAULT_ROULETTE, viewer, 1000, rng), /plain text/);
  for (const now of [-1, .5, NaN, Infinity, Number.MAX_SAFE_INTEGER]) assert.throws(() => createRouletteRound(DEFAULT_ROULETTE, '', now, rng), /timestamp/);
});

test('advance waits through the reveal, returns immutable completion and never clears a held result', () => {
  const round = spin(23);
  assert.equal(advanceRoulette(round, round.startAt), round);
  assert.equal(advanceRoulette(round, round.startAt + round.durationMs * .9), round);
  assert.equal(advanceRoulette(round, round.endAt - 1), round);
  const completed = advanceRoulette(round, round.endAt);
  assert.notEqual(completed, round);
  assert.equal(completed.phase, 'complete');
  assert.equal(round.phase, 'spinning');
  assert.equal(completed.amount, 90);
  assert.equal(completed.id, round.id);
  assert.equal(advanceRoulette(completed, completed.endAt + 86400000), completed);
  assert.equal(advanceRoulette(completed, 0), completed);
  assert.ok(Object.isFrozen(completed));
  assert.equal(advanceRoulette(null), null);
});

test('reloading an unfinished spin recovers the same pocket and finishes only once', () => {
  const original = spin(11), saved = JSON.parse(JSON.stringify(original));
  const recovered = validateRouletteRound(saved);
  assert.deepEqual(recovered, original);
  assert.notEqual(recovered, saved);
  const final = advanceRoulette(recovered, original.endAt + 10000);
  assert.equal(final.phase, 'complete');
  assert.equal(final.index, original.index);
  assert.equal(final.amount, original.amount);
  assert.equal(advanceRoulette(final, final.endAt + 20000), final);
});

test('public snapshots expose only validated drawing state and no private fields', () => {
  const original = {...spin(11), room: 'secret', editKey: 'secret', metrics: {private: 123}};
  const snapshot = publicRoulette(original);
  assert.deepEqual(snapshot, validateRouletteRound(original));
  for (const key of ['room', 'editKey', 'metrics']) assert.ok(!Object.hasOwn(snapshot, key));
  assert.equal(snapshot.index, 11);
  assert.equal(snapshot.amount, 90);
  assert.notEqual(snapshot.config, original.config);
  assert.equal(publicRoulette(null), null);
});

test('corrupted saved rounds reject mismatched pocket, result, time, viewer and phase', () => {
  for (const patch of [
    {id: ''}, {index: -1}, {index: 24}, {index: .5}, {amount: 1}, {amount: '0'},
    {phase: 'ready'}, {startAt: -1}, {endAt: 27001}, {durationMs: 25000}, {viewer: 'x'.repeat(41)},
  ]) assert.throws(() => validateRouletteRound({...spin(0), ...patch}));
  assert.throws(() => validateRouletteRound(null));
  assert.throws(() => advanceRoulette({...spin(), amount: 42}, 1000), /pocket/);
});
