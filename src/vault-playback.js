import {vaultRoundTime} from './vault-hold.js';
import {VAULT_FIRST_CHAMBER_STYLE} from './vault-first-chamber.js';
import {VAULT_TREASURE_STYLE,VAULT_TREASURE_INTRO_MS} from './vault-opening-treasure.js';
// Saved wall-clock deadlines keep controls and OBS in agreement. The artwork
// samples its original timeline at a gentler pace, without changing any prizes.
export const VAULT_PLAYBACK_SCALE=1.5;
export const vaultPlaybackScale=round=>round?.playbackScale===VAULT_PLAYBACK_SCALE?VAULT_PLAYBACK_SCALE:1;
export function prepareVaultPlay(round){
 if(vaultPlaybackScale(round)===VAULT_PLAYBACK_SCALE){round.holdFinal=true;return round;}
 round.playbackScale=VAULT_PLAYBACK_SCALE;
 round.introStyle=VAULT_TREASURE_STYLE;
 round.firstChamberStyle=VAULT_FIRST_CHAMBER_STYLE;
 round.readyAt=round.startedAt+VAULT_TREASURE_INTRO_MS*VAULT_PLAYBACK_SCALE;
 round.holdFinal=true;
 return round;
}
const cache=new WeakMap();
export function vaultPresentation(round,time){
 time=vaultRoundTime(round,time);
 const scale=vaultPlaybackScale(round);if(scale===1)return {round,time};
 const anchor=round.startedAt,stamp=value=>Number.isFinite(value)?anchor+(value-anchor)/scale:value;
 const signature=[round.flight?.id,round.opened.length,round.completedAt,round.hideAt,round.holdFinal,round.readyAt,round.startedAt,round.holdRevision].join(':');
 let saved=cache.get(round);
 if(!saved||saved.signature!==signature){
  const shot=s=>s?{...s,startAt:stamp(s.startAt),revealAt:stamp(s.revealAt),finishAt:stamp(s.finishAt),...(s.bonusBuildMs?{bonusBuildMs:s.bonusBuildMs/scale}:{})}:null;
  const presented={...round,holdAt:stamp(round.holdAt),resumedAt:stamp(round.resumedAt),readyAt:stamp(round.readyAt),completedAt:stamp(round.completedAt),hideAt:stamp(round.hideAt),flight:shot(round.flight),opened:round.opened.map(shot)};
  saved={signature,round:presented};cache.set(round,saved);
 }
 return {round:saved.round,time:stamp(time)};
}
