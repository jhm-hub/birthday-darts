import {crownPinata,pinataBat,littleCrown,candySprite,sparkleSprite,impactSprite,swingTrail,bonusArt} from './pinata-art.js';
import {projectedPinata,pinataTotal,rewardCopy,money,CLEAR_MS} from './pinata-game.js';
import {PARTICLE_COUNT,BREAK_DELAY,batPose,crownPose,breakPose,particleSpec,particlePose,clamp} from './pinata-motion.js';
import {FINALE_PARTICLES,finalePose,finaleParticleSpec,finaleParticlePose} from './pinata-finale.js';
import {BONUS_PARTICLES,swingSide,bonusPose,bonusParticlePose} from './pinata-bonus.js';
import {damagePose} from './pinata-damage.js';
import {HANDOFF_SPARKS,finalHitAge,handoffPose,handoffSparkPose} from './pinata-handoff.js';
let sequence=0;
export function createPinataView(root,{audio=null,preview=false,clock=Date.now,quiet=null}={}){
 const id='pinata-art-'+(++sequence);root.innerHTML=`<section class="pinata-stage" aria-label="Piñata Party"><header class="pina-heading"><span class="pina-kicker">FAITH’S BIRTHDAY</span><strong>PIÑATA PARTY</strong></header><div class="pina-meta"><span class="pina-viewer"></span><span class="pina-count"></span></div><div class="pina-hanging">${crownPinata(id)}</div><div class="pina-swing-side" aria-hidden="true"><div class="pina-swish">${swingTrail()}</div><div class="pina-bat">${pinataBat()}</div><div class="pina-impact" aria-hidden="true">${impactSprite()}</div></div><div class="pina-particles" aria-hidden="true">${Array.from({length:PARTICLE_COUNT},(_,i)=>{const p=particleSpec(i);return `<i class="${p.candy?'candy':p.star?'star':'paper'}" style="--c:${['#ffd48e','#ffb3da','#b4eadd','#d9bdff','#a5e4ff'][i%5]};width:${p.width}px;height:${p.height}px">${p.candy?candySprite(i):p.star?sparkleSprite():''}</i>`;}).join('')}</div><div class="pina-bonus-feature" aria-hidden="true">${bonusArt()}</div><div class="pina-bonus-token" aria-hidden="true"><span></span></div><div class="pina-bonus-particles" aria-hidden="true">${Array.from({length:BONUS_PARTICLES},(_,i)=>`<i>${i%3===0?sparkleSprite():candySprite(i%2?1:3)}</i>`).join('')}</div><div class="pina-reward" aria-live="polite"><span class="pina-reward-kicker"></span><strong></strong><small></small></div><div class="pina-idle">A LITTLE CHAOS. A LOT OF CANDY.</div><footer class="pina-footer"><div><small>COLLECTED</small><strong class="pina-cash"></strong></div><div><small>MULTIPLIER</small><strong class="pina-mult"></strong></div><div><small>TOTAL SO FAR</small><strong class="pina-bank"></strong></div></footer><div class="pina-handoff-sparks" aria-hidden="true">${Array.from({length:HANDOFF_SPARKS},()=>`<i>${sparkleSprite()}</i>`).join('')}</div><div class="pina-finale-particles" aria-hidden="true">${Array.from({length:FINALE_PARTICLES},(_,i)=>{const p=finaleParticleSpec(i);return `<i class="${p.candy?'candy':p.star?'star':'paper'}" style="--c:${['#efc47e','#f5a6cb','#b4e8d5','#c8a2ed'][i%4]};width:${p.size}px;height:${p.size}px">${p.candy?candySprite(i+Math.floor(i/2)):p.star?sparkleSprite():''}</i>`;}).join('')}</div><div class="pina-finale"><div class="pina-final-crest">${littleCrown()}</div><small class="pina-final-title">ROYALLY SPOILED.</small><div class="pina-total-wrap"><div class="pina-total-tag"><small>FINAL TOTAL</small><strong class="pina-final-amount"></strong></div></div><p></p></div></section>`;
 const $=s=>root.querySelector(s),stage=$('.pinata-stage'),hang=$('.pina-hanging'),halves=[...root.querySelectorAll('.pina-half')],particles=[...root.querySelectorAll('.pina-particles i')],finalParticles=[...root.querySelectorAll('.pina-finale-particles i')],handoffSparks=[...root.querySelectorAll('.pina-handoff-sparks i')],footerParts=[...root.querySelectorAll('.pina-footer>div')],bonusParticles=[...root.querySelectorAll('.pina-bonus-particles i')],tears=[...root.querySelectorAll('.pina-damage-hit')].map(el=>({el,main:[...el.querySelectorAll('.pina-tear-main path')],branches:[...el.querySelectorAll('.pina-tear-branches path')],curl:el.querySelector('.pina-paper-curl')})),reduced=matchMedia('(prefers-reduced-motion:reduce)');let snapshot=null,offset=0,visible=true,frame,lastText='';
 const fit=()=>{const s=Math.min(root.clientWidth/420,root.clientHeight/460);stage.style.transform=`translate(-50%,-50%) scale(${s})`;};const resize=new ResizeObserver(fit);resize.observe(root);fit();
 function render(){
  const time=clock()+offset,r=snapshot?.round,show=visible&&(preview||!!r),opacity=r?.hideAt?1-clamp((time-r.hideAt)/CLEAR_MS):1;stage.style.opacity=show?opacity:0;stage.setAttribute('aria-hidden',String(!show||opacity<=0));
  if(show){
   const still=quiet===null?reduced.matches:quiet();
   const shot=r?.flight??r?.hits.at(-1),shown=projectedPinata(r,time),elapsed=shot?time-shot.startAt:-1,after=shot?time-shot.hitAt:-1,finalAge=finalHitAge(r,time),final=finalAge!==null,burst=final&&after>=BREAK_DELAY,celebrate=final&&finalAge>=40,finish=finalePose(finalAge??-1,still),handoff=handoffPose(finalAge,still);
   const side=swingSide(shot?.index),kind=shot?.prize.kind,motion=crownPose(after,still),bonus=bonusPose(kind,after,still),sway=still?0:Math.sin(time/940)*1.25;
   hang.style.transform=`translate(${Math.round(motion.x*side)}px,${Math.round(motion.y)}px) rotate(${sway+motion.angle*side*(burst?1-clamp((after-BREAK_DELAY)/400):1)}deg)`;
   $('.pina-paper').style.transform=`scale(${1+motion.squash},${1-motion.squash})`;
   $('.pina-tassels').style.transform=`rotate(${motion.tassel*.35*side}deg)`;
   const fracture=burst?breakPose(after,still):{x:0,y:0,angle:0,opacity:1,seam:0};
   halves.forEach((el,i)=>{const d=i?1:-1;el.style.transform=`translate(${d*fracture.x}px,${fracture.y}px) rotate(${d*fracture.angle}deg)`;el.style.opacity=fracture.opacity;});
   $('.pina-seam').style.opacity=fracture.seam;
   tears.forEach((tear,i)=>{const v=damagePose(r,time,i,still),state=JSON.stringify(v);if(tear.state===state)return;tear.state=state;tear.el.style.opacity=v.opacity;for(const [paths,p] of [[tear.main,v.main],[tear.branches,v.branches]])for(const path of paths){path.style.strokeDasharray='1';path.style.strokeDashoffset=1-p;}tear.curl.style.opacity=v.curl;tear.curl.style.transform=`rotate(${v.angle}deg)`;});
   $('.pina-gleam').style.opacity=burst?0:motion.glint;
   $('.pina-rope').style.opacity=handoff.ropeOpacity;
   $('.pina-swing-side').style.transform=`scaleX(${side})`;
   const pose=batPose(elapsed,still),bat=$('.pina-bat');
   bat.style.opacity=pose.opacity;bat.style.transform=`translate(${pose.x}px,${pose.y}px) rotate(${pose.angle}deg)`;
   $('.pina-swish').style.opacity=pose.trail*.6;
   const impact=$('.pina-impact'),flash=after>=0&&after<200&&!still;impact.style.opacity=flash?1-clamp((after-40)/160):0;impact.style.transform=`scale(${.72+clamp(after/200)*.5}) rotate(-9deg)`;
   particles.forEach((p,i)=>{const v=particlePose(i,after,{breaking:final,quiet:still,side});p.style.opacity=v.opacity;if(v.opacity>0)p.style.transform=`translate(${v.x}px,${v.y}px) rotate(${v.angle}deg) scaleX(${v.flip})`;});
   finalParticles.forEach((p,i)=>{const v=finaleParticlePose(i,finalAge??-1,still);p.style.opacity=v.opacity;if(v.opacity>0)p.style.transform=`translate(${v.x}px,${v.y}px) rotate(${v.angle}deg) scaleX(${v.flip})`;});
   handoffSparks.forEach((p,i)=>{const v=handoffSparkPose(i,finalAge,still);p.style.opacity=v.opacity;if(v.opacity>0)p.style.transform=`translate(${v.x}px,${v.y}px) rotate(${v.angle}deg) scale(${v.scale})`;});
   const feature=$('.pina-bonus-feature');feature.dataset.kind=kind??'';feature.style.opacity=bonus.opacity;feature.style.transform=`translateY(${bonus.y}px) scale(${bonus.scale})`;$('.pina-bonus-orbit').style.transform=`rotate(${bonus.orbit}deg)`;
   const token=$('.pina-bonus-token');token.style.opacity=bonus.tokenOpacity;token.style.transform=`translate(${bonus.tokenX}px,${bonus.tokenY}px) scale(${bonus.tokenScale})`;
   $('.pina-mult').style.transform=`scale(${bonus.bankScale})`;$('.pina-bank').style.transform=`translateY(${handoff.bankY}px) scale(${bonus.bankScale})`;$('.pina-count').style.transform=`scale(${bonus.countScale})`;
   bonusParticles.forEach((p,i)=>{const v=bonusParticlePose(i,kind,after,still);p.style.opacity=v.opacity;if(v.opacity>0)p.style.transform=`translate(${v.x}px,${v.y}px) rotate(${v.angle}deg)`;});
   const revealDelay=kind==='cash'?120:160,reward=$('.pina-reward'),reveal=shot&&after>=revealDelay&&(finalAge===null||finalAge<160);reward.style.opacity=reveal?handoff.rewardOpacity:0;reward.setAttribute('aria-hidden',String(!reveal));reward.style.transform=still?'none':`translateY(${Math.round((1-clamp((after-revealDelay)/200))*12+handoff.rewardY)}px) scale(${1+Math.sin(clamp((after-revealDelay)/350)*Math.PI)*.08})`;
   $('.pina-idle').style.opacity=r?0:1;$('.pina-idle').setAttribute('aria-hidden',String(!!r));
   footerParts.slice(0,2).forEach(el=>{el.style.opacity=handoff.detailOpacity;el.setAttribute('aria-hidden',String(handoff.detailOpacity===0));});
   footerParts[2].querySelector('small').style.opacity=handoff.captionOpacity;$('.pina-bank').style.opacity=handoff.bankOpacity;$('.pina-footer').setAttribute('aria-hidden',String(handoff.bankOpacity===0));
   const finale=$('.pina-finale');finale.setAttribute('aria-hidden',String(!celebrate));finale.style.opacity=celebrate?1:0;
   const crest=$('.pina-final-crest');crest.style.opacity=finish.crestOpacity;crest.style.transform=`translateY(${finish.crestY}px) rotate(${finish.crestAngle}deg) scale(${finish.crestScale})`;
   $('.pina-final-title').style.opacity=finish.titleOpacity;
   $('.pina-total-wrap').style.opacity=finish.amountOpacity;$('.pina-total-wrap').style.transform=`scale(${finish.amountScale})`;$('.pina-total-wrap').setAttribute('aria-hidden',String(finish.amountOpacity===0));
   finale.querySelector('p').style.opacity=finish.detailOpacity;
   const key=JSON.stringify([snapshot?.widget?.swings,r?.id,shown?.cashCents,shown?.multiplier,shown?.remaining,shot?.id,celebrate,!!reveal]);
   if(key!==lastText){lastText=key;$('.pina-viewer').textContent=r?.viewer||'Birthday VIP';$('.pina-count').textContent=r?(shown.remaining?shown.remaining+' SWING'+(shown.remaining===1?'':'S')+' LEFT':'ROUND COMPLETE'):(snapshot?.widget?.swings??3)+' SWING'+((snapshot?.widget?.swings??3)===1?'':'S');$('.pina-cash').textContent=money(shown?.cashCents??0);$('.pina-mult').textContent='×'+(shown?.multiplier??1);$('.pina-bank').textContent=money(pinataTotal(shown));
    $('.pina-bonus-token span').textContent=kind==='extra'?'+'+(shot.prize.granted??shot.prize.value):'';
    $('.pina-reward-kicker').textContent=kind==='multiply'?'ROYAL MULTIPLIER':kind==='extra'?'ENCORE!':'';
    if(reveal){const copy=rewardCopy(shot.prize);reward.dataset.kind=shot.prize.kind;reward.querySelector('strong').textContent=shot.prize.kind==='cash'?money(Math.round(shot.prize.value*100)):copy.main;reward.querySelector('small').textContent=copy.detail;}else{reward.querySelector('strong').textContent='';reward.querySelector('small').textContent='';}
    finale.querySelector('strong').textContent=money(pinataTotal(shown));finale.querySelector('p').textContent=money(shown?.cashCents??0)+' collected × '+(shown?.multiplier??1);
    for(const [sel,max,width] of [['.pina-bank',34,130],['.pina-cash',25,100],['.pina-mult',25,76],['.pina-final-amount',84,314],['.pina-reward>strong',48,360],['.pina-finale p',16,350]]){const el=$(sel);el.style.fontSize=Math.min(max,width/(Math.max(1,el.textContent.length)*.62))+'px';}
   }
   audio?.update(r,time);
  }
  frame=requestAnimationFrame(render);
 }
 frame=requestAnimationFrame(render);
 return {update(s,{show=true}={}){snapshot=s;offset=s.serverNow-clock();visible=show;},dispose(){cancelAnimationFrame(frame);resize.disconnect();root.replaceChildren();}};
}
