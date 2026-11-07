import {createVaultView} from './vault-view.js';
import {vaultPresentation} from './vault-playback.js';
import {vaultRewardPoint} from './vault-special.js';
import {conceptProgress,conceptFlight,smooth,CRESTS} from './vault-concept-model.js';
import {assemblingCrown,CROWN_SOCKETS,crestMedallion,crestSVG,routeDoor,pixelStar} from './vault-concept-art.js';

export function createConceptView(root,id){
 root.dataset.concept=id;
 const base=createVaultView(root),stage=root.querySelector('.vault-stage');
 if(id==='current')return {update:({round,time},quiet)=>base.update({widget:round.preset,round},{preview:true,frozenAt:time,quiet}),hide:()=>base.hide(),dispose:()=>base.dispose()};
 const layer=document.createElement('div');layer.className='concept-layer concept-'+id;layer.setAttribute('aria-hidden','true');stage.append(layer);
 layer.innerHTML=id==='route'?`<div class="concept-route-label">ROOMS</div><div class="concept-route-line"></div>${Array.from({length:8},()=>`<div class="concept-room">${routeDoor()}<b></b><i>+</i></div>`).join('')}<div class="concept-flight">${crestSVG('key')}</div>`:id==='crown'?`<div class="concept-built-crown">${assemblingCrown()}<small>BONUS CROWN</small></div><div class="concept-flight">${crestSVG('ruby')}</div><div class="concept-crown-gleam">${pixelStar}</div>`:`<div class="concept-personal-crest"></div><div class="concept-crest-orbit">${Array.from({length:12},()=>`<i>${pixelStar}</i>`).join('')}</div><div class="concept-crest-caption"></div>`;
 const rooms=[...layer.querySelectorAll('.concept-room')],line=layer.querySelector('.concept-route-line'),crown=layer.querySelector('.concept-built-crown'),gems=[...layer.querySelectorAll('.concept-gem')],flying=layer.querySelector('.concept-flight'),gleam=layer.querySelector('.concept-crown-gleam'),medallion=layer.querySelector('.concept-personal-crest'),sparks=[...layer.querySelectorAll('.concept-crest-orbit i')],caption=layer.querySelector('.concept-crest-caption');
 let crest='';
 function flight(event,time,from,to,quiet){const p=event?conceptFlight(event,time,from,to,quiet):{opacity:0,x:0,y:0,scale:1};flying.style.opacity=p.opacity;flying.style.transform=`translate(${p.x-12}px,${p.y-12}px) scale(${p.scale})`;}
 return {update(frame,quiet=false,selectedCrest='crown'){
  const {round,time:wall}=frame; base.update({widget:round.preset,round},{preview:true,frozenAt:wall,quiet});
  const presentation=vaultPresentation(round,wall),r=presentation.round,time=presentation.time,progress=conceptProgress(r,time),last=progress.bonuses.at(-1),finalAge=progress.finished?time-r.completedAt:-1;
  layer.style.opacity=String(smooth((time-r.startedAt-250)/350));
  if(id==='route'){
   const current=progress.rooms.findIndex(n=>n.current),first=Math.max(0,(current<0?progress.rooms.length-1:current)-7),shown=progress.rooms.slice(first,first+8);
   layer.querySelector('.concept-route-label').textContent=first?'ROOMS '+(first+1)+'+':'ROOMS';
   let lastY=88;
   rooms.forEach((el,i)=>{const room=shown[i];el.hidden=!room;if(!room)return;const age=time-room.born,arrive=quiet?1:smooth(age/550),y=88+i*31;
    el.dataset.state=room.done?'done':room.current?'current':'waiting';el.dataset.bonus=String(room.bonus);el.querySelector('b').textContent=room.done?'✓':String(room.index+1);el.querySelector('i').hidden=!room.bonus;
    el.style.opacity=room.bonus?arrive:1;el.style.transform=`translate(12px,${y+(room.bonus?9*(1-arrive):0)}px) scale(${room.bonus?.8+.2*arrive:1})`;
    el.style.filter=room.current&&!quiet?'drop-shadow(0 0 '+(1.5+Math.sin((time-room.born)/310)*.5)+'px #ffe6a5)':'';
    if(i)lastY=y+(room.bonus?-31*(1-arrive):0);
   });
   line.style.height=Math.max(0,lastY-88)+'px';
   const extra=progress.bonuses.filter(b=>b.kind==='extra').at(-1),room=progress.rooms.at(-1),index=room?room.index-first:0;
   flight(extra,time,extra?vaultRewardPoint(r,extra.shot.index):{x:210,y:180},{x:26,y:102+index*31},quiet);
  }else if(id==='crown'){
   const finish=progress.finished?(quiet?1:smooth((finalAge-100)/750)):0,scale=1.08+.42*finish,x=210-52*scale,y=292-120*finish;
   crown.style.transform=`translate(${x}px,${y}px) scale(${scale})`;crown.querySelector('small').textContent='YOUR BONUS CROWN';crown.querySelector('small').style.opacity=finish;
   gems.forEach((el,i)=>{const event=progress.bonuses[i],t=event?(time-event.at-440)/200:-1;el.style.opacity=t<0?0:quiet?1:smooth(t);});
   const i=Math.min(progress.bonuses.length-1,5),socket=CROWN_SOCKETS[Math.max(0,i)],to={x:x+(socket[0]+4)*scale,y:y+(socket[1]+4)*scale};
   flight(last,time,last?vaultRewardPoint(r,last.shot.index):{x:210,y:180},to,quiet);
   const sparkle=last&&!quiet?Math.sin(Math.PI*Math.max(0,Math.min(1,(time-last.at-500)/500))):0;
   gleam.style.opacity=sparkle;gleam.style.transform=`translate(${to.x-7}px,${to.y-11}px) scale(${1+sparkle*.25})`;
  }else{
   const theme=CRESTS[selectedCrest]??CRESTS.crown;
   for(const [name,value]of Object.entries(theme))if(name!=='name')layer.style.setProperty('--crest-'+name,value);
   if(crest!==selectedCrest){crest=selectedCrest;medallion.innerHTML=crestMedallion(crest);sparks.forEach((el,i)=>el.innerHTML=i%3===0?crestSVG(crest):pixelStar);}
   const finish=progress.finished?(quiet?1:smooth((finalAge-100)/850)):0,scale=.66+.79*finish;
   medallion.style.transform=`translate(${370-201*finish}px,${278-109*finish}px) scale(${scale})`;
   caption.textContent=theme.name.toUpperCase();caption.style.opacity=1-finish;
   caption.style.transform=`translate(388px,326px)`;
   const shot=r.flight??r.opened.at(-1),eventAt=progress.finished?r.completedAt+500:last&&time-last.at<1000?last.at:shot?shot.revealAt+240:-Infinity,age=time-eventAt;
   const active=!quiet&&age>=0&&age<1100;
   sparks.forEach((el,i)=>{const t=(age-i*18)/780;if(!active||t<=0||t>=1){el.style.opacity=0;return;}
    const angle=(i/12)*Math.PI*2-Math.PI/2,radius=progress.finished?70+45*t:140+15*t,cx=210,cy=progress.finished?222:207;
    el.style.opacity=Math.min(1,t*7,(1-t)*4)*.9;el.style.transform=`translate(${cx+Math.cos(angle)*radius-7}px,${cy+Math.sin(angle)*radius-7}px) scale(${.7+.3*Math.sin(t*Math.PI)})`;
   });
  }
 },hide:()=>base.hide(),dispose(){base.dispose();layer.remove();}};
}
