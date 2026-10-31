import {vaultTotal,vaultLevel} from './vault-game.js';
import {finalePose} from './vault-effects.js';
const clamp=t=>Math.max(0,Math.min(1,t)),smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
export const VAULT_TREASURE_CORONATION_MS=360,VAULT_TREASURE_ENCORE_MS=840;

// Presentation uses only amounts already revealed. No private preset, target,
// future plan or username rule enters the display or its audio decisions.
export function vaultTreasureLevel(cents,kind='cash'){
 const amount=BigInt(cents??0),limits=kind==='final'?[150000n,400000n]:kind==='lock'?[100000n,250000n]:[15000n,30000n];
 return amount>=limits[1]?2:amount>=limits[0]?1:0;
}
export function vaultBankedBefore(round,shot){
 let cash=BigInt(round?.openingCents??0),multiplier=1n;
 for(const award of round?.opened??[]){if(award.index>=shot.index)continue;cash+=BigInt(award.cashCents);if(award.bonus?.kind==='multiply')multiplier*=BigInt(award.bonus.value);}
 return (cash*multiplier).toString();
}
export function vaultTreasurePose(round,time,quiet=false){
 const off={visible:false,kind:'',level:0,age:0,ring:0};
 if(!round||quiet)return off;
 if(round.completedAt!==null){
  const level=vaultTreasureLevel(vaultTotal(round),'final'),age=time-round.completedAt-finalePose(0,vaultLevel(round)).build;
  return {visible:level>0&&age>=0&&age<1500,kind:'final',level,age,ring:0};
 }
 const shot=round.flight;if(!shot||time<shot.startAt||time>=shot.finishAt)return off;
 const kind=time<shot.revealAt?'lock':'cash',level=vaultTreasureLevel(kind==='lock'?vaultBankedBefore(round,shot):shot.cashCents,kind),age=time-(kind==='lock'?shot.startAt+285:shot.revealAt+140);
 return {visible:level>0&&age>=0&&age<(kind==='lock'?420:820),kind,level,age,ring:level?Math.sin(Math.PI*Math.max(0,Math.min(1,age/(kind==='lock'?420:550))))**2*(kind==='lock'?.22:.38):0};
}
export function vaultTreasureParticle(pose,index){
 const off={visible:false,x:0,y:0,opacity:0,scale:1,rotation:0};
 if(!pose.visible)return off;
 if(pose.kind==='final')return finalParticle(pose,index,off);
 const lock=pose.kind==='lock',count=lock?8:[0,24,40][pose.level];
 if(index>=count)return off;
 const side=index%2?1:-1,pair=Math.floor(index/2),delay=pair*(lock?22:12),duration=lock?240:560,t=(pose.age-delay)/duration;
 if(t<=0||t>=1)return off;
 const spread=Math.sin(pair*2.1)*10,x=Math.round(210+side*(158+Math.sin(Math.PI*t)*(12+spread)));
 const originY=lock?160+pair*12:205+pair%3*28,y=Math.round(originY-Math.sin(Math.PI*t)*(lock?20:55+pair%4*12)+t*t*18);
 return {visible:true,x,y,opacity:Math.min(1,t*9,(1-t)*5)*.85,scale:lock?.65:.75+(pair%3)*.125,rotation:Math.floor((pair+t*3)%4)*90};
}
export function vaultTreasureRing(){return '<svg viewBox="0 0 340 340" shape-rendering="crispEdges" aria-hidden="true"><g fill="none" stroke="#513047" stroke-width="5"><path d="M114 9H226V19H258V35H282V58H305V82H321V114H331V226H321V258H305V282H282V305H258V321H226V331H114V321H82V305H58V282H35V258H19V226H9V114H19V82H35V58H58V35H82V19H114Z"/></g><path d="M114 9H226V19H258V35H282V58H305V82H321V114H331V226H321V258H305V282H282V305H258V321H226V331H114V321H82V305H58V282H35V258H19V226H9V114H19V82H35V58H58V35H82V19H114Z" fill="none" stroke="#ffe5a3" stroke-width="2"/><path d="M165 0H175V11H184V19H175V30H165V19H156V11H165Z" fill="#fff3c6" stroke="#9c6b7d" stroke-width="2"/></svg>';}

// Two choreographies share the reveal clock, not the private preset. The lower
// flourish opens outward in gold; the upper one gathers jewels, then answers
// with two distinct volleys. Every piece clears before the resting hold.
function finalParticle(pose,index,off){
 const grand=pose.level===1,count=grand?32:48;if(index>=count||pose.level<1)return off;
 const side=index%2?1:-1,pair=Math.floor(index/2),gather=!grand&&pair<8;
 const wave=grand?Math.floor(pair/8):pair<16?0:1,slot=pair%8;
 const delay=grand?wave*330+slot*14:gather?slot*14:(wave?VAULT_TREASURE_ENCORE_MS:VAULT_TREASURE_CORONATION_MS)+slot*10;
 const duration=grand?690:gather?360:570,t=(pose.age-delay)/duration;if(t<=0||t>=1)return off;
 let x,y,scale;
 if(gather){const travel=smooth(t);x=210+side*(170-travel*(60-slot*3));y=250-slot*8-travel*(126-slot*5);scale=.7+.25*travel;}
 else {const spread=grand?15+slot*3:26+slot*2;x=210+side*((grand?132:140)+Math.sin(Math.PI*t)*spread);y=(grand?246-wave*22:wave?229:188)-Math.sin(Math.PI*t)*(grand?85+slot*5:72+slot*5)+18*t*t;scale=grand?.85+slot%3*.12:slot%3===0?1.45:1.1;}
 return {visible:true,x:Math.round(x),y:Math.round(y),opacity:Math.min(1,t*9,(1-t)*6)*(gather?.75:.95),scale,rotation:grand?Math.floor((slot+t*2)%4)*90:gather?0:Math.floor((slot+t*3)%4)*90};
}
export function vaultTreasureOrnament(pose,index,type,lead=0){
 const off={opacity:0,y:0,scale:1};if(!pose.visible||pose.kind!=='final')return off;
 const a=pose.age,entrance=a+lead,fade=1-smooth((a-1100)/380);
 if(type==='leaf'&&pose.level===1){const grow=smooth((entrance-index*42)/230);return {opacity:grow*fade,y:Math.round((1-grow)*4),scale:.8+.2*grow+.06*Math.sin(Math.PI*grow)};}
 if(type==='stem'&&pose.level===1)return {...off,opacity:smooth(entrance/240)*fade*.9};
 if(type==='arc'&&pose.level===2)return {...off,opacity:smooth((entrance-200)/160)*fade*.65};
 if(type==='gem'&&pose.level===2){const arrive=smooth((entrance-Math.abs(index-3)*38)/300),hit=Math.sin(Math.PI*clamp((a-VAULT_TREASURE_CORONATION_MS)/340));return {opacity:arrive*fade,y:Math.round((1-arrive)*14),scale:.7+.3*arrive+.18*hit};}
 if(type==='star'&&pose.level===2){const rise=smooth((a-VAULT_TREASURE_CORONATION_MS)/140),settle=1-smooth((a-920)/330);return {...off,opacity:rise*settle};}
 return off;
}
