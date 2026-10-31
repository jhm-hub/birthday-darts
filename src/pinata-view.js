import {crownPinata,pinataBat,littleCrown,candySprite,swingTrail} from './pinata-art.js';
import {projectedPinata,pinataTotal,rewardCopy,money,CLEAR_MS} from './pinata-game.js';
import {PARTICLE_COUNT,BREAK_DELAY,batPose,crownPose,breakPose,particleSpec,particlePose,clamp} from './pinata-motion.js';
let sequence=0;
export function createPinataView(root,{audio=null,preview=false,clock=Date.now,quiet=null}={}){
 const id='pinata-art-'+(++sequence);root.innerHTML=`<section class="pinata-stage" aria-label="Piñata Party"><header class="pina-heading"><span class="pina-kicker">FAITH’S BIRTHDAY</span><strong>PIÑATA PARTY</strong></header><div class="pina-meta"><span class="pina-viewer"></span><span class="pina-count"></span></div><div class="pina-hanging">${crownPinata(id)}</div><div class="pina-swish">${swingTrail()}</div><div class="pina-bat">${pinataBat()}</div><div class="pina-impact" aria-hidden="true"><svg viewBox="0 0 50 50" shape-rendering="crispEdges"><path d="M23 0h6v14h7v-7h6v13h8v7H36v8h6v6H29v9h-7V36h-8v6H7V29H0v-7h14v-8H7V7h13V0z" fill="#b96594"/><path d="M24 5h3v14h7v-5h3v9h8v3H31v8h5v3h-9v8h-3V31h-8v5h-3v-9H5v-3h14v-8h-5v-3h10z" fill="#fff1b1"/><path d="M22 19h8v11h-11v-8h3z" fill="#fff9e8"/></svg></div><div class="pina-particles" aria-hidden="true">${Array.from({length:PARTICLE_COUNT},(_,i)=>{const p=particleSpec(i);return `<i class="${p.candy?'candy':p.star?'star':'paper'}" style="--c:${['#ffd48e','#ffb3da','#b4eadd','#d9bdff','#a5e4ff'][i%5]};width:${p.width}px;height:${p.height}px">${p.candy?candySprite(i):''}</i>`;}).join('')}</div><div class="pina-reward" aria-live="polite"><strong></strong><small></small></div><div class="pina-idle">A LITTLE CHAOS. A LOT OF CANDY.</div><footer class="pina-footer"><div><small>COLLECTED</small><strong class="pina-cash"></strong></div><div><small>MULTIPLIER</small><strong class="pina-mult"></strong></div><div><small>TOTAL SO FAR</small><strong class="pina-bank"></strong></div></footer><div class="pina-finale">${littleCrown()}<small class="pina-final-title">SPOILED AGAIN.</small><strong></strong><p></p></div></section>`;
 const $=s=>root.querySelector(s),stage=$('.pinata-stage'),hang=$('.pina-hanging'),halves=[...root.querySelectorAll('.pina-half')],particles=[...root.querySelectorAll('.pina-particles i')],reduced=matchMedia('(prefers-reduced-motion:reduce)');let snapshot=null,offset=0,visible=true,frame,lastText='';
 const fit=()=>{const s=Math.min(root.clientWidth/420,root.clientHeight/460);stage.style.transform=`translate(-50%,-50%) scale(${s})`;};const resize=new ResizeObserver(fit);resize.observe(root);fit();
 function render(){
  const time=clock()+offset,r=snapshot?.round,show=visible&&(preview||!!r),opacity=r?.hideAt?1-clamp((time-r.hideAt)/CLEAR_MS):1;stage.style.opacity=show?opacity:0;stage.setAttribute('aria-hidden',String(!show||opacity<=0));
  if(show){
   const still=quiet===null?reduced.matches:quiet();
   const shot=r?.flight??r?.hits.at(-1),shown=projectedPinata(r,time),elapsed=shot?time-shot.startAt:-1,after=shot?time-shot.hitAt:-1,final=!!r&&(r.flight?r.remaining===1&&shot.prize.kind!=='extra':r.remaining===0),burst=final&&after>=BREAK_DELAY,finalAge=r?.completedAt!==null&&r?time-r.completedAt:-1,celebrate=finalAge>=100;
   const damage=Math.min(shown?.hits.length??0,2),motion=crownPose(after,still),sway=still?0:Math.sin(time/940)*1.25;
   hang.style.transform=`translate(${Math.round(motion.x)}px,${Math.round(motion.y)}px) rotate(${sway+motion.angle*(burst?1-clamp((after-BREAK_DELAY)/400):1)}deg)`;
   $('.pina-paper').style.transform=`scale(${1+motion.squash},${1-motion.squash})`;
   $('.pina-tassels').style.transform=`rotate(${motion.tassel*.35}deg)`;
   const fracture=burst?breakPose(after,still):{x:0,y:0,angle:0,opacity:1,seam:0};
   halves.forEach((el,i)=>{const d=i?1:-1;el.style.transform=`translate(${d*fracture.x}px,${fracture.y}px) rotate(${d*fracture.angle}deg)`;el.style.opacity=fracture.opacity;});
   $('.pina-seam').style.opacity=fracture.seam;
   $('.pina-crack.one').style.opacity=damage>=1&&!burst?1:0;$('.pina-crack.two').style.opacity=damage>=2&&!burst?1:0;
   $('.pina-gleam').style.opacity=burst?0:motion.glint;
   $('.pina-rope').style.opacity=celebrate ? .3 : 1;
   const pose=batPose(elapsed,still),bat=$('.pina-bat');
   bat.style.opacity=pose.opacity;bat.style.transform=`translate(${pose.x}px,${pose.y}px) rotate(${pose.angle}deg)`;
   $('.pina-swish').style.opacity=pose.trail*.6;
   const impact=$('.pina-impact'),flash=after>=0&&after<200&&!still;impact.style.opacity=flash?1-clamp((after-40)/160):0;impact.style.transform=`scale(${.72+clamp(after/200)*.5}) rotate(-9deg)`;
   particles.forEach((p,i)=>{const v=particlePose(i,after,{breaking:final,quiet:still});p.style.opacity=v.opacity;if(v.opacity>0)p.style.transform=`translate(${v.x}px,${v.y}px) rotate(${v.angle}deg) scaleX(${v.flip})`;});
   const reward=$('.pina-reward'),reveal=shot&&after>=120&&!celebrate;reward.style.opacity=reveal?1:0;reward.setAttribute('aria-hidden',String(!reveal));reward.style.transform=still?'none':`translateY(${Math.round((1-clamp((after-120)/200))*12)}px) scale(${1+Math.sin(clamp((after-120)/350)*Math.PI)*.08})`;
   $('.pina-idle').style.opacity=r?0:1;$('.pina-idle').setAttribute('aria-hidden',String(!!r));
   $('.pina-footer').style.opacity=celebrate?0:1;$('.pina-footer').setAttribute('aria-hidden',String(celebrate));
   const finale=$('.pina-finale');finale.setAttribute('aria-hidden',String(!celebrate));finale.style.opacity=celebrate?clamp((finalAge-100)/200):0;finale.style.transform=still?'none':`translateY(${Math.round((1-clamp((finalAge-100)/350))*9)}px)`;
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
 return {update(s,{show=true}={}){snapshot=s;offset=s.serverNow-clock();visible=show;},dispose(){cancelAnimationFrame(frame);resize.disconnect();root.replaceChildren();}};
}
