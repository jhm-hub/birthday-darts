import {HIT_MS} from './pinata-game.js';

export const PARTICLE_COUNT=112, HIT_PARTICLES=20, BREAK_DELAY=140;
export const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};
const out=x=>1-(1-clamp(x))**3;
const mix=(a,b,t)=>a+(b-a)*t;

// Sample the same clock on the controller and display, including after reconnects.
export function batPose(elapsed,quiet=false){
 const pose={x:-10,y:28,angle:-18,opacity:0,trail:0};
 if(quiet||elapsed<0||elapsed>=1130)return pose;
 pose.opacity=clamp(elapsed/80)*(1-smooth((elapsed-940)/190));
 if(elapsed<280){const p=out(elapsed/280);pose.x=mix(-10,-18,p);pose.y=mix(28,-4,p);pose.angle=mix(-18,-76,p);}
 else if(elapsed<330)Object.assign(pose,{x:-18,y:-4,angle:-76});
 else if(elapsed<HIT_MS){const p=((elapsed-330)/(HIT_MS-330))**2.2;pose.x=mix(-18,18,p);pose.y=mix(-4,6,p);pose.angle=mix(-76,-6,p);}
 else if(elapsed<HIT_MS+40)Object.assign(pose,{x:18,y:6,angle:-6});
 else if(elapsed<700){const p=out((elapsed-HIT_MS-40)/(700-HIT_MS-40));pose.x=mix(18,38,p);pose.y=mix(6,12,p);pose.angle=mix(-6,16,p);}
 else{const p=smooth((elapsed-700)/430);pose.x=mix(38,-6,p);pose.y=mix(12,24,p);pose.angle=mix(16,-30,p);}
 pose.trail=clamp((elapsed-355)/65)*(1-clamp((elapsed-HIT_MS)/65));
 return pose;
}

export function crownPose(after,quiet=false){
 if(quiet||after<0||after>=1020)return {angle:0,x:0,y:0,squash:0,tassel:0,glint:0};
 const t=Math.max(0,after-40),fade=1-smooth((after-780)/240);
 const angle=(after<40?-3.2:-13*Math.sin(t/145+.249)*Math.exp(-t/290))*fade;
 return {angle,x:after<40?2:2*Math.exp(-t/180),y:after<40?1:Math.max(0,Math.sin(t/130))*2*Math.exp(-t/250),
  squash:(1-smooth((after-40)/150))*.025,
  tassel:after<70?0:Math.sin((after-70)/110)*7*Math.exp(-(after-70)/360)*fade,
  glint:clamp(after/35)*(1-clamp((after-90)/210))};
}

export function breakPose(after,quiet=false){
 const t=after-BREAK_DELAY;
 if(t<0)return {x:0,y:0,angle:0,opacity:1,seam:0};
 const p=clamp(t/740),launch=out(t/600);
 return {x:quiet?0:launch*45,y:quiet?0:-Math.sin(p*Math.PI)*13+p*p*54,
  angle:quiet?0:launch*37,opacity:1-smooth((t-250)/490),seam:quiet?0:1-clamp(t/180)};
}

export function particleSpec(i){
 const candy=i<36,star=i>=96;
 return {candy,star,width:candy?22+(i%3)*3:star?9:4+i%3,height:candy?17+(i%3)*2:star?9:8+i%4};
}

export function particlePose(i,after,{breaking=false,quiet=false,side=1}={}){
 const off={x:210,y:210,angle:0,flip:1,opacity:0};
 if(quiet||after<0||(breaking?i>=PARTICLE_COUNT:!(i<6||(i>=36&&i<50))))return off;
 const delay=breaking?BREAK_DELAY+(i%6)*24+(i>=72?90:0):(i%5)*12;
 const t=(after-delay)/1000,life=breaking?1.9:.82;
 if(t<0||t>=life)return off;
 const hero=particleSpec(i).candy;
 let x,y;
 if(breaking){
  const vx=Math.cos(i*2.399)*(110+(i%8)*22),vy=-80-(i%9)*20;
  x=210+vx*t;y=211+vy*t+190*t*t;
 }else{
  const a=i*2.399;x=184+Math.cos(a)*(35+i%5*11)*t;y=214+Math.sin(a)*45*t-65*t+125*t*t;
 }
 if(!breaking&&side===-1)x=420-x-particleSpec(i).width;
 let opacity=1-smooth((t-(breaking?1.05:.36))/(breaking?.85:.46));
 // Keep the title, bank and final amount unobstructed inside the 420×460 stage.
 const size=particleSpec(i);if(x<14||x+size.width>406||y<104||y+size.height>381)opacity=0;
 if(breaking&&x>76&&x<344&&y>207&&y<355)opacity*=1-smooth((after-950)/170);
 if(breaking&&after>=1120&&y+size.height>=200&&y<=376)opacity=0;
 return {x:Math.round(x),y:Math.round(y),angle:Math.round((i*37+t*(i%2?190:-240))*(breaking?1:side)),
  flip:hero?Math.max(.38,Math.abs(Math.cos(t*5+i))):1,opacity};
}
