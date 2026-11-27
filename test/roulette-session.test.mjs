import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRouletteStore, ROULETTE_KEY, isRouletteSnapshot} from '../src/roulette-store.js';
import {DEFAULT_ROULETTE, createRouletteRound} from '../src/roulette-game.js';

function fixture() {
  const data = new Map();
  const storage = {getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value)};
  let tail = Promise.resolve();
  const locks = {request(name, callback) { const next = tail.then(callback); tail = next.catch(() => {}); return next; }};
  return {data, storage, locks, store: createRouletteStore(storage, locks)};
}

test('roulette persists one OBS secret, settings, and the original in-flight result across reload', async () => {
  const f = fixture(); await f.store.init(1000);
  const key = f.store.displayKey();
  await f.store.save({...DEFAULT_ROULETTE, name: 'Faith’s roulette', amounts: [5, 10, 15, 20, 25, 30]}, 1000);
  const first = await f.store.action('spin', {viewer: 'FaithFan'}, 2000);
  assert.equal(first.round.config.amounts.length, 6);
  const reload = createRouletteStore(f.storage, f.locks); await reload.init(3000);
  assert.equal(reload.displayKey(), key);
  assert.deepEqual(reload.snapshot(3000).round, first.round);
  assert.equal(reload.snapshot(3000).config.name, 'Faith’s roulette');
  assert.ok(!JSON.stringify(first).includes(key));
  assert.ok(isRouletteSnapshot(first));
});

test('roulette transactions reject overlapping spins and settings changes during a spin', async () => {
  const f = fixture(); await f.store.init(1000);
  const attempts = await Promise.allSettled([
    f.store.action('spin', {viewer: 'One'}, 2000), f.store.action('spin', {viewer: 'Two'}, 2000),
  ]);
  assert.equal(attempts.filter(value => value.status === 'fulfilled').length, 1);
  assert.equal(attempts.filter(value => value.status === 'rejected').length, 1);
  await assert.rejects(f.store.save({...DEFAULT_ROULETTE, name: 'Changed'}, 3000), /Finish or cancel/);
  await assert.rejects(f.store.action('clear', {}, 3000), /Finish or cancel/);
  assert.equal(f.store.snapshot(3000).round.viewer, 'One');
});

test('roulette recovery settles a result exactly once and holds it until clear', async () => {
  const f = fixture(); await f.store.init(1000);
  const start = await f.store.action('spin', {viewer: 'Viewer'}, 2000);
  const finish = start.round.endAt;
  const reload = createRouletteStore(f.storage, f.locks); await reload.init(finish + 10);
  await reload.advance(finish + 20); await reload.advance(finish + 30);
  const settled = reload.snapshot(finish + 30);
  assert.equal(settled.round.phase, 'complete');
  assert.equal(settled.round.amount, start.round.amount);
  assert.equal(settled.history.length, 1);
  assert.deepEqual(settled.history[0], {id: start.round.id, viewer: 'Viewer', amount: start.round.amount, endedAt: finish});
  assert.ok(isRouletteSnapshot(settled));
  await reload.action('clear', {}, finish + 40);
  assert.equal(reload.snapshot(finish + 40).round, null);
  assert.equal(reload.snapshot(finish + 40).history.length, 1);
});

test('cancelled roulette spins never enter history; visibility and volume preserve the chosen result', async () => {
  const f = fixture(); await f.store.init(1000);
  const start = await f.store.action('spin', {viewer: 'Viewer'}, 2000);
  await f.store.action('visibility', {visible: false}, 3000);
  const next = await f.store.action('volume', {value: 25}, 3000);
  assert.equal(next.visible, false); assert.equal(next.volume, 25);
  assert.equal(next.round.amount, start.round.amount);
  assert.equal(next.round.config.volume, DEFAULT_ROULETTE.volume);
  await f.store.action('cancel', {}, 3000);
  await f.store.advance(start.round.endAt + 5000);
  const cancelled = f.store.snapshot(start.round.endAt + 5000);
  assert.equal(cancelled.round, null); assert.deepEqual(cancelled.history, []);
  await assert.rejects(f.store.action('volume', {value: 1.5}, 3000), /whole number/);
  await assert.rejects(f.store.action('visibility', {visible: 'false'}, 3000), /whether/);
});

test('cancellation at or after the deadline retains the completed result and credits history once', async () => {
  for (const delay of [0, 1, 5000]) {
    const f = fixture(); await f.store.init(1000);
    const start = await f.store.action('spin', {viewer: 'Deadline'}, 2000);
    const now = start.round.endAt + delay;
    await assert.rejects(f.store.action('cancel', {}, now), /already finished.*Next viewer/);
    const final = f.store.snapshot(now);
    assert.equal(final.round.phase, 'complete');
    assert.equal(final.round.id, start.round.id);
    assert.equal(final.round.amount, start.round.amount);
    assert.deepEqual(final.history, [{id: start.round.id, viewer: 'Deadline', amount: start.round.amount, endedAt: start.round.endAt}]);
    await assert.rejects(f.store.action('cancel', {}, now + 1), /already finished.*Next viewer/);
    await f.store.advance(now + 2);
    assert.deepEqual(f.store.snapshot(now + 2).history, final.history);
    const reload = createRouletteStore(f.storage, f.locks); await reload.init(now + 3);
    assert.equal(reload.snapshot(now + 3).round.phase, 'complete');
    assert.deepEqual(reload.snapshot(now + 3).history, final.history);
  }
  const before = fixture(); await before.store.init(1000);
  const start = await before.store.action('spin', {viewer: 'Just in time'}, 2000);
  await before.store.action('cancel', {}, start.round.endAt - 1);
  await before.store.advance(start.round.endAt);
  assert.equal(before.store.snapshot(start.round.endAt).round, null);
  assert.deepEqual(before.store.snapshot(start.round.endAt).history, []);
});

test('roulette saves preserve the displayed round and OBS identity; history retains only ten results', async () => {
  const f = fixture(); await f.store.init(1000); const key = f.store.displayKey();
  let now = 2000;
  for (let i = 0; i < 12; i++) {
    const started = await f.store.action('spin', {viewer: 'Viewer' + i}, now);
    now = started.round.endAt + 1; await f.store.advance(now);
  }
  const before = f.store.snapshot(now);
  await f.store.save({...DEFAULT_ROULETTE, amounts: [0, 0, 0, 0, 0, 0], name: 'New amounts'}, now);
  const after = f.store.snapshot(now);
  assert.deepEqual(after.round, before.round);
  assert.equal(after.config.name, 'New amounts');
  assert.equal(after.history.length, 10);
  assert.equal(after.history[0].viewer, 'Viewer11');
  assert.equal(after.history.at(-1).viewer, 'Viewer2');
  assert.equal(f.store.displayKey(), key);
});

test('corrupt roulette storage is preserved and surfaced instead of resetting the game', async () => {
  const f = fixture(); await f.store.init(1000);
  for (const invalid of ['{', '{}', JSON.stringify({...JSON.parse(f.data.get(ROULETTE_KEY)), room: 'bad'})]) {
    f.data.set(ROULETTE_KEY, invalid);
    const other = createRouletteStore(f.storage, f.locks);
    await assert.rejects(other.init(2000), /not been overwritten/);
    assert.equal(f.data.get(ROULETTE_KEY), invalid);
  }
});

test('display snapshot validator rejects malformed amounts, clocks, pockets and unbounded history', async () => {
  const f = fixture(); await f.store.init(1000);
  const valid = await f.store.action('spin', {viewer: 'Viewer'}, 2000);
  assert.ok(isRouletteSnapshot(valid));
  const changes = [
    snap => { snap.kind = 'other'; }, snap => { snap.serverNow = Infinity; },
    snap => { snap.visible = 'true'; }, snap => { snap.volume = 1000; },
    snap => { snap.config.amounts = [1.5, 2, 3, 4, 5, 6]; },
    snap => { snap.round.amount = 10001; }, snap => { snap.round.index = 99; },
    snap => { snap.round.endAt += 1; }, snap => { snap.serverNow = snap.round.startAt - 1; },
    snap => { snap.round.phase = 'complete'; },
    snap => { snap.history = Array.from({length: 11}, (_, i) => ({id: 'id' + i, viewer: '', amount: 1, endedAt: 1000})); },
    snap => { snap.history = [{id: 'old', viewer: 'Viewer', amount: 1, endedAt: snap.serverNow + 1}]; },
  ];
  for (const change of changes) { const next = structuredClone(valid); change(next); assert.equal(isRouletteSnapshot(next), false); }
});

test('host session locks control ownership, ignores viewer commands and releases transport on dispose', async () => {
  const f = fixture(); await f.store.init();
  const hosts = [], sent = [], held = new Set(), timers = new Map();
  let serial = 0;
  const nav = {locks: {async request(name, options, callback) {
    if (held.has(name)) return callback(null);
    held.add(name); try { return await callback({}); } finally { held.delete(name); }
  }}};
  const source = (await readFile(new URL('../src/roulette-session.js', import.meta.url), 'utf8'))
    .replace(/^import .*;\n/gm, '').replace(/^export \{.*;\n/gm, '').replaceAll('export ', '');
  const connect = new Function('connectRoom', 'validKey', 'navigator', 'window', 'location', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', source + '\nreturn connectRouletteControl;')(
    options => { const host = {options, disposed: false, send: snap => sent.push(snap), dispose() { host.disposed = true; }}; hosts.push(host); return host; },
    key => /^[a-f0-9]{64}$/.test(key), nav, {addEventListener() {}, removeEventListener() {}}, {href: 'https://example.test/roulette.html?live=1'},
    fn => { const id = ++serial; timers.set(id, fn); return id; }, id => timers.delete(id),
    fn => { const id = ++serial; timers.set(id, fn); return id; }, id => timers.delete(id),
  );
  const statuses = [], session = await connect(f.store, () => {}, (ready, label) => statuses.push({ready, label}));
  session.start(); session.start(); await new Promise(setImmediate);
  assert.equal(hosts.length, 1); assert.equal(session.ready, true);
  assert.equal(new URL(session.displayURL).pathname, '/roulette-display.html');
  assert.equal(new URL(session.displayURL).hash, '#room=' + f.store.displayKey());
  const other = await connect(f.store, () => {}, () => {}); other.start(); await new Promise(setImmediate);
  assert.equal(other.ready, false); await assert.rejects(other.action('spin', {viewer: 'Rejected'}), /active roulette/);
  hosts[0].options.message({action: 'spin', viewer: 'Remote'});
  assert.equal(f.store.snapshot().round, null);
  await session.action('spin', {viewer: 'Local'});
  assert.equal(f.store.snapshot().round.viewer, 'Local');
  assert.ok(sent.length > 0);
  assert.ok(sent.every(snap => isRouletteSnapshot(snap) && !JSON.stringify(snap).includes(f.store.displayKey())));
  // A temporary read failure disables the controls, then an ordinary successful
  // publication recovers them without reopening the tab or changing the result.
  const healthySnapshot = f.store.snapshot;
  const resultBeforeFailure = healthySnapshot().round;
  f.store.snapshot = () => { throw Error('Storage temporarily unavailable.'); };
  hosts[0].options.ready();
  assert.equal(session.ready, false);
  assert.deepEqual(statuses.at(-1), {ready: false, label: 'Storage temporarily unavailable.'});
  hosts[0].options.status('connected');
  assert.equal(statuses.at(-1).ready, false);
  await assert.rejects(session.action('clear'), /active roulette/);
  f.store.snapshot = healthySnapshot;
  hosts[0].options.ready();
  assert.equal(session.ready, true);
  assert.deepEqual(statuses.at(-1), {ready: true, label: 'OBS display connected.'});
  assert.deepEqual(f.store.snapshot().round, resultBeforeFailure);
  hosts[0].options.status('duplicate');
  assert.equal(session.ready, false); await assert.rejects(session.action('clear'), /active roulette/);
  f.store.snapshot = () => { throw Error('Read interrupted.'); };
  hosts[0].options.ready(); f.store.snapshot = healthySnapshot; hosts[0].options.ready();
  assert.equal(session.ready, false);
  assert.match(statuses.at(-1).label, /Another browser/);
  hosts[0].options.status('connected'); assert.equal(session.ready, true);
  session.dispose(); other.dispose(); await new Promise(setImmediate);
  assert.ok(hosts.every(host => host.disposed)); assert.equal(timers.size, 0); assert.equal(held.size, 0);
  await assert.rejects(session.action('cancel'), /active roulette/);
});
