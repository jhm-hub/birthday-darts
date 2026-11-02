import {vaultLastShot} from './vault-finish-motion.js';
import {vaultBonusAt,vaultBonusBuildAt} from './vault-timing.js';
import {VAULT_BONUS_LAND_MS} from './vault-bonus-motion.js';
import {ease,clamp} from './vault-motion.js';

// Presentation uses only the current public award, never its private game/range.
export function vaultFinalBoost(round){
 const bonus=vaultLastShot(round)?.bonus;
 return bonus?.kind==='multiply'&&[4,6].includes(bonus.value)?bonus.value:0;
}
export const vaultFinalBoostCue=(factor,phase)=>factor===4||factor===6?`boost-${factor}-${phase}`:phase==='build'?'multiply-build':'multiply';

// Fixed side ornaments leave a 172px text gutter. Only the ornaments move;
// the bonus plate and total keep the same footprint through the whole boost.
export function vaultFinalBoostPose(factor,shot,time,quiet=false){
 const off={opacity:0,wing:0,charge:0,burst:0,gems:[0,0,0]};
 if(!factor||!shot||time<vaultBonusBuildAt(shot)||time>=shot.finishAt)return off;
 const at=vaultBonusAt(shot),start=vaultBonusBuildAt(shot),land=at+VAULT_BONUS_LAND_MS;
 if(quiet)return {...off,opacity:1,wing:1,charge:1,gems:[1,1,1]};
 const count=factor===6?3:2,build=Math.max(1,at-start),age=time-land;
 const seat=i=>start+(count===3?[25,175,330]:[25,275])[i];
 const fade=1-ease((time-(shot.finishAt-380))/220);
 return {opacity:ease((time-start)/85)*fade,wing:ease((time-start)/build),charge:clamp((time-start)/build),
  burst:age<0?0:Math.sin(Math.PI*clamp(age/360))*fade,
  gems:Array.from({length:3},(_,i)=>i<count?ease((time-seat(i))/85):0)};
}
export function vaultFinalBoostSpark(index,factor,pose){
 const off={opacity:0,x:0,y:0};if(!pose.burst||index>=factor*2)return off;
 const right=index%2,step=Math.floor(index/2),t=pose.burst;
 return {opacity:t*.85,x:Math.round((right?1:-1)*(4+t*(4+step%2*3))),y:Math.round((step-(factor-1)/2)*9-t*5)};
}
export function vaultFinalBoostArt(){
 const gold='<path d="M3 8H9V4H17V8H13V12H9V42H13V46H17V50H9V46H3Z" fill="#492a41"/><path d="M5 10H11V6H15V8H11V14H7V40H11V46H15V48H11V44H5Z" fill="#d89150"/><path d="M5 10H9V14H7V38H5Z M11 6H15V8H11Z" fill="#fff0bd"/>';
 const wing='<path d="M1 11H5V15H9V19H13V25H19V41H15V47H9V43H5V35H1Z" fill="#492a41"/><path d="M3 15H5V19H9V23H13V29H17V39H13V43H9V39H7V33H3Z" fill="#a66bb2"/><path d="M3 15H5V19H9V23H7V29H5V33H3Z" fill="#ffe7b2"/><path d="M9 23H11V29H15V37H11V41H9V35H7V29H9Z" fill="#eea1d9"/><path d="M11 31H15V37H11Z" fill="#a8f3e7"/>';
 const gem=i=>`<g class="boost-seat" data-seat="${i}"><path d="M7 ${i*20}H15V${i*20+2}H18V${i*20+10}H15V${i*20+13}H7V${i*20+10}H4V${i*20+2}H7Z" fill="#492a41"/><path d="M7 ${i*20+2}H15V${i*20+4}H16V${i*20+9}H13V${i*20+11}H8V${i*20+9}H6V${i*20+4}H7Z" fill="var(--boost-gem)"/><path d="M7 ${i*20+2}H12V${i*20+5}H9V${i*20+8}H6V${i*20+4}H7Z" fill="#fff7de"/><path d="M13 ${i*20+5}H16V${i*20+9}H13V${i*20+11}H10V${i*20+9}H13Z" fill="var(--bonus-dark)"/></g>`;
 return `<svg viewBox="0 0 220 60" shape-rendering="crispEdges" aria-hidden="true"><g class="boost-flare" fill="var(--bonus-light)"><path d="M20 0H34V2H28V4H24V8H20Z M200 0H186V2H192V4H196V8H200Z M20 60H34V58H28V56H24V52H20Z M200 60H186V58H192V56H196V52H200Z"/></g>${[false,true].map(right=>`<g transform="${right?'translate(220 4) scale(-1 1)':'translate(0 4)'}"><g class="boost-wing"><g class="boost-gold">${gold}</g><g class="boost-royal">${wing}</g></g>${[0,1,2].map(gem).join('')}</g>`).join('')}</svg>`;
}
export function vaultFinalBoostGlyph(factor){
 if(factor===4)return '<svg viewBox="0 0 30 26" shape-rendering="crispEdges" aria-hidden="true"><path d="M2 9H5V6H25V9H28V23H25V25H5V23H2Z" fill="#492a41"/><path d="M4 10H26V21H24V23H6V21H4Z" fill="#cd8750"/><path d="M6 8H24V11H26V13H4V11H6Z" fill="#fff0bc"/><path d="M6 14H24V17H6Z M6 20H24V22H6Z" fill="#f3c977"/><path d="M14 0H18V3H21V7H18V10H14V7H11V3H14Z" fill="#492a41"/><path d="M14 2H18V4H19V6H16V8H14V6H13V4H14Z" fill="#ffe4a0"/><path d="M7 10H9V21H7Z" fill="#fff7de"/></svg>';
 return '<svg viewBox="0 0 30 26" shape-rendering="crispEdges" aria-hidden="true"><path d="M1 5H5V8H9V5H12V1H18V5H21V8H25V5H29V12H27V23H24V25H6V23H3V12H1Z" fill="#492a41"/><path d="M3 8H5V11H10V8H14V4H16V8H20V11H25V8H27V13H25V21H5V13H3Z" fill="#e9b579"/><path d="M5 13H9V16H12V10H18V16H21V13H25V20H5Z" fill="#bc79ac"/><path d="M5 21H25V23H5Z M3 8H5V13H3Z M14 4H16V8H14Z" fill="#fff0bc"/><path d="M13 12H17V14H19V17H17V19H13V17H11V14H13Z" fill="#a5f0e1"/><path d="M13 13H16V15H13Z" fill="#fff7de"/><path d="M6 15H8V18H6Z M22 15H24V18H22Z" fill="#f9c2ec"/></svg>';
}
