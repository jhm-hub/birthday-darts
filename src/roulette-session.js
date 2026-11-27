import {connectRoom} from './room.js';
import {validKey} from './protocol.js';
export {isRouletteSnapshot} from './roulette-store.js';

export async function connectRouletteControl(store, onSnapshot, onStatus) {
  if (!navigator.locks) throw Error('Open roulette in an up-to-date browser over HTTPS.');
  await store.init();
  const key = store.displayKey();
  if (!validKey(key)) throw Error('The private roulette display link could not be read.');
  const url = new URL('./roulette-display.html', location.href);
  url.hash = 'room=' + key;
  let disposed = false, started = false, ready = false, peerStatus = 'connecting', lastError = '';
  let link, pulse, heartbeat, unsubscribe, release, retry;
  const reportError = error => {
    if (disposed) return;
    lastError = error?.message || 'Roulette controls are temporarily unavailable.';
    status();
  };
  function status() {
    if (disposed) return;
    if (lastError) { onStatus(false, lastError); return; }
    onStatus(ready && peerStatus !== 'duplicate',
      !ready ? 'Another tab has roulette controls open. Close it to use this tab.' :
      peerStatus === 'connected' ? 'OBS display connected.' :
      peerStatus === 'duplicate' ? 'Another browser is hosting this roulette display.' :
      peerStatus === 'offline' ? 'Controls ready; OBS connection is offline.' :
      'Controls ready; waiting for the OBS display.');
  }
  function publish() {
    if (disposed) return;
    try {
      const next = store.snapshot(); onSnapshot(next); link?.send(next);
      if (lastError) { lastError = ''; status(); }
    }
    catch (error) { reportError(error); }
  }
  function claim() {
    if (disposed) return;
    void navigator.locks.request('faith-roulette-stream-control', {ifAvailable: true}, async ownership => {
      if (disposed) return;
      if (!ownership) { status(); retry = setTimeout(claim, 2500); return; }
      ready = true;
      link = connectRoom({role: 'host', key,
        status(value) { peerStatus = value; status(); },
        message() { /* Displays are read-only. Remote data never starts a spin. */ },
        ready: publish,
      });
      unsubscribe = store.subscribe(publish);
      status(); publish();
      pulse = setInterval(() => { void store.advance().then(() => { if (lastError) publish(); }).catch(reportError); }, 100);
      heartbeat = setInterval(publish, 1000);
      await new Promise(resolve => { release = resolve; });
    }).catch(reportError);
  }
  function assertActive() {
    if (!ready || disposed || lastError || peerStatus === 'duplicate') throw Error('Use the active roulette control tab.');
  }
  function dispose() {
    if (disposed) return;
    disposed = true; ready = false;
    clearInterval(pulse); clearInterval(heartbeat); clearTimeout(retry);
    unsubscribe?.(); link?.dispose(); release?.();
    window.removeEventListener('pagehide', dispose);
  }
  window.addEventListener('pagehide', dispose, {once: true});
  return {
    displayURL: url.href,
    get ready() { return ready && !disposed && !lastError && peerStatus !== 'duplicate'; },
    start() { if (!started && !disposed) { started = true; claim(); } },
    dispose,
    async action(action, payload = {}) { assertActive(); return store.action(action, payload); },
    async save(config) { assertActive(); return store.save(config); },
  };
}
