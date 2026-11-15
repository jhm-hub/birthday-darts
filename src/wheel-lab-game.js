import {hexColor,fontName} from './double-appearance.js';
import {targetRotation,randomIndex} from './double-wheel/model.js';
import {validateDemoArtwork} from './demo-presets.js';

export const CONCEPTS={
 stack:{name:'Lock & Stack',number:'01',hook:'Pick your keepers.',description:'Spin three rings. Lock one result, then spin the others again. Three locked numbers make your final result.',wheels:['Outer','Inner','Centre'],feature:'Show a full lock sequence'},
 crowns:{name:'Crown Collector',number:'02',hook:'Earn your audience with the Goddess.',description:'Crown spots score their number and collect a crown. Reach the target to unlock one Goddess bonus spin, added to your turn.',wheels:['Main','Goddess'],feature:'Show the crown unlock'},
 climb:{name:'The Climb',number:'03',hook:'Regular. Royal. Goddess.',description:'ASCEND opens the next tier. A number ends the climb. Only the final number scores; ascent slots do not add an amount.',wheels:['Regular','Royal','Goddess'],feature:'Climb all three tiers'},
 jackpot:{name:'Growing Jackpot',number:'06',hook:'Every spin raises the stakes.',description:'Each settled spin adds to the pot, up to its cap. JACKPOT wins that pot instead of a number, then resets it to the starting amount.',wheels:['Main'],feature:'Show a jackpot win'},
};
export const cents=n=>Math.round(n*100);
export function decimal(units,places=2){let text=String(units).padStart(places+1,'0');return places?(text.slice(0,-places)+'.'+text.slice(-places)).replace(/\.?0+$/,''):text;}
export function formatLab(value){const [whole,fraction]=String(value).split('.');return whole.replace(/\B(?=(\d{3})+(?!\d))/g,',')+(fraction?'.'+fraction:'');}
export function stackTotal(values,operation){const ns=values.map(n=>BigInt(cents(n)));return operation==='add'?decimal(ns.reduce((a,b)=>a+b,0n)):decimal(ns.reduce((a,b)=>a*b,1n),values.length*2);}
const bounded=(n,min,max,label,integer=false)=>{if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max||integer&&!Number.isInteger(n))throw Error(label);return n;};
function money(n,max=9999.99){bounded(n,0,max,'Use amounts from 0 to '+max+' with up to two decimal places.');if(Math.abs(cents(n)-n*100)>1e-6)throw Error('Use up to two decimal places.');return n;}
export function labDefaults(kind,high=false){
 if(!CONCEPTS[kind])throw Error('Choose a wheel prototype.');
 const arrays=kind==='stack'?[[10,20,30,15,40,25,50,5],[2,3,4,5,2,6],[1,2,3,2,4,5]]:kind==='climb'?[[10,15,20,25,30,40,50,75],[50,75,100,150,200,250,300,400],[200,300,400,500,750,1000]]:kind==='crowns'?[[10,20,25,30,40,50,60,75],[50,75,100,150,200,250]]:[[10,20,25,40,50,75,100,150]];
 const pairs=[['#AB4BB8','#D9A9E8'],['#C42D9A','#F4A6CF'],['#FFC86B','#FFE9AD']];
 return validateLab({kind,id:kind+(high?'-high':'-regular'),name:high?'High Roller':'Regular',operation:'multiply',duration:3.6,spins:kind==='crowns'?3:1,crownTarget:2,enabled:true,seed:high?500:100,contribution:high?50:10,cap:high?10000:2000,font:'Fredoka',rim:'#633375',pointer:'#FFE1AB',text:'#FFFFFF',special:'#FFC86B',artwork:{kind:'sample'},diameter:105,wheels:arrays.map((values,i)=>({values:values.map(n=>n*(high?(kind==='stack'?(i===0?5:1):5):1)),colors:pairs[i],specials:kind==='crowns'&&i===0?[0,4]:kind==='climb'&&i<2?[1,5]:kind==='jackpot'?[0]:[]}))});
}
export function validateLab(raw){
 if(!raw||!CONCEPTS[raw.kind])throw Error('Choose a wheel prototype.');
 const {kind}=raw;if(!/^[\w-]{1,80}$/.test(raw.id??''))throw Error('Invalid saved wheel.');
 if(typeof raw.name!=='string'||!raw.name.trim()||raw.name.trim().length>40)throw Error('Give the wheel a name of 1–40 characters.');
 if(!['add','multiply'].includes(raw.operation))throw Error('Choose Add or Multiply.');
 if(typeof raw.enabled!=='boolean')throw Error('Choose whether special slots are enabled.');
 if(!Array.isArray(raw.wheels)||raw.wheels.length!==CONCEPTS[kind].wheels.length)throw Error('This prototype has the wrong number of wheels.');
 const wheels=raw.wheels.map((w,i)=>{
  if(!Array.isArray(w.values)||w.values.length<2||w.values.length>24)throw Error('Each wheel needs 2–24 spots.');
  const values=w.values.map(n=>money(n));if(!Array.isArray(w.colors)||w.colors.length!==2)throw Error('Choose two hex colours per wheel.');
  if(!Array.isArray(w.specials)||new Set(w.specials).size!==w.specials.length||w.specials.some(n=>!Number.isInteger(n)||n<0||n>=values.length))throw Error('Choose valid special spots.');
  const supports=kind==='crowns'&&i===0||kind==='climb'&&i<2||kind==='jackpot';
  return {values,colors:w.colors.map(hexColor),specials:supports?[...w.specials]:[]};
 });
 const spins=bounded(raw.spins,1,20,'Choose 1–20 spins.',true),crownTarget=bounded(raw.crownTarget,1,20,'Choose 1–20 crowns.',true);
 if(kind==='crowns'&&crownTarget>spins)throw Error('The crown target cannot exceed the number of spins.');
 const seed=money(raw.seed,999999.99),cap=money(raw.cap,999999.99),contribution=money(raw.contribution);
 if(cap<seed)throw Error('The jackpot cap must be at least the starting pot.');
 const artwork=validateDemoArtwork(raw.artwork);if(artwork.kind==='saved')throw Error('Choose a sample or uploaded prototype PNG.');
 return {id:raw.id,kind,name:raw.name.trim(),operation:raw.operation,wheels,spins,crownTarget,seed,cap,contribution,enabled:raw.enabled,duration:bounded(raw.duration,1,15,'Choose a spin duration from 1 to 15 seconds.'),font:fontName(raw.font),rim:hexColor(raw.rim),pointer:hexColor(raw.pointer),text:hexColor(raw.text),special:hexColor(raw.special),artwork,diameter:bounded(raw.diameter,60,130,'Choose a PNG diameter from 60 to 130.',true)};
}
export function specialName(kind){return kind==='crowns'?'CROWN':kind==='climb'?'ASCEND':'JACKPOT';}
export function startLab(source,{staged=false,poolCents=cents(source.seed)}={}){
 const config=validateLab(source);
 if(staged){config.enabled=true;config.wheels.forEach((w,i)=>{if(config.kind==='crowns'&&i===0||config.kind==='climb'&&i<2||config.kind==='jackpot')if(!w.specials.length)w.specials=[0];});}
 bounded(poolCents,cents(config.seed),cents(config.cap),'Invalid demo jackpot balance.',true);
 return {config,staged,phase:'ready',spins:0,tier:0,crowns:0,bonusTaken:false,totalCents:0,amount:'0',poolCents:staged&&config.kind==='jackpot'?Math.min(cents(config.cap),cents(config.seed)+cents(config.contribution)*5):poolCents,locked:[false,false,false],picks:config.wheels.map(()=>null),angles:config.wheels.map(w=>-180/w.values.length),history:[],flight:null,serial:0,justWon:false};
}
export function spinLab(run,now=Date.now(),choose=randomIndex){
 if(!['ready','readyBonus'].includes(run.phase))throw Error('Finish this spin or choose a ring to lock.');
 const c=run.config,bonus=run.phase==='readyBonus',active=c.kind==='stack'?c.wheels.map((_,i)=>i).filter(i=>!run.locked[i]):[c.kind==='crowns'?(bonus?1:0):c.kind==='climb'?run.tier:0];
 const pending=active.map(wheel=>{const w=c.wheels[wheel];let index;
  if(run.staged){const special=c.kind==='crowns'&&!bonus||c.kind==='climb'&&run.tier<2||c.kind==='jackpot';index=special?w.specials[0]:w.values.indexOf(Math.max(...w.values));}
  else index=choose(w.values.length);
  if(!Number.isInteger(index)||index<0||index>=w.values.length)throw Error('Invalid wheel landing.');
  return {wheel,index,value:w.values[index],special:c.enabled&&w.specials.includes(index)};
 });
 const from=[...run.angles],to=[...from];for(const p of pending)to[p.wheel]=targetRotation(from[p.wheel],c.wheels[p.wheel].values,p.index,p.wheel===1?1:-1,4+p.wheel);
 const duration=(run.staged?1.7:c.duration)*1000;
 run.flight={from,to,pending,bonus,startAt:now,landAt:now+duration,duration};run.phase='spinning';run.serial++;return run;
}
function finish(run){run.phase='complete';run.amount=run.config.kind==='stack'?stackTotal(run.picks.map(p=>p.value),run.config.operation):decimal(run.totalCents);}
export function lockLab(run,wheel){
 if(run.config.kind!=='stack'||run.phase!=='choose'||!Number.isInteger(wheel)||wheel<0||wheel>2||run.locked[wheel]||!run.picks[wheel])throw Error('Choose an unlocked ring after it lands.');
 run.locked[wheel]=true;run.history.push({label:CONCEPTS.stack.wheels[wheel]+' locked',amount:String(run.picks[wheel].value)});run.phase='ready';return run;
}
export function advanceLab(run,now=Date.now()){
 if(run.phase!=='spinning'||now<run.flight.landAt)return false;
 const c=run.config,f=run.flight;run.angles=[...f.to];for(const p of f.pending)run.picks[p.wheel]={...p};
 if(c.kind==='stack'){
  run.spins++;if(run.locked.filter(Boolean).length===2){const p=f.pending[0];run.locked[p.wheel]=true;run.history.push({label:CONCEPTS.stack.wheels[p.wheel]+' locked',amount:String(p.value)});finish(run);}else run.phase='choose';return true;
 }
 const p=f.pending[0];
 if(c.kind==='crowns'){
  run.totalCents+=cents(p.value);
  if(f.bonus){run.bonusTaken=true;run.history.push({label:'Goddess bonus',amount:String(p.value)});}
  else{run.spins++;if(p.special)run.crowns++;run.history.push({label:'Spin '+run.spins+(p.special?' · crown collected':''),amount:String(p.value)});}
  if(!run.bonusTaken&&run.crowns>=c.crownTarget)run.phase='readyBonus';else if(run.spins<c.spins)run.phase='ready';else finish(run);
 }else if(c.kind==='climb'){
  if(p.special&&run.tier<2){run.history.push({label:CONCEPTS.climb.wheels[run.tier]+' → '+CONCEPTS.climb.wheels[run.tier+1],amount:'ASCEND'});run.tier++;run.phase='ready';}
  else{run.totalCents=cents(p.value);run.history.push({label:CONCEPTS.climb.wheels[run.tier]+' landing',amount:String(p.value)});finish(run);}
 }else{
  const before=run.poolCents,pot=Math.min(cents(c.cap),before+cents(c.contribution));run.justWon=p.special;run.spins++;
  const payout=p.special?pot:cents(p.value);run.totalCents+=payout;run.poolCents=p.special?cents(c.seed):pot;
  run.history.push({label:p.special?'JACKPOT · pot won':'Spin '+run.spins+' · pot +'+decimal(pot-before),amount:decimal(payout)});
  // Keep an explicit contribution record for the UI without inferring it from the reset pot.
  run.lastPot=pot;run.lastPayout=payout;
  if(run.spins<c.spins)run.phase='ready';else finish(run);
 }
 return true;
}
export function labAngles(run,now=Date.now(),reduced=false){
 if(!run?.flight||run.phase!=='spinning')return run?.angles;
 const f=run.flight,t=Math.max(0,Math.min(1,(now-f.startAt)/f.duration)),ease=10*t*t-20*t**3+15*t**4-4*t**5;
 return reduced&&t<1?f.from:f.from.map((a,i)=>a+(f.to[i]-a)*ease);
}
