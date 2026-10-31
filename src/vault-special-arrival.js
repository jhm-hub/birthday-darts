import {ease,clamp} from './vault-motion.js';
import {vaultChamberLinks,VAULT_WING_LEAD_MS} from './vault-chamber-handoff.js';
import {vaultSpecialTheme} from './vault-special.js';

export const VAULT_SPECIAL_PREPARE_MS=260,VAULT_SPECIAL_HIT_MS=120;
export const VAULT_SPECIAL_SETTLED_MS=640;
const off={active:false,theme:null,from:null,age:0,incoming:1,outgoing:1,seal:0,title:0,titleY:0,shine:0,rim:0};
// One saved finish clock spans the award commit and the following click.
// Only the next allocated extra chamber can invite a special-vault entrance.
export function vaultSpecialArrival(round,time,quiet=false){
 const link=vaultChamberLinks(round,time).filter(l=>vaultSpecialTheme(round,l.index)&&time>=l.from.finishAt-VAULT_SPECIAL_PREPARE_MS&&time<l.from.finishAt+VAULT_SPECIAL_SETTLED_MS).at(-1);
 if(!link)return {...off};
 const age=time-link.from.finishAt,theme=vaultSpecialTheme(round,link.index);
 if(quiet)return {...off,active:true,theme,from:link.from,age,incoming:Number(age>=0),outgoing:Number(age<0)};
 const hit=age-VAULT_SPECIAL_HIT_MS;
 return {...off,active:true,theme,from:link.from,age,
  incoming:ease((age+VAULT_WING_LEAD_MS)/240),outgoing:1-ease((age+VAULT_WING_LEAD_MS)/180),
  seal:ease((age+220)/120)*(1-ease((age-180)/180)),
  title:ease((age+20)/100)*(1-ease((age-420)/160)),titleY:4*(1-ease((age+20)/120)),
  shine:Math.sin(clamp(hit/220)*Math.PI)**2,
  rim:ease((age+180)/180)*(1-ease((age-240)/200))};
}
export function vaultSpecialParticle(pose,index,quiet=false){
 const empty={opacity:0,x:210,y:208,scale:1,kind:'gem'};
 if(!pose.active||quiet||index<0||index>=20)return empty;
 const age=pose.age;
 if(index<8){
  const side=index%2?1:-1,order=Math.floor(index/2),t=(age+240-order*28)/310;
  if(t<=0||t>=1)return empty;
  const angle=1.25-ease(t)*2.8;
  return {opacity:ease(t/.14)*(1-ease((t-.8)/.2))*.9,x:Math.round(210+side*144*Math.cos(angle)),y:Math.round(208+134*Math.sin(angle)),scale:1,kind:'gem'};
 }
 const n=index-8,t=(age-VAULT_SPECIAL_HIT_MS-n%3*18)/360;
 if(t<=0||t>=1)return empty;
 const angle=-Math.PI/2+n*Math.PI/6,radius=124+32*ease(t),u=1-ease((t-.38)/.62);
 return {opacity:ease(t/.1)*u,x:Math.round(210+Math.cos(angle)*radius),y:Math.round(208+Math.sin(angle)*radius*.89),scale:t>.65?.7:1,kind:n%3===0?'star':'gem'};
}
// Small outlined facets reuse the game's gold/plum shading. There is no
// rectangle, blur or full-screen flash behind the transparent sprite.
export function vaultSpecialJewel(star=false){return `<svg viewBox="0 0 12 14" shape-rendering="crispEdges" aria-hidden="true">${star?'<path d="M5 0H7V4H9V6H12V8H9V10H7V14H5V10H3V8H0V6H3V4H5Z" fill="#513049"/><path d="M5 2H7V5H8V6H10V8H8V9H7V12H5V9H4V8H2V6H4V5H5Z" fill="#ffe6ae"/><path d="M5 4H7V6H9V7H7V9H5V7H3V6H5Z" fill="#fff8dc"/>':'<path d="M4 0H8V2H10V4H12V10H10V12H8V14H4V12H2V10H0V4H2V2H4Z" fill="#513049"/><path d="M4 1H8V3H10V5H11V9H9V11H7V13H5V11H3V9H1V5H3V3H4Z" fill="#e9ba79"/><path d="M4 3H8V5H10V9H8V11H4V9H2V5H4Z" fill="var(--special-light,#ffd2e8)"/><path d="M4 3H8V4H5V7H3V5H4Z" fill="#fff8dc"/><path d="M8 5H10V9H8V11H5V10H7V8H8Z" fill="#966b98"/>'}</svg>`;}
