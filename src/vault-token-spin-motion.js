import {TOKEN_TIMING as T,TOKEN_FINALE,clamp,ease} from './vault-tokens-model.js';
const arc=(a,b,c,d,u)=>{const v=1-u;return v*v*v*a+3*v*v*u*b+3*v*u*u*c+u*u*u*d;};
export function tokenInsertionPose(f,age,quiet=false){
 const hidden={opacity:0,x:210,y:265,scaleX:1,scaleY:1,rotation:0};if(!f||quiet||age<0||age>=T.insert)return hidden;
 const from=40.5+f.tokenIndex*25,pick=ease(age/T.pickup),u=ease((age-T.pickup)/(T.approach-T.pickup)),tip=ease((age-T.approach)/(T.insert-T.approach));
 return {opacity:1-tip,x:arc(from,132,210,210,u),y:age<T.pickup?116.5-8*pick:arc(108.5,90,175,261,u)+7*tip,
  scaleX:1-.15*tip,scaleY:1-.9*tip,rotation:Math.sin(u*Math.PI)*16};
}
export function tokenStackFlight(f,age,quiet=false){
 const u=ease((age-T.stackStart)/(T.stackLand-T.stackStart));
 return {opacity:!f||quiet||age<T.stackStart||age>=T.stackLand?0:Math.min(1,(age-T.stackStart)/80),
  x:arc(210,310,367,367,u),y:arc(212,190,136,88,u),scale:1-.18*u};
}
export function tokenSpinLight(f,age,quiet=false){
 if(!f||quiet)return {slot:0,land:0,stack:0};
 return {slot:Math.sin(Math.PI*clamp((age-T.insert)/260)),land:Math.sin(Math.PI*clamp((age-T.land)/520)),stack:Math.sin(Math.PI*clamp((age-T.stackLand)/320))};
}
export function tokenFinalePose(age,quiet=false){
 const impact=age-TOKEN_FINALE.reveal,build=ease(age/TOKEN_FINALE.reveal),burst=clamp(impact/650);
 return {build:age>=0&&impact<0?build:0,rays:quiet||impact<0?0:Math.sin(Math.PI*burst)*(1-.2*burst),
  shine:quiet||impact<0?0:Math.sin(Math.PI*clamp(impact/680)),progress:clamp(impact/680),
  crown:quiet||impact<0?0:Math.sin(Math.PI*clamp(impact/1100)),impact};
}
export function tokenFinaleParticle(index,age,quiet=false){
 const t=(age-TOKEN_FINALE.reveal-(index%7)*34)/2100;
 if(quiet||t<=0||t>=1)return {opacity:0,x:0,y:0,rotation:0};
 const side=index%2?1:-1,reach=36+(index%9)*9;
 return {opacity:Math.min(1,t*8,(1-t)*5),x:Math.max(12,Math.min(408,210+side*(58+reach*Math.sin(t*Math.PI/2)))),
  y:288-(230+(index%5)*14)*t+215*t*t,rotation:side*t*(110+index*17)};
}
