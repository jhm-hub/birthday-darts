import {VAULT_INTRO_MS} from './vault-game.js';
import {clamp,ease} from './vault-motion.js';

export const VAULT_OPENING_REVEAL_MS=620;
export const VAULT_OPENING_LOCK_MS=[180,260,340,420,500];
// One saved clock drives the arrival, lock lights and exact balance reveal.
// No presentation frame draws another balance or delays the first unlock.
export function vaultIntro(round,time,quiet=false){
 const age=round?time-round.startedAt:VAULT_INTRO_MS;
 const active=!!round&&!round.flight&&!round.opened.length&&round.completedAt==null&&age<VAULT_INTRO_MS;
 const still={active:false,pending:false,stage:1,heading:1,machineY:0,brightness:1,locks:[0,0,0,0,0],pips:[0,0,0],pipY:[0,0,0],amount:1,amountY:0,amountScale:1,calc:1,bankTitle:true,title:1,gleam:0};
 if(!active)return still;
 const reveal=age-VAULT_OPENING_REVEAL_MS,pending=reveal<0;
 const pulse=quiet?0:Math.sin(clamp(reveal/340)*Math.PI);
 return {...still,active,pending,stage:ease(age/240),heading:ease((age-60)/220),
  machineY:quiet?0:6*(1-ease(age/400)),brightness:quiet?1:.88+.12*ease(age/580)+.07*pulse,
  locks:VAULT_OPENING_LOCK_MS.map(at=>quiet?0:ease((age-at)/30)*(1-ease((age-at-40)/150))),
  pips:[0,1,2].map(i=>ease((age-160-i*55)/100)*(1-ease((age-560)/60))*(quiet?1:.65+.35*Math.sin(clamp((age-160-i*55)/400)*Math.PI))),
  pipY:[0,1,2].map(i=>quiet?0:-3*Math.sin(clamp((age-180-i*55)/370)*Math.PI)),
  amount:pending?0:ease(reveal/(quiet?80:110)),amountY:quiet?0:5*(1-ease(reveal/210)),amountScale:1+.035*pulse,
  calc:ease((age-860)/180),bankTitle:age>=1120,
  title:age<1120?1-ease((age-1040)/80):ease((age-1120)/80),gleam:pulse};
}
