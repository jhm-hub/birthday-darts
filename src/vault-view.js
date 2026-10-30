import {vaultSVG,vaultLock} from './vault-art.js';
import {giftFinalBadge,giftFinalBow,giftFinalCrown} from './gift-finale-art.js';
import {projectedVault,vaultTotal,vaultLevel,money,VAULT_CLEAR_MS,VAULT_INTRO_MS} from './vault-game.js';
import {clamp,ease,CHAMBER_SLOTS,chamberTheme,chamberBirths,chamberPose,vaultBankPose,chamberPoint,vaultTrail} from './vault-motion.js';
export function createVaultView(root,{audio}={}){
 root.innerHTML=`<section class="vault-stage" aria-label="Birthday vault"><div class="vault-heading">FAITH’S <b>BIRTHDAY VAULT</b></div><div class="vault-topline"><span class="vault-viewer"></span><span class="vault-count"></span></div><div class="vault-progress" aria-label="Chamber progress"></div><div class="vault-machine">${vaultSVG()}</div><div class="vault-reveal"><small></small><strong></strong><span class="vault-bonus"></span></div><div class="vault-loot-trail" aria-hidden="true">${Array.from({length:10},()=>`<i></i>`).join('')}</div><div class="vault-final-crest"></div><div class="vault-bankroll"><small>BANKROLL</small><strong>$0</strong><span class="vault-calculation"></span></div><div class="vault-particles" aria-hidden="true">${Array.from({length:100},(_,i)=>`<i style="--confetti:${['#fff1b4','#f7add5','#c9b6f8','#a9efdc','#aae3f6'][i%5]}"></i>`).join('')}</div></section>`;
 const $=s=>root.querySelector(s),stage=$('.vault-stage'),els={viewer:$('.vault-viewer'),count:$('.vault-count'),progress:$('.vault-progress'),machine:$('.vault-machine'),reveal:$('.vault-reveal'),small:$('.vault-reveal small'),cash:$('.vault-reveal strong'),bonus:$('.vault-bonus'),bank:$('.vault-bankroll strong'),bankLabel:$('.vault-bankroll small'),calc:$('.vault-calculation'),crest:$('.vault-final-crest')},particles=[...root.querySelectorAll('.vault-particles i')],reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const banks=[...root.querySelectorAll('.vault-bank')],trails=[...root.querySelectorAll('.vault-loot-trail i')];
 const chambers=[...root.querySelectorAll('.vault-chamber')].map((el,i)=>({el,i,slot:CHAMBER_SLOTS[i%5],left:el.querySelector('.chamber-leaf-left'),right:el.querySelector('.chamber-leaf-right'),wheels:[...el.querySelectorAll('.chamber-wheel')],bolt:el.querySelector('.chamber-bolt'),loot:el.querySelector('.chamber-loot'),glow:el.querySelector('.chamber-radiance'),focus:el.querySelector('.chamber-focus'),spark:el.querySelector('.chamber-spark'),award:el.querySelector('.chamber-award'),bonus:el.querySelector('.chamber-bonus-mark'),number:el.querySelector('.chamber-number'),dormant:el.querySelector('.chamber-dormant')}));
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
  const bankPose=vaultBankPose(r,time,quiet),births=chamberBirths(r),point=chamberPoint(shot?.index??r?.opened.at(-1)?.index??0);
  if(bankPose.bank>0&&!finished)els.count.textContent=(r&&(shot?.index??r.opened.at(-1)?.index??0)>=r.preset.chambers?'BONUS WING':'WING '+(bankPose.bank+1))+' · '+(now?.remaining??allocated)+' LEFT';
  banks.forEach((bank,i)=>{const current=i===bankPose.bank,previous=i===bankPose.previous;bank.style.display=current||previous?'':'none';bank.style.opacity=current?bankPose.blend:previous?1-bankPose.blend:0;bank.setAttribute('transform',`translate(${current?(1-bankPose.blend)*10:previous?-bankPose.blend*10:0} 0)`);});
  chambers.forEach(c=>{
   if(Math.floor(c.i/5)!==bankPose.bank&&Math.floor(c.i/5)!==bankPose.previous)return;
   const eligible=c.i<allocated,current=c.i===shot?.index,award=r?.opened.find(s=>s.index===c.i)??(current?shot:null),pose=chamberPose(award,time,quiet),theme=chamberTheme(c.i),w=c.slot.w-6,h=c.slot.h-6;
   if(finished&&r.celebrationPreview)pose.open=pose.bolt=1;
   const born=births.get(c.i),arrive=quiet||born===undefined?1:ease((time-born)/300);
   c.el.style.opacity=eligible?arrive*(shot&&!current?.8:1):1;
   c.dormant.style.display=eligible?'none':'';c.number.style.opacity=eligible?1:0;
   c.left.setAttribute('transform',theme.motion==='split'?`translate(${-pose.open*(w/2+2)} 0)`:theme.motion==='shutter'?`translate(0 ${-pose.open*(h+1)})`:theme.motion==='hinge-right'?`translate(${w} 0) scale(${1-pose.open*.965} 1) skewY(${pose.open*5}) translate(${-w} 0)`:`scale(${1-pose.open*.965} 1) skewY(${-pose.open*5})`);
   if(c.right)c.right.setAttribute('transform',theme.motion==='split'?`translate(${pose.open*(w/2+2)} 0)`:`translate(${w} 0) scale(${1-pose.open*.965} 1) skewY(${pose.open*5}) translate(${-w} 0)`);
   c.wheels.forEach(wheel=>wheel.setAttribute('transform',`rotate(${pose.turn} ${w/2} ${h/2})`));c.bolt.setAttribute('transform',`translate(${-pose.bolt*5} 0)`);
   c.glow.style.opacity=pose.glow;c.loot.style.opacity=pose.loot;c.focus.style.opacity=current?.65+pose.glow*.35:0;c.spark.style.opacity=quiet?0:pose.glow;
   const revealed=eligible&&award&&time>=award.revealAt;
   const label=revealed?money(award.cashCents):'';if(c.award.textContent!==label)c.award.textContent=label;
   const bonusLabel=revealed&&award.bonus?(award.bonus.kind==='multiply'?'×'+award.bonus.value:'+1'):'';if(c.bonus.textContent!==bonusLabel)c.bonus.textContent=bonusLabel;c.bonus.style.opacity=quiet?1:ease((time-(award?.startAt??time)-1720)/260);
c.award.setAttribute('font-size',Math.min(8,(c.slot.w-12)/(Math.max(1,c.award.textContent.length)*.65)));
   c.award.style.opacity=revealed?(quiet?1:ease((time-award.startAt-1720)/260)):0;
  });
  [...els.progress.children].forEach((el,i)=>{const born=births.get(i),arrive=born===undefined||quiet?1:clamp((time-born)/400);el.style.transform=`scale(${1+Math.sin(arrive*Math.PI)*.25})`;el.classList.toggle('in-bank',Math.floor(i/5)===bankPose.bank);});
  const showingShot=shot&&time>=shot.revealAt,reward=showingShot?shot:null,pose=chamberPose(shot,time,quiet);
  els.reveal.style.opacity=finished?0:reward?(quiet?1:pose.reward):r&&intro<1?ease((intro-.2)/.6):0;
  els.reveal.style.left=(reward?Math.max(8,Math.min(192,point.x-110)):100)+'px';els.reveal.style.right='auto';els.reveal.style.width='220px';els.reveal.style.top=(reward?Math.max(118,Math.min(260,point.y-37)):170)+'px';
  els.reveal.classList.toggle('has-bonus',!!reward?.bonus);
  els.small.textContent=reward?(reward.index+1)+' · '+chamberTheme(reward.index).name:'OPENING BALANCE';
  fit(els.cash,reward?'+'+money(reward.cashCents):money(r?.openingCents??0),38,200);
  els.cash.style.transform=quiet?'none':`translateY(${showingShot?(1-ease((age-780)/220))*7:0}px) scale(${showingShot?1+Math.sin(clamp((age-780)/360)*Math.PI)*.07:1})`;
  els.bonus.textContent=reward?.bonus?(reward.bonus.kind==='multiply'?'×'+reward.bonus.value+' TOTAL':'+1 UNLOCK'):'';
  els.bonus.dataset.kind=reward?.bonus?.kind??'';els.bonus.style.opacity=showingShot?ease((age-1040)/180):1;
  trails.forEach((el,i)=>{const t=vaultTrail(shot?.index??0,i,time,shot,quiet);el.style.opacity=t.visible&&!finished?t.opacity:0;el.style.transform=`translate(${t.x}px,${t.y}px)`;});
  if(finished&&level!==tier){els.crest.innerHTML=[giftFinalBadge,giftFinalBow,giftFinalCrown][level]();tier=level;}
  const build=level===2?600:level===1?220:180,landing=finished?ease((finalAge-build)/380):0;
  els.crest.style.opacity=finished?ease(finalAge/250):0;els.crest.style.transform=`translateY(${finished&&!quiet?(1-landing)*8:0}px) scale(${1+(!quiet?Math.sin(landing*Math.PI)*.12:0)})`;
  els.bankLabel.textContent=finished?['VAULT TOTAL','BIG WIN','ROYAL WIN'][level]:r&&intro<1?'OPENING BALANCE':'BANKROLL';
  const total=vaultTotal(now),openingFactor=r&&!r.opened.length&&!r.flight?ease((intro-.2)/.7):1;
  const amount=openingFactor<1?(BigInt(total)*BigInt(Math.floor(openingFactor*1000))/1000n).toString():total;
  fit(els.bank,r?money(amount):'$ —',finished?68:56,376);
  els.bank.style.opacity=finished&&!quiet&&finalAge<build?.25:1;
  els.bank.style.transform=finished&&!quiet?`scale(${1+Math.sin(landing*Math.PI)*.12})`:'none';
  els.calc.textContent=now?money(now.cashCents)+' collected  ·  ×'+now.multiplier:'Cash in every chamber. Bonuses on top.';
  els.calc.style.fontSize=Math.min(14,376/(els.calc.textContent.length*.56))+'px';
  const count=finished?[28,58,100][level]:reward?.bonus?20:reward?12:0,burstAge=finished?finalAge-build:shot?age-780:10000;
  particles.forEach((el,i)=>{const elapsed=burstAge-i%7*32,life=finished?1800+i%5*140:900,pr=elapsed/life,active=!quiet&&i<count&&pr>=0&&pr<1;if(!active){el.style.opacity=0;return;}const angle=(i*137.5)%360*Math.PI/180,speed=55+(i%9)*12,x=(finished?210:point.x)+Math.cos(angle)*speed*pr*(finished?1:.45),y=(finished?220:point.y)+Math.sin(angle)*speed*pr*(finished?1:.45)+65*pr*pr;el.style.opacity=String(1-Math.max(0,(pr-.65)/.35));el.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px) rotate(${Math.round(i*30+pr*190)}deg)`;});
  audio?.sync(r,time);
 }
 render();
 return {update(next,opts={}){snapshot=next;options={preview:true,show:true,...opts};offset=Number.isFinite(next.serverNow)?next.serverNow-Date.now():0;},hide(){options.show=false;},dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();}};
}
