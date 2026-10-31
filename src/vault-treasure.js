import {vaultTotal,vaultLevel} from './vault-game.js';
import {finalePose} from './vault-effects.js';

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
  return {visible:level>0&&age>=0&&age<1500,kind:'final',level,age,ring:level?Math.sin(Math.PI*Math.max(0,Math.min(1,age/650)))**2*.45:0};
 }
 const shot=round.flight;if(!shot||time<shot.startAt||time>=shot.finishAt)return off;
 const kind=time<shot.revealAt?'lock':'cash',level=vaultTreasureLevel(kind==='lock'?vaultBankedBefore(round,shot):shot.cashCents,kind),age=time-(kind==='lock'?shot.startAt+285:shot.revealAt+140);
 return {visible:level>0&&age>=0&&age<(kind==='lock'?420:820),kind,level,age,ring:level?Math.sin(Math.PI*Math.max(0,Math.min(1,age/(kind==='lock'?420:550))))**2*(kind==='lock'?.22:.38):0};
}
export function vaultTreasureParticle(pose,index){
 const off={visible:false,x:0,y:0,opacity:0,scale:1,rotation:0};
 if(!pose.visible)return off;
 const final=pose.kind==='final',lock=pose.kind==='lock',count=lock?8:final?[0,32,48][pose.level]:[0,24,40][pose.level];
 if(index>=count)return off;
 const side=index%2?1:-1,pair=Math.floor(index/2),wave=final?Math.floor(pair/8):0;
 const delay=final?wave*370+pair%8*14:pair*(lock?22:12),duration=final?660:lock?240:560,t=(pose.age-delay)/duration;
 if(t<=0||t>=1)return off;
 const spread=final?Math.sin((pair%8+1)*1.7)*40:Math.sin(pair*2.1)*10;
 const x=Math.round(210+side*((final?132:158)+Math.sin(Math.PI*t)*(final?spread:12+spread)));
 const originY=final?195+wave*12:lock?160+pair*12:205+pair%3*28;
 const y=Math.round(originY-Math.sin(Math.PI*t)*(final?70+pair%4*13:lock?20:55+pair%4*12)+t*t*(final?28:18));
 return {visible:true,x,y,opacity:Math.min(1,t*9,(1-t)*5)*(final?.95:.85),scale:lock?.65:final?(index%5===0?1.25:1):.75+(pair%3)*.125,rotation:Math.floor((pair+t*3)%4)*90};
}
export function vaultTreasureRing(){return '<svg viewBox="0 0 340 340" shape-rendering="crispEdges" aria-hidden="true"><g fill="none" stroke="#513047" stroke-width="5"><path d="M114 9H226V19H258V35H282V58H305V82H321V114H331V226H321V258H305V282H282V305H258V321H226V331H114V321H82V305H58V282H35V258H19V226H9V114H19V82H35V58H58V35H82V19H114Z"/></g><path d="M114 9H226V19H258V35H282V58H305V82H321V114H331V226H321V258H305V282H282V305H258V321H226V331H114V321H82V305H58V282H35V258H19V226H9V114H19V82H35V58H58V35H82V19H114Z" fill="none" stroke="#ffe5a3" stroke-width="2"/><path d="M165 0H175V11H184V19H175V30H165V19H156V11H165Z" fill="#fff3c6" stroke="#9c6b7d" stroke-width="2"/></svg>';}
