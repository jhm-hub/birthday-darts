import {createVaultView} from './vault-view.js';
import {sceneState,sceneCoin} from './vault-scenes-model.js';
import {sceneArtwork,storyCoin} from './vault-scenes-art.js';
import {smooth} from './vault-concept-model.js';

export function createSceneView(root,id){
 root.dataset.sceneConcept=id;
 const base=createVaultView(root),stage=root.querySelector('.vault-stage');
 if(id==='current')return {update:({round,time},quiet)=>base.update({widget:round.preset,round},{preview:true,frozenAt:time,quiet}),hide:()=>base.hide(),dispose:()=>base.dispose()};
 const layer=document.createElement('div');layer.className='story-scene';layer.setAttribute('aria-hidden','true');
 layer.innerHTML=sceneArtwork()+'<div class="story-chapter"></div><div class="story-cash"></div><div class="story-bonus"></div><div class="story-waiting-label"></div><div class="story-coins">'+Array.from({length:7},()=>'<i>'+storyCoin()+'</i>').join('')+'</div>';
 stage.append(layer);
 const $=s=>layer.querySelector(s),rooms=[...layer.querySelectorAll('.story-room')].map(el=>({el,chest:el.querySelector('.room-chest'),lid:el.querySelector('.room-chest-lid'),loot:el.querySelector('.room-chest-loot'),secret:el.querySelector('.room-secret'),wall:el.querySelector('.secret-wall'),key:el.querySelector('.secret-key'),machine:el.querySelector('.room-reel-machine'),strip:el.querySelector('.reel-strip'),handle:el.querySelector('.reel-handle'),shimmer:el.querySelector('.room-shimmer')}));
 const left=$('.story-door-left'),right=$('.story-door-right'),entry=$('.story-entry-portal'),entryLeft=$('.story-entry-left'),entryRight=$('.story-entry-right'),title=$('.story-chapter'),cash=$('.story-cash'),bonus=$('.story-bonus'),waiting=$('.story-waiting-door'),waitingLabel=$('.story-waiting-label'),coins=[...layer.querySelectorAll('.story-coins i')],sparks=[...layer.querySelectorAll('.story-sparkles>g')];
 let token='',active=-1;
 return {update(frame,quiet=false){
  base.update({widget:frame.round.preset,round:frame.round},{preview:true,frozenAt:frame.time,quiet});
  const s=sceneState(frame,quiet),room=rooms[s.index%rooms.length];
  if(active!==s.index){active=s.index;rooms.forEach((r,i)=>r.el.style.display=i===s.index%rooms.length?'':'none');}
  layer.style.opacity=s.opening*(1-s.ending);layer.dataset.phase=s.finished?'final':s.bonusShown?'bonus':s.reveal>=0?'cash':'opening';layer.dataset.room=String(s.index+1);layer.dataset.waiting=String(s.waiting);
  const last=s.index>=s.r.allocated-1&&!s.extra,close=s.shot&&!last?smooth((s.time-s.shot.finishAt+160)/420):0,open=s.door*(1-close),width=Math.max(.025,Math.cos(open*Math.PI*.49));
  left.setAttribute('transform',`translate(104 213) matrix(${width} ${open*.03} 0 1 0 0) translate(-104 -213)`);
  right.setAttribute('transform',`translate(316 213) matrix(${width} ${-open*.03} 0 1 0 0) translate(-316 -213)`);
  left.style.opacity=right.style.opacity=1-smooth((open-.94)/.06);
  const see=smooth((open-.48)/.4),isMachine=id==='machine'&&s.multiply,isSecret=id==='secret',machineArrival=isMachine?smooth((s.time-s.bonusAt+430)/230):0;
  const entering=isSecret&&s.special&&s.age<1000,entryProgress=smooth((s.age-180)/620),entryScale=.86+.4*smooth(s.age/950);
  entry.style.display=entering?'':'none';entry.style.opacity=quiet?0:1-smooth((s.age-650)/350);
  entry.setAttribute('transform',`translate(64 64) scale(${entryScale}) translate(-64 -64)`);
  entryLeft.setAttribute('transform',`translate(46 0) scale(${1-.98*entryProgress} 1) translate(-46 0)`);
  entryRight.setAttribute('transform',`translate(82 0) scale(${1-.98*entryProgress} 1) translate(-82 0)`);
  if(isSecret&&s.special)left.style.opacity=right.style.opacity=0;
  title.textContent=(s.special?'BONUS · ':'')+s.name;title.style.opacity=see;
  cash.textContent=s.amount;cash.style.opacity=s.cashOpacity*see;cash.dataset.small=String(isMachine&&machineArrival>0);
  bonus.textContent=s.bonusShown?(s.extra?(isSecret?'+1 SECRET VAULT':'+1 UNLOCK'):isMachine?'×'+s.shot.bonus.value+' WHOLE TOTAL':'×'+s.shot.bonus.value+' TOTAL'):'';
  bonus.style.opacity=s.bonusShown?see:0;bonus.dataset.kind=s.extra?'extra':'multiply';
  root.dataset.mechanism=String(isMachine);root.dataset.secret=String(isSecret&&s.extra&&s.bonusBuild);
  room.chest.style.opacity=(1-machineArrival)*(isSecret?1-smooth(s.secret/.75):1);
  room.chest.setAttribute('transform',`translate(0 ${isSecret?9*s.secret:0})`);
  room.lid.setAttribute('transform',`translate(0 ${77-18*s.chest}) scale(1 ${1-.52*s.chest}) translate(0 -77)`);
  room.loot.style.opacity=s.chest;
  room.machine.style.display=isMachine?'':'none';room.machine.style.opacity=machineArrival;room.machine.setAttribute('transform',`translate(0 ${quiet?0:18*(1-machineArrival)})`);
  const reelToken=s.shot?.id??'';
  if(reelToken!==token){token=reelToken;room.strip.innerHTML=s.reelRows.map((n,i)=>`<text x="9.5" y="${19+i*25}" text-anchor="middle" fill="#8f3977" font-size="23" font-family="Fredoka,sans-serif" font-weight="600">${n}</text>`).join('');}
  const spin=quiet?Number(s.bonusShown):1-(1-s.mechanism)**3;
  room.strip.setAttribute('transform',`translate(0 ${-225*spin})`);
  room.handle.setAttribute('transform',`rotate(${quiet?0:34*Math.sin(Math.PI*s.mechanism)} 98 70)`);
  room.secret.style.display=isSecret?'':'none';
  room.wall.setAttribute('transform',`translate(${-52*s.secret} 0)`);room.wall.style.opacity=1-s.secret;
  const keyAge=s.time-s.bonusAt+200,keyProgress=smooth(keyAge/380);
  room.key.setAttribute('transform',`translate(${57+25*(1-keyProgress)} ${48+22*(1-keyProgress)}) rotate(${-45+135*keyProgress} 7 7)`);
  room.key.style.opacity=isSecret&&s.extra&&keyAge>=0&&!quiet?Math.min(smooth(keyAge/100),1-smooth((keyAge-420)/230)):0;
  // A discovered passage remains visible until its earned extra chamber is reached.
  waiting.style.opacity=waitingLabel.style.opacity=isSecret&&s.waiting>0?1:0;
  waitingLabel.textContent=s.waiting===1?'1 WAITING':s.waiting+' WAITING';
  room.shimmer.style.opacity=quiet?0:see*(.35+.35*Math.sin((s.time-s.r.startedAt)/410)**2);
  const sparkleAt=s.bonusShown?s.landAt:s.shot?.revealAt??Infinity;
  sparks.forEach((el,i)=>{const t=(s.time-sparkleAt-i*28)/650;if(quiet||t<=0||t>=1){el.style.opacity=0;return;}const a=i/8*Math.PI*2;el.style.opacity=Math.sin(t*Math.PI)*.7;el.setAttribute('transform',`translate(${210+Math.cos(a)*(48+30*t)} ${211+Math.sin(a)*(48+30*t)}) scale(.65)`);});
  coins.forEach((el,i)=>{const p=sceneCoin(s,i);el.style.opacity=p.opacity;el.style.transform=`translate(${p.x-7}px,${p.y-5}px) scaleX(${p.flip})`;});
 },hide:()=>base.hide(),dispose(){base.dispose();layer.remove();}};
}
