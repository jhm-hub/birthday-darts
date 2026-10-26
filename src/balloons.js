import {balloonPopAt} from './balloon-timing.js';
import {shotAge} from './dart-timing.js';
import {balloonDeformation} from './motion.js';
import {buildBalloonFX,animateBalloonFX} from './balloon-fx.js';
import {balloonPixelLayers} from './balloon-art.js';
import {birthdayCake,birthdayGifts} from './party-props.js';
const palette=['#f28cbe','#baa0ec','#83d9bc','#efcd87','#8dc7ec','#dea2d5','#efb58f','#accc95'];
export {outcomeForShot,balloonSlots,balloonSlotForShot} from './balloon-slots.js';
import {outcomeForShot,balloonSlots,balloonSlotForShot} from './balloon-slots.js';
import {REPEAT_BALLOON_RULE} from './birthday-rules.js';
export {balloonPoint} from './darts-layout.js';
import {balloonPoint} from './darts-layout.js';
function svgNode(tag,attrs){const node=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value]of Object.entries(attrs))node.setAttribute(key,value);return node;}
export function buildBalloons(container,outcomes,money){
 container.replaceChildren();
 const labels=document.createElement('div');labels.className='prize-labels';labels.setAttribute('aria-hidden','true');
 for(const [index,outcomeIndex]of balloonSlots(outcomes.length).entries()){
  const outcome=outcomes[outcomeIndex],item=document.createElement('div');item.className='prize-balloon';item.dataset.index=index;item.dataset.outcome=outcomeIndex;item.setAttribute('aria-label',money(outcome.amountCents)+' balloon');
  const svg=svgNode('svg',{viewBox:'0 0 88 138','aria-hidden':'true'}),color=palette[outcomeIndex%palette.length];
  for(const layer of balloonPixelLayers(color))svg.append(svgNode('path',layer));
  const labelBox=document.createElement('div');labelBox.className='prize-label';
  const lettering=svgNode('svg',{viewBox:'0 0 88 138'}),amount=svgNode('text',{x:44,y:57,'text-anchor':'middle',class:'candy-amount'});const currency=svgNode('tspan',{class:'candy-currency'});currency.textContent='$';const digits=svgNode('tspan',{});digits.textContent=money(outcome.amountCents).slice(1);amount.append(currency,digits);lettering.append(svgNode('path',{d:'M10 34H78V36H82V62H78V64H10V62H6V36H10Z',class:'candy-plaque'}),amount);labelBox.append(lettering);labels.append(labelBox);
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
 const popAt=shot?balloonPopAt(shot):0,elapsed=shot?shotAge(shot,time,popAt):Infinity;
 const focused=!!shot&&time>=shot.releaseAt&&elapsed<1100;
 const landed=[...(round?.throws||[]),...(flight&&time>=flight.landAt?[flight]:[])];
 const won=new Set(landed.map(s=>outcomeForShot(s,count)));
 const popped=new Map(landed.map(s=>[balloonSlotForShot(s,count),s]));
 const labels=container.querySelector('.prize-labels'),ribbons=container.querySelector('.bouquet-ribbons');
 for(let i=0;i<balloonSlots(count).length;i++){
  const item=container.children[i],label=labels.children[i],old=popped.get(i),isHit=focused&&i===hit,used=round?.preset?.birthdayRule!==REPEAT_BALLOON_RULE&&won.has(Number(item.dataset.outcome))&&!old;
  const point=balloonPoint(i,count,isHit?shot.landAt:time,motion);
  const deformation=balloonDeformation(old?shotAge(old,time,balloonPopAt(old)):-Infinity,motion);let alpha=used?.2:deformation.alpha;
  if(focused&&!isHit)alpha*=.38;
  const gone=!!old&&time>=balloonPopAt(old);
  item.classList.toggle('is-hit-focus',isHit);item.classList.toggle('is-popped',gone);item.setAttribute('aria-hidden',String(gone||used));
  label.classList.toggle('is-used',used);label.classList.toggle('is-hit-focus',isHit);
  item.style.transform=`translate(${Math.round(point.x-44)}px,${Math.round(point.y-48)}px) scale(${deformation.x*point.scale},${deformation.y*point.scale})`;item.style.opacity=alpha;
  label.style.transform=`translate(${Math.round(point.x-44)}px,${Math.round(point.y-48)}px) scale(${point.scale})`;label.style.opacity=alpha;
  const knotY=point.y+point.scale*49,ribbon=ribbons.children[i];ribbon.setAttribute('d',`M${point.x} ${knotY} Q${point.x+(410-point.x)*.1} ${Math.max(knotY+10,372)} 410 386`);ribbon.style.opacity=alpha*.6;
 }
 const origin=shot?balloonPoint(hit,count,shot.landAt,motion):null;
 animateBalloonFX(container,shot,origin,time,palette[shot?outcomeForShot(shot,count)%palette.length:0],motion);
}

function buildPartyDecor(container){
 const ribbons=svgNode('svg',{viewBox:'0 0 540 400',class:'bouquet-ribbons','aria-hidden':'true'});
 for(const item of container.querySelectorAll('.prize-balloon'))ribbons.append(svgNode('path',{fill:'none',stroke:palette[Number(item.dataset.outcome)%palette.length],'stroke-width':1.5}));
 ribbons.append(svgNode('path',{d:'M410 386 l-10 -5 h-8 v9 h9 l9 -4 10 -5 h8 v9 h-9 l-9 -4 -5 10 m5 -10 6 12',fill:'#ff9dc9',stroke:'#311935','stroke-width':2}));container.append(ribbons);
 const decor=document.createElement('div');decor.className='party-decor';decor.setAttribute('aria-hidden','true');
 const svg=svgNode('svg',{viewBox:'0 0 540 540'});
 svg.append(svgNode('path',{d:'M12 6 Q140 26 270 8 Q400 28 528 6',fill:'none',stroke:'#301631','stroke-width':5}),svgNode('path',{d:'M12 6 Q140 26 270 8 Q400 28 528 6',fill:'none',stroke:'#ffe3a3','stroke-width':2}));
 for(let i=0;i<13;i++){const x=16+i*39,y=8+Math.sin((i%7)/6*Math.PI)*7;svg.append(svgNode('path',{d:`M${x} ${y} h30 v7 h-4 v6 h-4 v6 h-4 v5 h-6 v-5 h-4 v-6 h-4 v-6 h-4 Z`,fill:palette[i%palette.length],stroke:'#311935','stroke-width':2}));}
 const cake=birthdayCake(svgNode),gifts=birthdayGifts(svgNode);cake.setAttribute('transform','translate(188 362) scale(.85)');gifts.setAttribute('transform','translate(12 370)');svg.append(cake,gifts);
 for(const [i,x,y]of [[0,20,104],[1,233,116],[2,18,248],[3,246,274],[4,217,335],[5,520,92],[6,524,422]]){svg.append(svgNode('path',{d:`M${x} ${y-7} v5 h5 v4 h-5 v5 h-4 v-5 h-5 v-4 h5 v-5 Z`,fill:palette[i%palette.length],stroke:'#311935','stroke-width':1}));}
 for(const [x,y,color]of [[12,185,'#ffabe1'],[237,194,'#fff2ac'],[521,314,'#ddb5ff']])svg.append(svgNode('path',{d:`M${x} ${y} h9 v8 h-12 v9 h10 v8 h-6`,fill:'none',stroke:color,'stroke-width':4}));
 decor.append(svg);container.append(decor);
 const shower=document.createElement('div');shower.className='party-shower';shower.setAttribute('aria-hidden','true');
 for(let i=0;i<52;i++){const piece=document.createElement('i');piece.style.setProperty('--x',(18+(i*137)%504)+'px');piece.style.setProperty('--delay',((i%13)*.11)+'s');piece.style.setProperty('--drift',(((i*43)%44)-22)+'px');piece.style.background=palette[i%palette.length];shower.append(piece);}container.append(shower);
}
