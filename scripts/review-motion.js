import {buildBalloons,animateBalloons,balloonPoint,balloonSlotForShot} from '../src/balloons.js';
import {throwCel,spriteLayout,dartReleasePoint} from '../src/motion.js';
import {loadCharacterArt,createCharacterRenderer} from '../src/sprite-renderer.js';
import {REPEAT_BALLOON_RULE} from '../src/birthday-rules.js';
const config=await (await fetch('./character.json')).json(),$=s=>document.querySelector(s);
const outcomes=[{amountCents:1000},{amountCents:2500},{amountCents:5000},{amountCents:7500},{amountCents:10000}];
const shot={id:'motion-study',outcomeIndex:2,amountCents:5000,startAt:0,releaseAt:750,landAt:1490,popAt:1810,finishAt:3240};
const round={preset:{birthdayRule:REPEAT_BALLOON_RULE},throws:[],flight:shot};let time=0,rate=0,last=0,motion=true;
buildBalloons($('#balloons'),outcomes,c=>'$'+c/100);$('#sprite').style.backgroundImage=`url(${config.throwStudy})`;
const renderer=createCharacterRenderer($('#sprite'),config,await loadCharacterArt(config));
// The filmstrip keeps every hand visible together for anatomy/registration QA.
const strip=document.createElement('section');strip.className='filmstrip';
for(let i=0;i<config.frames.length;i++){
 const card=document.createElement('figure'),art=document.createElement('div'),caption=document.createElement('figcaption');
 art.className='strip-art';const cel=document.createElement('div');cel.className='sprite';
 Object.assign(cel.style,spriteLayout(config,i),{display:'block',backgroundImage:`url(${config.frames[i].image||config.throwStudy})`});
 art.append(cel);caption.textContent=`Pose ${i+1}`;card.append(art,caption);strip.append(card);
}
document.body.append(strip);
function draw(){
 const cel=throwCel(shot,time,motion);$('#sprite').style.display='block';renderer.draw(cel);
 animateBalloons($('#balloons'),round,outcomes.length,time,motion);
 const dart=$('#dart');dart.style.display='none';
 if(time>=shot.releaseAt&&time<shot.popAt){
  const target=balloonPoint(balloonSlotForShot(shot,outcomes.length),outcomes.length,shot.landAt,motion),start=dartReleasePoint(config,true),u=Math.min(1,(time-shot.releaseAt)/(shot.landAt-shot.releaseAt)),cx=(start.x+target.x)/2,cy=Math.min(30,target.y-80);
  const x=(1-u)**2*start.x+2*(1-u)*u*cx+u*u*target.x,y=(1-u)**2*start.y+2*(1-u)*u*cy+u*u*target.y;
  dart.style.display='block';dart.style.left=x-31+'px';dart.style.top=y-4+'px';dart.style.transform=`rotate(${u===1?0:Math.atan2(2*(1-u)*(cy-start.y)+2*u*(target.y-cy),2*(1-u)*(cx-start.x)+2*u*(target.x-cx))*180/Math.PI}deg)`;
 }
 $('#time').value=time;$('#readout').textContent=`${Math.round(time)} ms · ${'painted cel '+(cel+1)} · ${time<750?'wind-up':time<1490?'flight':time<1810?'impact hold':time<2290?'rupture':'settle'}`;
}
const jump=t=>{rate=0;time=t;draw();};
for(const [i,t]of [0,385,455,515,565,615,665,715,750,840,950,1060,1180,1290,1400,1540].entries()){const b=document.createElement('button');b.textContent='Pose '+(i+1);b.onclick=()=>jump(t);$('#poses').append(b);}
for(const [name,t]of [['Impact',1550],['Pressure',1790],['Rupture',1870],['Fragments',2050],['Settle',2550]]){const b=document.createElement('button');b.textContent=name;b.onclick=()=>jump(t);$('#beats').append(b);}
$('#time').oninput=e=>jump(Number(e.target.value));$('#play').onclick=()=>{time=0;rate=1;};$('#slow').onclick=()=>{time=0;rate=.25;};$('#pause').onclick=()=>{rate=0;};$('#motion').onclick=()=>{motion=!motion;$('#motion').textContent=motion?'Reduce motion':'Full motion';draw();};
function tick(now){if(rate){time=Math.min(3240,time+(now-last)*rate);if(time===3240)rate=0;draw();}last=now;requestAnimationFrame(tick);}draw();requestAnimationFrame(tick);
