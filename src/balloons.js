import {balloonPopAt} from './balloon-timing.js';
import {balloonDeformation} from './motion.js';
import {buildBalloonFX,animateBalloonFX} from './balloon-fx.js';
import {balloonPixelLayers} from './balloon-art.js';
import {birthdayCake,birthdayGifts} from './party-props.js';
const palette=['#ee659e','#a48adc','#66bdac','#efbd62','#75afd8','#d783c0','#d59a71','#94ba73'];
export function outcomeForShot(shot,count){return Number.isInteger(shot?.outcomeIndex)?shot.outcomeIndex:Math.min(shot.bandIndex,2*count-2-shot.bandIndex);}
export function balloonSlots(count){return Array.from({length:Math.max(12,Math.min(16,count*3))},(_,i)=>i%count);}
export function balloonSlotForShot(shot,count){const options=balloonSlots(count).flatMap((outcome,i)=>outcome===outcomeForShot(shot,count)?[i]:[]);let hash=0;for(const char of shot.id||'')hash=(hash*31+char.charCodeAt(0))>>>0;return options[hash%options.length];}
export function balloonPoint(index,count,time=0,motion=true){
 // Hand-staggered bouquet: varied sizes and heights, with no rows or columns.
 const positions=[[-18,30,.73],[35,57,.68],[-62,71,.71],[2,100,.76],[69,118,.69],[-51,133,.72],[-4,167,.76],[-71,191,.67],[58,194,.74],[-33,225,.7],[82,242,.65],[19,252,.73],[-52,278,.63],[7,298,.62],[95,66,.62],[-86,32,.6]];
 const [dx,y,scale]=positions[index],x=549+dx*1.23;
 return {x:x+(motion?Math.sin(time/1300+index*1.9)*2:0),y:y*1.23+(motion?Math.sin(time/850+index*1.4)*3:0),scale:scale*1.4};
}
function svgNode(tag,attrs){const node=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value]of Object.entries(attrs))node.setAttribute(key,value);return node;}
export function buildBalloons(container,outcomes,money){
 container.replaceChildren();
 const labels=document.createElement('div');labels.className='prize-labels';labels.setAttribute('aria-hidden','true');
 for(const [index,outcomeIndex]of balloonSlots(outcomes.length).entries()){
  const outcome=outcomes[outcomeIndex],item=document.createElement('div');item.className='prize-balloon';item.dataset.index=index;item.dataset.outcome=outcomeIndex;item.setAttribute('aria-label',money(outcome.amountCents)+' balloon');
  const svg=svgNode('svg',{viewBox:'0 0 88 138','aria-hidden':'true'}),color=palette[outcomeIndex%palette.length];
  for(const layer of balloonPixelLayers(color))svg.append(svgNode('path',layer));
  const labelBox=document.createElement('div');labelBox.className='prize-label';
  const lettering=svgNode('svg',{viewBox:'0 0 88 138'}),amount=svgNode('text',{x:44,y:57,'text-anchor':'middle',class:'candy-amount'});amount.textContent=money(outcome.amountCents);lettering.append(amount);labelBox.append(lettering);labels.append(labelBox);
  const value=document.createElement('strong');value.textContent=money(outcome.amountCents);item.append(svg,value);container.append(item);
 }
 container.append(labels);
 // Measure the locally bundled face, so custom amounts and cents also fit.
 document.fonts.load('700 28px "Faith Candy"').then(()=>{
  if(!labels.isConnected)return;
  for(const text of labels.querySelectorAll('text')){
   const width=text.getComputedTextLength();
   if(width>68){const size=28*68/width;text.style.fontSize=size+'px';text.setAttribute('y',50+size/4);}
  }
 });
 buildBalloonFX(container,palette);
 buildPartyDecor(container);
}
export function animateBalloons(container,round,count,time,motion=true){
 const flight=round?.flight,shot=flight&&time>=flight.releaseAt?flight:round?.throws.at(-1),hit=shot?balloonSlotForShot(shot,count):-1;
 const popAt=shot?balloonPopAt(shot):0,elapsed=shot?time-popAt:Infinity;
 const focused=!!shot&&time>=shot.releaseAt&&elapsed<1100;
 const landed=[...(round?.throws||[]),...(flight&&time>=flight.landAt?[flight]:[])];
 const won=new Set(landed.map(s=>outcomeForShot(s,count)));
 const popped=new Map(landed.map(s=>[balloonSlotForShot(s,count),s]));
 const labels=container.querySelector('.prize-labels'),ribbons=container.querySelector('.bouquet-ribbons');
 for(let i=0;i<balloonSlots(count).length;i++){
  const item=container.children[i],label=labels.children[i],old=popped.get(i),isHit=focused&&i===hit,used=won.has(Number(item.dataset.outcome))&&!old;
  const point=balloonPoint(i,count,isHit?shot.landAt:time,motion);
  const deformation=balloonDeformation(old?time-balloonPopAt(old):-Infinity,motion);let alpha=used?.2:deformation.alpha;
  if(focused&&!isHit)alpha*=.38;
  const gone=!!old&&time>=balloonPopAt(old);
  item.classList.toggle('is-hit-focus',isHit);item.classList.toggle('is-popped',gone);item.setAttribute('aria-hidden',String(gone||used));
  label.classList.toggle('is-used',used);label.classList.toggle('is-hit-focus',isHit);
  item.style.transform=`translate(${Math.round(point.x-44)}px,${Math.round(point.y-48)}px) scale(${deformation.x*point.scale},${deformation.y*point.scale})`;item.style.opacity=alpha;
  label.style.transform=`translate(${Math.round(point.x-44)}px,${Math.round(point.y-48)}px) scale(${point.scale})`;label.style.opacity=alpha;
  const knotY=point.y+point.scale*49,ribbon=ribbons.children[i];ribbon.setAttribute('d',`M${point.x} ${knotY} Q${point.x+(550-point.x)*.1} ${Math.max(knotY+10,365)} 550 420`);ribbon.style.opacity=alpha*.6;
 }
 const origin=shot?balloonPoint(hit,count,shot.landAt,motion):null;
 animateBalloonFX(container,shot,origin,time,palette[shot?outcomeForShot(shot,count)%palette.length:0],motion);
}

function buildPartyDecor(container){
 const ribbons=svgNode('svg',{viewBox:'0 0 716 435',class:'bouquet-ribbons','aria-hidden':'true'});
 for(const item of container.querySelectorAll('.prize-balloon'))ribbons.append(svgNode('path',{fill:'none',stroke:palette[Number(item.dataset.outcome)%palette.length],'stroke-width':1.5}));
 ribbons.append(svgNode('path',{d:'M550 420 l-10 -5 h-8 v9 h9 l9 -4 10 -5 h8 v9 h-9 l-9 -4 -5 10 m5 -10 6 12',fill:'#ff9dc9',stroke:'#311935','stroke-width':2}));container.append(ribbons);
 const decor=document.createElement('div');decor.className='party-decor';decor.setAttribute('aria-hidden','true');
 const svg=svgNode('svg',{viewBox:'0 0 720 540'});
 svg.append(svgNode('path',{d:'M0 5 Q175 44 360 9 Q540 45 720 4',fill:'none',stroke:'#301631','stroke-width':5}),svgNode('path',{d:'M0 5 Q175 44 360 9 Q540 45 720 4',fill:'none',stroke:'#ffe3a3','stroke-width':2}));
 for(let i=0;i<16;i++){const x=10+i*45,y=8+Math.sin((i%8)/7*Math.PI)*14;svg.append(svgNode('path',{d:`M${x} ${y} h30 v7 h-4 v6 h-4 v6 h-4 v5 h-6 v-5 h-4 v-6 h-4 v-6 h-4 Z`,fill:palette[i%palette.length],stroke:'#311935','stroke-width':2}));}
 svg.append(birthdayCake(svgNode),birthdayGifts(svgNode));
 for(const [i,x,y]of [[0,22,105],[1,250,117],[2,22,222],[3,262,219],[4,199,294],[5,697,111],[6,698,373]]){svg.append(svgNode('path',{d:`M${x} ${y-7} v5 h5 v4 h-5 v5 h-4 v-5 h-5 v-4 h5 v-5 Z`,fill:palette[i%palette.length],stroke:'#311935','stroke-width':1}));}
 for(const [x,y,color]of [[7,148,'#ff83b9'],[249,156,'#ffd783'],[693,224,'#bca0ff']])svg.append(svgNode('path',{d:`M${x} ${y} h9 v8 h-12 v9 h10 v8 h-6`,fill:'none',stroke:color,'stroke-width':4}));
 decor.append(svg);container.append(decor);
 const shower=document.createElement('div');shower.className='party-shower';shower.setAttribute('aria-hidden','true');
 for(let i=0;i<52;i++){const piece=document.createElement('i');piece.style.setProperty('--x',((i*137)%700)+'px');piece.style.setProperty('--delay',((i%13)*.11)+'s');piece.style.setProperty('--drift',(((i*43)%120)-60)+'px');piece.style.background=palette[i%palette.length];shower.append(piece);}container.append(shower);
}
