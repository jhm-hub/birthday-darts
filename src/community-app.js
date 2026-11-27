import {GAMES, parseRoster, createRound, settleRound, exposure, roundPhase} from './community-engine.js';
import {renderCommunity} from './community-renderer.js';

const $ = selector => document.querySelector(selector);
const money = n => '$' + n.toLocaleString('en-US');
const storageKey = 'faith-community-lab-v1';
const sample = $('#roster').value;
const descriptions = {
  orbit: {
    kicker: 'THE SHARED WHEEL', phases: ['Lock one', 'Lock two'],
    line: '“Get your names in. Three locks. The whole room gets the same number.”',
    steps: ['Add each participant and their agreed entry count. Set the entry fee separately, if you want to rehearse a buy-in.', 'The wheel spins, then locks a base, an addition and a final flourish. Every lock builds the same shared amount.', 'The final number holds on screen. Each entry adds that result to its participant’s total.'],
    odds: 'Twelve equally likely whole-dollar results: $0, $5, $10, $15, $20, $25, $30, $35, $40, $50, $70 and $90. The average is about $33 per entry over many rounds. The three locks reveal one draw in parts.',
    scenes: ['The room gathers around the wheel.', 'The base locks into place.', 'The second lock builds the shared amount.', 'One last lock. Everyone shares the reveal.', 'The shared amount holds for the whole room.'],
  },
  drop: {
    kicker: 'THE COMMUNITY CASCADE', phases: ['Release', 'Cascade'],
    line: '“Every entry gets a crown. Watch yours all the way down.”',
    steps: ['Add the crowd. Every entry becomes a named crown on the same board.', 'The crowns release in a short wave, bounce through the pegs, and collect in the amount trays together.', 'Each crown shows its exact result. The receipt groups all entries by participant.'],
    odds: 'Each entry independently draws from the twelve amounts $0, $5, $10, $15, $20, $25, $30, $35, $40, $50, $70 and $90: about $33 on average over many rounds. The drop illustrates that draw; the path does not change the odds.',
    scenes: ['Every entry takes its place.', 'The first crowns enter the board.', 'Follow the crowns through the cascade.', 'The crowns settle into their amount trays.', 'Every crown has landed. The amounts hold.'],
  },
  vault: {
    kicker: 'THE ROOM-WIDE REVEAL', phases: ['Charge', 'Unlock'],
    line: '“Your name. Your vault. Three pulses, then we open the whole room.”',
    steps: ['Add participants and entries. Each entry gets a named vault in the grid.', 'A circuit travels through the room. Vaults light up and unlatch in three waves.', 'The last pulse reveals the complete grid. Every amount stays visible beside its participant’s total.'],
    odds: 'Each entry independently draws from the twelve amounts $0, $5, $10, $15, $20, $25, $30, $35, $40, $50, $70 and $90: about $33 on average over many rounds. Reveal order does not change the odds.',
    scenes: ['The room’s vaults come online.', 'The first pulse charges the circuit.', 'Locks release across the grid.', 'The final wave opens every vault.', 'All vaults are open. The amounts hold.'],
  },
  roulette: {
    kicker: 'THE COLOR-CALL ROULETTE', phases: ['Launch', 'Slowdown'],
    line: '“Choose rose, lilac or gold. Follow the ball. Matching color gets double.”',
    steps: ['Add a color after each name and entry count: Bongo, 3, rose. All of that participant’s entries use their chosen color.', 'The ball circles 24 pockets. Each combines one of three colors with a $5–$40 base amount.', 'The matching color takes twice the base result; the other two colors keep the base. Every entry adds its color’s result to the participant’s total.'],
    odds: 'All 24 pockets are equally likely. Each color matches on 8 pockets. Base amounts are $5, $10, $15, $20, $25, $30, $35 and $40. Results range from $5 to $80 and average $30 per entry over many rounds. These are game amounts, not prize payouts.',
    scenes: ['The colors are chosen. The room is ready.', 'The ball takes the outer track.', 'The ball slows toward the pockets.', 'One pocket. Three color results.', 'The matching color doubles. All results hold.'],
  },
};

let game = 'orbit', players = [], round = null, receipt = null, running = false;
let started = 0, progress = 0, frameId = 0, finishTimer = 0, lastPhase = -1;
let sound = false, audio = null, valid = false;
let entryFee = 0, capturedFee = 0;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let saved;
try { saved = JSON.parse(localStorage.getItem(storageKey)); } catch { /* A fresh session also works without storage. */ }
if (saved && typeof saved.roster === 'string') $('#roster').value = saved.roster;
// This collection uses one game result per entry, as requested.
if (Number.isInteger(saved?.entryFee) && saved.entryFee >= 0 && saved.entryFee <= 1000) $('#entry-fee').value = saved.entryFee;
const linkedGame = new URL(location.href).searchParams.get('game');
if (Object.hasOwn(GAMES, linkedGame)) game = linkedGame;
else if (Object.hasOwn(GAMES, saved?.game)) game = saved.game;

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify({roster: $('#roster').value, billing: $('#billing').value, duration: Number($('#duration').value), entryFee: Number($('#entry-fee').value), game})); }
  catch { $('#status').textContent = 'Browser saving is unavailable. You can still play this demo.'; }
}
function setDuration(value = GAMES[game].duration) {
  const original = $('#duration').options[0];
  original.value = GAMES[game].duration;
  original.textContent = GAMES[game].duration + ' seconds · original pace';
  $('#duration').value = [...$('#duration').options].some(o => Number(o.value) === value) ? String(value) : String(GAMES[game].duration);
}
function draw() {
  renderCommunity($('#community-canvas'), {game, progress, round, players, reducedMotion: reduced.matches, time: performance.now() / 1000});
}
function clearRound(message = 'Ready for a new round. The previous demo has been cleared.') {
  cancelAnimationFrame(frameId); clearTimeout(finishTimer);
  running = false; round = null; receipt = null; progress = 0; lastPhase = -1;
  $('#setup-fields').disabled = false;
  document.querySelectorAll('[data-game]').forEach(button => { button.disabled = false; });
  $('#results').hidden = true; $('#copy-status').textContent = '';
  $('#round-label').textContent = 'READY FOR THE ROOM';
  $('#scene-label').textContent = 'Add your crowd, then start the round.';
  $('#status').textContent = message;
  updateProgress(); validate();
}
function validate() {
  if (running) return;
  valid = false;
  const billing = $('#billing').value;
  const average = game === 'roulette' ? 30 : 33;
  $('#billing-help').textContent = billing === 'entry'
    ? `Each entry adds a game result, averaging about ${money(average)} over many rounds. Entry fees are separate.`
    : `Alternate demo rule: one result per person, averaging about ${money(average)}. Extra tokens share that result and count once; entry fees still apply to all entries.`;
  try {
    players = parseRoster($('#roster').value);
    entryFee = Number($('#entry-fee').value);
    if ($('#entry-fee').value.trim() === '' || !Number.isInteger(entryFee) || entryFee < 0 || entryFee > 1000) throw new Error('Set an entry fee in whole dollars from $0 to $1,000. Use $0 to leave it unset.');
    const limits = exposure(players, billing, game);
    const count = players.reduce((n, p) => n + p.count, 0);
    $('#people-count').textContent = players.length;
    $('#token-count').textContent = count;
    $('#max-person').textContent = money((game === 'roulette' ? 80 : 90) * (billing === 'person' ? 1 : Math.max(...players.map(p => p.count))));
    $('#range').textContent = money(limits.min) + '–' + money(limits.max);
    $('#range-detail').textContent = `Average combined game result: about ${money(Math.round(limits.mean))}. Any single round may be higher or lower.`;
    $('#fee-summary').textContent = entryFee ? `Entry fees: ${count} × ${money(entryFee)} = ${money(count * entryFee)}, separate from the game results.` : 'Entry fee not set. Game results are separate from any buy-in.';
    $('#entry-label').textContent = `${players.length} ${players.length === 1 ? 'person' : 'people'} · ${count} ${count === 1 ? 'entry' : 'entries'}`;
    $('#form-error').textContent = '';
    valid = true;
  } catch (error) {
    players = []; $('#form-error').textContent = error.message;
    for (const id of ['people-count', 'token-count', 'max-person', 'range']) $('#' + id).textContent = '—';
    $('#entry-label').textContent = 'Complete the setup to play';
    $('#range-detail').textContent = 'Correct the setup to see the round’s range.';
    $('#fee-summary').textContent = '';
  }
  $('#start').disabled = !valid;
  $('#start').textContent = `Start ${$('#duration').value}-second round ↗`;
  $('#timer').textContent = $('#duration').value + ' sec';
  draw();
}
function selectGame(next, initial = false) {
  if (running) return;
  game = next;
  const info = descriptions[game];
  document.querySelectorAll('[data-game]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.game === game)));
  $('#game-title').textContent = GAMES[game].name;
  $('#game-kicker').textContent = info.kicker;
  $('#phase-one').textContent = info.phases[0]; $('#phase-two').textContent = info.phases[1];
  $('#host-line').textContent = info.line; $('#odds-note').textContent = info.odds;
  $('#host-steps').replaceChildren(...info.steps.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
  $('.intro-note > span').textContent = game === 'roulette' ? '~$30' : '~$33';
  setDuration(initial ? saved?.duration : undefined);
  clearRound('Demo only. Add names manually; no Twitch connection or payments.');
  const url = new URL(location.href); url.searchParams.set('game', game); history.replaceState(null, '', url);
  if (!initial) save();
}
function random() {
  const bytes = new Uint32Array(1); crypto.getRandomValues(bytes); return bytes[0] / 4294967296;
}
function tone(frequency, length = .13, volume = .035, delay = 0) {
  if (!sound || !audio || audio.state !== 'running') return;
  const oscillator = audio.createOscillator(), gain = audio.createGain();
  const at = audio.currentTime + delay;
  oscillator.type = 'sine'; oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(volume, at + .008);
  gain.gain.exponentialRampToValueAtTime(.0001, at + length);
  oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(at); oscillator.stop(at + length + .01);
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
}
function updateProgress() {
  $('#progress-fill').style.width = `${progress * 100}%`;
  $('.timeline').setAttribute('aria-valuenow', String(Math.round(progress * 100)));
  const phase = roundPhase(progress).index;
  document.querySelectorAll('.phase-track span').forEach((span, i) => span.classList.toggle('active', Boolean(round) && i <= Math.min(phase, 3)));
  if (round) {
    $('#timer').textContent = running ? `${Math.max(0, Math.ceil(round.duration * (1 - progress)))} sec remaining` : `${round.duration} sec · complete`;
    $('#scene-label').textContent = descriptions[game].scenes[phase];
    if (phase !== lastPhase) {
      lastPhase = phase;
      $('#status').textContent = descriptions[game].scenes[phase] + (phase === 4 && running ? ' Preparing the participant totals.' : '');
      tone([330, 440, 554, 660, 880][phase], .22);
    }
  }
}
function finish() {
  if (!running || !round) return;
  running = false; progress = 1; cancelAnimationFrame(frameId); clearTimeout(finishTimer);
  receipt = settleRound(round);
  updateProgress(); draw();
  $('#round-label').textContent = 'ROUND COMPLETE';
  $('#status').textContent = 'All results are ready. Reset to edit the crowd or play another round.';
  $('#grand-total').textContent = money(receipt.total);
  $('#result-explanation').textContent = round.billing === 'entry'
    ? `${round.entries.length} entries, each counted once. ${game === 'orbit' ? 'Shared result: ' + money(round.sharedAmount) + ' per entry.' : 'Individual results are grouped below.'}`
    : 'One result counted per person. Their extra tokens share the same amount and do not add to the total.';
  $('#result-fees').textContent = capturedFee ? `Separate entry fees: ${round.entries.length} × ${money(capturedFee)} = ${money(round.entries.length * capturedFee)}. Combined with game results: ${money(receipt.total + round.entries.length * capturedFee)}. Demo only; no payments collected.` : 'Entry fee was not set for this demo. The totals above contain game results only.';
  $('#result-rows').replaceChildren(...receipt.rows.map(row => {
    const tr = document.createElement('tr');
    for (const value of [row.name, row.count, row.amounts.map(money).join(' + '), money(row.total)]) {
      const td = document.createElement('td'); td.textContent = value; tr.append(td);
    }
    return tr;
  }));
  $('#results').hidden = false;
  // Hold the captured round until an explicit reset; setup changes never rewrite its receipt.
  $('#start').disabled = true;
  tone(660, .3, .035, .08); tone(880, .4, .03, .22);
}
function animate(now) {
  if (!running) return;
  progress = Math.min(1, (now - started) / (round.duration * 1000));
  updateProgress(); draw();
  if (progress >= 1) finish(); else frameId = requestAnimationFrame(animate);
}
$('#start').onclick = () => {
  if (running || round || !valid) return;
  try {
    round = createRound({game, players, billing: $('#billing').value, duration: Number($('#duration').value)}, random);
    capturedFee = entryFee;
    save(); running = true; progress = 0; started = performance.now(); lastPhase = -1;
    $('#setup-fields').disabled = true; $('#start').disabled = true;
    document.querySelectorAll('[data-game]').forEach(button => { button.disabled = true; });
    $('#round-label').textContent = 'THE ROOM IS IN';
    $('#results').hidden = true;
    $('#play').scrollIntoView({block: 'start', behavior: reduced.matches ? 'instant' : 'smooth'});
    finishTimer = setTimeout(finish, round.duration * 1000);
    frameId = requestAnimationFrame(animate);
  } catch (error) { $('#status').textContent = error.message; }
};
$('#reset').onclick = () => clearRound(running ? 'Round cancelled. No results were settled. Your crowd is ready again.' : undefined);
$('#room-form').onsubmit = event => event.preventDefault();
for (const id of ['roster', 'billing', 'duration', 'entry-fee']) $('#' + id).addEventListener('input', () => { if (!round) { validate(); save(); } });
$('#sample').onclick = () => { $('#roster').value = sample; validate(); save(); };
document.querySelectorAll('[data-game]').forEach(button => { button.onclick = () => selectGame(button.dataset.game); });
$('#sound').onclick = async () => {
  if (sound) { sound = false; if (audio) await audio.suspend(); }
  else {
    try { audio ??= new (window.AudioContext || window.webkitAudioContext)(); await audio.resume(); sound = true; tone(660); }
    catch { $('#status').textContent = 'Sound is unavailable in this browser. The visual demo still works.'; sound = false; }
  }
  $('#sound').textContent = sound ? 'Sound on' : 'Sound off'; $('#sound').setAttribute('aria-pressed', String(sound));
};
$('#focus').onclick = () => {
  const enabled = document.body.classList.toggle('focus-mode');
  $('#focus').textContent = enabled ? 'Exit focus view ↙' : 'Focus view ↗';
  $('#focus').setAttribute('aria-pressed', String(enabled)); draw();
};
$('#copy').onclick = async () => {
  if (!receipt) return;
  const text = `${GAMES[game].name} · Demo results · ${round.billing === 'entry' ? 'Per entry' : 'Per person'}\n` + receipt.rows.map(row => `${row.name} · ${row.count} ${row.count === 1 ? 'entry' : 'entries'} · ${row.amounts.map(money).join(' + ')} = ${money(row.total)}`).join('\n') + `\nCombined game results: ${money(receipt.total)}\nSeparate entry fees: ${capturedFee ? money(capturedFee * round.entries.length) : 'not set'}\nNo payments collected.`;
  try { await navigator.clipboard.writeText(text); $('#copy-status').textContent = 'Results copied.'; }
  catch { $('#copy-status').textContent = 'Copy is unavailable here. Select and copy the result table instead.'; }
};
window.addEventListener('resize', draw);
reduced.addEventListener('change', draw);
window.addEventListener('pagehide', () => { cancelAnimationFrame(frameId); clearTimeout(finishTimer); void audio?.close(); });
window.addEventListener('pageshow', event => {
  if (!event.persisted) return;
  audio = null; sound = false;
  $('#sound').textContent = 'Sound off'; $('#sound').setAttribute('aria-pressed', 'false');
  clearRound('Returned to the demo. Start a fresh round with your saved crowd.');
});
selectGame(game, true);
document.fonts.ready.then(draw);
