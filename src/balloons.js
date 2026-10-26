import {balloonDeck,dartsScore,goldAmount,BONUS_BALLOON_RULE} from './darts-bonuses.js';
import {balloonPopAt} from './balloon-timing.js';
import {shotAge} from './dart-timing.js';
import {balloonDeformation} from './motion.js';
import {buildBalloonFX,animateBalloonFX} from './balloon-fx.js';
import {balloonPixelLayers,balloonLabelPalette} from './balloon-art.js';
import {birthdayCake,birthdayGifts} from './party-props.js';
const palette=['#f28cbe','#baa0ec','#83d9bc','#efcd87','#8dc7ec','#dea2d5','#efb58f','#accc95'];
export {outcomeForShot,balloonSlots,balloonSlotForShot} from './balloon-slots.js';
import {outcomeForShot,balloonSlots,balloonSlotForShot} from './balloon-slots.js';
import {REPEAT_BALLOON_RULE} from './birthday-rules.js';
export {balloonPoint} from './darts-layout.js';
import {balloonPoint} from './darts-layout.js';
function svgNode(tag,attrs){const node=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value]of Object.entries(attrs))node.setAttribute(key,value);return node;}
function paintBalloon(item,color){const svg=item.querySelector('svg');svg.replaceChildren();for(const layer of balloonPixelLayers(color))svg.append(svgNode('path',layer));}
function paintLabel(label,color){for(const [key,value]of Object.entries(balloonLabelPalette(color)))label.style.setProperty('--label-'+key,value);}
function fitLabel(label){const text=label.querySelector('text');text.style.fontSize='26px';const width=text.getComputedTextLength(),size=width>67?26*67/width:26;text.style.fontSize=size+'px';text.setAttribute('y',50+size*.28);}
function labelValue(label,text,cash){const amount=label.querySelector('text');amount.replaceChildren();if(cash){const currency=svgNode('tspan',{class:'candy-currency'});currency.textContent='$';const digits=svgNode('tspan',{});digits.textContent=text.slice(1);amount.append(currency,digits);}else amount.textContent=text;fitLabel(label);}
export function buildBalloons(container,preset,money){
 const outcomes=preset.outcomes,deck=balloonDeck(preset);container._preset=preset;container._money=money;container._deck=deck;
 container.replaceChildren();
 const labels=document.createElement('div');labels.className='prize-labels';labels.setAttribute('aria-hidden','true');
 for(const descriptor of deck){
  const {slot:index,outcomeIndex,kind}=descriptor,outcome=outcomes[outcomeIndex],item=document.createElement('div');item.className='prize-balloon';item.dataset.index=index;item.dataset.outcome=outcomeIndex??'';item.dataset.kind=kind;
  const color=kind==='cash'?palette[outcomeIndex%palette.length]:kind==='multiply'?'#bca0f1':kind==='extra'?'#83dcc4':'#f5c968';item.dataset.color=color;
  const svg=svgNode('svg',{viewBox:'0 0 88 138','aria-hidden':'true'});item.append(svg);paintBalloon(item,color);
  const labelBox=document.createElement('div');labelBox.className='prize-label';labelBox.dataset.kind=kind;paintLabel(labelBox,color);
  const lettering=svgNode('svg',{viewBox:'0 0 88 138'}),amount=svgNode('text',{x:44,y:57,'text-anchor':'middle',class:'candy-amount'});
  lettering.append(amount);
  if(kind!=='cash'){const note=svgNode('text',{x:44,y:72,'text-anchor':'middle',class:'bonus-balloon-note'});note.textContent=kind==='multiply'?'TOTAL':kind==='extra'?'DART'+(preset.bonuses.extraDarts===1?'':'S'):'GOLD';lettering.append(note);}
  labelBox.append(lettering);labels.append(labelBox);container.append(item);
  item.setAttribute('aria-label',kind==='cash'?money(outcome.amountCents)+' balloon':kind==='multiply'?'Multiply the total by '+preset.bonuses.multiplier+' balloon':kind==='extra'?'Extra darts balloon':'Gold +'+preset.bonuses.goldPercent+' percent balloon');
  labelBox.dataset.value=kind==='cash'?money(outcome.amountCents):kind==='multiply'?'×'+preset.bonuses.multiplier:kind==='extra'?'+'+preset.bonuses.extraDarts:'+'+preset.bonuses.goldPercent+'%';
  labelValue(labelBox,labelBox.dataset.value,kind==='cash');
 }
 container.append(labels);
 // Measure the locally bundled face, so custom amounts and cents also fit.
 document.fonts.load('700 26px "Faith Candy"').then(()=>{if(labels.isConnected)for(const label of labels.children)fitLabel(label);});
 buildBalloonFX(container,palette);
 buildPartyDecor(container);
}
export function animateBalloons(container,round,count,time,motion=true){
 const flight=round?.flight,shot=flight&&time>=flight.releaseAt?flight:round?.throws.at(-1),hit=shot?balloonSlotForShot(shot,count):-1;
 const popAt=shot?balloonPopAt(shot):0,elapsed=shot?shotAge(shot,time,popAt):Infinity;
 const focused=!!shot&&time>=shot.releaseAt&&elapsed<1100;
 const landed=[...(round?.throws||[]),...(flight&&time>=flight.landAt?[flight]:[])];
 const visible=[...(round?.throws||[]),...(flight&&time>=balloonPopAt(flight)?[flight]:[])],score=dartsScore(container._preset,visible);
 const won=new Set(landed.map(s=>outcomeForShot(s,count)));
 const popped=new Map(landed.map(s=>[balloonSlotForShot(s,count),s]));
 const labels=container.querySelector('.prize-labels'),ribbons=container.querySelector('.bouquet-ribbons');
 for(let i=0;i<balloonSlots(count).length;i++){
  const item=container.children[i],label=labels.children[i],old=popped.get(i),isHit=focused&&i===hit,used=round?.preset?.birthdayRule!==REPEAT_BALLOON_RULE&&round?.preset?.birthdayRule!==BONUS_BALLOON_RULE&&won.has(Number(item.dataset.outcome))&&!old;
  const descriptor=container._deck[i];if(descriptor.kind==='cash'&&!old){const amount=goldAmount(container._preset.outcomes[descriptor.outcomeIndex].amountCents,score.goldStacks,container._preset.bonuses?.goldPercent??10),value=container._money(amount);if(label.dataset.value!==value){label.dataset.value=value;labelValue(label,value,true);item.setAttribute('aria-label',value+' gold balloon');}if(item.dataset.gold!==String(score.goldStacks)){item.dataset.gold=String(score.goldStacks);paintBalloon(item,score.goldStacks?'#f4c753':item.dataset.color);paintLabel(label,score.goldStacks?'#f4c753':item.dataset.color);item.classList.toggle('is-gold',score.goldStacks>0);label.classList.toggle('is-gold',score.goldStacks>0);}}
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
 animateBalloonFX(container,shot,origin,time,(shot&&container.children[hit]?.dataset.gold>0?'#f4c753':container.children[hit]?.dataset.color)||palette[0],motion);
}

function buildPartyDecor(container){
 const ribbons=svgNode('svg',{viewBox:'0 0 540 400',class:'bouquet-ribbons','aria-hidden':'true'});
 for(const item of container.querySelectorAll('.prize-balloon'))ribbons.append(svgNode('path',{fill:'none',stroke:item.dataset.color,'stroke-width':1.5}));
 ribbons.append(svgNode('path',{d:'M410 386 l-10 -5 h-8 v9 h9 l9 -4 10 -5 h8 v9 h-9 l-9 -4 -5 10 m5 -10 6 12',fill:'#ff9dc9',stroke:'#311935','stroke-width':2}));container.append(ribbons);
 const decor=document.createElement('div');decor.className='party-decor';decor.setAttribute('aria-hidden','true');
 const svg=svgNode('svg',{viewBox:'0 0 540 540'});
 svg.append(svgNode('path',{d:'M12 6 Q140 26 270 8 Q400 28 528 6',fill:'none',stroke:'#301631','stroke-width':5}),svgNode('path',{d:'M12 6 Q140 26 270 8 Q400 28 528 6',fill:'none',stroke:'#ffe3a3','stroke-width':2}));
 for(let i=0;i<13;i++){const x=16+i*39,y=8+Math.sin((i%7)/6*Math.PI)*7;svg.append(svgNode('path',{d:`M${x} ${y} h30 v7 h-4 v6 h-4 v6 h-4 v5 h-6 v-5 h-4 v-6 h-4 v-6 h-4 Z`,fill:palette[i%palette.length],stroke:'#311935','stroke-width':2}));}
 const cake=birthdayCake(svgNode),gifts=birthdayGifts(svgNode);cake.setAttribute('transform','translate(300 377) scale(.8)');gifts.setAttribute('transform','translate(228 385) scale(.82)');svg.append(cake,gifts);
 for(const [i,x,y]of [[0,20,104],[1,233,116],[2,18,248],[3,246,274],[4,217,335],[5,520,92],[6,524,422]]){svg.append(svgNode('path',{d:`M${x} ${y-7} v5 h5 v4 h-5 v5 h-4 v-5 h-5 v-4 h5 v-5 Z`,fill:palette[i%palette.length],stroke:'#311935','stroke-width':1}));}
 for(const [x,y,color]of [[12,185,'#ffabe1'],[237,194,'#fff2ac'],[521,314,'#ddb5ff']])svg.append(svgNode('path',{d:`M${x} ${y} h9 v8 h-12 v9 h10 v8 h-6`,fill:'none',stroke:color,'stroke-width':4}));
 decor.append(svg);container.append(decor);
 const shower=document.createElement('div');shower.className='party-shower';shower.setAttribute('aria-hidden','true');
 for(let i=0;i<52;i++){const piece=document.createElement('i');piece.style.setProperty('--x',(18+(i*137)%504)+'px');piece.style.setProperty('--delay',((i%13)*.11)+'s');piece.style.setProperty('--drift',(((i*43)%44)-22)+'px');piece.style.background=palette[i%palette.length];shower.append(piece);}container.append(shower);
}
