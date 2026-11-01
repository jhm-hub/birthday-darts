import {clamp} from './pinata-motion.js';
import {CASH_RESOLVE_SECONDS,MULTIPLIER_RESOLVE_SECONDS,EXTRA_REPEAT_SECONDS,ENCORE_CATCH_SECONDS,rewardBeat} from './pinata-reward-timing.js';

export const JACKPOT_PARTICLES=32,JACKPOT_LIGHTS=14;
const smooth=x=>{const p=clamp(x);return p*p*(3-2*p);};
const out=x=>1-(1-clamp(x))**3;
const pulse=(t,rise,fall)=>smooth((t+rise)/rise)*(1-smooth(t/fall));
export const jackpotBeat=kind=>rewardBeat(kind==='multiply'?MULTIPLIER_RESOLVE_SECONDS:kind==='extra'?ENCORE_CATCH_SECONDS:CASH_RESOLVE_SECONDS);
const supported=kind=>['cash','multiply','extra'].includes(kind);

// One compact payoff, sampled from the original reward's clock. Coin tails
// continue into the next wind-up using the same handoff as the reward label.
export function jackpotPose(kind,after,quiet=false){
 if(quiet||!supported(kind))return {opacity:0,scale:1,y:0};
 const t=after-jackpotBeat(kind),end=kind==='extra'?390:kind==='multiply'?480:440,enter=out((t+60)/100);
 return {opacity:smooth((t+60)/70)*(1-smooth((t-end+180)/180)),scale:.94+.06*enter+.045*pulse(t,30,170),y:4*(1-enter)-2*pulse(t,30,170)};
}
export function jackpotLightPose(i,kind,after,quiet=false){
 if(quiet||i<0||i>=JACKPOT_LIGHTS||!supported(kind))return 0;
 return .7+.3*pulse(after-jackpotBeat(kind)-Math.floor(i/2)*20,24,150);
}
export function jackpotParticleSpec(i,kind){
 return {size:i%4===3?12:(kind==='cash'?16:18)+Math.floor(i/2)%3*2,coin:i%4!==3};
}
export function jackpotParticlePose(i,kind,after,quiet=false){
 const off={x:0,y:0,angle:0,flip:1,opacity:0};
 if(quiet||!supported(kind)||i<0||i>=JACKPOT_PARTICLES||(kind==='cash'&&i>=20))return off;
 const row=Math.floor(i/2),side=i%2?1:-1,earlyEncore=kind==='extra'&&i<16;
 const at=earlyEncore?rewardBeat(EXTRA_REPEAT_SECONDS):jackpotBeat(kind);
 const start=at+(kind==='cash'?row*9:row%8*11);
 const life=kind==='cash'?500:kind==='multiply'?450:earlyEncore?400:330;
 const p=(after-start)/life;if(p<=0||p>=1)return off;
 const size=jackpotParticleSpec(i,kind).size,reach=68+(row*5%7)*8,lift=88+row%3*14;
 const x=210+side*(32+row%3*12+reach*(1-(1-p)**2)),y=278-row%4*10-4*lift*p*(1-p)+4*p;
 return {x:Math.round(x-size/2),y:Math.round(y-size/2),angle:side*(row%4*18+p*120),
  flip:.28+.72*Math.abs(Math.cos(Math.PI*(p*2.3+row*.19))),
  opacity:smooth(p/.07)*(1-smooth((p-.55)/.45))};
}

// Open stepped gold wings, with room for the crown and its reward text.
export function jackpotFrameArt(){
 const points=[[40,6],[24,24],[10,48],[2,76],[2,104],[12,130],[30,150]];
 const rail='M50 4H38V12H28V24H18V40H10V58H6V104H12V124H22V140H36V152H50';
 const wing=`<path d="${rail}" fill="none" stroke="#63314b" stroke-width="7"/><path d="${rail}" fill="none" stroke="#e9b55f" stroke-width="4"/><path d="${rail}" fill="none" stroke="#fff1c1" stroke-width="1"/>`;
 const lights=points.map(([x,y],i)=>[x,280-x-8].map(px=>`<g class="pina-jackpot-light"><path d="M${px} ${y}h8v8h-8z" fill="#784353"/><path d="M${px+1} ${y+1}h6v6h-6z" fill="${i%2?'#ffc4dd':'#ffe4a1'}"/><path d="M${px+1} ${y+1}h4v2h-4z" fill="#fff8d9"/></g>`).join('')).join('');
 return `<svg viewBox="0 0 280 170" shape-rendering="crispEdges" aria-hidden="true">${wing}<g transform="translate(280 0) scale(-1 1)">${wing}</g>${lights}</svg>`;
}
