import {artworkBox} from './centre-artwork.js';
import {CONCEPTS,labAngles,specialName} from './wheel-lab-game.js';
import {wheelLayout} from './double-wheel/model.js';
import {labDiscs,labLabelMetrics} from './wheel-lab-style.js';
const NS='http://www.w3.org/2000/svg';
function node(name,attrs={},text){const el=document.createElementNS(NS,name);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));if(text!==undefined)el.textContent=text;return el;}
const point=(r,a)=>[300+r*Math.cos(a*Math.PI/180),300+r*Math.sin(a*Math.PI/180)];
function wedge(inner,outer,a,b){return `M ${point(outer,a)} A ${outer} ${outer} 0 ${b-a>180?1:0} 1 ${point(outer,b)} L ${point(inner,b)} A ${inner} ${inner} 0 ${b-a>180?1:0} 0 ${point(inner,a)} Z`;}
const brightness=hex=>{const ns=hex.slice(1).match(/../g).map(n=>parseInt(n,16));return ns[0]*.299+ns[1]*.587+ns[2]*.114;};
export function createLabView(host){
 let config,signature='',rotors=[],cover,coverPointer,svg;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function set(c,run){
  const key=JSON.stringify([c, c.kind==='climb'?(run?.tier??0):0]);if(key===signature){draw(run);return;}signature=key;config=c;rotors=[];
  svg=node('svg',{viewBox:'0 0 600 600',role:'img','aria-label':CONCEPTS[c.kind].name+' wheel. Landed numbers appear in the result below.'});
  svg.style.fontFamily='"'+c.font+'", Nunito, sans-serif';
  svg.append(node('circle',{cx:300,cy:300,r:285,fill:c.rim,stroke:'#F2C98E','stroke-width':2}));
  for(let i=0;i<48;i++){const [cx,cy]=point(281,i*7.5);svg.append(node('circle',{cx,cy,r:1.6,fill:'#FFE6AD',opacity:.75}));}
  const discs=labDiscs(c.kind,run?.tier??0);
  const pointers=[];cover=null;
  for(const [side,inner,outer] of discs){
   const w=c.wheels[side],group=node('g',{'data-ring':side}),paths=[];
   svg.append(node('circle',{cx:300,cy:300,r:outer+3,fill:c.rim,stroke:'#F3CDE8','stroke-width':2}));
   for(const [i,slice] of wheelLayout(w.values).entries()){
    const a=slice.startTurn*360,b=a+slice.sizeTurn*360,mid=(a+b)/2,special=c.enabled&&w.specials.includes(i),color=special?c.special:w.colors[i%2],label=special?specialName(c.kind):String(w.values[i]);
    const path=node('path',{d:wedge(inner,outer,a,b),fill:color,stroke:c.rim,'stroke-width':1.5});paths.push(path);group.append(path);
    const hasBase=special&&c.kind==='crowns',metrics=labLabelMetrics(inner,outer,w.values.length,label,hasBase),[x,y]=point(metrics.radius,mid),size=metrics.size;
    const labelGroup=node('g',{transform:`translate(${x} ${y}) rotate(${mid})`,fill:brightness(color)>155?'#41204B':c.text});
    const labelAttrs={x:0,'text-anchor':'middle','dominant-baseline':'central','font-weight':650,'data-fit-width':metrics.width};
    labelGroup.append(node('text',{...labelAttrs,y:hasBase?-size*.5:0,'font-size':size,'data-fit-size':size},label));
    if(hasBase)labelGroup.append(node('text',{...labelAttrs,y:size*.65,'font-size':size*.82,'data-fit-size':size*.82},'+'+w.values[i]));
    group.append(labelGroup);
   }
   svg.append(group);rotors.push({side,group,paths});
   svg.append(node('circle',{cx:300,cy:300,r:inner-1,fill:'#261230',stroke:c.rim,'stroke-width':3}));
   const pointer=node('g',{'data-pointer':side,transform:`translate(${306+outer} 300) scale(.7)`});
   pointer.append(node('path',{d:'M-21 0 5-15 24-10 24 10 5 15Z',fill:c.pointer,stroke:c.rim,'stroke-width':3,'stroke-linejoin':'round'}));
   pointer.append(node('path',{d:'M-21 0 5-15 7 0Z',fill:'#FFFFFF',opacity:.5}),node('path',{d:'M-21 0 7 0 5 15Z',fill:'#582764',opacity:.35}),node('path',{d:'M7 0 24-10 24 10Z',fill:'#FFFFFF',opacity:.2}));pointers.push(pointer);
  }
  if(c.kind==='crowns'){
   cover=node('g',{class:'goddess-cover'});cover.append(node('circle',{cx:300,cy:300,r:184,fill:'#2C1539',stroke:'#7F4E89','stroke-width':3}));
   cover.append(node('path',{d:'M260 202l15 12 25-29 25 29 15-12-10 39h-60Z',fill:'#E9BD78'}));
   cover.append(node('text',{x:300,y:389,'text-anchor':'middle',fill:'#F3CDE8','font-size':20,'font-weight':600},'GODDESS WHEEL'));
   cover.append(node('text',{x:300,y:413,'text-anchor':'middle',fill:'#C1A8C8','font-size':13},c.enabled?'COLLECT '+c.crownTarget+' CROWNS':'BONUS OFF'));svg.append(cover);coverPointer=pointers[1];
  }
  svg.append(...pointers);
  svg.append(node('circle',{cx:300,cy:300,r:73,fill:'#271331',stroke:'#F3CDE8','stroke-width':3}),node('circle',{cx:300,cy:300,r:69,fill:'none',stroke:'#E9BD78','stroke-width':1,opacity:.75}));
  const art=c.artwork.kind==='sample'?'./demo-assets/faith-wheel-badge-v1.png':c.artwork.kind==='upload'?c.artwork.png:null;
  if(art){const box=artworkBox(c.diameter,c);svg.append(node('image',{'data-centre-art':'',href:art,x:300+box.x-box.size/2,y:300+box.y-box.size/2,width:box.size,height:box.size}));}
  else svg.append(node('text',{x:300,y:304,'text-anchor':'middle','dominant-baseline':'central',fill:'#F6C9DE','font-size':22,'font-weight':650},'FAITH'));
  host.replaceChildren(svg);fitLabels();draw(run);
 }
 function fitLabels(){if(!svg)return;for(const label of svg.querySelectorAll('[data-fit-width]')){const size=Number(label.dataset.fitSize),width=Number(label.dataset.fitWidth);label.setAttribute('font-size',size);const measured=label.getComputedTextLength();if(measured>width)label.setAttribute('font-size',size*width/measured);}}
 function draw(run,now=Date.now()){
  if(!config)return;const angles=run?labAngles(run,now,reduced.matches):config.wheels.map(w=>-180/w.values.length);
  for(const rotor of rotors){rotor.group.setAttribute('transform',`rotate(${angles[rotor.side]} 300 300)`);rotor.group.classList.toggle('ring-locked',!!run?.locked[rotor.side]&&config.kind==='stack');
   rotor.paths.forEach((p,i)=>p.classList.toggle('landed',run?.picks[rotor.side]?.index===i&&(run.phase!=='spinning'||config.kind==='stack'&&run.locked[rotor.side])));
  }
  if(cover){const open=run?.bonusTaken||run?.phase==='readyBonus'||run?.flight?.bonus;cover.classList.toggle('open',!!open);coverPointer.style.opacity=open?'1':'0';}
 }
 return {set,draw,fitLabels};
}
