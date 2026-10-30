import {CHAMBER_SLOTS,VAULT_ART} from './vault-layout.js';
export {CHAMBER_SLOTS} from './vault-layout.js';
// Presentation only: each award belongs to one physical chamber. The saved
// award clock drives every pose, including after refresh or display reconnect.
export const CHAMBER_THEMES=['GOLDEN WELCOME','CANDY CACHE','JEWEL ROOM','BIRTHDAY TREATS','CROWN CHAMBER'].map(name=>({name}));
export const clamp=v=>Math.max(0,Math.min(1,v));
export const ease=v=>{v=clamp(v);return v*v*(3-2*v);};
const smoother=v=>{v=clamp(v);return v*v*v*(v*(v*6-15)+10);};
export const chamberTheme=index=>CHAMBER_THEMES[index%5];
export function chamberBirths(round){
 const births=new Map();if(!round)return births;
 let index=round.preset.chambers;const seen=new Set();
 for(const shot of [...round.opened,...(round.flight?[round.flight]:[])]){
  if(seen.has(shot.id))continue;seen.add(shot.id);
  if(shot.bonus?.kind==='extra')births.set(index++,shot.revealAt);
 }
 return births;
}
export function chamberPose(shot,time,quiet=false){
 if(!shot)return {open:0,bolt:0,turn:0,glow:0,reward:0,loot:1};
 const age=time-shot.startAt,shown=time>=shot.revealAt;
 if(quiet)return {open:Number(shown),bolt:Number(shown),turn:shown?120:0,glow:0,reward:0,loot:1};
 return {
  open:smoother((age-330)/610),bolt:ease((age-190)/220),turn:ease((age-60)/430)*150,
  glow:shown&&age<1430?Math.sin(clamp((age-780)/650)*Math.PI):0,
  reward:ease((age-780)/180)*(1-ease((age-1640)/360)),
  loot:1-.55*ease((age-780)/180)*(1-ease((age-1650)/350))
 };
}
export function vaultBankPose(round,time,quiet=false){
 const event=round?.flight??round?.opened.at(-1);
 const index=event?.index??(round?.completedAt!=null?Math.max(0,round.allocated-1):0);
 const bank=Math.floor(index/5),age=event?time-event.startAt:9999;
 const arriving=bank>0&&index%5===0;
 const blend=quiet?1:arriving?ease(age/300):1;
 return {bank,previous:arriving?bank-1:null,blend};
}
export function chamberPoint(index){const s=CHAMBER_SLOTS[index%5],a=VAULT_ART;return {x:a.x+s.cx*a.size/a.source,y:a.y+s.cy*a.size/a.source};}
export function vaultTrail(index,particle,time,shot,quiet=false){
 if(!shot||quiet)return {visible:false,x:210,y:405,opacity:0};
 const t=(time-shot.startAt-1240-particle*22)/500;
 if(t<=0||t>=1)return {visible:false,x:210,y:405,opacity:0};
 const start=chamberPoint(index),curve={x:start.x+(particle%2?40:-40),y:start.y-45},end={x:210+(particle%3-1)*8,y:402};
 return {visible:true,x:Math.round((1-t)**2*start.x+2*(1-t)*t*curve.x+t*t*end.x),y:Math.round((1-t)**2*start.y+2*(1-t)*t*curve.y+t*t*end.y),opacity:Math.min(1,t*9,(1-t)*7)};
}
