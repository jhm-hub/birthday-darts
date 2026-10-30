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
export function finalePose(age,level,quiet=false){
 const build=[180,220,600][level],land=ease((age-build)/440);
 if(quiet)return {build,land:1,amount:1,crest:1,scale:1,rise:0,dim:1,halo:level?.25:0};
 return {build,land,amount:ease((age-build)/170),crest:ease(age/260),
  scale:1+Math.sin(land*Math.PI)*[.035,.05,.065][level],rise:(1-land)*7,
  dim:ease(age/450),halo:(level+1)*.1+Math.sin(land*Math.PI)*.32};
}
export function vaultParticle(index,elapsed,{final=false,level=0,x=210,y=210,quiet=false}={}){
 const count=final?[24,48,84][level]:level?20:12;
 const t=(elapsed-(index%7)*27)/(final?1450+(index%5)*100:780);
 if(quiet||index>=count||t<=0||t>=1)return {visible:false,x:0,y:0,opacity:0,rotation:0};
 const angle=final?(18+(index*137.5)%144)*Math.PI/180:(index*137.5)%360*Math.PI/180;
 const speed=final?85+(index%9)*10:30+(index%7)*6;
 const px=x+Math.cos(angle)*speed*t;
 const py=final?y-Math.sin(angle)*speed*t*1.3+55*t*t:y+Math.sin(angle)*speed*t+38*t*t;
 // Fade before pieces enter the final amount's reading area.
 const clear=final?1-ease((py-250)/20):1;
 return {visible:true,x:Math.round(px),y:Math.round(py),opacity:Math.min(1,t*8,(1-t)*4)*clear,
  rotation:Math.round((index*45+t*135)/45)*45};
}
