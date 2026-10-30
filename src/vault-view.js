import {doorFinish,rimSparkle,finalePose,vaultParticle} from './vault-effects.js';
import {chamberDoorTransforms,VAULT_ART} from './vault-layout.js';
import {vaultSVG,vaultLock,crownVaultCrest,vaultHaloSVG} from './vault-art.js';
import {giftFinalBadge,giftFinalBow} from './gift-finale-art.js';
import {projectedVault,vaultTotal,vaultLevel,money,VAULT_CLEAR_MS,VAULT_INTRO_MS} from './vault-game.js';
import {clamp,ease,CHAMBER_SLOTS,chamberTheme,chamberBirths,chamberPose,vaultBankPose,chamberPoint,vaultTrail} from './vault-motion.js';
export function createVaultView(root,{audio}={}){
 root.innerHTML=`<section class="vault-stage" aria-label="Birthday vault"><div class="vault-heading">FAITH’S <b>BIRTHDAY VAULT</b></div><div class="vault-topline"><span class="vault-viewer"></span><span class="vault-count"></span></div><div class="vault-progress" aria-label="Chamber progress"></div><div class="vault-machine">${vaultSVG()}</div><div class="vault-reveal"><small></small><strong></strong><span class="vault-bonus"></span></div><div class="vault-loot-trail" aria-hidden="true">${Array.from({length:10},()=>`<i></i>`).join('')}</div><div class="vault-final-halo">${vaultHaloSVG()}</div><div class="vault-final-crest"></div><div class="vault-bankroll"><small>BANKROLL</small><strong>$0</strong><span class="vault-calculation"></span></div><div class="vault-particles" aria-hidden="true">${Array.from({length:100},(_,i)=>`<i style="--confetti:${['#fff1b4','#f7add5','#c9b6f8','#a9efdc','#aae3f6'][i%5]}"></i>`).join('')}</div></section>`;
 const $=s=>root.querySelector(s),stage=$('.vault-stage'),els={viewer:$('.vault-viewer'),count:$('.vault-count'),progress:$('.vault-progress'),machine:$('.vault-machine'),reveal:$('.vault-reveal'),small:$('.vault-reveal small'),cash:$('.vault-reveal strong'),bonus:$('.vault-bonus'),bank:$('.vault-bankroll strong'),bankLabel:$('.vault-bankroll small'),calc:$('.vault-calculation'),halo:$('.vault-final-halo'),crest:$('.vault-final-crest'),bankWrap:$('.vault-bankroll')},particles=[...root.querySelectorAll('.vault-particles i')],reduced=matchMedia('(prefers-reduced-motion: reduce)');
 els.machine.style.cssText=`left:${VAULT_ART.x}px;top:${VAULT_ART.y}px;width:${VAULT_ART.size}px;height:${VAULT_ART.size}px`;
 const banks=[...root.querySelectorAll('.vault-bank')],trails=[...root.querySelectorAll('.vault-loot-trail i')];
 const rim=[...root.querySelectorAll('.rim-glint')].map(el=>({el,origin:el.getAttribute('transform')}));
 const chambers=[...root.querySelectorAll('.vault-chamber')].map((el,i)=>({el,i,slot:CHAMBER_SLOTS[i%5],left:el.querySelector('.chamber-leaf-left'),leftEdge:el.querySelector('.chamber-edge-left'),rightEdge:el.querySelector('.chamber-edge-right'),shades:[...el.querySelectorAll('.door-shade')],sheens:[...el.querySelectorAll('.door-sheen')],lock:el.querySelector('.chamber-lock-glint'),attention:el.querySelector('.chamber-attention'),right:el.querySelector('.chamber-leaf-right'),loot:el.querySelector('.chamber-loot'),glow:el.querySelector('.chamber-radiance'),focus:el.querySelector('.chamber-focus'),spark:el.querySelector('.chamber-spark'),award:el.querySelector('.chamber-award'),bonus:el.querySelector('.chamber-bonus-mark'),number:el.querySelector('.chamber-number'),dormant:el.querySelector('.chamber-dormant')}));
 let snapshot=null,options={preview:true,show:true},offset=0,raf,disposed=false,progressKey='',tier=-1;
 const resize=()=>{stage.style.transform=`translate(-50%,-50%) scale(${Math.min(root.clientWidth/420,root.clientHeight/460)})`;};
 const observer=new ResizeObserver(resize);observer.observe(root);resize();
 function fit(el,text,max,width){if(el.textContent!==text)el.textContent=text;el.style.fontSize=Math.min(max,width/(Math.max(1,text.length)*.61))+'px';}
 function render(){
  if(disposed)return;raf=requestAnimationFrame(render);
  const quiet=options.quiet??reduced.matches;
  const r=snapshot?.round,time=options.frozenAt??Date.now()+offset,p=snapshot?.widget??{chambers:5},finished=!!r&&r.completedAt!==null,now=projectedVault(r,time),intro=r?clamp((time-r.startedAt)/VAULT_INTRO_MS):1;
  const visible=options.show!==false&&(options.preview||!!r),exit=finished?1-ease((time-r.hideAt)/VAULT_CLEAR_MS):1;
  stage.style.opacity=visible?exit*(quiet?1:ease(intro*4)):0;stage.setAttribute('aria-hidden',String(!visible));if(!visible)return;
  stage.classList.toggle('is-finished',finished);stage.classList.toggle('is-opening',!!r?.flight);stage.classList.toggle('is-idle',!r);
  const allocated=now?.allocated??p.chambers,opened=finished?allocated:now?.opened.length??0,key=allocated+':'+opened+':'+(r?.flight?.index??'');
  if(key!==progressKey){els.progress.innerHTML=Array.from({length:allocated},(_,i)=>`<span class="vault-step ${i<opened?'done':i===opened&&r?.flight?'active':''}" aria-label="Chamber ${i+1}${i<opened?', unlocked':''}">${vaultLock(i<opened)}<b>${i+1}</b></span>`).join('');progressKey=key;}
  els.progress.style.setProperty('--steps',allocated);els.viewer.textContent=r?.viewer||'A LITTLE LUCK. A LOT OF GOLD.';els.count.textContent=finished?'VAULT CLEARED':r?now.remaining+' UNLOCK'+(now.remaining===1?'':'S')+' LEFT':allocated+' CHAMBERS';
  const shot=r?.flight,age=shot?time-shot.startAt:0,finalAge=finished?time-r.completedAt:0,level=finished?vaultLevel(r):0;
  stage.dataset.tier=finished?String(level):'';
  rim.forEach(({el,origin},i)=>{const sparkle=rimSparkle(i,time,quiet);el.style.opacity=sparkle.opacity*(shot?.45:1);el.setAttribute('transform',origin+` scale(${sparkle.scale})`);});
  const bankPose=vaultBankPose(r,time,quiet),births=chamberBirths(r),point=chamberPoint(shot?.index??r?.opened.at(-1)?.index??0);
  if(bankPose.bank>0&&!finished)els.count.textContent=(r&&(shot?.index??r.opened.at(-1)?.index??0)>=r.preset.chambers?'BONUS WING':'WING '+(bankPose.bank+1))+' · '+(now?.remaining??allocated)+' LEFT';
  banks.forEach((bank,i)=>{const current=i===bankPose.bank,previous=i===bankPose.previous;bank.style.display=current||previous?'':'none';bank.style.opacity=current?bankPose.blend:previous?1-bankPose.blend:0;});
  chambers.forEach(c=>{
   if(Math.floor(c.i/5)!==bankPose.bank&&Math.floor(c.i/5)!==bankPose.previous)return;
   const eligible=c.i<allocated,current=c.i===shot?.index,award=r?.opened.find(s=>s.index===c.i)??(current?shot:null),pose=chamberPose(award,time,quiet);
   if(finished&&r.celebrationPreview)pose.open=pose.bolt=1;
   const born=births.get(c.i),arrive=quiet||born===undefined?1:ease((time-born)/300);
   c.el.style.opacity=1;
   c.dormant.style.display=eligible?'none':'';c.number.style.opacity=eligible?1:0;
   c.number.setAttribute('transform',`translate(${c.slot.numberX} ${c.slot.numberY}) scale(${1+(!quiet?Math.sin(arrive*Math.PI)*.12:0)})`);
   const doors=chamberDoorTransforms(c.i,pose.open),edgeOpacity=1-ease((pose.open-.91)/.09),finish=doorFinish(award?time-award.startAt:0,pose.open,quiet);
   c.left.setAttribute('transform',doors.left);c.left.style.opacity=edgeOpacity;
   c.leftEdge.setAttribute('transform',doors.leftEdge);c.leftEdge.style.opacity=finish.edge;
   if(c.right){c.right.setAttribute('transform',doors.right);c.right.style.opacity=edgeOpacity;c.rightEdge.setAttribute('transform',doors.rightEdge);c.rightEdge.style.opacity=finish.edge;}
   c.shades.forEach(el=>el.style.opacity=finish.shade);
   c.sheens.forEach(el=>{el.style.opacity=finish.sheen;el.setAttribute('transform',`translate(${c.slot.x-c.slot.w+finish.sweep*c.slot.w*2} 0)`);});
   c.lock.style.opacity=finish.lock*.85;c.attention.style.opacity=shot&&!current?.18*(1-ease((age-1520)/480)):0;
   c.glow.style.opacity=pose.glow*.12;c.loot.style.opacity=1-pose.loot;c.focus.style.opacity=current?finish.focus*.85:0;c.spark.style.opacity=quiet?0:pose.glow*.75;
   const revealed=eligible&&award&&time>=award.revealAt;
   c.number.dataset.state=current?'active':revealed?'open':'closed';
   const label=revealed?money(award.cashCents):'';if(c.award.textContent!==label)c.award.textContent=label;
   const bonusLabel=revealed&&award.bonus?(award.bonus.kind==='multiply'?'×'+award.bonus.value:'+1'):'';if(c.bonus.textContent!==bonusLabel)c.bonus.textContent=bonusLabel;c.bonus.style.opacity=(quiet?1:ease((time-(award?.startAt??time)-1760)/240))*(shot&&!current?.55:1);
c.award.setAttribute('font-size',Math.min(c.i%5===4?50:58,(c.i%5===4?200:310)/(Math.max(1,c.award.textContent.length)*.61)));
   c.award.style.opacity=revealed?(quiet?1:ease((time-award.startAt-1760)/240))*(shot&&!current?.55:1):0;
  });
  [...els.progress.children].forEach((el,i)=>{const born=births.get(i),arrive=born===undefined||quiet?1:clamp((time-born)/400);el.style.transform=`scale(${1+Math.sin(arrive*Math.PI)*.25})`;el.classList.toggle('in-bank',Math.floor(i/5)===bankPose.bank);});
  const showingShot=shot&&time>=shot.revealAt,reward=showingShot?shot:null,pose=chamberPose(shot,time,quiet);
  els.reveal.style.opacity=finished?0:reward?(quiet?1:pose.reward):r&&intro<1?ease((intro-.2)/.25)*(1-ease((intro-.76)/.24)):0;
  els.reveal.style.left=(reward?Math.max(8,Math.min(192,point.x-110)):100)+'px';els.reveal.style.right='auto';els.reveal.style.width='220px';els.reveal.style.top=(reward?Math.max(112,Math.min(255,point.y-39)):170)+'px';
  els.reveal.classList.toggle('has-bonus',!!reward?.bonus);
  els.small.textContent=reward?(reward.index+1)+' · '+chamberTheme(reward.index).name:'OPENING BALANCE';
  fit(els.cash,reward?'+'+money(reward.cashCents):money(r?.openingCents??0),38,184);
  els.cash.style.transform=quiet?'none':`translateY(${showingShot?(1-ease((age-780)/220))*7:0}px) scale(${showingShot?1+Math.sin(clamp((age-780)/360)*Math.PI)*.07:1})`;
  els.bonus.textContent=reward?.bonus?(reward.bonus.kind==='multiply'?'×'+reward.bonus.value+' TOTAL':'+1 UNLOCK'):'';
  els.bonus.dataset.kind=reward?.bonus?.kind??'';els.bonus.style.opacity=showingShot?ease((age-1040)/180):1;
  trails.forEach((el,i)=>{const t=vaultTrail(shot?.index??0,i,time,shot,quiet);el.style.opacity=t.visible&&!finished?t.opacity:0;el.style.transform=`translate(${t.x}px,${t.y}px)`;});
  if(finished&&level!==tier){els.crest.innerHTML=[giftFinalBadge,giftFinalBow,crownVaultCrest][level]();tier=level;}
  const finale=finalePose(finalAge,level,quiet),build=finale.build;
  els.machine.style.filter=finished?`brightness(${1-finale.dim*.42}) saturate(${1-finale.dim*.14})`:'none';
  els.bankWrap.style.transition='none';els.bankWrap.style.bottom=(finished?9+63*(quiet?1:ease(finalAge/400)):9)+'px';
  els.halo.style.opacity=finished?finale.halo:0;
  els.halo.style.transform=`translateY(${finale.rise}px)`;
  els.crest.style.opacity=finished?finale.crest:0;els.crest.style.transform=`translateY(${finale.rise}px) scale(${finale.scale})`;
  els.bankLabel.textContent=finished?['VAULT TOTAL','BIG WIN','ROYAL WIN'][level]:r&&intro<1?'OPENING BALANCE':'BANKROLL';
  const total=vaultTotal(now),openingFactor=r&&!r.opened.length&&!r.flight?ease((intro-.2)/.7):1;
  const amount=openingFactor<1?(BigInt(total)*BigInt(Math.floor(openingFactor*1000))/1000n).toString():total;
  fit(els.bank,r?money(amount):'$ —',finished?50+18*(quiet?1:ease(finalAge/440)):50,340);
  els.bank.style.opacity=finished?finale.amount:1;
  els.bank.style.transform=finished?`translateY(${finale.rise}px) scale(${finale.scale})`:'none';
  els.calc.textContent=now?money(now.cashCents)+' collected  ·  ×'+now.multiplier:'Cash in every chamber. Bonuses on top.';
  els.calc.style.fontSize=Math.min(14,376/(els.calc.textContent.length*.56))+'px';
  const burstAge=finished?finalAge-build:shot?age-780:10000;
  particles.forEach((el,i)=>{const particle=vaultParticle(i,burstAge,{final:finished,level:finished?level:Number(!!reward?.bonus),x:finished?210:point.x,y:finished?220:point.y,quiet});el.style.opacity=particle.visible?particle.opacity:0;el.style.transform=`translate(${particle.x}px,${particle.y}px) rotate(${particle.rotation}deg)`;});
  audio?.sync(r,time);
 }
 render();
 return {update(next,opts={}){snapshot=next;options={preview:true,show:true,...opts};offset=Number.isFinite(next.serverNow)?next.serverNow-Date.now():0;},hide(){options.show=false;},dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();}};
}
