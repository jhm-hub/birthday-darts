import {DEFAULT_VAULT,startVaultRound,unlockVault,advanceVault} from './vault-game.js';
import {ease,chamberPoint,vaultBankPose} from './vault-motion.js';
import {doorFinish} from './vault-effects.js';
import {VAULT_ART} from './vault-layout.js';

export const VAULT_CHAMBER_GUIDE_LEAD_MS=220;
export const VAULT_WING_LEAD_MS=40;
const prepare=(shot,time)=>ease((time-shot.finishAt+320)/320);
// Derive links from saved awards, including an uncommitted +1 unlock. Nothing
// here advances play, draws a prize, or changes the controller's readiness.
export function vaultChamberLinks(round,time){
 if(!round||round.completedAt!=null)return [];
 const shots=[...(round.opened??[]),...(round.flight?[round.flight]:[])].filter(s=>s.startAt<=time);
 const allocated=round.allocated+(round.flight?.bonus?.kind==='extra'&&time>=round.flight.revealAt?1:0);
 return shots.filter(s=>s.index+1<allocated).map(from=>({from,index:from.index+1,next:shots.find(s=>s.index===from.index+1)??null,wing:(from.index+1)%5===0}));
}
export function vaultChamberHandoff(round,time,quiet=false){
 const links=vaultChamberLinks(round,time),link=links.filter(l=>time>=l.from.finishAt-320).at(-1);
 if(!link)return {linked:false};
 const shot=round.flight??round.opened.at(-1),active=!!round.flight&&time<shot.finishAt,age=active?time-shot.startAt:2000;
 const focuses=Array(20).fill(0),attention=Array(20).fill(0);
 if(active&&!quiet)focuses[shot.index]=doorFinish(age,0).focus*.85;
 const ready=quiet?Number(time>=link.from.finishAt):prepare(link.from,time);
 const click=link.next,blend=click?ease((time-click.startAt)/160):0,start=click?prepare(link.from,click.startAt):ready;
 const target=click?focuses[link.index]:0;
 focuses[link.index]=quiet?(time>=link.from.finishAt&&(!click||time<click.revealAt)?.22:0):click?.3*start*(1-blend)+Math.max(target,blend<1?.3*start:0)*blend:.3*ready;
 const activeDim=quiet?0:.18*ease(age/160)*(1-ease((age-1520)/480));
 for(let i=0;i<20;i++){
  attention[i]=active&&i!==shot.index?activeDim:0;
  if(i!==link.index&&!quiet)attention[i]+=.06*start*(1-blend);
 }
 const wingBlend=quiet?Number(time>=link.from.finishAt):ease((time-link.from.finishAt+VAULT_WING_LEAD_MS)/300);
 const bank=link.wing?{bank:Math.floor(link.index/5),previous:Math.floor(link.from.index/5),blend:wingBlend}:vaultBankPose(round,time,quiet);
 const lock=quiet?0:.32*ease((time-link.from.finishAt+30)/50)*(1-ease((time-link.from.finishAt-70)/170));
 return {linked:true,link,focuses,attention,bank,lock};
}
export function vaultChamberTrail(handoff,index,time,quiet=false){
 const off={visible:false,x:0,y:0,opacity:0};
 if(quiet||!handoff.linked||index>=3)return off;
 const {from,index:next}=handoff.link;
 const t=(time-from.finishAt+VAULT_CHAMBER_GUIDE_LEAD_MS-index*24)/320;
 if(t<=0||t>=1)return off;
 const start=chamberPoint(from.index),slot=next%5;
 const end={x:VAULT_ART.x+[310,941,310,941,624][slot]*VAULT_ART.size/VAULT_ART.source,y:VAULT_ART.y+[475,475,851,851,599][slot]*VAULT_ART.size/VAULT_ART.source};
 const control={x:(start.x+end.x)/2,y:Math.max(100,Math.min(start.y,end.y)-32)};
 return {visible:true,x:Math.round((1-t)**2*start.x+2*(1-t)*t*control.x+t*t*end.x),y:Math.round((1-t)**2*start.y+2*(1-t)*t*control.y+t*t*end.y),opacity:Math.min(1,t*9,(1-t)*7)*.8};
}
export const vaultOtherAwardOpacity=(shot,time,quiet=false)=>!shot||time>=shot.finishAt?1:quiet?.7:1-.45*ease((time-shot.startAt)/160)*(1-ease((time-shot.startAt-1520)/480));

// Two real sample clicks with a short, visible pause; no saved game is touched.
export function sampleVaultChamberHandoff(index=0,waitMs=400,time=10000,bonus=null){
 const p={...structuredClone(DEFAULT_VAULT),guarantee:false};
 const before=startVaultRound(p,'Demo viewer',time-1200-index*2000,()=>100);
 for(let i=0;i<index;i++){const s=unlockVault(before,before.readyAt+i*2000,{forcedCash:1,forcedBonus:null});advanceVault(before,s.finishAt);}
 const first=unlockVault(before,time,{forcedCash:1,forcedBonus:index===4?'extra':bonus});
 const waiting=structuredClone(before);advanceVault(waiting,first.finishAt);
 const flight=structuredClone(waiting),second=unlockVault(flight,first.finishAt+waitMs,{forcedCash:2,forcedBonus:null});
 const settled=structuredClone(flight);advanceVault(settled,second.finishAt);
 return {before,waiting,flight,settled,startAt:time,readyAt:first.finishAt,clickAt:second.startAt,finishAt:second.finishAt};
}
export function vaultChamberSampleRound(sample,time){return time<sample.readyAt?sample.before:time<sample.clickAt?sample.waiting:time<sample.finishAt?sample.flight:sample.settled;}
