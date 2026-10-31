import {clamp} from './pinata-motion.js';

export const ARRIVAL_MS=300,ARRIVAL_SPARKS=8,ARRIVAL_SOUND_AT=24;
const smooth=x=>{const p=clamp(x);return p*p*(3-2*p);};

// The first swing is the arrival clock, shared by practice, controls and OBS.
// First-shot history survives commits and reconnects; subsequent hits never
// restart the welcome, even when an Encore adds more swings.
export function crownArrivalAge(round,time){
 const first=round?.hits[0]??(round?.flight?.index===0?round.flight:null);
 return first?time-first.startAt:null;
}

export function crownArrivalPose(age,quiet=false){
 const off={y:0,angle:0,tassel:0,glint:0};
 if(age===null||age<=0||age>=ARRIVAL_MS||quiet)return off;
 const lift=smooth(age/105)*(1-smooth((age-105)/195));
 return {y:-4*lift,angle:-.65*lift,
  tassel:2.3*Math.sin(clamp(age/ARRIVAL_MS)*Math.PI*2)*Math.sin(clamp(age/ARRIVAL_MS)*Math.PI)**2,
  glint:.42*smooth((age-35)/50)*(1-smooth((age-145)/125))};
}

// Little glints follow the crown's silhouette. They finish before the bat's
// release, leaving the viewer name, cash and impact clear of decorative motion.
const points=[[106,166],[314,158],[129,250],[291,246],[153,132],[267,130],[184,114],[236,116]];
export function arrivalSparkPose(i,age,quiet=false){
 const off={x:0,y:0,opacity:0,size:12};
 if(quiet||age===null||i<0||i>=ARRIVAL_SPARKS)return off;
 const t=age-(34+(i%4)*22),life=205;
 if(t<0||t>=life)return off;
 const p=smooth(t/life),[x,y]=points[i],side=x<210?-1:1;
 return {x:Math.round(x+side*p*5),y:Math.round(y+3-8*p),
  opacity:smooth(t/45)*(1-smooth((t-95)/110)),size:i>=6?10:i%3===0?16:12};
}
