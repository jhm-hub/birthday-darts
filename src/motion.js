import {BALLOON_HIT_HOLD_MS,BALLOON_BURST_MS} from './balloon-timing.js';
import {shotAge} from './dart-timing.js';

const clamp=x=>Math.max(0,Math.min(1,x));
export const THROW_RECOVERY_MS=980;

export function spriteLayout(config,index){
 const frame=config.frames[index],box=characterFrameLayout(config,index),scale=box.scale;
 return {left:box.left+'px',top:box.top+'px',width:box.width+'px',height:box.height+'px',
  backgroundSize:(frame.sheetWidth||config.sheetWidth)*scale+'px '+(frame.sheetHeight||config.sheetHeight)*scale+'px',
  backgroundPosition:-frame.x*scale+'px '+(-frame.y*scale)+'px'};
}

export function characterFrameLayout(config,index,frames=config.frames){
 const f=frames[index],height=f.height||config.frameHeight,scale=f.scale||298/height;
 return {left:config.bodyAnchorX-(f.anchor-f.x)*scale,
  top:f.baseline===undefined?0:config.groundY-(f.baseline-f.y)*scale,
  width:f.width*scale,height:height*scale,scale};
}

export function dartReleasePoint(config,balloons){
 if(!config)return {x:228,y:balloons?128:86};
 const release=config.release,frame=config.frames[release.frame],box=characterFrameLayout(config,release.frame);
 return {x:37+(config.canvasOffsetX||0)+box.left+(release.x-frame.x)*box.scale+(release.tipOffsetX||0),
  y:(balloons?50:8)+(config.canvasOffsetY||0)+box.top+(release.y-frame.y)*box.scale+(release.tipOffsetY||0)};
}

// All motion samples the shared shot clock. Refreshing or joining mid-throw
// shows the correct cel without starting another animation or awarding a prize.
export function throwCel(shot,time,motion=true){
 if(!shot||time<shot.startAt)return 0;
 const age=shotAge(shot,time,shot.releaseAt);
 if(!motion)return age>=0&&age<260?8:0;
 // Whole-body cels, sampled from the shared clock. The front boot is
 // registered in the renderer while the hips, back leg and hair move.
 const starts=[-410,-350,-290,-230,-180,-135,-90,-45,0,45,90,140,190,240,300,360,420,480,540,605,675,750,835,920];
 if(age<THROW_RECOVERY_MS){let cel=0;for(let i=1;i<starts.length;i++){if(age<starts[i])break;cel=i;}return cel;}
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
