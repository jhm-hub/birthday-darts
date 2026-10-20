import {BALLOON_HIT_HOLD_MS,BALLOON_BURST_MS} from './balloon-timing.js';

const clamp=x=>Math.max(0,Math.min(1,x));

export function spriteLayout(config,index){
 const frame=config.frames[index],scale=298/config.frameHeight;
 return {left:(config.bodyAnchorX-(frame.anchor-frame.x)*scale)+'px',width:frame.width*scale+'px',height:'298px',
  backgroundSize:config.sheetWidth*scale+'px '+config.sheetHeight*scale+'px',
  backgroundPosition:-frame.x*scale+'px '+(-frame.y*scale)+'px'};
}

export function dartReleasePoint(config,balloons){
 if(!config)return {x:228,y:balloons?128:86};
 const release=config.release,frame=config.frames[release.frame],scale=298/config.frameHeight;
 return {x:37+config.bodyAnchorX+(release.x-frame.anchor)*scale,y:(balloons?50:8)+(release.y-frame.y)*scale};
}

// All motion samples the shared shot clock. Refreshing or joining mid-throw
// shows the correct cel without starting another animation or awarding a prize.
export function throwCel(shot,time,motion=true){
 if(!shot||time<shot.startAt)return 0;
 const age=time-shot.releaseAt;
 if(!motion)return age>=0&&age<260?4:0;
 if(age<-350)return 0;
 if(age<-220)return 1;
 if(age<-75)return 2;
 if(age<0)return 3;
 if(age<105)return 4;
 if(age<290)return 5;
 if(age<475)return 6;
 if(age<650)return 7;
 return 0;
}

export function balloonDeformation(age,motion=true){
 if(age>=0)return {x:1,y:1,alpha:0};
 if(age<-BALLOON_HIT_HOLD_MS||!motion)return {x:1,y:1,alpha:1};
 const u=clamp(1+age/BALLOON_HIT_HOLD_MS);
 // A short compression, elastic rebound, then a held pressure pose.
 const squash=Math.sin(Math.min(1,u/.4)*Math.PI)*.14;
 const pressure=.085*clamp((u-.3)/.7);
 return {x:1+pressure-squash,y:1+pressure+squash*.8,alpha:1};
}

export function popCel(age,motion=true){
 if(age<0||age>=480)return -1;
 return motion?Math.min(7,Math.floor(age/60)):Math.min(7,Math.floor(age/120)+4);
}

export function fragmentMotion(index,age,motion=true){
 const u=clamp(age/BALLOON_BURST_MS),angle=-Math.PI/2+index*Math.PI/4;
 const travel=(1-Math.exp(-4*u))*(36+(index%3)*11)*(motion?1:.15);
 return {x:Math.cos(angle)*travel,y:Math.sin(angle)*travel+(motion?66:5)*u*u,
  turn:motion?(index%2?1:-1)*(16+index*5)*u:0,
  scale:motion?1-.58*clamp(age/220):1,
  alpha:age<0||age>=BALLOON_BURST_MS?0:1-clamp((u-.18)/.72)};
}

export function confettiMotion(index,age,motion=true){
 const delay=40+(index%4)*25,life=age-delay;
 if(life<0||life>=1150||!motion)return {x:0,y:0,turn:0,flip:1,alpha:0};
 const u=life/1150,angle=index*2.3999632297,speed=48+(index%5)*14,travel=1-Math.exp(-3.5*u);
 return {x:Math.cos(angle)*speed*travel,y:Math.sin(angle)*speed*travel+100*u*u,
  turn:(index%2?1:-1)*(80+index*13)*u,
  flip:.35+.65*Math.abs(Math.cos(u*9+index)),alpha:1-clamp((u-.55)/.45)};
}
