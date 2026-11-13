import {validateDouble,defaultDouble,formatDouble,operator,HOLD_MS,CLEAR_MS} from './double-game.js';
import {randomIndex,targetRotation,frameAt,indexAtPointer} from './double-wheel/model.js';
import {hexColor,readAppearance} from './double-appearance.js';
export {formatDouble as formatBonus,operator,indexAtPointer,CLEAR_MS};
export const REVEAL_MS=1000;
export const bonusKey=mode=>'faith-bonus-wheel-live-'+mode+'-v1';
export const gameId=mode=>'bonus-'+mode;
export function defaultBonus(mode){
 const base=defaultDouble(mode);base.appearance=readAppearance(undefined,base);base.appearance.innerColors[5]='#FFC86B';
 return {...base,id:gameId(mode),name:'Bonus Wheel '+(mode==='add'?'Add':'Multiply'),bonus:[10,20,30,40,50,100],bonusSlots:[5],bonusDuration:4,bonusTextColor:'#492450',bonusColors:['#FFC86B','#FFE9AD','#FFC86B','#FFE9AD','#FFC86B','#FFE9AD']};
}
export function validateBonus(raw,mode=raw?.operation){
 const base=validateDouble(raw,mode),bonus=raw.bonus;
 if(!Array.isArray(bonus)||bonus.length<2||bonus.length>24||bonus.some(n=>typeof n!=='number'||!Number.isFinite(n)||n<0||n>9999.99||Math.abs(n*100-Math.round(n*100))>1e-6))throw Error('The bonus wheel needs 2–24 numbers from 0 to 9999.99, with up to two decimal places.');
 const slots=raw.bonusSlots;
 if(!Array.isArray(slots)||!slots.length||new Set(slots).size!==slots.length||slots.some(i=>!Number.isInteger(i)||i<0||i>=base.inner.length))throw Error('Mark at least one valid inner spot as a Bonus slot.');
 if(!Array.isArray(raw.bonusColors)||raw.bonusColors.length!==bonus.length)throw Error('Every bonus spot needs a hex colour.');
 if(!Number.isFinite(raw.bonusDuration)||raw.bonusDuration<2||raw.bonusDuration>15)throw Error('Choose a bonus spin duration from 2 to 15 seconds.');
 return {...base,bonus:[...bonus],bonusSlots:[...slots].sort((a,b)=>a-b),bonusDuration:raw.bonusDuration,bonusTextColor:hexColor(raw.bonusTextColor??'#492450'),bonusColors:raw.bonusColors.map(hexColor)};
}
export function readBonusAppearance(config){return {...readAppearance(config.appearance,config),bonusColors:config.bonusColors,bonusTextColor:config.bonusTextColor??'#492450'};}
export function drawLanding(values,config,choose=randomIndex,special=[]){
 const line=config.lineLandings&&choose(100)<config.lineChance,index=choose(values.length),indices=line?[(index-1+values.length)%values.length,index]:[index];
 const numbers=indices.map(i=>special.includes(i)?null:values[i]);
 return {type:line?'line':'section',index,indices,values:numbers,total:numbers.reduce((s,n)=>s+Math.round((n??0)*100),0)/100,unlocks:numbers.includes(null)};
}
const combine=(outer,inner,operation)=>operation==='add'?(Math.round(outer*100)+Math.round(inner*100))/100:Math.round(outer*100)*Math.round(inner*100)/10000;
export function initialPlan(config,from,choose){
 const outerLanding=drawLanding(config.outer,config,choose),innerLanding=drawLanding(config.inner,config,choose,config.bonusSlots);
 return {from:{...from},to:{outer:targetRotation(from.outer,config.outer,outerLanding.index,-1,5,outerLanding.type==='line'),inner:targetRotation(from.inner,config.inner,innerLanding.index,1,6,innerLanding.type==='line'),bonus:from.bonus},duration:config.duration*1000,round:{outer:outerLanding.total,inner:innerLanding.total,outerLanding,innerLanding,unlocked:innerLanding.unlocks,operation:config.operation,result:innerLanding.unlocks?null:combine(outerLanding.total,innerLanding.total,config.operation)}};
}
export function restingBonus(config){return {outer:-180/config.outer.length,inner:-180/config.inner.length,bonus:-180/config.bonus.length};}
export function startBonus(config,viewer='',now=Date.now(),choose){
 const c=validateBonus(config),p=initialPlan(c,restingBonus(c),choose);
 return {id:crypto.randomUUID(),config:c,viewer:String(viewer).trim().slice(0,40),phase:'spinning',flight:{from:p.from,to:p.to,duration:p.duration,startAt:now,landAt:now+p.duration},bonusFlight:null,base:null,pending:p.round,result:null,results:[],total:0,completedAt:null,hideAt:null,creditedSpins:0};
}
export const bonusResults=round=>round?.results??[];
export const bonusTotal=round=>bonusResults(round).reduce((s,r)=>s+Math.round(r.result*10000),0)/10000;
export function continueBonus(round,now=Date.now(),choose){
 if(round?.phase!=='ready'||round.results.length>=round.config.spins)throw Error('Wait for the current spin and bonus to finish.');
 const from={...round.flight.to,bonus:round.bonusFlight?.to.bonus??round.flight.to.bonus},p=initialPlan(round.config,from,choose);
 Object.assign(round,{phase:'spinning',flight:{from:p.from,to:p.to,duration:p.duration,startAt:now,landAt:now+p.duration},bonusFlight:null,base:null,pending:p.round,result:null});return round;
}
function finish(round,landAt){
 round.result=round.pending;round.pending=null;round.results.push(round.result);round.total=bonusTotal(round);
 const complete=round.results.length>=round.config.spins;round.phase=complete?'complete':'ready';round.completedAt=complete?landAt:null;round.hideAt=complete?landAt+HOLD_MS:null;
}
export function advanceBonus(round,now=Date.now(),choose){
 if(!round)return false;let changed=false;
 if(round.phase==='spinning'&&now>=round.flight.landAt){
  changed=true;
  if(!round.pending.unlocked)finish(round,round.flight.landAt);
  else {
   round.base=round.pending;const c=round.config,landing=drawLanding(c.bonus,c,choose),from={...round.flight.to},startAt=round.flight.landAt+REVEAL_MS,duration=c.bonusDuration*1000;
   round.bonusFlight={from,to:{...from,bonus:targetRotation(from.bonus,c.bonus,landing.index,-1,5,landing.type==='line')},duration,startAt,landAt:startAt+duration};
   const inner=(Math.round(round.base.inner*100)+Math.round(landing.total*100))/100;
   round.pending={...round.base,inner,bonus:landing.total,bonusLanding:landing,result:combine(round.base.outer,inner,c.operation)};round.phase='bonus';
  }
 }
 if(round.phase==='bonus'&&now>=round.bonusFlight.landAt){finish(round,round.bonusFlight.landAt);changed=true;}
 return changed;
}
export function bonusAngles(round,now,reduced=false){
 const f=round.bonusFlight??round.flight;if(reduced&&now<f.landAt)return {...f.from};
 const result=frameAt(f,now-f.startAt),t=Math.max(0,Math.min(1,(now-f.startAt)/f.duration)),ease=t===1?1:10*t*t-20*t**3+15*t**4-4*t**5;
 return {outer:result.outer,inner:result.inner,bonus:f.from.bonus+(f.to.bonus-f.from.bonus)*ease};
}
export function publicBonus(round){
 if(!round)return null;
 const {id,config,viewer,phase,flight,bonusFlight,base,result,results,total,completedAt,hideAt}=round;
 return structuredClone({id,config,viewer,phase,flight,bonusFlight,base,result,results,total,completedAt,hideAt});
}
export function resultEquation(r){
 const term=l=>l.values.map(v=>v===null?'BONUS':formatDouble(v)).join(' + '),outer=r.outerLanding.type==='line'?'('+term(r.outerLanding)+')':formatDouble(r.outer);
 const inner=r.unlocked?formatDouble(r.inner):r.innerLanding.type==='line'?'('+term(r.innerLanding)+')':formatDouble(r.inner);
 return (r.unlocked?'Bonus '+formatDouble(r.bonus)+' → ':'')+outer+' '+operator(r.operation)+' '+inner+' = '+formatDouble(r.result);
}
export function landingIndices(result,side,values,angle){return result?.[side+'Landing']?.indices??[indexAtPointer(values,angle)];}
export function landingText(result,side){
 const l=result?.[side+'Landing'];if(!l)return '';
 if(side==='inner'&&l.unlocks)return l.values.filter(v=>v!==null).map(formatDouble).concat('Bonus '+(result.bonus===undefined?'…':formatDouble(result.bonus))).join(' + ')+(result.bonus===undefined?'':' = '+formatDouble(result.inner));
 return l.type==='line'?l.values.map(formatDouble).join(' + ')+' = '+formatDouble(result[side]):'';
}
