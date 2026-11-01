import {randomInt,randomUUID} from './random.js';

export const SPIN_MS=3200, REVEAL_MS=1400, GIFT_MS=650, FINAL_HOLD_MS=6500, CLEAR_MS=450;
export const DEFAULT_BROKIE={id:'birthday-brokie',name:'Bday Brokie Wheel',cash:[300,400,500,600,600,700,700,800,900,1000,1100,1400],gifts:[500,1500],cake:[200,3000],firstDouble:1000};
export const money=cents=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:cents%100?2:0}).format(cents/100);
const amount=v=>Number.isSafeInteger(v)&&v>=0&&v<=1000000;
export function validateBrokie(raw){
 if(!raw||typeof raw.id!=='string'||!raw.id||raw.id.length>80)throw Error('This wheel needs an ID.');
 if(typeof raw.name!=='string'||!raw.name.trim()||raw.name.length>40)throw Error('Use a wheel name from 1 to 40 characters.');
 for(const [key,length] of [['cash',12],['gifts',2],['cake',2]])if(!Array.isArray(raw[key])||raw[key].length!==length||!raw[key].every(amount))throw Error('Use valid dollar amounts between $0 and $10,000.');
 if(!amount(raw.firstDouble))throw Error('Set a valid first-spin Double Damage amount.');
 return {id:raw.id,name:raw.name.trim(),cash:[...raw.cash],gifts:[...raw.gifts],cake:[...raw.cake],firstDouble:raw.firstDouble};
}
export function slices(config){const c=validateBrokie(config);return c.cash.map((value,i)=>({kind:'cash',label:money(value),value,id:'cash-'+i})).concat([{kind:'gift',label:'Gift Grab',id:'gift'},{kind:'cake',label:'Cake or Crumbs',id:'cake'},{kind:'double',label:'Double Damage',id:'double'}]);}
export function expectedTotal(config){const c=validateBrokie(config),base=c.cash.reduce((a,b)=>a+b,0)+(c.gifts[0]+c.gifts[1])/2+(c.cake[0]+c.cake[1])/2;let previous=c.firstDouble,total=0;for(let i=0;i<3;i++){previous=(base+previous)/15;total+=previous;}return total;}
const mod=n=>((n%360)+360)%360;
// Same target-before-animation principle as the supplied StreamElements wheel.
// This wheel uses clockwise degrees from its top pointer and equal 24-degree slices.
export const landingIndex=rotation=>Math.floor(mod(-rotation)/24)%15;
export function targetRotation(from,index,turns=4){return from+turns*360+mod(360-(index+.5)*24-mod(from));}
export function spinRotation(flight,now,reduced=false){
 if(!flight)return 0;
 const t=Math.max(0,Math.min(1,(now-flight.startAt)/SPIN_MS));
 if(reduced)return t<1?flight.from:flight.to;
 if(t<.06){const p=t/.06;return flight.from-10*(p*p*(3-2*p));}
 const p=(t-.06)/.94;
 // Cubic deceleration has a zero-velocity end; the short wind-up eases at both ends.
 const eased=1-(1-p)**3;
 return flight.from-10+(flight.to-flight.from+10)*eased;
}
export function startBrokie(config,viewer='',now=Date.now()){
 return {id:randomUUID(),config:validateBrokie(config),viewer:String(viewer).trim().slice(0,40),phase:'ready',startedAt:now,turn:0,total:0,rotation:0,history:[],flight:null,choice:null,result:null,completedAt:null,hideAt:null,revision:0};
}
export function spinBrokie(r,now=Date.now(),rng=randomInt,forced=null){
 if(!r||r.phase!=='ready'||r.turn>=3)throw Error('Wait for the current spin to finish.');
 const index=forced===null?rng(15):forced;if(!Number.isInteger(index)||index<0||index>14)throw Error('Invalid slice.');
 // Keep both hidden gifts on the authority; the stream receives neither their order nor the pending result.
 const privateGifts=rng(2)?[...r.config.gifts].reverse():[...r.config.gifts];
 const privateCake=r.config.cake[rng(2)];
 r.flight={id:randomUUID(),index,from:r.rotation,to:targetRotation(r.rotation,index),startAt:now,landAt:now+SPIN_MS,privateGifts,privateCake};
 r.phase='spinning';r.result=null;r.choice=null;r.revision++;return r;
}
function reveal(r,amount,kind,detail,at,extra={}){
 r.result={id:r.flight.id,index:r.flight.index,kind,amount,detail,revealAt:at,creditAt:at+500,finishAt:at+REVEAL_MS,...extra};
 r.phase='revealing';r.revision++;
}
export function advanceBrokie(r,now=Date.now()){
 if(!r)return false;let changed=false;
 if(r.phase==='spinning'&&now>=r.flight.landAt){
  r.rotation=r.flight.to;const s=slices(r.config)[r.flight.index],at=r.flight.landAt;
  if(s.kind==='gift'){r.phase='choosing';r.choice={readyAt:at};r.revision++;}
  else if(s.kind==='cake')reveal(r,r.flight.privateCake,'cake',r.flight.privateCake===r.config.cake[1]?'Birthday surprise':'A little crumb',at);
  else if(s.kind==='double'){const prior=r.history.at(-1);reveal(r,prior?.amount??r.config.firstDouble,'double',prior?'Repeats spin '+r.turn:'First-spin amount',at);}
  else reveal(r,s.value,'cash','Added to the round',at);
  changed=true;
 }
 if(r.phase==='revealing'&&now>=r.result.finishAt){
  r.total+=r.result.amount;r.history.push({...r.result});r.turn++;r.flight=null;r.choice=null;
  r.phase=r.turn===3?'complete':'ready';r.revision++;changed=true;
  if(r.phase==='complete'){r.completedAt=r.result.finishAt;r.hideAt=r.completedAt+FINAL_HOLD_MS;}
 }
 return changed;
}
export function chooseBrokie(r,index,now=Date.now(),rng=randomInt){
 if(!r||r.phase!=='choosing')throw Error('Wait for Gift Grab before picking a present.');
 if(index==='random')index=rng(2);if(index!==0&&index!==1)throw Error('Choose the left or right present.');
 reveal(r,r.flight.privateGifts[index],'gift',index===0?'Left present':'Right present',now+GIFT_MS,{choice:index,unwrapAt:now});return r;
}
export function publicBrokie(r){
 if(!r)return null;
 const {config,flight,...rest}=structuredClone(r);
 // Amounts are public on the wheel. Pending gift order and cake outcome are not.
 return {...rest,config,flight:flight?{id:flight.id,from:flight.from,to:flight.to,startAt:flight.startAt,landAt:flight.landAt}:null};
}
export function visibleTotal(r,now){return (r?.total??0)+(r?.phase==='revealing'&&now>=r.result.creditAt?r.result.amount:0);}
