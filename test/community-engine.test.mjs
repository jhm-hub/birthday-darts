import test from 'node:test';
import assert from 'node:assert/strict';
import {GAMES, RESULT_VALUES, ROULETTE_BASES, ROULETTE_COLORS, parseRoster, exposure, createRound, settleRound, roundPhase} from '../src/community-engine.js';

const players = () => [{name: 'Alice', count: 3, color: 'rose'}, {name: 'Bongo', count: 2, color: 'lilac'}];
const sequence = values => {
  let index = 0;
  return () => {
    assert.ok(index < values.length, 'No extra outcome draws');
    return values[index++];
  };
};
const mean = values => values.reduce((sum, amount) => sum + amount, 0) / values.length;

test('four concepts use the requested 20-30 second defaults', () => {
  assert.deepEqual(Object.keys(GAMES), ['orbit', 'drop', 'vault', 'roulette']);
  assert.deepEqual(Object.values(GAMES).map(game => game.duration), [24, 27, 28, 26]);
  for (const game of Object.keys(GAMES)) assert.equal(createRound({game, players: players()}, () => 0).duration, GAMES[game].duration);
  assert.throws(() => { GAMES.orbit.duration = 90; }, TypeError);
});

test('roster combines names case-insensitively and cycles colors by unique person', () => {
  assert.deepEqual(parseRoster(' Alice, 2\n\nalice, 3\r\nBongo_1\nCharlie,1\nDave,2'), [
    {name: 'Alice', count: 5, color: 'rose'}, {name: 'Bongo_1', count: 1, color: 'lilac'},
    {name: 'Charlie', count: 1, color: 'gold'}, {name: 'Dave', count: 2, color: 'rose'},
  ]);
  assert.deepEqual(parseRoster('Alice,2,GOLD\nalice,1,gold\nBongo,2,rose'), [
    {name: 'Alice', count: 3, color: 'gold'}, {name: 'Bongo', count: 2, color: 'rose'},
  ]);
  assert.deepEqual(parseRoster('__proto__,1\nconstructor,2'), [{name: '__proto__', count: 1, color: 'rose'}, {name: 'constructor', count: 2, color: 'lilac'}]);
});

test('roster rejects malformed names, counts, conflicting colors and unbounded input', () => {
  for (const value of ['', '   ', 'Alice,0', 'Alice,-1', 'Alice,1.5', 'Alice,NaN', 'Alice,Infinity', 'Alice,1,2', 'Alice,1,rose,more', 'Alice,', ',2', 'A B,2', '<img>,2', 'a'.repeat(26), 'Alice,1,', 'Alice,1,red']) {
    assert.throws(() => parseRoster(value), undefined, value);
  }
  assert.throws(() => parseRoster('Alice,1,gold\nalice,1,rose'), /same color/);
  assert.throws(() => parseRoster('Alice,7\nalice,4'), /combined entries/);
  assert.throws(() => parseRoster(Array.from({length: 26}, (_, i) => `Person${i},1`).join('\n')), /25 people/);
  assert.throws(() => parseRoster(Array.from({length: 6}, (_, i) => `Person${i},10`).join('\n')), /50 total/);
  assert.throws(() => parseRoster(' '.repeat(5001)), /too long/);
  assert.throws(() => parseRoster(null), /one name/);
});

test('roster accepts exact people, token and per-person limits', () => {
  assert.equal(parseRoster(Array.from({length: 25}, (_, i) => `Person${i},2`).join('\n')).length, 25);
  const roster = parseRoster(Array.from({length: 5}, (_, i) => `Person${i},10`).join('\n'));
  assert.deepEqual(exposure(roster, 'entry'), {units: 50, min: 0, max: 4500, mean: 1625, perResultMin: 0, perResultMax: 90});
  assert.equal(parseRoster('a'.repeat(25))[0].name.length, 25);
});

test('calibrated distribution averages $32.50 while allowing outcomes outside $20-$45', () => {
  assert.deepEqual(RESULT_VALUES, [0, 5, 10, 15, 20, 25, 30, 35, 40, 50, 70, 90]);
  assert.equal(mean(RESULT_VALUES), 32.5);
  assert.ok(RESULT_VALUES.some(amount => amount < 20));
  assert.ok(RESULT_VALUES.some(amount => amount > 45));
  assert.throws(() => { RESULT_VALUES[0] = 20; }, TypeError);
  for (const game of ['orbit', 'drop', 'vault']) {
    const outcomes = [];
    for (let index = 0; index < RESULT_VALUES.length; index++) {
      for (const sample of [(index + .001) / 12, (index + .999) / 12]) {
        const round = createRound({game, players: [{name: 'Alice', count: 1}]}, () => sample);
        const entry = round.entries[0], amount = RESULT_VALUES[index];
        assert.equal(entry.amount, amount);
        const base = Math.min(10, amount), addition = Math.floor((amount - base) / 10) * 5;
        assert.deepEqual(entry.stages, [base, addition, amount - base - addition]);
        assert.ok(entry.stages.every(stage => Number.isInteger(stage) && stage % 5 === 0));
        assert.equal(entry.stages.reduce((sum, part) => sum + part, 0), amount);
        assert.equal(settleRound(round).total, amount);
        outcomes.push(amount);
      }
    }
    assert.equal(mean(outcomes), 32.5);
  }
});

test('entry and person exposure includes exact means and per-result limits', () => {
  assert.deepEqual(exposure(players()), {units: 5, min: 0, max: 450, mean: 162.5, perResultMin: 0, perResultMax: 90});
  assert.deepEqual(exposure(players(), 'person'), {units: 2, min: 0, max: 180, mean: 65, perResultMin: 0, perResultMax: 90});
  assert.equal(exposure([{name: 'Alice', count: 1}, {name: 'alice', count: 2}], 'person').units, 1);
  assert.throws(() => exposure(players(), 'invalid'), /per-entry/);
  assert.throws(() => exposure(players(), 'person', 'invalid'), /Choose Orbit/);
});

test('random endpoints produce $0 and $90 without clamping invalid draws', () => {
  assert.equal(createRound({game: 'drop', players: [{name: 'A', count: 1}]}, () => 0).entries[0].amount, 0);
  assert.equal(createRound({game: 'drop', players: [{name: 'A', count: 1}]}, () => 1 - Number.EPSILON).entries[0].amount, 90);
  for (const game of ['orbit', 'roulette']) for (const sample of [-0.01, 1, 1.1, NaN, Infinity, '0.5', null]) {
    assert.throws(() => createRound({game, players: players()}, () => sample), /random source/);
  }
});

test('Orbit Lock draws once and shares the exact result across entries', () => {
  for (const billing of ['entry', 'person']) {
    const round = createRound({game: 'orbit', players: players(), billing}, sequence([.5]));
    assert.equal(round.sharedAmount, 30);
    assert.equal(round.entries.length, 5);
    for (const entry of round.entries) {
      assert.equal(entry.amount, 30);
      assert.deepEqual(entry.stages, round.sharedStages);
    }
    assert.equal(settleRound(round).total, billing === 'entry' ? 150 : 60);
  }
});

test('entry is the default and Drop/Vault independently draw each entry', () => {
  for (const game of ['drop', 'vault']) {
    const round = createRound({game, players: players()}, sequence([0, .1, .5, .8, .999]));
    assert.equal(round.billing, 'entry');
    assert.equal(round.sharedAmount, null);
    assert.equal(round.sharedStages, null);
    assert.equal(round.rouletteIndex, null);
    assert.deepEqual(round.entries.map(entry => entry.amount), [0, 5, 30, 50, 90]);
    const settled = settleRound(round);
    assert.deepEqual(settled.rows, [
      {name: 'Alice', count: 3, color: 'rose', amounts: [0, 5, 30], total: 35},
      {name: 'Bongo', count: 2, color: 'lilac', amounts: [50, 90], total: 140},
    ]);
    assert.equal(settled.total, 175);
    assert.equal(settled.units, 5);
  }
});

test('optional per-person mode draws once and repeats tokens without multiplying totals', () => {
  for (const game of ['drop', 'vault']) {
    const round = createRound({game, players: players(), billing: 'person'}, sequence([0, .999]));
    assert.deepEqual(round.entries.map(entry => entry.amount), [0, 0, 0, 90, 90]);
    assert.equal(settleRound(round).total, 90);
    assert.deepEqual(settleRound(round).rows.map(row => row.amounts), [[0], [90]]);
  }
});

test('all 24 roulette pockets have the intended base, color and equal per-color $30 mean', () => {
  const roster = ROULETTE_COLORS.map((color, i) => ({name: `Person${i}`, count: 2, color}));
  const sums = [0, 0, 0], seen = new Set();
  for (let index = 0; index < 24; index++) {
    const round = createRound({game: 'roulette', players: roster, billing: 'person'}, sequence([(index + .5) / 24]));
    assert.equal(round.rouletteIndex, index);
    assert.equal(round.sharedBase, ROULETTE_BASES[Math.floor(index / 3)]);
    assert.equal(round.sharedColor, ROULETTE_COLORS[index % 3]);
    assert.equal(round.sharedAmount, null);
    seen.add(`${round.sharedBase}:${round.sharedColor}`);
    const settled = settleRound(round);
    for (let i = 0; i < 3; i++) {
      const expected = round.sharedBase * (roster[i].color === round.sharedColor ? 2 : 1);
      assert.equal(settled.rows[i].total, expected);
      assert.deepEqual(settled.rows[i].amounts, [expected]);
      assert.deepEqual(round.entries.slice(i * 2, i * 2 + 2).map(entry => entry.amount), [expected, expected]);
      sums[i] += expected;
    }
    assert.equal(settled.total, round.sharedBase * 4);
  }
  assert.equal(seen.size, 24);
  assert.deepEqual(sums.map(sum => sum / 24), [30, 30, 30]);
});

test('roulette exposes $5/$80 per-result extremes and multiplies entries only in entry mode', () => {
  const roster = [{name: 'Alice', count: 3, color: 'gold'}];
  const low = createRound({game: 'roulette', players: roster, billing: 'person'}, () => 0);
  const high = createRound({game: 'roulette', players: roster, billing: 'person'}, () => 1 - Number.EPSILON);
  assert.equal(settleRound(low).total, 5);
  assert.equal(settleRound(high).total, 80);
  assert.equal(high.sharedBase, 40);
  assert.equal(high.sharedColor, 'gold');
  assert.deepEqual(high.entries[0].stages, [10, 35, 35]);
  const entries = createRound({game: 'roulette', players: roster}, () => 1 - Number.EPSILON);
  assert.equal(settleRound(entries).total, 240);
  assert.equal(settleRound(entries).units, 3);
});

test('roulette combined min/max account for the shared color and match exhaustive enumeration', () => {
  for (const roster of [players(), [{name: 'One', count: 4, color: 'gold'}], ROULETTE_COLORS.map((color, i) => ({name: `Person${i}`, count: i + 1, color}))]) {
    for (const billing of ['person', 'entry']) {
      const totals = Array.from({length: 24}, (_, i) => settleRound(createRound({game: 'roulette', players: roster, billing}, () => (i + .5) / 24)).total);
      const limits = exposure(roster, billing, 'roulette');
      assert.equal(limits.min, Math.min(...totals));
      assert.equal(limits.max, Math.max(...totals));
      assert.equal(limits.mean, mean(totals));
      assert.equal(limits.mean, limits.units * 30);
      assert.equal(limits.perResultMin, 5);
      assert.equal(limits.perResultMax, 80);
    }
  }
  assert.deepEqual(exposure(players(), 'entry', 'roulette'), {units: 5, min: 25, max: 320, mean: 150, perResultMin: 5, perResultMax: 80});
});

test('rounds snapshot colors and inputs and freeze all outcome data before animation', () => {
  const input = players(), original = structuredClone(input);
  const round = createRound({game: 'vault', players: input}, () => .5);
  assert.deepEqual(input, original);
  input[0].name = 'Changed'; input[0].count = 1; input[0].color = 'gold';
  input.push({name: 'Extra', count: 4});
  assert.deepEqual(round.players, original);
  for (const item of [round, round.players, ...round.players, round.entries, ...round.entries, ...round.entries.map(entry => entry.stages)]) assert.ok(Object.isFrozen(item));
  assert.throws(() => { round.entries[0].amount = 99; }, TypeError);
  assert.throws(() => { round.entries[0].stages[1] = 99; }, TypeError);
  assert.equal(new Set(round.entries.map(entry => entry.id)).size, 5);
  assert.deepEqual(round.entries.map(entry => entry.index), [1, 2, 3, 1, 2]);
  const another = createRound({game: 'vault', players: players()}, () => .5);
  assert.notEqual(another.id, round.id);
  assert.deepEqual(settleRound(round), settleRound(round));
});

test('setup validates options and colors before drawing', () => {
  const rng = () => { throw Error('Should not draw'); };
  for (const game of ['bad', '__proto__', 'toString', undefined]) assert.throws(() => createRound({game, players: players()}, rng), /Choose Orbit/);
  for (const duration of [0, 19.9, 60.1, Infinity, NaN, '24']) assert.throws(() => createRound({game: 'orbit', players: players(), duration}, rng), /20 and 60/);
  assert.throws(() => createRound({game: 'orbit', players: players(), billing: 'twice'}, rng), /per-entry/);
  assert.throws(() => createRound({game: 'orbit', players: [{name: 'Alice', count: 1.1}]}, rng), /1-10/);
  assert.throws(() => createRound({game: 'roulette', players: [{name: 'Alice', count: 1, color: '<red>'}]}, rng), /rose, lilac or gold/);
  assert.throws(() => createRound({game: 'orbit', players: players()}, null), /function/);
  for (const duration of [20, 30, 60]) assert.equal(createRound({game: 'orbit', players: players(), duration}, () => 0).duration, duration);
});

test('settlement rejects corrupted or inconsistent amounts, identity, color and pockets', () => {
  const valid = createRound({game: 'orbit', players: players()}, () => .5);
  for (const alter of [
    round => { round.entries.pop(); }, round => { round.entries[0].name = 'Different'; },
    round => { round.entries[0].index = 2; }, round => { round.entries[0].amount = 91; },
    round => { round.entries[0].amount = 30.5; }, round => { round.entries[0].color = 'gold'; },
    round => { round.entries[0].stages[1] += 1; }, round => { round.entries[0].id = round.entries[1].id; },
    round => { round.sharedAmount = 20; }, round => { round.billing = 'twice'; },
  ]) {
    const round = structuredClone(valid); alter(round); assert.throws(() => settleRound(round));
  }
  const person = structuredClone(createRound({game: 'drop', players: players(), billing: 'person'}, () => 0));
  person.entries[1].amount = 5; person.entries[1].stages = [5, 0, 0];
  assert.throws(() => settleRound(person), /one result/);
  for (const alter of [
    round => { round.sharedBase = 7; }, round => { round.sharedColor = 'red'; },
    round => { round.rouletteIndex = 24; }, round => { round.rouletteIndex = .5; },
    round => { round.entries[0].amount = 90; round.entries[0].stages = [10, 50, 30]; },
  ]) {
    const round = structuredClone(createRound({game: 'roulette', players: players()}, () => .5)); alter(round); assert.throws(() => settleRound(round));
  }
});

test('phase boundaries cover all phases without ending the animation early', () => {
  const checkpoints = [[0, 0], [.1199, 0], [.12, 1], [.3999, 1], [.4, 2], [.6999, 2], [.7, 3], [.8999, 3], [.9, 4], [1, 4]];
  for (const [progress, index] of checkpoints) assert.equal(roundPhase(progress).index, index);
  assert.equal(roundPhase(-1).index, 0); assert.equal(roundPhase(2).index, 4);
  for (const progress of [NaN, Infinity, undefined, '0.5']) assert.throws(() => roundPhase(progress), /finite number/);
});
