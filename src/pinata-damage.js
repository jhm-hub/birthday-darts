import {clamp} from './pinata-motion.js';

export const DAMAGE_HITS=12;
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};

// Twelve distinct tears support the maximum round length without reusing the
// same two scratches. The centre jewel/letter stays clear until the final split.
const tears=[
 {main:'M49 105l-5 4 2 5-6 4 3 6-6 7 2 5',branch:'M45 110l-7-2-4 4-7-1M42 119l-8 2-3 5',curl:[38,128]},
 {main:'M31 86l4 5-4 5 3 5-6 5 3 6',branch:'M33 96l-8-2-4 5M30 106l-6 3 1 5',curl:[26,103]},
 {main:'M54 66l-4 6 2 5-4 6 3 5',branch:'M50 74l-7 1-4 5M49 82l-6 4-2 5',curl:[45,77]},
 {main:'M23 116l5 3-2 5 4 4-3 6',branch:'M27 123l9 1 3 5M29 128l-7 5',curl:[25,125]},
 {main:'M54 130l-5 3 2 5-5 4',branch:'M50 133l-8-3-4 3',curl:[47,137]},
 {main:'M40 98l5-5-2-5 5-4',branch:'M44 94l-7-4-2-5',curl:[39,91]}
];
export function damageArt(){
 return Array.from({length:DAMAGE_HITS},(_,i)=>{
  const spec=tears[Math.floor(i/2)],right=i%2===1,[x,y]=spec.curl;
  return `<g class="pina-damage-hit" data-hit="${i}" transform="${right?'translate(140 0) scale(-1 1)':'translate(0 0)'}" opacity="0">
   <g class="pina-tear-main"><path d="${spec.main}" pathLength="1" fill="none" stroke="#352039" stroke-width="4.5"/><path d="${spec.main}" pathLength="1" fill="none" stroke="#ffe1ca" stroke-width="3.1" transform="translate(-.8 -.6)"/><path d="${spec.main}" pathLength="1" fill="none" stroke="#4a213f" stroke-width="2.1"/></g>
   <g class="pina-tear-branches"><path d="${spec.branch}" pathLength="1" fill="none" stroke="#ffd1ca" stroke-width="2.8" transform="translate(-.4 -.4)"/><path d="${spec.branch}" pathLength="1" fill="none" stroke="#51243f" stroke-width="1.5"/></g>
   <g class="pina-paper-curl" style="transform-origin:${x}px ${y}px"><path d="M${x} ${y}l5-2 2 4-3 4-5-1z" fill="#6b304c"/><path d="M${x} ${y}l4-2 1 4-3 2-2-1z" fill="#d8729b"/><path d="M${x} ${y}l4-2-1 4-3 1z" fill="#ffdacb"/><path d="M${x-3} ${y+6}h2v2h-2zM${x+7} ${y-5}h2v1h-2z" fill="#b84f7b"/></g>
  </g>`;
 }).join('');
}

export function damagePose(round,time,index,quiet=false){
 const shot=round?.hits?.find(h=>h.index===index)??(round?.flight?.index===index?round.flight:null);
 if(!shot||time<shot.hitAt)return {opacity:0,main:0,branches:0,curl:0,angle:0};
 const age=time-shot.hitAt;
 return {opacity:1,main:quiet?1:smooth(age/220),branches:quiet?1:smooth((age-65)/265),
  curl:quiet?1:smooth((age-150)/220),angle:quiet?0:-14*Math.sin(clamp((age-140)/450)*Math.PI)};
}
