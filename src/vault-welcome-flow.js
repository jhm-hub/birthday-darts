import {VAULT_OPENING_REVEAL_MS} from './vault-intro-motion.js';
import {VAULT_OPENING_GUIDE_MS} from './vault-opening-handoff.js';
import {ease} from './vault-motion.js';
export const VAULT_WELCOME_START_MS=100;
export const VAULT_WELCOME_ECHO_MS=26;
// This welcome belongs only to the new saved round. No previous win, preset,
// viewer rule or opening amount is needed to decide its appearance or timing.
export function vaultWelcomeFlow(round,time,quiet=false){
 const off={active:false,age:0,catch:0};
 if(quiet||!round||round.flight||round.opened.length||round.completedAt!=null)return off;
 const age=time-round.startedAt;if(age<0||age>=VAULT_OPENING_GUIDE_MS)return off;
 const pulse=offset=>{const t=(age-VAULT_OPENING_REVEAL_MS-offset)/220;return t<=0||t>=1?0:Math.sin(Math.PI*t)**2;};
 return {active:true,age,catch:Math.min(1,pulse(0)*.65+pulse(VAULT_WELCOME_ECHO_MS)*.12+pulse(VAULT_WELCOME_ECHO_MS*2)*.08)};
}
export function vaultWelcomeParticle(flow,index,dock={left:140,right:280,y:386}){
 const off={opacity:0,x:0,y:0};if(!flow.active||index<0||index>=6)return off;
 const slot=Math.floor(index/2),right=index%2===1,start=VAULT_WELCOME_START_MS+slot*32;
 // All trails finish on the balance beat, before its text changes the dock.
 // That keeps a long new balance from making a moving trail jump sideways.
 const t=(flow.age-start)/(VAULT_OPENING_REVEAL_MS-start);if(t<=0||t>=1)return off;
 const u=ease(t),v=1-u,end=right?dock.right:dock.left;
 const c1=right?Math.max(372,end):Math.min(48,end),c2=right?Math.max(386,end):Math.min(34,end);
 const x=v*v*v*210+3*v*v*u*c1+3*v*u*u*c2+u*u*u*end;
 const y=v*v*v*212+3*v*v*u*(140-slot*5)+3*v*u*u*(dock.y-56)+u*u*u*dock.y;
 return {opacity:Math.min(1,t*10,(1-t)*6)*(.9-slot*.1),x:Math.round(x),y:Math.round(y)};
}
