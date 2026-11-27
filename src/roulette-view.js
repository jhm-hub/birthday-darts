import {DEFAULT_ROULETTE} from './roulette-game.js';

const SIZE = 1000, TAU = Math.PI * 2;
const CENTER = {x: 500, y: 462}, POCKET_R = 355, LABEL_R = 302, TRACK_R = 380, BALL_R = 337;
const COLORS = ['#bd9cde', '#edb0cc', '#dfc590', '#a787c6'];
const C = {ink:'#23142e', velvet:'#34203f', gold:'#e8cc95', ivory:'#fff3df', muted:'#c4afd3'};
const bounded = (v, lo=0, hi=1) => Math.min(hi, Math.max(lo, Number(v) || 0));
const easeOut = value => 1 - (1-bounded(value)) ** 3;
const money = value => '$' + Number(value).toLocaleString('en-US', {maximumFractionDigits:0});
const monoNow = () => globalThis.performance?.now?.() ?? Date.now();

// Constant initial velocity, then continuous linear deceleration. The value is
// integrated distance, so neither rotor nor ball jumps when the slowdown begins.
function travel(progress, stop=.92) {
  const t=bounded(progress/stop), cruise=.4;
  if(t<=cruise)return t/.7;
  const tail=t-cruise;
  return (cruise+tail-tail*tail/(2*(1-cruise)))/.7;
}
function landingAngle(id) {
  let hash=2166136261;
  for(const character of String(id||''))hash=Math.imul(hash^character.charCodeAt(0),16777619);
  return -Math.PI/2 + (hash>>>0)/4294967296*TAU;
}

/** Exact presentation geometry; the round engine alone chooses the pocket. */
export function roulettePose(round, now, reducedMotion=false) {
  if(!round)return {progress:0,rotor:0,ballAngle:-Math.PI/2,ballRadius:TRACK_R,landed:false};
  const progress=round.phase==='complete'?1:bounded((now-round.startAt)/Math.max(1,round.durationMs));
  const angle=landingAngle(round.id),step=TAU/round.config.amounts.length;
  const target=TAU*4+angle-(round.index+.5)*step;
  const distance=travel(progress),landed=progress>=.92;
  let ballRadius=TRACK_R+(BALL_R-TRACK_R)*easeOut((progress-.72)/.2);
  if(progress>.92&&progress<.97){const settle=(progress-.92)/.05;ballRadius+=Math.sin(settle*TAU*2)*(1-settle)*3.5;}
  if(reducedMotion)ballRadius=landed?BALL_R:TRACK_R;
  return {
    progress,rotor:reducedMotion?(landed?target:0):target*distance,
    ballAngle:reducedMotion?(landed?angle:-Math.PI/2):-Math.PI/2+(angle-TAU*9+Math.PI/2)*distance,
    ballRadius,landed,
  };
}

function disc(ctx,x,y,r,fill,stroke=null,width=1){ctx.beginPath();ctx.arc(x,y,r,0,TAU);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
function panel(ctx,x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=1.5;ctx.strokeStyle=stroke;ctx.stroke();}}
function label(ctx,value,x,y,size=24,color=C.ivory,weight=800,maxWidth=Infinity){ctx.font=`${weight} ${size}px Nunito, sans-serif`;const width=ctx.measureText(String(value)).width;if(width>maxWidth)ctx.font=`${weight} ${Math.max(10,size*maxWidth/width)}px Nunito, sans-serif`;ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(value),x,y);}
function crown(ctx,x,y,size,color=C.gold){ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.moveTo(-size*.62,-size*.27);ctx.lineTo(-size*.36,size*.35);ctx.lineTo(size*.36,size*.35);ctx.lineTo(size*.62,-size*.27);ctx.lineTo(size*.23,-size*.04);ctx.lineTo(0,-size*.6);ctx.lineTo(-size*.23,-size*.04);ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();}

function paint(canvas,snapshot,now,reducedMotion){
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const cssWidth=Math.max(1,canvas.clientWidth||SIZE),dpr=Math.min(2,globalThis.devicePixelRatio||1),pixels=Math.round(cssWidth*dpr);
 if(canvas.width!==pixels||canvas.height!==pixels){canvas.width=pixels;canvas.height=pixels;}
 ctx.setTransform(pixels/SIZE,0,0,pixels/SIZE,0,0);ctx.clearRect(0,0,SIZE,SIZE);
 if(!snapshot||snapshot.visible===false)return;
 const round=snapshot.round,config=round?.config??snapshot.config??DEFAULT_ROULETTE,amounts=config.amounts,pose=roulettePose(round,now,reducedMotion),complete=round?.phase==='complete';
 const {x:cx,y:cy}=CENTER,n=amounts.length,step=TAU/n;
 const rim=ctx.createRadialGradient(cx-50,cy-80,280,cx,cy,395);rim.addColorStop(0,'#53354e');rim.addColorStop(.72,'#b39166');rim.addColorStop(.81,'#f6dfae');rim.addColorStop(.86,'#806079');rim.addColorStop(.95,'#38243d');rim.addColorStop(1,'#d7b98a');
 ctx.save();ctx.shadowColor='rgba(10,4,17,.38)';ctx.shadowBlur=17;ctx.shadowOffsetY=8;disc(ctx,cx,cy,394,rim,C.gold,2);ctx.restore();
 disc(ctx,cx,cy,385,null,'#765770',1.5);disc(ctx,cx,cy,377,null,'#21162a',11);disc(ctx,cx,cy,368,null,'#d4b080',2);disc(ctx,cx,cy,360,'#1d1426','#7b607c',2);
 // Small metal studs give the rim a stable reference against the rotating rotor.
 for(let i=0;i<24;i++){const angle=i*TAU/24;disc(ctx,cx+Math.cos(angle)*390,cy+Math.sin(angle)*390,1.8,'#fff0c9');}
 ctx.save();ctx.translate(cx,cy);ctx.rotate(pose.rotor);
 for(let index=0;index<n;index++){
  const a=index*step,b=(index+1)*step;
  ctx.beginPath();ctx.arc(0,0,POCKET_R,a,b);ctx.arc(0,0,252,b,a,true);ctx.closePath();ctx.fillStyle=COLORS[index%COLORS.length];ctx.fill();ctx.strokeStyle='#634559';ctx.lineWidth=2;ctx.stroke();
  ctx.save();ctx.rotate((index+.5)*step);ctx.translate(LABEL_R,0);ctx.rotate(Math.PI/2);label(ctx,amounts[index],0,0,n>28?26:32,'#291733',900,Math.min(91,2*Math.PI*LABEL_R/n*.8));ctx.restore();
  if(complete&&index===round.index){ctx.save();ctx.beginPath();ctx.arc(0,0,POCKET_R-3,a+.008,b-.008);ctx.arc(0,0,255,b-.008,a+.008,true);ctx.closePath();ctx.strokeStyle='#fff1b8';ctx.lineWidth=4;ctx.shadowColor='#ffe9a5';ctx.shadowBlur=12;ctx.stroke();ctx.restore();}
 }
 ctx.restore();
 disc(ctx,cx,cy,252,'#20132a',C.gold,2.4);disc(ctx,cx,cy,243,null,'#755174',2);
 const velvet=ctx.createRadialGradient(cx-45,cy-60,6,cx,cy,235);velvet.addColorStop(0,'#63405c');velvet.addColorStop(.64,C.velvet);velvet.addColorStop(1,'#24162e');disc(ctx,cx,cy,235,velvet,'#513448',1);
 ctx.save();ctx.setLineDash([2,10]);disc(ctx,cx,cy,222,null,'rgba(232,204,149,.3)',1);ctx.restore();
 crown(ctx,cx,cy-122,47);
 label(ctx,'FAITH’S',cx,cy-66,23,C.gold,900);
 if(complete){
  label(ctx,'FINAL AMOUNT',cx,cy-12,17,C.muted,900);
  label(ctx,money(round.amount),cx,cy+56,92,C.ivory,900,365);
  label(ctx,'A LITTLE LUCK. ALL HERS.',cx,cy+132,15,C.gold,800,350);
 }else{
  const name=String(config.name||'Velvet Roulette');
  const words=name.trim().split(/\s+/),split=Math.ceil(words.length/2),first=words.slice(0,split).join(' '),last=words.slice(split).join(' ');
  label(ctx,first.toUpperCase(),cx,cy+1,last?46:44,C.ivory,900,354);
  if(last)label(ctx,last.toUpperCase(),cx,cy+56,46,C.ivory,900,354);
  label(ctx,round?(pose.landed?'THE BEAD HAS LANDED':pose.progress>.7?'SETTLING IN':'FOLLOW THE BEAD'):'READY TO SPIN',cx,cy+133,16,C.gold,900,350);
 }
 // A soft, short trail suggests velocity while preserving the bead's exact path.
 if(round&&!reducedMotion&&!pose.landed&&pose.progress>.015){
  const velocity=1-bounded((pose.progress/.92-.4)/.6);
  for(let trail=3;trail>=1;trail--){const angle=pose.ballAngle+trail*.035*velocity;ctx.globalAlpha=(4-trail)*.055;disc(ctx,cx+Math.cos(angle)*pose.ballRadius,cy+Math.sin(angle)*pose.ballRadius,8,'#fff0ce');}ctx.globalAlpha=1;
 }
 const bx=cx+Math.cos(pose.ballAngle)*pose.ballRadius,by=cy+Math.sin(pose.ballAngle)*pose.ballRadius;
 ctx.save();ctx.shadowColor='rgba(0,0,0,.6)';ctx.shadowBlur=7;ctx.shadowOffsetY=3;disc(ctx,bx,by,11.5,'#f5e4c7','#fff7e3',1.5);ctx.restore();disc(ctx,bx-3.5,by-4,3.5,'#fffdf1');
 // Stream-safe plaques remain opaque while all surrounding canvas pixels are clear.
 panel(ctx,235,12,530,48,24,'rgba(33,20,43,.96)','#93718c');
 label(ctx,round?.viewer||'READY FOR THE NEXT VIEWER',500,36,20,C.ivory,900,480);
 panel(ctx,210,891,580,88,24,'rgba(36,22,46,.97)',complete?C.gold:'#8a6787');
 if(complete){label(ctx,'FINAL AMOUNT',500,915,12,C.gold,900);label(ctx,money(round.amount),500,943,44,C.ivory,900,500);}
 else {label(ctx,round?(pose.landed?'LANDED · THE REVEAL IS NEXT':'THE WHEEL IS IN MOTION'):'ONE SPIN. ONE AMOUNT.',500,922,19,C.ivory,900,520);label(ctx,round?'Stay with the bead.':String(config.name||'Velvet Roulette'),500,952,15,C.muted,700,520);}
}

/** A shared snapshot drives the local preview and transparent OBS canvas. */
export function createRouletteView(canvas,{audio=null}={}){
 if(!canvas?.getContext)throw new Error('Roulette needs a canvas.');
 let snapshot=null,receivedAt=monoNow(),serverAt=Date.now(),lastNow=serverAt,roundId=null,frame=0,disposed=false;
 const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')??{matches:false};
 function tick(){if(disposed)return;const now=Math.max(lastNow,serverAt+monoNow()-receivedAt);lastNow=now;paint(canvas,snapshot,now,reduced.matches);frame=requestAnimationFrame(tick);}
 frame=requestAnimationFrame(tick);
 return {
  update(next){
   if(disposed)return;snapshot=next??null;
   const currentId=next?.round?.id??null,server=Number.isFinite(next?.serverNow)?next.serverNow:Date.now();
   receivedAt=monoNow();serverAt=server;if(currentId!==roundId){roundId=currentId;lastNow=server;}
   const now=Math.max(lastNow,server);lastNow=now;
   canvas.setAttribute('aria-label',next?.round?.phase==='complete'?`Roulette result${next.round.viewer?' for '+next.round.viewer:''}: ${money(next.round.amount)}.`:next?.round?`Roulette spinning${next.round.viewer?' for '+next.round.viewer:''}.`:'Roulette wheel ready to spin.');
   paint(canvas,snapshot,now,reduced.matches);audio?.update(next);
  },
  dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);audio?.stop();const ctx=canvas.getContext('2d');ctx?.clearRect(0,0,canvas.width,canvas.height);},
 };
}

/** Quiet procedural sound; complete snapshots loaded later never replay a chime. */
export function createRouletteAudio(){
 let context=null,master=null,enabled=false,volume=65,snapshot=null,serverAt=Date.now(),receivedAt=monoNow(),timer=null,disposed=false,roundId=null,observedPlaying=false,chimedId=null;
 const voices=new Set();
 const currentNow=()=>serverAt+monoNow()-receivedAt;
 function cancelVoices(){for(const voice of voices){try{voice.stop();}catch{}try{voice.disconnect();}catch{}}voices.clear();}
 function stop(){if(timer!==null){clearTimeout(timer);timer=null;}cancelVoices();observedPlaying=false;}
 function audible(){return !disposed&&enabled&&volume>0&&snapshot?.visible!==false&&context?.state==='running';}
 function tone(frequency,delay,duration,level,type='sine'){
  if(!audible())return;
  const osc=context.createOscillator(),gain=context.createGain(),at=context.currentTime+delay;osc.type=type;osc.frequency.setValueAtTime(frequency,at);
  gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(level,at+.007);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
  osc.connect(gain);gain.connect(master);voices.add(osc);osc.onended=()=>{voices.delete(osc);try{osc.disconnect();gain.disconnect();}catch{}};osc.start(at);osc.stop(at+duration+.025);
 }
 function rolling(){
  timer=null;const round=snapshot?.round;
  if(!audible()||!round||round.phase!=='spinning')return;
  const progress=bounded((currentNow()-round.startAt)/Math.max(1,round.durationMs));
  if(progress>=.92||currentNow()<round.startAt)return;
  observedPlaying=true;
  const velocity=1-bounded((progress/.92-.4)/.6);tone(730+velocity*420,0,.025+(.02*(1-velocity)),.07,'triangle');
  timer=setTimeout(rolling,75+(1-velocity)**1.45*245);
 }
 function resumeRolling(){if(timer===null&&audible()&&snapshot?.round?.phase==='spinning'&&currentNow()<snapshot.round.endAt)rolling();}
 function setVolume(next){volume=bounded(next,0,100);if(master)master.gain.setValueAtTime(volume/100*.35,context.currentTime);if(volume===0)stop();else resumeRolling();}
 return {
  async unlock(){
   if(disposed)return false;
   try{if(!context){const Audio=globalThis.AudioContext??globalThis.webkitAudioContext;if(!Audio)return false;context=new Audio();master=context.createGain();master.gain.value=volume/100*.35;master.connect(context.destination);}if(context.state==='suspended')await context.resume();resumeRolling();return context.state==='running';}catch{return false;}
  },
  setEnabled(value){enabled=!!value;if(!enabled)stop();else resumeRolling();},
  setVolume,
  update(next){
   if(disposed)return;const previousId=roundId;snapshot=next??null;receivedAt=monoNow();serverAt=Number.isFinite(next?.serverNow)?next.serverNow:Date.now();
   const round=next?.round??null;roundId=round?.id??null;
   if(previousId!==roundId){stop();chimedId=null;}
   if(Number.isFinite(next?.volume))setVolume(next.volume);else if(Number.isFinite(next?.config?.volume))setVolume(next.config.volume);
   if(!round||next?.visible===false){stop();return;}
   if(round.phase==='complete'){
    if(chimedId===round.id){if(!audible())stop();return;}
    const shouldChime=observedPlaying&&chimedId!==round.id&&audible()&&currentNow()-round.endAt>=0&&currentNow()-round.endAt<1500;
    stop();chimedId=round.id;
    if(shouldChime){tone(523.25,0,.26,.18);tone(659.25,.08,.28,.15);tone(783.99,.16,.38,.13);}
   }else resumeRolling();
  },
  stop,
  dispose(){if(disposed)return;stop();disposed=true;try{master?.disconnect();}catch{}try{context?.close();}catch{}},
 };
}
