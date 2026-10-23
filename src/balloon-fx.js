import {balloonPixelLayers} from './balloon-art.js';
import {popCel,fragmentMotion,confettiMotion} from './motion.js';
import {BALLOON_BURST_MS} from './balloon-timing.js';
import {shotAge} from './dart-timing.js';

const svg=(tag,attrs={})=>{const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value]of Object.entries(attrs))el.setAttribute(key,value);return el;};
// Eight drawn, stepped cels: pinprick, rupture, open burst, departing sparks.
const cels=[
 'M-4-18h8v12h8v8H4v12h-8V2h-8v-8h8z',
 'M-4-26h8v14h6v6h16v8H10v6H4v18h-8V8h-6V2h-16v-8h16v-6h6z',
 'M-4-34h8v16h4v8h10v6h16v8H18v6H8v8H4v16h-8V18h-4v-8h-10V4h-16v-8h16v-6h10v-8h4z',
 'M-4-40h8v14h-8z M-4 26h8v14h-8z M-40-4h14v8h-14z M26-4h14v8H26z M-22-22h8v8h-8z M14-22h8v8h-8z M14 14h8v8h-8z M-22 14h8v8h-8z',
 'M-2-46h4v12h-4z M-2 34h4v12h-4z M-46-2h12v4h-12z M34-2h12v4H34z M-28-28h8v4h-4v4h-4z M20-28h8v8h-4v-4h-4z M24 20h4v8h-8v-4h4z M-28 20h4v4h4v4h-8z',
 'M-2-50h4v8h-4z M-2 42h4v8h-4z M-50-2h8v4h-8z M42-2h8v4h-8z M-32-32h6v6h-6z M26-32h6v6h-6z M26 26h6v6h-6z M-32 26h6v6h-6z',
 'M-2-54h4v4h-4z M-2 50h4v4h-4z M-54-2h4v4h-4z M50-2h4v4h-4z M-34-34h4v4h-4z M30-34h4v4h-4z M30 30h4v4h-4z M-34 30h4v4h-4z',
 'M-2-56h2v2h-2z M0 54h2v2H0z M-56 0h2v2h-2z M54-2h2v2h-2z M-36-36h2v2h-2z M34-36h2v2h-2z M34 34h2v2h-2z M-36 34h2v2h-2z'
];

export function buildBalloonFX(container,palette){
 const root=document.createElement('div');root.className='balloon-burst';root.setAttribute('aria-hidden','true');
 const art=svg('svg',{viewBox:'-96 -96 192 192',class:'pop-art'}),defs=svg('defs'),body=svg('g',{id:'pop-balloon-art'});
 defs.append(body);art.append(defs);
 for(let i=0;i<8;i++){
  const angle=-Math.PI/2+i*Math.PI/4,edge=angle-Math.PI/8,end=angle+Math.PI/8;
  const clip=svg('clipPath',{id:'pop-shard-'+i});
  // Jagged inner tears leave curved rubber scraps, not eight solid pie wedges.
  const inner=15+(i%3)*4,points=[[edge,140],[end,140],[end,inner+5],[angle+.16,inner+1],[angle+.05,inner+7],[angle-.1,inner-3],[edge,inner+2]];
  const contour=points.map(([a,r])=>[Math.round((44+r*Math.cos(a))/2)*2,Math.round((48+r*Math.sin(a))/2)*2].join(' '));
  clip.append(svg('path',{d:'M'+contour.join(' L')+'Z'}));defs.append(clip);
  const shard=svg('g',{class:'pop-shard'}),cut=svg('g',{'clip-path':`url(#pop-shard-${i})`});
  cut.append(svg('use',{href:'#pop-balloon-art'}));shard.append(cut);art.append(shard);
 }
 const spark=svg('path',{class:'pop-cel',fill:'#fff1c4',stroke:'#a65c71','stroke-width':2,'stroke-linejoin':'miter'});art.append(spark);root.append(art);
 const confetti=document.createElement('div');confetti.className='pop-confetti';
 for(let i=0;i<24;i++){const piece=document.createElement('i');piece.style.background=palette[i%palette.length];confetti.append(piece);}root.append(confetti);container.append(root);
 const impact=svg('svg',{viewBox:'-28 -28 56 56',class:'balloon-impact','aria-hidden':'true'});
 impact.append(svg('path',{d:'M-3-24h6v8h-6z M-3 16h6v8h-6z M-24-3h8v6h-8z M16-3h8v6h-8z',fill:'#fff0ce',stroke:'#74455c','stroke-width':2}));container.append(impact);
 return root;
}

export function animateBalloonFX(container,shot,origin,time,color,motion){
 const root=container.querySelector('.balloon-burst'),impact=container.querySelector('.balloon-impact');
 const age=shot?shotAge(shot,time,shot.popAt??shot.landAt):Infinity,hitAge=shot?shotAge(shot,time,shot.landAt):Infinity;
 const impacting=hitAge>=0&&hitAge<180&&age<0;
 impact.style.display=impacting?'block':'none';
 if(impacting){impact.style.left=origin.x-28+'px';impact.style.top=origin.y-28+'px';impact.style.opacity=1-hitAge/180;impact.style.transform=`scale(${motion?1+hitAge/240:1})`;}
 const active=age>=0&&age<BALLOON_BURST_MS;root.style.display=active?'block':'none';
 if(!active)return;
 root.style.left=Math.round(origin.x)+'px';root.style.top=Math.round(origin.y)+'px';
 if(root.dataset.color!==color){root.dataset.color=color;root.querySelector('#pop-balloon-art').replaceChildren(...balloonPixelLayers(color).map(layer=>svg('path',layer)));}
 for(const [i,shard]of [...root.querySelectorAll('.pop-shard')].entries()){
  const p=fragmentMotion(i,age,motion),angle=-Math.PI/2+i*Math.PI/4;
  const px=Math.cos(angle)*30,py=Math.sin(angle)*34,s=origin.scale*1.085;
  shard.setAttribute('transform',`translate(${Math.round(p.x)} ${Math.round(p.y)}) scale(${s}) translate(${px} ${py}) rotate(${p.turn}) scale(${p.scale}) translate(${-44-px} ${-48-py})`);
  shard.style.opacity=p.alpha;
 }
 const cel=popCel(age,motion),spark=root.querySelector('.pop-cel');root.dataset.cel=cel;
 spark.style.display=cel<0?'none':'';if(cel>=0)spark.setAttribute('d',cels[cel]);
 for(const [i,piece]of [...root.querySelector('.pop-confetti').children].entries()){
  const p=confettiMotion(i,age,motion);piece.style.transform=`translate(${Math.round(p.x)}px,${Math.round(p.y)}px) rotate(${p.turn}deg) scaleX(${p.flip})`;piece.style.opacity=p.alpha;
 }
}
