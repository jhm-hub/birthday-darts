import {vaultSVG,vaultLock} from './vault-art.js';
import {giftFinalBadge,giftFinalBow,giftFinalCrown} from './gift-finale-art.js';
import {projectedVault,vaultTotal,vaultLevel,money,VAULT_CLEAR_MS,VAULT_INTRO_MS} from './vault-game.js';
const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
export function vaultDoorMotion(age){if(age<300)return 0;if(age<780)return ease((age-300)/480);if(age<1400)return 1;return 1-ease((age-1400)/600);}
export function createVaultView(root,{audio}={}){
 root.innerHTML=`<section class="vault-stage" aria-label="Birthday vault"><div class="vault-heading">FAITH’S <b>BIRTHDAY VAULT</b></div><div class="vault-topline"><span class="vault-viewer"></span><span class="vault-count"></span></div><div class="vault-progress" aria-label="Chamber progress"></div><div class="vault-machine">${vaultSVG()}</div><div class="vault-reveal"><small></small><strong></strong><span class="vault-bonus"></span></div><div class="vault-final-crest"></div><div class="vault-bankroll"><small>BANKROLL</small><strong>$0</strong><span class="vault-calculation"></span></div><div class="vault-particles" aria-hidden="true">${Array.from({length:100},(_,i)=>`<i style="--confetti:${['#fff1b4','#f7add5','#c9b6f8','#a9efdc','#aae3f6'][i%5]}"></i>`).join('')}</div></section>`;
 const $=s=>root.querySelector(s),stage=$('.vault-stage'),els={viewer:$('.vault-viewer'),count:$('.vault-count'),progress:$('.vault-progress'),machine:$('.vault-machine'),door:$('.vault-door'),wheel:$('.vault-wheel'),bolts:$('.vault-bolts'),reveal:$('.vault-reveal'),small:$('.vault-reveal small'),cash:$('.vault-reveal strong'),bonus:$('.vault-bonus'),bank:$('.vault-bankroll strong'),bankLabel:$('.vault-bankroll small'),calc:$('.vault-calculation'),crest:$('.vault-final-crest'),spill:$('.vault-spill')},particles=[...root.querySelectorAll('.vault-particles i')],reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let snapshot=null,options={preview:true,show:true},offset=0,raf,disposed=false,progressKey='',tier=-1;
 const resize=()=>{stage.style.transform=`translate(-50%,-50%) scale(${Math.min(root.clientWidth/420,root.clientHeight/460)})`;};
 const observer=new ResizeObserver(resize);observer.observe(root);resize();
 function fit(el,text,max,width){if(el.textContent!==text)el.textContent=text;el.style.fontSize=Math.min(max,width/(Math.max(1,text.length)*.61))+'px';}
 function render(){
  if(disposed)return;raf=requestAnimationFrame(render);
  const r=snapshot?.round,time=Date.now()+offset,p=snapshot?.widget??{chambers:5},finished=!!r&&r.completedAt!==null,now=projectedVault(r,time),intro=r?clamp((time-r.startedAt)/VAULT_INTRO_MS):1;
  const visible=options.show!==false&&(options.preview||!!r),exit=finished?1-ease((time-r.hideAt)/VAULT_CLEAR_MS):1;
  stage.style.opacity=visible?exit*(reduced.matches?1:ease(intro*4)):0;stage.setAttribute('aria-hidden',String(!visible));if(!visible)return;
  stage.classList.toggle('is-finished',finished);stage.classList.toggle('is-opening',!!r?.flight);stage.classList.toggle('is-idle',!r);
  const allocated=now?.allocated??p.chambers,opened=finished?allocated:now?.opened.length??0,key=allocated+':'+opened+':'+(r?.flight?.index??'');
  if(key!==progressKey){els.progress.innerHTML=Array.from({length:allocated},(_,i)=>`<span class="vault-step ${i<opened?'done':i===opened&&r?.flight?'active':''}" aria-label="Chamber ${i+1}${i<opened?', unlocked':''}">${vaultLock()}<b>${i+1}</b></span>`).join('');progressKey=key;}
  els.progress.style.setProperty('--steps',allocated);els.viewer.textContent=r?.viewer||'A LITTLE LUCK. A LOT OF GOLD.';els.count.textContent=finished?'VAULT CLEARED':r?now.remaining+' UNLOCK'+(now.remaining===1?'':'S')+' LEFT':allocated+' CHAMBERS';
  const shot=r?.flight,age=shot?time-shot.startAt:0,finalAge=finished?time-r.completedAt:0,level=finished?vaultLevel(r):0;
  const lastChamber=shot&&r.remaining===1&&shot.bonus?.kind!=='extra';
  let door=finished?1:shot?vaultDoorMotion(lastChamber?Math.min(age,1400):age):0;if(reduced.matches)door=finished||shot&&time>=shot.revealAt?1:0;
  els.door.style.transform=`translateX(${-door*4}px) scaleX(${1-door*.9}) skewY(${-door*6}deg)`;
  els.door.style.filter=`brightness(${1-door*.16})`;
  els.wheel.style.transform=`rotate(${reduced.matches?0:shot?ease(age/650)*180:0}deg)`;
  els.bolts.style.transform=`translateX(${door*7}px)`;
  els.machine.style.setProperty('--vault-metal',['#96769e','#7c9db1','#819c8d','#b3829b','#a58c70'][Math.min(4,opened)]);
  els.spill.style.opacity=finished?1:door*.8;
  const showingShot=shot&&time>=shot.revealAt,last=!shot&&!finished?r?.opened.at(-1):null,reward=showingShot?shot:last;
  els.reveal.style.opacity=finished?0:reward?1:r&&intro<1?ease((intro-.2)/.6):0;
  els.reveal.classList.toggle('has-bonus',!!reward?.bonus);
  els.small.textContent=reward?'CHAMBER '+(reward.index+1):'OPENING BALANCE';
  fit(els.cash,reward?'+'+money(reward.cashCents):money(r?.openingCents??0),40,260);
  els.cash.style.transform=reduced.matches?'none':`translateY(${showingShot?(1-ease((age-780)/220))*10:0}px) scale(${showingShot?1+Math.sin(clamp((age-780)/360)*Math.PI)*.1:1})`;
  els.bonus.textContent=reward?.bonus?(reward.bonus.kind==='multiply'?'×'+reward.bonus.value+' TOTAL':'+1 UNLOCK'):'';
  els.bonus.dataset.kind=reward?.bonus?.kind??'';els.bonus.style.opacity=showingShot?ease((age-1040)/180):1;
  if(finished&&level!==tier){els.crest.innerHTML=[giftFinalBadge,giftFinalBow,giftFinalCrown][level]();tier=level;}
  const build=level===2?600:level===1?220:180,landing=finished?ease((finalAge-build)/380):0;
  els.crest.style.opacity=finished?ease(finalAge/250):0;els.crest.style.transform=`translateY(${finished&&!reduced.matches?(1-landing)*8:0}px) scale(${1+(!reduced.matches?Math.sin(landing*Math.PI)*.12:0)})`;
  els.bankLabel.textContent=finished?['VAULT TOTAL','BIG WIN','ROYAL WIN'][level]:r&&intro<1?'OPENING BALANCE':'BANKROLL';
  const total=vaultTotal(now),openingFactor=r&&!r.opened.length&&!r.flight?ease((intro-.2)/.7):1;
  const amount=openingFactor<1?(BigInt(total)*BigInt(Math.floor(openingFactor*1000))/1000n).toString():total;
  fit(els.bank,r?money(amount):'$ —',finished?68:56,376);
  els.bank.style.opacity=finished&&!reduced.matches&&finalAge<build?.25:1;
  els.bank.style.transform=finished&&!reduced.matches?`scale(${1+Math.sin(landing*Math.PI)*.12})`:'none';
  els.calc.textContent=now?money(now.cashCents)+' collected  ·  ×'+now.multiplier:'Cash in every chamber. Bonuses on top.';
  els.calc.style.fontSize=Math.min(14,376/(els.calc.textContent.length*.56))+'px';
  const count=finished?[28,58,100][level]:reward?.bonus?20:reward?12:0,burstAge=finished?finalAge-build:shot?age-780:10000;
  particles.forEach((el,i)=>{const elapsed=burstAge-i%7*32,life=finished?1800+i%5*140:900,pr=elapsed/life,active=!reduced.matches&&i<count&&pr>=0&&pr<1;if(!active){el.style.opacity=0;return;}const angle=(i*137.5)%360*Math.PI/180,speed=55+(i%9)*12,x=210+Math.cos(angle)*speed*pr,y=(finished?220:208)+Math.sin(angle)*speed*pr+105*pr*pr;el.style.opacity=String(1-Math.max(0,(pr-.65)/.35));el.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px) rotate(${Math.round(i*30+pr*190)}deg)`;});
  audio?.sync(r,time);
 }
 render();
 return {update(next,opts={}){snapshot=next;options={preview:true,show:true,...opts};offset=Number.isFinite(next.serverNow)?next.serverNow-Date.now():0;},hide(){options.show=false;},dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();}};
}
