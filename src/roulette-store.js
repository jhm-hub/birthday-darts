import {DEFAULT_ROULETTE, validateRoulette, validateRouletteRound, createRouletteRound, advanceRoulette, publicRoulette} from './roulette-game.js';
import {randomKey, validKey} from './protocol.js';

export const ROULETTE_KEY = 'faith-velvet-roulette-v1';
const time = value => Number.isSafeInteger(value) && value >= 0;
const volume = value => Number.isInteger(value) && value >= 0 && value <= 100;

function historyEntry(value) {
  if (!value || typeof value.id !== 'string' || !/^[\w-]{1,100}$/.test(value.id) ||
      typeof value.viewer !== 'string' || value.viewer.length > 40 || /[\u0000-\u001f\u007f]/.test(value.viewer) ||
      !Number.isInteger(value.amount) || value.amount < 0 || value.amount > 10000 || !time(value.endedAt)) {
    throw Error('Invalid roulette result history.');
  }
  return {id: value.id, viewer: value.viewer, amount: value.amount, endedAt: value.endedAt};
}

function historyList(values) {
  if (!Array.isArray(values) || values.length > 10) throw Error('Invalid roulette result history.');
  const result = values.map(historyEntry);
  if (new Set(result.map(item => item.id)).size !== result.length) throw Error('Duplicate roulette result.');
  return result;
}

/** Validate the display envelope before allowing any network snapshot to render. */
export function isRouletteSnapshot(value) {
  try {
    if (!value || value.kind !== 'faith-roulette' || value.version !== 1 || !time(value.serverNow) ||
        typeof value.visible !== 'boolean' || !volume(value.volume)) return false;
    validateRoulette(value.config);
    const history = historyList(value.history);
    if (history.some(item => item.endedAt > value.serverNow)) return false;
    if (value.round !== null) {
      const round = validateRouletteRound(value.round);
      if (round.startAt > value.serverNow || (round.phase === 'complete' && round.endAt > value.serverNow)) return false;
    }
    return true;
  } catch { return false; }
}

/** Roulette settings deliberately stay local until the shared service supports this game. */
export function createRouletteStore(storage, locks) {
  const listeners = new Set();
  const lock = fn => locks.request(ROULETTE_KEY, fn);
  function read() {
    const text = storage.getItem(ROULETTE_KEY);
    if (text === null) return null;
    try {
      const data = JSON.parse(text);
      if (!data || data.version !== 1 || !validKey(data.room) || typeof data.visible !== 'boolean' || !volume(data.volume)) throw Error();
      return {
        version: 1, room: data.room, config: validateRoulette(data.config),
        round: data.round === null ? null : validateRouletteRound(data.round),
        history: historyList(data.history), visible: data.visible, volume: data.volume,
      };
    } catch { throw Error('Saved roulette settings could not be read. They have not been overwritten.'); }
  }
  function required() {
    const data = read();
    if (!data) throw Error('Open roulette settings to initialize this game.');
    return data;
  }
  function write(data) {
    storage.setItem(ROULETTE_KEY, JSON.stringify(data));
    for (const listener of listeners) listener();
  }
  function settle(data, now) {
    if (!time(now)) throw Error('Invalid roulette clock.');
    if (!data.round) return false;
    const next = advanceRoulette(data.round, now);
    let changed = next !== data.round;
    data.round = next;
    if (next.phase === 'complete' && !data.history.some(item => item.id === next.id)) {
      data.history = [{id: next.id, viewer: next.viewer, amount: next.amount, endedAt: next.endAt}, ...data.history].slice(0, 10);
      changed = true;
    }
    return changed;
  }
  function snapshot(now = Date.now()) {
    if (!time(now)) throw Error('Invalid roulette clock.');
    const data = required();
    return {
      kind: 'faith-roulette', version: 1, serverNow: now, config: validateRoulette(data.config),
      round: publicRoulette(data.round), history: data.history.map(item => ({...item})),
      visible: data.visible, volume: data.volume,
    };
  }
  return {
    async init(now = Date.now()) {
      await lock(() => {
        const existing = read();
        const data = existing ?? {version: 1, room: randomKey(), config: validateRoulette(DEFAULT_ROULETTE), round: null, history: [], visible: true, volume: DEFAULT_ROULETTE.volume};
        const changed = settle(data, now);
        if (!existing || changed) write(data);
      });
      return snapshot(now);
    },
    snapshot,
    displayKey: () => required().room,
    async save(config, now = Date.now()) {
      const next = validateRoulette(config);
      await lock(() => {
        const data = required();
        settle(data, now);
        if (data.round?.phase === 'spinning') throw Error('Finish or cancel the current spin before editing this wheel.');
        data.config = next; data.volume = next.volume;
        write(data);
      });
      return snapshot(now);
    },
    async action(action, payload = {}, now = Date.now()) {
      await lock(() => {
        const data = required();
        const settled = settle(data, now);
        if (action === 'spin') {
          if (data.round?.phase === 'spinning') throw Error('Wait for the current spin to finish.');
          data.round = createRouletteRound(data.config, payload.viewer ?? '', now);
        } else if (action === 'clear') {
          if (data.round?.phase === 'spinning') throw Error('Finish or cancel the spin before clearing it.');
          data.round = null;
        } else if (action === 'cancel') {
          if (data.round?.phase === 'complete') {
            if (settled) write(data);
            throw Error('This spin has already finished. Use Next viewer to clear it.');
          }
          data.round = null;
        } else if (action === 'visibility') {
          if (typeof payload.visible !== 'boolean') throw Error('Choose whether to show the wheel.');
          data.visible = payload.visible;
        } else if (action === 'volume') {
          if (!volume(payload.value)) throw Error('Volume must be a whole number from 0 to 100.');
          data.volume = payload.value;
          data.config = {...data.config, volume: payload.value};
        } else throw Error('Unknown roulette action.');
        write(data);
      });
      return snapshot(now);
    },
    async advance(now = Date.now()) {
      await lock(() => {
        const data = required();
        if (settle(data, now)) write(data);
      });
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    changed(key) { if (key === ROULETTE_KEY) for (const listener of listeners) listener(); },
  };
}
