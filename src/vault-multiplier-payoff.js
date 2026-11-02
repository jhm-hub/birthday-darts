import {vaultLastShot} from './vault-finish-motion.js';
import {vaultBonusAt,vaultBonusBuildMs} from './vault-timing.js';
import {VAULT_BONUS_LAND_MS} from './vault-bonus-motion.js';
import {projectedVault,vaultLevel} from './vault-game.js';
import {finalePose} from './vault-effects.js';
import {ease,clamp} from './vault-motion.js';

// Extremely wide amounts leave no side gutter. Dock above those plaques.
export const vaultPayoffDock=dock=>dock.right>370?{...dock,y:dock.y-80}:dock;

// The last earned boost (in the final chamber or the one before it) carries
// into the finale. Only public awards are needed; no target/preset is read.
export function vaultMultiplierPayoff(round,time){
 const off={linked:false},last=vaultLastShot(round);
 if(!last||time<last.revealAt)return off;
 const boost=[...(round.opened??[]),...(round.flight?[round.flight]:[])].filter(s=>s.index>=last.index-1&&s.bonus?.kind==='multiply'&&vaultBonusBuildMs(s)).at(-1);
 if(!boost)return off;
 const direct=boost.index===last.index;
 const landAt=direct?vaultBonusAt(last)+VAULT_BONUS_LAND_MS:last.revealAt+180;
 const shown=projectedVault(round,time),revealAt=last.finishAt+finalePose(0,vaultLevel(shown)).build;
 return {linked:true,direct,last,boost,landAt,catchAt:landAt+420,revealAt,multiplier:String(shown.multiplier)};
}

// The existing multiplier seal docks beside the bank, then rises into the
// crown. Its path stays outside the money and meets the existing jackpot hit.
export function vaultPayoffFlight(payoff,ordinary,time,dock,quiet=false,anchor=ordinary){
 if(!payoff.linked)return ordinary;
 const off={...ordinary,opacity:0,catch:0};
 if(quiet||time<payoff.landAt||time>payoff.revealAt+120)return off;
 if(time<payoff.catchAt)return payoff.direct?ordinary:off;
 const t=clamp((time-payoff.catchAt)/(payoff.revealAt-payoff.catchAt)),rise=ease(t/.5),sweep=ease((t-.45)/.55);
 const right=payoff.direct?anchor.x:Math.min(396,dock.right+8),fromY=payoff.direct?anchor.y:dock.y,y=fromY+(194-fromY)*rise;
 return {kind:'multiply',label:'×'+payoff.multiplier,x:Math.round(right+(210-right)*sweep),y:Math.round(y),
  scale:(payoff.direct?anchor.scale:.78)+(1-(payoff.direct?anchor.scale:.78))*sweep,opacity:(payoff.direct?1:ease((time-payoff.catchAt)/60))*(1-ease((time-payoff.revealAt+20)/140)),catch:0};
}
