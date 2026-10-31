import {clamp,ease} from './vault-motion.js';

// Every effect samples the saved event clock. Scrubbing and reconnecting do not
// restart a tween or re-roll decoration, and nothing here changes a reward.
export function doorFinish(age,open,quiet=false){
 if(quiet)return {edge:0,shade:0,sheen:0,sweep:0,lock:0,focus:0};
 const sweep=clamp((age-160)/620),edge=1-ease((open-.87)/.13);
 return {edge:Math.sin(open*Math.PI/2)*edge,shade:Math.sin(open*Math.PI/2)*.34,
  sheen:age>160&&age<780?Math.sin(sweep*Math.PI)*.26:0,sweep,
  lock:age>40&&age<440?Math.sin(ease((age-40)/400)*Math.PI):0,
  focus:ease(age/100)*(1-ease((age-1580)/420))};
}
export function rimSparkle(index,time,quiet=false){
 if(quiet)return {opacity:0,scale:1};
 const t=((time+index*827)%6200+6200)%6200;
 const glow=t<900?Math.sin(Math.PI*t/900)**2:0;
 return {opacity:glow*.65,scale:.7+glow*.3};
}
export const VAULT_REST_AT_MS=[1700,2000,2600],VAULT_REST_MS=800;
export function finalePose(age,level,quiet=false){
 const build=[180,220,600][level],land=ease((age-build)/440);
 if(quiet)return {build,land:1,amount:1,crest:1,crestScale:1,crestY:0,rest:1,flare:0,flareScale:1,scale:1,rise:0,dim:1,halo:.22};
 const wave=t=>t<=0||t>=1?0:Math.sin(Math.PI*t);
 const charge=ease(age/build),hit=ease((age-build)/300),echo=level?wave((age-build-[0,310,340][level])/460):0,rest=ease((age-VAULT_REST_AT_MS[level])/VAULT_REST_MS);
 return {build,land,rest,amount:ease((age-build)/170),crest:ease(age/260),
  crestScale:.82+.18*charge+Math.sin(hit*Math.PI)*[.10,.14,.18][level],crestY:(1-charge)*12+rest*3,
  flare:wave((age-build)/680)*.8+echo*.22,flareScale:.8+.25*hit,
  scale:1+Math.sin(land*Math.PI)*[.035,.05,.065][level],rise:(1-land)*7,
  dim:ease(age/450),halo:.3+charge*.18+Math.sin(land*Math.PI)*.35-rest*.26};
}
export function vaultParticle(index,elapsed,{final=false,level=0,x=210,y=210,quiet=false}={}){
 const count=final?[36,68,100][level]:level?20:12;
 const encore=final&&level>0&&index>=[36,40,60][level];
 const delay=final?(encore?[0,310,340][level]+index%4*18:(index%7)*18):(index%7)*27;
 const t=(elapsed-delay)/(final?1300+(index%5)*80:780);
 if(quiet||index>=count||t<=0||t>=1)return {visible:false,x:0,y:0,opacity:0,rotation:0};
 const angle=final?(18+(index*137.5)%144)*Math.PI/180:(index*137.5)%360*Math.PI/180;
 const speed=final?110+(index%9)*9:30+(index%7)*6;
 const travel=final?Math.sqrt(t):t;
 const px=x+Math.cos(angle)*speed*travel;
 const py=final?y-14-Math.sin(angle)*speed*travel*1.2+68*t*t:y+Math.sin(angle)*speed*t+38*t*t;
 // Fade before pieces enter the final amount's reading area.
 const clear=final?1-ease((py-250)/20):1;
 return {visible:true,x:Math.round(px),y:Math.round(py),opacity:Math.min(1,t*8,(1-t)*4)*clear,
  rotation:Math.round((index*45+t*135)/45)*45};
}
