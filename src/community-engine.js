const MIN_AMOUNT = 0;
const MAX_AMOUNT = 90;
const MAX_PEOPLE = 25;
const MAX_ENTRIES = 50;
const MAX_PER_PERSON = 10;
const NAME = /^[A-Za-z0-9_]{1,25}$/;
let roundSequence = 0;

export const RESULT_VALUES = Object.freeze([0, 5, 10, 15, 20, 25, 30, 35, 40, 50, 70, 90]);
export const ROULETTE_BASES = Object.freeze([5, 10, 15, 20, 25, 30, 35, 40]);
export const ROULETTE_COLORS = Object.freeze(['rose', 'lilac', 'gold']);

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

export const GAMES = freeze({
  orbit: {
    name: 'Orbit Lock', duration: 24,
    tagline: 'One orbit. One reveal. The whole room.',
    description: 'Three locks reveal one shared result for the room, averaging about $33 per entry with a $0-$90 range.',
  },
  drop: {
    name: 'Crown Drop', duration: 27,
    tagline: 'Every crown has a landing.',
    description: 'Named crowns cascade into individual results, averaging about $33 per entry with a $0-$90 range.',
  },
  vault: {
    name: 'Vault Circuit', duration: 28,
    tagline: 'Three pulses. A room full of reveals.',
    description: 'Three pulses open the community vaults, averaging about $33 per entry with a $0-$90 range.',
  },
  roulette: {
    name: 'Velvet Roulette', duration: 26,
    tagline: 'Pick your color. Let the room spin.',
    description: 'A shared pocket reveals $5-$40. Matching colors double it, averaging $30 per entry with a $5-$80 range.',
  },
});

function billingMode(billing) {
  if (billing !== 'entry' && billing !== 'person') {
    throw new Error('Choose per-entry or per-person amounts.');
  }
  return billing;
}

function gameMode(game) {
  if (!Object.hasOwn(GAMES, game)) throw new Error('Choose Orbit Lock, Crown Drop, Vault Circuit or Velvet Roulette.');
  return game;
}

function normalizePlayers(players) {
  if (!Array.isArray(players) || !players.length) {
    throw new Error('Add at least one person before starting.');
  }
  if (players.length > MAX_ENTRIES) throw new Error('Use no more than 50 roster rows.');
  const people = new Map();
  for (const player of players) {
    const name = typeof player?.name === 'string' ? player.name.trim() : '';
    if (!NAME.test(name)) {
      throw new Error('Names must contain 1-25 letters, numbers or underscores.');
    }
    if (!Number.isInteger(player.count) || player.count < 1 || player.count > MAX_PER_PERSON) {
      throw new Error(`${name}: choose 1-10 entries.`);
    }
    const key = name.toLowerCase();
    const previous = people.get(key);
    const selected = player.color === undefined ? undefined : typeof player.color === 'string' ? player.color.trim().toLowerCase() : '';
    if (selected !== undefined && !ROULETTE_COLORS.includes(selected)) {
      throw new Error(`${name}: choose rose, lilac or gold for the roulette color.`);
    }
    if (previous) {
      if (selected !== undefined && selected !== previous.color) throw new Error(`${previous.name}: use the same color for all of this person's entries.`);
      previous.count += player.count;
      if (previous.count > MAX_PER_PERSON) throw new Error(`${previous.name}: combined entries cannot exceed 10.`);
    } else people.set(key, {name, count: player.count, color: selected ?? ROULETTE_COLORS[people.size % ROULETTE_COLORS.length]});
  }
  const result = [...people.values()];
  if (result.length > MAX_PEOPLE) throw new Error('A demo round supports up to 25 people.');
  if (result.reduce((sum, player) => sum + player.count, 0) > MAX_ENTRIES) {
    throw new Error('A demo round supports up to 50 total entries.');
  }
  return result;
}

export function parseRoster(text) {
  if (typeof text !== 'string') throw new Error('Enter one name and entry count per line.');
  if (text.length > 5000) throw new Error('The roster is too long; use up to 25 people and 50 entries.');
  const rows = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const players = rows.map((line, index) => {
    const fields = line.split(',').map(field => field.trim());
    if (fields.length > 3 || !fields[0] || (fields.length >= 2 && !/^\d+$/.test(fields[1]))) {
      throw new Error(`Line ${index + 1}: use name, count, optional color (for example, FaithFan, 2, rose).`);
    }
    return {name: fields[0], count: fields.length === 1 ? 1 : Number(fields[1]), ...(fields.length === 3 ? {color: fields[2]} : {})};
  });
  return normalizePlayers(players);
}

export function exposure(players, billing = 'entry', game = 'orbit') {
  const roster = normalizePlayers(players);
  billingMode(billing);
  gameMode(game);
  const units = billing === 'person' ? roster.length : roster.reduce((sum, player) => sum + player.count, 0);
  if (game === 'roulette') {
    const colorUnits = ROULETTE_COLORS.map(color => roster.reduce((sum, player) => sum + (player.color === color ? billing === 'person' ? 1 : player.count : 0), 0));
    return {
      units, min: 5 * (units + Math.min(...colorUnits)), max: 40 * (units + Math.max(...colorUnits)), mean: units * 30,
      perResultMin: 5, perResultMax: 80,
    };
  }
  return {units, min: units * MIN_AMOUNT, max: units * MAX_AMOUNT, mean: units * 32.5, perResultMin: MIN_AMOUNT, perResultMax: MAX_AMOUNT};
}

function randomIndex(random, length) {
  const sample = random();
  if (typeof sample !== 'number' || !Number.isFinite(sample) || sample < 0 || sample >= 1) {
    throw new Error('The random source must return a number from 0 up to, but not including, 1.');
  }
  return Math.floor(sample * length);
}

function result(amount) {
  const base = Math.min(10, amount);
  const addition = Math.floor((amount - base) / 10) * 5;
  return {amount, stages: [base, addition, amount - base - addition]};
}

function draw(random) {
  return result(RESULT_VALUES[randomIndex(random, RESULT_VALUES.length)]);
}

export function createRound({game, players, billing = 'entry', duration} = {}, random = Math.random) {
  gameMode(game);
  billingMode(billing);
  const roster = normalizePlayers(players);
  const seconds = duration ?? GAMES[game].duration;
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 20 || seconds > 60) {
    throw new Error('Round duration must be between 20 and 60 seconds.');
  }
  if (typeof random !== 'function') throw new Error('A random source function is required.');
  const id = globalThis.crypto?.randomUUID?.() ?? `community-${Date.now().toString(36)}-${++roundSequence}`;
  const shared = game === 'orbit' ? draw(random) : null;
  const rouletteIndex = game === 'roulette' ? randomIndex(random, 24) : null;
  const sharedBase = rouletteIndex === null ? null : ROULETTE_BASES[Math.floor(rouletteIndex / 3)];
  const sharedColor = rouletteIndex === null ? null : ROULETTE_COLORS[rouletteIndex % 3];
  const entries = roster.flatMap(player => {
    const personDraw = game === 'roulette' ? result(sharedBase * (player.color === sharedColor ? 2 : 1)) : shared ?? (billing === 'person' ? draw(random) : null);
    return Array.from({length: player.count}, (_, position) => {
      const result = personDraw ?? draw(random);
      return {
        id: `${id}:${player.name.toLowerCase()}:${position + 1}`,
        name: player.name,
        color: player.color,
        index: position + 1,
        amount: result.amount,
        stages: [...result.stages],
      };
    });
  });
  return freeze({
    id, game, billing, duration: seconds, players: roster, entries,
    sharedAmount: shared?.amount ?? null,
    sharedStages: shared ? [...shared.stages] : null,
    sharedBase, sharedColor, rouletteIndex,
  });
}

export function settleRound(round) {
  if (!round || !Object.hasOwn(GAMES, round.game)) throw new Error('A valid community round is required.');
  const limits = exposure(round.players, round.billing, round.game);
  const roster = normalizePlayers(round.players);
  if (round.game === 'roulette' && (!Number.isInteger(round.rouletteIndex) || round.rouletteIndex < 0 || round.rouletteIndex >= 24 ||
    round.sharedBase !== ROULETTE_BASES[Math.floor(round.rouletteIndex / 3)] || round.sharedColor !== ROULETTE_COLORS[round.rouletteIndex % 3])) {
    throw new Error('Roulette must keep its original base, color and pocket together.');
  }
  if (!Array.isArray(round.entries) || round.entries.length !== roster.reduce((sum, player) => sum + player.count, 0)) {
    throw new Error('Round entries do not match the roster.');
  }
  const ids = new Set();
  let cursor = 0;
  const rows = roster.map(player => {
    const entries = round.entries.slice(cursor, cursor + player.count);
    cursor += player.count;
    entries.forEach((entry, index) => {
      if (entry.name !== player.name || entry.color !== player.color || entry.index !== index + 1 || typeof entry.id !== 'string' || !entry.id || ids.has(entry.id)) {
        throw new Error('Round entries must uniquely match each person and entry number.');
      }
      ids.add(entry.id);
      if (!Number.isInteger(entry.amount) || entry.amount < MIN_AMOUNT || entry.amount > MAX_AMOUNT ||
        !Array.isArray(entry.stages) || entry.stages.length !== 3 ||
        entry.stages.some(amount => !Number.isInteger(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) ||
        entry.stages.reduce((sum, amount) => sum + amount, 0) !== entry.amount) {
        throw new Error('Round amounts must be whole dollars from $0-$90 with matching reveals.');
      }
      if (round.game !== 'roulette' && !RESULT_VALUES.includes(entry.amount)) throw new Error('The result must be one of the calibrated wheel amounts.');
      if (round.game === 'roulette' && entry.amount !== round.sharedBase * (player.color === round.sharedColor ? 2 : 1)) {
        throw new Error('Roulette amounts must match the pocket and the person\'s color.');
      }
      if (round.game === 'orbit' && (entry.amount !== round.sharedAmount ||
        entry.stages.some((amount, stage) => amount !== round.sharedStages?.[stage]))) {
        throw new Error('Orbit Lock must use the same result for every entry.');
      }
    });
    if (round.billing === 'person' && entries.some(entry => entry.amount !== entries[0].amount ||
      entry.stages.some((amount, stage) => amount !== entries[0].stages[stage]))) {
      throw new Error('Per-person mode must use one result for all of a person\'s entries.');
    }
    const amounts = (round.billing === 'person' ? entries.slice(0, 1) : entries).map(entry => entry.amount);
    return {name: player.name, count: player.count, color: player.color, amounts, total: amounts.reduce((sum, amount) => sum + amount, 0)};
  });
  return freeze({rows, total: rows.reduce((sum, row) => sum + row.total, 0), ...limits});
}

export function roundPhase(progress) {
  if (typeof progress !== 'number' || !Number.isFinite(progress)) throw new Error('Round progress must be a finite number.');
  if (progress < 0.12) return {index: 0, label: 'Gathering entries'};
  if (progress < 0.4) return {index: 1, label: 'First reveal'};
  if (progress < 0.7) return {index: 2, label: 'Second reveal'};
  if (progress < 0.9) return {index: 3, label: 'Final reveal'};
  return {index: 4, label: 'Round complete'};
}
