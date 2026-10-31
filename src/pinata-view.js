import {crownPinata,pinataBat,littleCrown} from './pinata-art.js';
import {projectedPinata,pinataTotal,rewardCopy,money,CLEAR_MS} from './pinata-game.js';
let sequence=0;const clamp=x=>Math.max(0,Math.min(1,x));
export function createPinataView(root,{audio=null,preview=false}={}){
 const id='pinata-art-'+(++sequence);root.innerHTML=`<section class="pinata-stage" aria-label="Piñata Party"><header class="pina-heading"><span class="pina-kicker">FAITH’S BIRTHDAY</span><strong>PIÑATA PARTY</strong></header><div class="pina-meta"><span class="pina-viewer"></span><span class="pina-count"></span></div><div class="pina-hanging">${crownPinata(id)}</div><div class="pina-bat">${pinataBat()}</div><div class="pina-impact" aria-hidden="true">✦</div><div class="pina-particles" aria-hidden="true">${Array.from({length:72},(_,i)=>`<i style="--c:${['#ffd48e','#ffb3da','#b4eadd','#d9bdff','#a5e4ff'][i%5]};width:${i%4===0?10:5}px;height:${i%4===0?6:9}px"></i>`).join('')}</div><div class="pina-reward" aria-live="polite"><strong></strong><small></small></div><div class="pina-idle">A LITTLE CHAOS. A LOT OF CANDY.</div><footer class="pina-footer"><div><small>COLLECTED</small><strong class="pina-cash"></strong></div><div><small>MULTIPLIER</small><strong class="pina-mult"></strong></div><div><small>TOTAL SO FAR</small><strong class="pina-bank"></strong></div></footer><div class="pina-finale">${littleCrown()}<small class="pina-final-title">SPOILED AGAIN.</small><strong></strong><p></p></div></section>`;
 const $=s=>root.querySelector(s),stage=$('.pinata-stage'),hang=$('.pina-hanging'),halves=[...root.querySelectorAll('.pina-half')],particles=[...root.querySelectorAll('.pina-particles i')],reduced=matchMedia('(prefers-reduced-motion:reduce)');let snapshot=null,offset=0,visible=true,frame,lastText='';
 const fit=()=>{const s=Math.min(root.clientWidth/420,root.clientHeight/460);stage.style.transform=`translate(-50%,-50%) scale(${s})`;};const resize=new ResizeObserver(fit);resize.observe(root);fit();
 function render(){
  const time=Date.now()+offset,r=snapshot?.round,show=visible&&(preview||!!r),opacity=r?.hideAt?1-clamp((time-r.hideAt)/CLEAR_MS):1;stage.style.opacity=show?opacity:0;stage.setAttribute('aria-hidden',String(!show||opacity<=0));
  if(show){
   const shot=r?.flight??r?.hits.at(-1),shown=projectedPinata(r,time),elapsed=shot?time-shot.startAt:-1,after=shot?time-shot.hitAt:-1,final=!!r&&(r.flight?r.remaining===1&&shot.prize.kind!=='extra':r.remaining===0),burst=final&&after>=140,finalAge=r?.completedAt!==null&&r?time-r.completedAt:-1,celebrate=finalAge>=100;
   const damage=Math.min(shown?.hits.length??0,2),shake=after>=0&&after<950&&!reduced.matches?Math.sin(after/65)*Math.exp(-after/300):0,sway=reduced.matches?0:Math.sin(time/940)*1.5;
   hang.style.transform=`translate(${Math.round(shake*9)}px,${Math.round(Math.abs(shake)*3)}px) rotate(${burst?0:sway+shake*8+damage*1.2}deg)`;
   const breakProgress=burst?clamp((after-140)/760):0;
   halves.forEach((el,i)=>{const d=i?1:-1;el.style.transform=burst&&!reduced.matches?`translate(${d*breakProgress*52}px,${breakProgress*45}px) rotate(${d*breakProgress*48}deg)`:'none';el.style.opacity=burst?1-breakProgress:1;});
   $('.pina-crack.one').style.opacity=damage>=1&&!burst?1:0;$('.pina-crack.two').style.opacity=damage>=2&&!burst?1:0;
   $('.pina-rope').style.opacity=celebrate ? .3 : 1;
   const bat=$('.pina-bat');let angle=-62,x=0;
   if(elapsed>=0&&elapsed<480){const p=elapsed/480;angle=p<.35?-62-p*65:-85+((p-.35)/.65)**2*77;x=p<.35?-p*18:(p-.35)/.65*42;}
   else if(elapsed>=480){const p=clamp((elapsed-480)/620);angle=-8-p*55;x=42*(1-p);}
   bat.style.opacity=!reduced.matches&&elapsed>=0&&elapsed<1150?1:0;bat.style.transform=`translateX(${Math.round(x)}px) rotate(${angle}deg)`;
   const impact=$('.pina-impact'),flash=after>=0&&after<240&&!reduced.matches;impact.style.opacity=flash?1-clamp(after/240):0;impact.style.transform=`scale(${1+clamp(after/240)*.65}) rotate(12deg)`;
   const particleTime=burst?after-140:after;particles.forEach((p,i)=>{const max=burst?72:16,t=(particleTime-(i%8)*16)/1000,on=!reduced.matches&&i<max&&t>=0&&t<1.6; p.style.opacity=on?1-clamp((t-.65)/.95):0;if(on){const a=i*2.399,force=burst?125:70,vx=Math.cos(a)*(force+i%6*9),vy=Math.sin(a)*(force*.8)-80;p.style.transform=`translate(${Math.round(vx*t)}px,${Math.round(vy*t+125*t*t)}px) rotate(${Math.round(i*30+t*(i%2?260:-220))}deg)`;}});
   const reward=$('.pina-reward'),reveal=shot&&after>=120&&!celebrate;reward.style.opacity=reveal?1:0;reward.setAttribute('aria-hidden',String(!reveal));reward.style.transform=reduced.matches?'none':`translateY(${Math.round((1-clamp((after-120)/200))*12)}px) scale(${1+Math.sin(clamp((after-120)/350)*Math.PI)*.08})`;
   $('.pina-idle').style.opacity=r?0:1;$('.pina-idle').setAttribute('aria-hidden',String(!!r));
   $('.pina-footer').style.opacity=celebrate?0:1;$('.pina-footer').setAttribute('aria-hidden',String(celebrate));
   const finale=$('.pina-finale');finale.setAttribute('aria-hidden',String(!celebrate));finale.style.opacity=celebrate?clamp((finalAge-100)/200):0;finale.style.transform=reduced.matches?'none':`translateY(${Math.round((1-clamp((finalAge-100)/350))*9)}px)`;
   const key=JSON.stringify([snapshot?.widget?.swings,r?.id,shown?.cashCents,shown?.multiplier,shown?.remaining,shot?.id,celebrate,!!reveal]);
   if(key!==lastText){lastText=key;$('.pina-viewer').textContent=r?.viewer||'Birthday VIP';$('.pina-count').textContent=r?(shown.remaining?shown.remaining+' SWING'+(shown.remaining===1?'':'S')+' LEFT':'ROUND COMPLETE'):(snapshot?.widget?.swings??3)+' SWING'+((snapshot?.widget?.swings??3)===1?'':'S');$('.pina-cash').textContent=money(shown?.cashCents??0);$('.pina-mult').textContent='×'+(shown?.multiplier??1);$('.pina-bank').textContent=money(pinataTotal(shown));
    if(reveal){const copy=rewardCopy(shot.prize);reward.dataset.kind=shot.prize.kind;reward.querySelector('strong').textContent=shot.prize.kind==='cash'?money(Math.round(shot.prize.value*100)):copy.main;reward.querySelector('small').textContent=copy.detail;}else{reward.querySelector('strong').textContent='';reward.querySelector('small').textContent='';}
    finale.querySelector('strong').textContent=money(pinataTotal(shown));finale.querySelector('p').textContent=money(shown?.cashCents??0)+' collected × '+(shown?.multiplier??1);
    for(const [sel,max,width] of [['.pina-bank',34,130],['.pina-cash',25,100],['.pina-mult',25,76],['.pina-finale>strong',74,360],['.pina-reward>strong',48,360],['.pina-finale p',17,360]]){const el=$(sel);el.style.fontSize=Math.min(max,width/(Math.max(1,el.textContent.length)*.62))+'px';}
   }
   audio?.update(r,time);
  }
  frame=requestAnimationFrame(render);
 }
 frame=requestAnimationFrame(render);
 return {update(s,{show=true}={}){snapshot=s;offset=s.serverNow-Date.now();visible=show;},dispose(){cancelAnimationFrame(frame);resize.disconnect();root.replaceChildren();}};
}
