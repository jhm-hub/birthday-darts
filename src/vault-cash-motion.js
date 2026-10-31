import {ease} from './vault-motion.js';

// Individual cash awards use the original $25 / $100 audio boundaries. Final
// celebration thresholds are separate and remain controlled by Faith.
export const VAULT_CASH_LAND_MS=140;
export const vaultCashLevel=cents=>cents>=10000?2:cents>=2500?1:0;
const pulse=t=>t<=0||t>=1?0:Math.sin(Math.PI*t);
export function vaultCashPose(shot,time,quiet=false){
 const level=vaultCashLevel(shot?.cashCents),off={visible:false,level,scale:1,y:0,shine:0,sweep:0,bankScale:1,gleam:0,fontSize:[38,40,42][level]};
 if(!shot||time<shot.revealAt||time>=shot.finishAt)return off;
 if(quiet)return {...off,visible:true};
 const age=time-shot.revealAt,arrive=ease(age/VAULT_CASH_LAND_MS),peak=[1.045,1.075,1.1][level];
 const emphasis=pulse(age/260);
 return {...off,visible:true,
  scale:age<VAULT_CASH_LAND_MS?.92+(peak-.92)*arrive:1+(peak-1)*(1-ease((age-VAULT_CASH_LAND_MS)/200)),
  y:[4,6,8][level]*(1-arrive),shine:[.12,.22,.32][level]*pulse((age-70)/280),sweep:ease((age-70)/280),
  bankScale:1+[.008,.014,.02][level]*emphasis,gleam:emphasis*[.25,.55,.8][level]};
}
export function vaultCashSpark(index,pose,shot,time,quiet=false){
 const off={visible:false,x:0,y:0,opacity:0,width:8};
 if(quiet||!pose.visible||index>=[6,10,16][pose.level])return off;
 const age=time-shot.revealAt-70-Math.floor(index/2)*6-index%2*4,t=age/[260,280,300][pose.level];
 if(t<=0||t>=1)return off;
 const side=index%2?-1:1,row=Math.floor(index/2)%3;
 return {visible:true,x:side*Math.round(8+row*4+t*[12,18,24][pose.level]),
  y:Math.round(-2-row*2-Math.sin(Math.PI*t)*(12+pose.level*4)+8*t*t),
  opacity:Math.min(1,t*10,(1-t)*5),width:[8,6,3,6][Math.floor(t*4+index)%4]};
}
