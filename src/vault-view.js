import {vaultOpeningTreasure,vaultOpeningCoin,polishedOpeningTreasure} from './vault-opening-treasure.js';
import {vaultOpeningChest} from './vault-opening-art.js';
import {vaultPresentation} from './vault-playback.js';
import {vaultFinalBoost,vaultFinalBoostPose,vaultFinalBoostSpark,vaultFinalBoostArt,vaultFinalBoostGlyph} from './vault-final-boost.js';
import {vaultStory,vaultStoryFlight,vaultStoryGlyph} from './vault-story.js';
import {vaultJourney} from './vault-journey.js';
import {createVaultClock} from './vault-clock.js';
import {vaultMultiplierPayoff,vaultPayoffFlight,vaultPayoffDock} from './vault-multiplier-payoff.js';
import {vaultWelcomeFlow,vaultWelcomeParticle} from './vault-welcome-flow.js';
import {vaultTreasureCoda,vaultTreasureRestOrnament} from './vault-treasure-coda.js';
import {vaultTreasureBridge,vaultTreasureBridgeParticle} from './vault-treasure-handoff.js';
import {vaultSpecialArrival,vaultSpecialParticle,vaultSpecialJewel} from './vault-special-arrival.js';
import {vaultTreasurePose,vaultTreasureParticle,vaultTreasureRing,vaultTreasureOrnament} from './vault-treasure.js';
import {vaultTreasureDecor,vaultTreasureSpriteIndex} from './vault-treasure-art.js';
import {vaultSpecialScene,vaultSpecialTheme,vaultSpecialDoors,vaultRewardPoint,VAULT_SPECIAL_POINT} from './vault-special.js';
import {doorFinish,rimSparkle,finalePose,vaultParticle} from './vault-effects.js';
import {presentedVaultRound,vaultHandoff,vaultLastShot,vaultFinaleGather} from './vault-finish-motion.js';
import {vaultExit,vaultResetAt,vaultIdleOpacity,vaultReceiptExit} from './vault-exit-motion.js';
import {vaultIntro} from './vault-intro-motion.js';
import {vaultOpeningHandoff,vaultOpeningTrail} from './vault-opening-handoff.js';
import {vaultChamberHandoff,vaultChamberTrail,vaultOtherAwardOpacity,vaultChamberGuideGlyph} from './vault-chamber-handoff.js';
import {vaultBonusAt,VAULT_BONUS_LAND_MS,vaultBonusPose,vaultBonusReadout,vaultBonusBirth,vaultBonusSpark} from './vault-bonus-motion.js';
import {vaultCashPose,vaultCashSpark} from './vault-cash-motion.js';
import {vaultCollectionCoin,vaultCollectionBank,vaultCollectionGlyph} from './vault-collection-motion.js';
import {vaultCashGlyph} from './vault-cash-art.js';
import {vaultBonusGlyph} from './vault-bonus-art.js';
import {chamberDoorTransforms,VAULT_ART} from './vault-layout.js';
import {vaultSVG,vaultLock,crownVaultCrest,vaultHaloSVG} from './vault-art.js';
import {vaultFinalePiece,vaultFinaleRays} from './vault-finale-art.js';
import {giftFinalBadge,giftFinalBow} from './gift-finale-art.js';
import {projectedVault,vaultLevel,money} from './vault-game.js';
import {clamp,ease,CHAMBER_SLOTS,chamberTheme,chamberBirths,chamberPose,vaultBankPose} from './vault-motion.js';
let spritePoolId=0;
export function createVaultView(root,{audio,preview=true}={}){
 // Five shared sprite shapes keep jackpot changes from reparsing hundreds of paths.
 const spritePrefix='vault-piece-'+(++spritePoolId)+'-',piece=index=>`<svg viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true"><use href="#${spritePrefix}${index%5}"/></svg>`;
 const spriteDefs=`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${Array.from({length:5},(_,i)=>`<symbol id="${spritePrefix}${i}" viewBox="0 0 12 12">${vaultFinalePiece(i).replace(/^<svg[^>]*>|<\/svg>$/g,'')}</symbol>`).join('')}</defs></svg>`;
 root.innerHTML=spriteDefs+`<section class="vault-stage" aria-label="Birthday vault"><div class="vault-heading">FAITH’S <b>BIRTHDAY VAULT</b></div><div class="vault-topline"><span class="vault-viewer"></span><span class="vault-count"></span></div><div class="vault-progress" aria-label="Chamber progress"></div><div class="vault-arrival-seal" aria-hidden="true">${vaultChamberGuideGlyph()}</div><div class="vault-machine">${vaultSVG()}</div><div class="vault-special-arrival" aria-hidden="true"><span class="special-arrival-seal">${vaultSpecialJewel(true)}</span>${Array.from({length:20},(_,i)=>`<i class="special-arrival-particle">${vaultSpecialJewel(i>=8&&(i-8)%3===0)}</i>`).join('')}<span class="special-arrival-title">BONUS VAULT</span></div><div class="vault-reveal"><small></small><div class="vault-cash-shell"><span class="vault-cash-icon" aria-hidden="true"></span><strong><span class="vault-cash-text"></span><i class="vault-cash-sheen" aria-hidden="true"></i></strong>${Array.from({length:16},(_,i)=>`<i class="vault-cash-spark" data-side="${i%2?'left':'right'}" aria-hidden="true"></i>`).join('')}</div><div class="vault-bonus-shell"><span class="vault-bonus"><span class="vault-bonus-icon" aria-hidden="true"></span><span class="vault-bonus-text"></span><i class="vault-bonus-sheen" aria-hidden="true"></i></span>${Array.from({length:8},(_,i)=>`<i class="vault-bonus-spark" data-side="${i<4?'left':'right'}" aria-hidden="true"></i>`).join('')}</div></div><div class="vault-loot-trail" aria-hidden="true">${Array.from({length:10},()=>`<i></i>`).join('')}</div><div class="vault-collection" aria-hidden="true">${Array.from({length:7},()=>`<i>${vaultCollectionGlyph()}</i>`).join('')}</div><div class="vault-final-gather" aria-hidden="true">${Array.from({length:6},()=>`<i>${piece(2)}</i>`).join('')}</div><div class="vault-final-rays" aria-hidden="true">${vaultFinaleRays()}</div><div class="vault-final-halo">${vaultHaloSVG()}</div><div class="vault-final-crest"></div><div class="vault-bankroll"><small>BANKROLL</small><strong>$0</strong><span class="vault-calculation"></span></div><div class="vault-particles" aria-hidden="true">${Array.from({length:100},(_,i)=>`<i>${piece(i)}</i>`).join('')}</div></section>`;
 const $=s=>root.querySelector(s),stage=$('.vault-stage'),els={viewer:$('.vault-viewer'),count:$('.vault-count'),progress:$('.vault-progress'),machine:$('.vault-machine'),reveal:$('.vault-reveal'),small:$('.vault-reveal small'),cash:$('.vault-reveal strong'),cashShell:$('.vault-cash-shell'),cashText:$('.vault-cash-text'),cashIcon:$('.vault-cash-icon'),cashSheen:$('.vault-cash-sheen'),bonus:$('.vault-bonus'),bonusShell:$('.vault-bonus-shell'),bonusIcon:$('.vault-bonus-icon'),bonusText:$('.vault-bonus-text'),bonusSheen:$('.vault-bonus-sheen'),bank:$('.vault-bankroll strong'),bankLabel:$('.vault-bankroll small'),calc:$('.vault-calculation'),halo:$('.vault-final-halo'),rays:$('.vault-final-rays'),crest:$('.vault-final-crest'),bankWrap:$('.vault-bankroll')},particles=[...root.querySelectorAll('.vault-particles i')],reduced=matchMedia('(prefers-reduced-motion: reduce)');
 els.machine.style.cssText=`left:${VAULT_ART.x}px;top:${VAULT_ART.y}px;width:${VAULT_ART.size}px;height:${VAULT_ART.size}px`;
 const original=$('.vault-original'),seal=$('.vault-arrival-seal'),specials=[...root.querySelectorAll('.vault-special')].map((el,i)=>({el,i,left:el.querySelector('.special-leaf-left'),right:el.querySelector('.special-leaf-right'),shades:[...el.querySelectorAll('.special-shade')],focus:el.querySelector('.special-focus'),lock:el.querySelector('.special-lock')}));
 const arrivalLayer=$('.vault-special-arrival'),arrivalSeal=$('.special-arrival-seal'),arrivalTitle=$('.special-arrival-title'),arrivalParticles=[...root.querySelectorAll('.special-arrival-particle')];
 const banks=[...root.querySelectorAll('.vault-bank')],trails=[...root.querySelectorAll('.vault-loot-trail i')];
 trails.forEach(el=>{el.innerHTML=vaultChamberGuideGlyph();});
 const rim=[...root.querySelectorAll('.rim-glint')].map(el=>({el,origin:el.getAttribute('transform')}));
 const chambers=[...root.querySelectorAll('.vault-chamber')].map((el,i)=>({el,i,slot:CHAMBER_SLOTS[i%5],left:el.querySelector('.chamber-leaf-left'),leftEdge:el.querySelector('.chamber-edge-left'),rightEdge:el.querySelector('.chamber-edge-right'),shades:[...el.querySelectorAll('.door-shade')],sheens:[...el.querySelectorAll('.door-sheen')],lock:el.querySelector('.chamber-lock-glint'),attention:el.querySelector('.chamber-attention'),right:el.querySelector('.chamber-leaf-right'),loot:el.querySelector('.chamber-loot'),glow:el.querySelector('.chamber-radiance'),focus:el.querySelector('.chamber-focus'),spark:el.querySelector('.chamber-spark'),award:el.querySelector('.chamber-award'),bonus:el.querySelector('.chamber-bonus-mark'),number:el.querySelector('.chamber-number'),dormant:el.querySelector('.chamber-dormant')}));
 const heading=$('.vault-heading'),topline=$('.vault-topline');
 const openingLayer=document.createElement('div');openingLayer.className='vault-opening-treasure';openingLayer.innerHTML='<small>YOUR STARTING TREASURE</small><strong class="opening-treasure-amount"></strong><span class="opening-treasure-sparks" aria-hidden="true"><i></i><i></i><i></i><i></i></span><div class="opening-treasure-chest">'+vaultOpeningChest()+'</div>';stage.append(openingLayer);
 const chestSparks=openingLayer.querySelector('.opening-treasure-sparks'),chestAmount=openingLayer.querySelector('strong'),chestLid=openingLayer.querySelector('.opening-chest-lid'),chestLock=openingLayer.querySelector('.opening-chest-lock'),chestPile=openingLayer.querySelector('.opening-chest-treasure'),chestHinges=openingLayer.querySelector('.opening-chest-hinges');
 const openingCoinLayer=document.createElement('div');openingCoinLayer.className='vault-opening-coins';openingCoinLayer.setAttribute('aria-hidden','true');openingCoinLayer.innerHTML=Array.from({length:5},()=>'<i>'+vaultCollectionGlyph()+'</i>').join('');stage.append(openingCoinLayer);const openingCoins=[...openingCoinLayer.children];

 const journeyLayer=document.createElement('div');journeyLayer.className='vault-journey';journeyLayer.innerHTML='<div class="journey-depth"><small>BONUS VAULT</small><strong></strong><span>'+Array.from({length:5},()=>'<i>'+vaultSpecialJewel()+'</i>').join('')+'</span></div><div class="journey-multiplier"><small>TOTAL BOOST</small><strong></strong></div>';stage.append(journeyLayer);
 const depthLabel=journeyLayer.querySelector('.journey-depth strong'),boostLabel=journeyLayer.querySelector('.journey-multiplier strong'),journeyGems=[...journeyLayer.querySelectorAll('i')];
 const openingPips=document.createElement('span');openingPips.className='vault-opening-pips';openingPips.setAttribute('aria-hidden','true');openingPips.innerHTML='<i></i><i></i><i></i>';els.bankWrap.append(openingPips);
 const catches=document.createElement('span');catches.className='vault-collection-catches';catches.setAttribute('aria-hidden','true');catches.innerHTML='<i></i><i></i>';els.bankWrap.append(catches);
 const gathers=[...root.querySelectorAll('.vault-final-gather i')];let gatherStyle=0;
 const welcomeLayer=document.createElement('div');welcomeLayer.className='vault-welcome-flow';welcomeLayer.setAttribute('aria-hidden','true');welcomeLayer.innerHTML=Array.from({length:6},()=>'<i>'+vaultChamberGuideGlyph()+'</i>').join('');stage.append(welcomeLayer);const welcomePieces=[...welcomeLayer.children];
 const treasure=document.createElement('div');treasure.className='vault-treasure';treasure.setAttribute('aria-hidden','true');treasure.innerHTML='<span class="vault-treasure-rim">'+vaultTreasureRing()+'</span><span class="vault-treasure-decor">'+vaultTreasureDecor()+'</span>'+Array.from({length:48},(_,i)=>'<i>'+piece(i%3===0?2:i)+'</i>').join('');stage.append(treasure);
 const treasureRim=treasure.querySelector('span'),treasurePieces=[...treasure.querySelectorAll('i')],laurelLeaves=[...treasure.querySelectorAll('.treasure-laurel-leaf')],laurelStems=[...treasure.querySelectorAll('.treasure-laurel-stem')],coronetGems=[...treasure.querySelectorAll('.treasure-coronet-gem')],coronetArc=treasure.querySelector('.treasure-jewel-arc'),coronetStar=treasure.querySelector('.treasure-coronet-star');let treasureStyle=0;
 const setPiece=(el,index)=>el.querySelector('use').setAttribute('href','#'+spritePrefix+(index%5));
 const storyFlight=document.createElement('div');storyFlight.className='vault-story-flight';storyFlight.setAttribute('aria-hidden','true');storyFlight.innerHTML='<span></span><b></b>';stage.append(storyFlight);let storyKind='';
 const receipt=document.createElement('div');receipt.className='vault-story-receipt';receipt.setAttribute('aria-label','How the total grew');receipt.innerHTML=Array.from({length:3},()=>'<div><small></small><strong></strong></div>').join('');stage.append(receipt);
 const coins=[...root.querySelectorAll('.vault-collection i')],catchStars=[...catches.children];let dockKey='',dock={left:130,right:290,y:386};
 const boostArt=document.createElement('span');boostArt.className='vault-boost-art';boostArt.setAttribute('aria-hidden','true');boostArt.innerHTML=vaultFinalBoostArt()+Array.from({length:12},(_,i)=>'<i data-side="'+(i%2?'right':'left')+'"></i>').join('');els.bonusShell.prepend(boostArt);
 const boostFlare=boostArt.querySelector('.boost-flare');
 const boostWings=[...boostArt.querySelectorAll('.boost-wing')],boostSeats=[...boostArt.querySelectorAll('.boost-seat')],boostBits=[...boostArt.querySelectorAll('i')];
 const pips=[...openingPips.children],bonusSparks=[...root.querySelectorAll('.vault-bonus-spark')],cashSparks=[...root.querySelectorAll('.vault-cash-spark')];
 let bonusKind='',cashLevel=-1;
 // OBS starts transparent until it receives a round, even before the first
 // connection callback. The private editor may show the idle art immediately.
 let snapshot=null,options={preview,show:true},raf,disposed=false,progressKey='',tier=-1,idleAt=null;
 const clock=createVaultClock();
 const resize=()=>{const next=`translate(-50%,-50%) scale(${Math.min(root.clientWidth/420,root.clientHeight/460)})`;if(stage.style.transform!==next)stage.style.transform=next;};
 // A changing prize must not resize/re-composite the entire OBS source.
 const observer=new ResizeObserver(entries=>{dockKey='';if(entries.some(e=>e.target===root))resize();});observer.observe(root);observer.observe(els.bank);resize();
 const text=(el,value)=>{if(el.textContent!==value)el.textContent=value;};
 function fit(el,text,max,width){if(el.textContent!==text)el.textContent=text;el.style.fontSize=Math.min(max,width/(Math.max(1,text.length)*.61))+'px';}
 // Measure the final amount once, so counting digits cannot resize a plaque,
 // change its font size, or move the coin landing points. No per-frame layout probe.
 const moneyMetrics=new Map(),moneyMeasure=document.createElement('canvas').getContext('2d');
 const clearMoneyMetrics=()=>moneyMetrics.clear();document.fonts?.ready.then(clearMoneyMetrics);document.fonts?.addEventListener('loadingdone',clearMoneyMetrics);
 function stableMoney(el,value,target,max,width){
  const size=Math.min(max,width/(Math.max(1,target.length)*.61)),key=size+':'+target;
  if(!moneyMetrics.has(key)){moneyMeasure.font=`700 ${size}px Fredoka,Arial,sans-serif`;moneyMetrics.set(key,Math.min(width+20,Math.ceil(moneyMeasure.measureText(target).width)+20));}
  text(el,value);el.style.fontSize=size+'px';el.style.width=moneyMetrics.get(key)+'px';
 }
 function render(){
  if(disposed)return;raf=requestAnimationFrame(render);
  const quiet=options.quiet??reduced.matches;
  const actualTime=options.frozenAt??clock.now(),presentation=vaultPresentation(snapshot?.round,actualTime),time=presentation.time,r=presentedVaultRound(presentation.round,time),p=snapshot?.widget??{chambers:5},finished=!!r&&r.completedAt!==null,now=projectedVault(r,time),readout=vaultBonusReadout(r,now,time),bonusPose=vaultBonusPose(r?.flight,time,quiet),cashPose=vaultCashPose(r?.flight,time,quiet),collection=vaultCollectionBank(r?.flight,time,quiet);
  const startingTreasure=vaultOpeningTreasure(r,time,quiet);
  const visible=options.show!==false&&(options.preview||!!r),exit=vaultExit(r,time,quiet),entrance=vaultIntro(r,time,quiet),welcome=vaultWelcomeFlow(r,time,quiet),opening=vaultOpeningHandoff(r,time,quiet),between=vaultChamberHandoff(r,time,quiet);
  stage.style.opacity=visible?exit.stage*(r?entrance.stage:vaultIdleOpacity(idleAt,time)):0;
  stage.setAttribute('aria-hidden',String(!visible||exit.done));
  if(!visible){if(!r)audio?.sync(null,time);return;}
  openingLayer.style.display=startingTreasure.active?'block':'none';openingLayer.style.opacity=startingTreasure.opacity;openingLayer.setAttribute('aria-hidden',String(!startingTreasure.active));openingLayer.dataset.phase=startingTreasure.phase;
  const openingMoney=r?money(r.openingCents):'';
  if(polishedOpeningTreasure(r))stableMoney(chestAmount,money(startingTreasure.cashCents??r.openingCents),openingMoney,42,270);
  else{chestAmount.style.width='';fit(chestAmount,openingMoney,42,270);}
  chestSparks.style.width=(parseFloat(chestAmount.style.width)||0)+24+'px';chestSparks.style.opacity=startingTreasure.cashGleam;
  chestAmount.style.boxShadow=startingTreasure.cashGleam?`inset 0 2px rgba(255,245,210,${.6+.4*startingTreasure.cashGleam}),inset 0 -2px #c28a80`:'';
  chestAmount.style.opacity=startingTreasure.prize;chestAmount.style.transform=`translate(-50%,${startingTreasure.prizeY}px)`;chestAmount.setAttribute('aria-hidden',String(!startingTreasure.prize));
  chestLid.setAttribute('transform',`translate(0 ${-22*startingTreasure.lid}) translate(53 55) scale(1 ${1-.18*startingTreasure.lid}) translate(-53 -55)`);
  chestLock.setAttribute('transform',`rotate(${startingTreasure.lock} 53 71)`);chestLock.style.opacity=startingTreasure.lockOpacity;chestHinges.style.opacity=startingTreasure.lid;chestPile.style.opacity=r?.openingCents>0?startingTreasure.lid:0;
  heading.style.opacity=topline.style.opacity=exit.heading*entrance.heading;
  seal.style.opacity=entrance.seal;
  els.machine.style.transform=`translateY(${entrance.machineY}px)`;
  pips.forEach((el,i)=>{el.style.opacity=entrance.pips[i];el.style.transform=`translateY(${entrance.pipY[i]}px)`;});
  stage.classList.toggle('is-finished',finished);stage.classList.toggle('is-opening',!!r?.flight);stage.classList.toggle('is-idle',!r);
  const allocated=now?.allocated??p.chambers,opened=finished?allocated:now?.opened.length??0,key=allocated+':'+opened+':'+(r?.flight?.index??'');
  if(key!==progressKey){els.progress.innerHTML=Array.from({length:allocated},(_,i)=>`<span class="vault-step ${i<opened?'done':i===opened&&r?.flight?'active':''}" aria-label="Chamber ${i+1}${i<opened?', unlocked':''}">${vaultLock(i<opened)}<b>${i+1}</b></span>`).join('');progressKey=key;}
  els.progress.style.setProperty('--steps',allocated);text(els.viewer,r?.viewer||'A LITTLE LUCK. A LOT OF GOLD.');text(els.count,finished?'VAULT CLEARED':r?readout.pendingExtra&&readout.remaining===0?'BONUS INCOMING':readout.remaining+' UNLOCK'+(readout.remaining===1?'':'S')+' LEFT':allocated+' CHAMBERS');
  els.count.style.transform=`scale(${bonusPose.countScale})`;
  const shot=r?.flight,age=shot?time-shot.startAt:0,finalAge=finished?time-r.completedAt:0,level=finished?vaultLevel(r):vaultLastShot(r)?vaultLevel(now):0;
  const coda=vaultTreasureCoda(r,time,quiet),bridge=vaultTreasureBridge(r,time,quiet),ornament=coda.enabled?{visible:coda.visible,kind:'final',level:coda.style,age:coda.age}:bridge.linked?{visible:bridge.active,kind:'final',level:bridge.style,age:bridge.age}:vaultTreasurePose(r,time,quiet),ornamentLead=bridge.linked?bridge.lead:0;
  stage.dataset.finishPhase=coda.enabled?coda.phase:'';
  const richness=vaultTreasurePose(r,time,quiet);treasureRim.style.opacity=richness.ring;treasure.style.opacity=exit.stage;
  const treasureFinal=finished?richness.level:0;if(treasureStyle!==treasureFinal){treasureStyle=treasureFinal;treasurePieces.forEach((el,i)=>setPiece(el,treasureFinal?vaultTreasureSpriteIndex(i,treasureFinal):i%3===0?2:i));particles.forEach((el,i)=>setPiece(el,treasureFinal?vaultTreasureSpriteIndex(i,treasureFinal):i));}
  laurelLeaves.forEach(el=>{const i=Number(el.dataset.step),tail=vaultTreasureRestOrnament(coda,i,'leaf'),o=vaultTreasureOrnament(ornament,i,'leaf',ornamentLead,tail.opacity),scale=o.scale*tail.scale;el.style.opacity=o.opacity;el.setAttribute('transform',`translate(${el.dataset.x} ${Number(el.dataset.y)+o.y+tail.y}) scale(${Number(el.dataset.side)*1.25*scale} ${1.25*scale})`);});
  laurelStems.forEach(el=>{const tail=vaultTreasureRestOrnament(coda,0,'stem');el.style.opacity=vaultTreasureOrnament(ornament,0,'stem',ornamentLead,tail.opacity).opacity;el.setAttribute('transform',`translate(0 ${tail.y})`);});
  coronetGems.forEach(el=>{const i=Number(el.dataset.step),tail=vaultTreasureRestOrnament(coda,i,'gem'),o=vaultTreasureOrnament(ornament,i,'gem',ornamentLead,tail.opacity);el.style.opacity=o.opacity;el.setAttribute('transform',`translate(${Number(el.dataset.x)+tail.x} ${Number(el.dataset.y)+o.y+tail.y}) scale(${o.scale})`);});
  const arcTail=vaultTreasureRestOrnament(coda,0,'arc');coronetArc.style.opacity=vaultTreasureOrnament(ornament,0,'arc',ornamentLead,arcTail.opacity).opacity;coronetArc.setAttribute('transform',`translate(0 ${arcTail.y})`);coronetStar.style.opacity=vaultTreasureOrnament(ornament,0,'star',ornamentLead).opacity;
  treasurePieces.forEach((el,i)=>{const gem=vaultTreasureParticle(richness,i);el.style.opacity=gem.opacity;el.style.transform=`translate(${gem.x}px,${gem.y}px) rotate(${gem.rotation}deg) scale(${gem.scale})`;});
  stage.dataset.tier=finished?String(level):'';
  const awardReadback=finished?(quiet?0:1-ease(finalAge/400)):1;
  rim.forEach(({el,origin},i)=>{const sparkle=rimSparkle(i,time,quiet);el.style.opacity=sparkle.opacity*(shot?.45:1)*exit.heading;el.setAttribute('transform',origin+` scale(${sparkle.scale})`);});
  const bankPose=between.linked?between.bank:vaultBankPose(r,time,quiet),births=chamberBirths(r),point=vaultRewardPoint(r,shot?.index??r?.opened.at(-1)?.index??0);
  const special=vaultSpecialScene(r,time,quiet),arrival=vaultSpecialArrival(r,time,quiet),arriving=arrival.active&&special.current?.index===arrival.theme.index;
  const journey=vaultJourney(r,time);
  journeyLayer.style.opacity=journey.visible?exit.heading:0;journeyLayer.setAttribute('aria-hidden',String(!journey.visible));
  journeyLayer.dataset.building=String(journey.building);journeyLayer.style.setProperty('--special-light',special.current?.light??'#ffd2e8');
  text(depthLabel,String(journey.number));text(boostLabel,'×'+journey.multiplier);
  journeyGems.forEach((el,i)=>{el.style.display=i<journey.level?'':'none';});
  const incoming=arriving?arrival.incoming:special.blend,outgoing=arriving?arrival.outgoing:1-special.blend;
  arrivalLayer.style.display=arrival.active?'':'none';arrivalLayer.style.setProperty('--special-light',arrival.theme?.light??'#ffd2e8');
  arrivalSeal.style.opacity=arrival.seal;arrivalTitle.style.opacity=arrival.title;arrivalTitle.style.transform=`translate(-50%,${arrival.titleY}px)`;
  text(arrivalTitle,arrival.chapter?'BONUS '+arrival.chapter.number+' · '+arrival.chapter.title:'BONUS VAULT');
  arrivalParticles.forEach((el,i)=>{const particle=vaultSpecialParticle(arrival,i,quiet);el.style.opacity=particle.opacity;el.style.transform=`translate(${particle.x}px,${particle.y}px) scale(${particle.scale})`;});
  original.style.opacity=special.current?(special.previous?0:outgoing):1;
  original.style.display=special.current&&special.blend===1?'none':'';
  specials.forEach(s=>{
   const current=s.i===special.current?.theme,previous=s.i===special.previous?.theme;
   const opacity=current?incoming:previous?outgoing:0;
   s.el.style.display=opacity>0?'inline':'none';s.el.style.opacity=opacity;
   s.el.style.filter=current&&arriving?`brightness(${1+.09*arrival.shine})`:'none';
   if(!opacity)return;
   const activeShot=current?special.shot:special.previousShot,pose=chamberPose(activeShot,time,quiet);
   pose.open*=1-exit.doors[4];
   const doors=vaultSpecialDoors(pose.open),finish=doorFinish(activeShot?time-activeShot.startAt:0,pose.open,quiet,activeShot?activeShot.finishAt-activeShot.startAt:undefined),edge=1-ease((pose.open-.94)/.06);
   s.left.setAttribute('transform',doors.left);s.right.setAttribute('transform',doors.right);s.left.style.opacity=s.right.style.opacity=edge;
   s.shades.forEach(el=>el.style.opacity=finish.shade);
   const ready=current&&!activeShot,prepared=current&&between.linked&&between.link.index===special.current.index;
   s.focus.style.opacity=finished?0:Math.max(prepared?between.focuses[special.current.index]*.5:ready?.15:finish.focus*.5,current&&arriving?arrival.rim*(.28+.035*arrival.chapter.level):0);
   s.lock.style.opacity=quiet?0:Math.max(finish.lock*.8,prepared?between.lock:0);
  });
  if(bankPose.bank>0&&bankPose.blend>0&&!finished&&!special.current)els.count.textContent='WING '+(bankPose.bank+1)+' · '+(r?readout.remaining:allocated)+' LEFT';
  if(special.current&&!finished)els.count.textContent=readout.remaining+' UNLOCK'+(readout.remaining===1?'':'S')+' LEFT';
  stage.dataset.vault=special.current?.key??'crown';
  banks.forEach((bank,i)=>{const current=i===bankPose.bank,previous=i===bankPose.previous;bank.style.display=current||previous?'':'none';bank.style.opacity=current?bankPose.blend:previous?1-bankPose.blend:0;});
  chambers.forEach(c=>{
   if(Math.floor(c.i/5)!==bankPose.bank&&Math.floor(c.i/5)!==bankPose.previous)return;
   const eligible=c.i<allocated,current=c.i===shot?.index,award=r?.opened.find(s=>s.index===c.i)??(current?shot:null),pose=chamberPose(award,time,quiet);
   if(finished&&r.celebrationPreview)pose.open=pose.bolt=1;
   pose.open*=1-exit.doors[c.i%5];
   const born=births.get(c.i),birth=vaultBonusBirth(born,time,quiet);
   c.el.style.opacity=1;
   c.dormant.style.display=eligible&&birth.opacity===1?'none':'';c.dormant.style.opacity=eligible?1-birth.opacity:1;c.number.style.opacity=eligible?birth.opacity:0;
   c.number.setAttribute('transform',`translate(${c.slot.numberX} ${c.slot.numberY}) scale(${birth.scale})`);
   const doors=chamberDoorTransforms(c.i,pose.open),edgeOpacity=1-ease((pose.open-.91)/.09),finish=doorFinish(award?time-award.startAt:0,pose.open,quiet,award?award.finishAt-award.startAt:undefined);
   c.left.setAttribute('transform',doors.left);c.left.style.opacity=edgeOpacity;
   c.leftEdge.setAttribute('transform',doors.leftEdge);c.leftEdge.style.opacity=finish.edge;
   if(c.right){c.right.setAttribute('transform',doors.right);c.right.style.opacity=edgeOpacity;c.rightEdge.setAttribute('transform',doors.rightEdge);c.rightEdge.style.opacity=finish.edge;}
   c.shades.forEach(el=>el.style.opacity=finish.shade);
   c.sheens.forEach(el=>{el.style.opacity=finish.sheen;el.setAttribute('transform',`translate(${c.slot.x-c.slot.w+finish.sweep*c.slot.w*2} 0)`);});
   c.lock.style.opacity=Math.max(finish.lock*.85,eligible&&c.i<5?entrance.locks[c.i]*.85:0,c.i===0&&opening.linked?opening.lock:0,between.linked&&c.i===between.link.index?between.lock:0,birth.lock);
   c.attention.style.opacity=between.linked?between.attention[c.i]:opening.linked?(c.i===0?0:opening.attention):shot&&!current?.18*(1-ease((time-shot.finishAt+480)/480)):0;
   c.glow.style.opacity=pose.glow*.12;c.loot.style.opacity=1-pose.loot;c.focus.style.opacity=Math.max(birth.glow,between.linked?between.focuses[c.i]:c.i===0&&opening.linked?opening.focus:current?finish.focus*.85:0);c.focus.style.stroke=birth.glow?'#c2ffe3':'';c.spark.style.opacity=quiet?0:pose.glow*.75;
   const revealed=eligible&&award&&time>=award.revealAt;
   c.number.dataset.state=current?'active':revealed?'open':'closed';
   const label=revealed?money(award.cashCents):'';if(c.award.textContent!==label)c.award.textContent=label;
   const bonusLabel=revealed&&award.bonus&&time>=vaultBonusAt(award)+VAULT_BONUS_LAND_MS?(award.bonus.kind==='multiply'?'×'+award.bonus.value:'+1'):'';if(c.bonus.textContent!==bonusLabel)c.bonus.textContent=bonusLabel;c.bonus.style.opacity=(quiet?1:ease((time-(award?.finishAt??time)+240)/240))*(current?1:vaultOtherAwardOpacity(shot,time,quiet))*exit.labels*awardReadback;
c.award.setAttribute('font-size',Math.min(c.i%5===4?50:58,(c.i%5===4?200:310)/(Math.max(1,c.award.textContent.length)*.61)));
   c.award.style.opacity=revealed?(quiet?1:ease((time-award.finishAt+240)/240))*(current?1:vaultOtherAwardOpacity(shot,time,quiet))*exit.labels*awardReadback:0;
  });
  [...els.progress.children].forEach((el,i)=>{const born=births.get(i),arrive=born===undefined||quiet?1:clamp((time-born)/400);el.style.transform=`scale(${1+Math.sin(arrive*Math.PI)*.25})`;el.classList.toggle('in-bank',Math.floor(i/5)===bankPose.bank);});
  const showingShot=shot&&time>=shot.revealAt,reward=showingShot?shot:null,pose=chamberPose(shot,time,quiet);
  els.reveal.style.opacity=finished?0:reward?(quiet?1:pose.reward):0;
  els.reveal.setAttribute('aria-hidden',String(!reward||finished));
  els.reveal.style.left=(reward?Math.max(8,Math.min(192,point.x-110)):100)+'px';els.reveal.style.right='auto';els.reveal.style.width='220px';els.reveal.style.top=(reward?Math.max(112,Math.min(255,point.y-39)):170)+'px';
  els.reveal.classList.toggle('has-bonus',!!reward?.bonus);
  text(els.small,reward?(reward.index+1)+' · '+(vaultSpecialTheme(r,reward.index)?.name??chamberTheme(reward.index).name):'OPENING BALANCE');
  const cashText=reward?'+'+money(reward.cashCents):money(r?.openingCents??0),showCashIcon=cashText.length<=7;
  fit(els.cashText,cashText,cashPose.fontSize,showCashIcon?158:184);
  els.cashShell.dataset.level=cashPose.level;els.cashShell.style.transform=`translateY(${cashPose.y}px) scale(${cashPose.scale})`;
  els.cashIcon.style.display=showCashIcon?'':'none';
  if(cashLevel!==cashPose.level){els.cashIcon.innerHTML=vaultCashGlyph(cashPose.level);cashLevel=cashPose.level;}
  els.cashSheen.style.opacity=cashPose.shine;els.cashSheen.style.left=(cashPose.sweep*110-10)+'%';
  cashSparks.forEach((el,i)=>{const spark=vaultCashSpark(i,cashPose,shot,time,quiet);el.style.opacity=spark.opacity;el.style.width=spark.width+'px';el.style.transform=`translate(${spark.x}px,${spark.y}px)`;});
  const kind=reward?.bonus?.kind??'',boost=reward?vaultFinalBoost(r):0,boostPose=vaultFinalBoostPose(boost,shot,time,quiet);
  els.bonusShell.dataset.finalBoost=String(boost);
  boostArt.style.opacity=boostPose.opacity;boostFlare.style.opacity=boostPose.burst;
  boostWings.forEach(el=>{el.style.transform=`translateY(${Math.round(4*(1-boostPose.wing))}px)`;});
  boostSeats.forEach(el=>{el.style.opacity=boostPose.gems[Number(el.dataset.seat)];});
  boostBits.forEach((el,i)=>{const p=vaultFinalBoostSpark(i,boost,boostPose);el.style.opacity=p.opacity;el.style.transform=`translate(${p.x}px,${p.y}px)`;});
  els.bonusShell.style.display=kind?'':'none';els.bonusShell.dataset.kind=kind;
  text(els.bonusText,kind?(kind==='multiply'?'×'+reward.bonus.value+(bonusPose.building?(boost?' BOOST':' INCOMING'):' TOTAL'):'+1 UNLOCK'):'');
  els.bonusShell.dataset.building=String(bonusPose.building);
  els.bonus.dataset.kind=kind;els.bonusShell.style.opacity=bonusPose.opacity;
  els.bonusShell.setAttribute('aria-hidden',String(!bonusPose.visible));
  els.bonusShell.style.transform=`translateY(${boost?0:bonusPose.y}px) scale(${boost?1:bonusPose.scale})`;
  if(kind+boost!==bonusKind){els.bonusIcon.innerHTML=boost?vaultFinalBoostGlyph(boost):vaultBonusGlyph(kind);bonusKind=kind+boost;}
  els.bonusIcon.querySelectorAll('.bonus-gem').forEach(g=>g.setAttribute('transform',`translate(${Number(g.dataset.x)+Number(g.dataset.side)*bonusPose.iconOffset} 0)`));
  els.bonusSheen.style.opacity=bonusPose.shine;els.bonusSheen.style.left=(bonusPose.sweep*110-10)+'%';
  bonusSparks.forEach((el,i)=>{const spark=vaultBonusSpark(i,bonusPose,shot,time,quiet);el.style.opacity=boost?0:spark.opacity;el.style.transform=`translate(${spark.x}px,${spark.y}px)`;});
  if(finished&&level!==tier){els.crest.innerHTML=[giftFinalBadge,giftFinalBow,crownVaultCrest][level]();const width=[84,100,116][level],height=[68,80,92][level];els.crest.style.width=width+'px';els.crest.style.height=height+'px';els.crest.style.left=(210-width/2)+'px';els.crest.style.top=(242-height)+'px';tier=level;}
  const finale=finalePose(finalAge,level,quiet),build=finale.build,handoff=vaultHandoff(r,time,level,quiet);
  const dim=handoff.linked?handoff.dim:finished?finale.dim:0;
  // Composite one opacity layer instead of re-filtering the large pixel-art
  // SVG on every opening/finale frame in OBS's embedded browser.
  els.machine.style.opacity=exit.machine*entrance.frame*(1-dim*.2)*(1-startingTreasure.dim);
  els.bankWrap.style.transition='none';els.bankWrap.style.bottom=(handoff.linked?handoff.bottom:finished?9+63*(quiet?1:ease(finalAge/400)):9)+'px';
  els.bankWrap.style.transform=`translateY(${-exit.lift}px)`;
  els.halo.style.opacity=finished?finale.halo*exit.halo*(coda.enabled?coda.haloGain:1):0;
  els.halo.style.transform=`translateY(${finale.rise}px)`;
  els.crest.style.opacity=finished?finale.crest*exit.crest:0;els.crest.style.transform=`translateY(${finale.crestY+exit.crestY}px) scale(${finale.crestScale})`;
  els.rays.style.opacity=finished?finale.flare*exit.halo:0;els.rays.style.transform=`scale(${finale.flareScale})`;
  text(els.bankLabel,finished&&(!handoff.linked||handoff.showTitle)?['VAULT TOTAL','BIG WIN','ROYAL WIN'][level]:entrance.active&&!entrance.bankTitle?'OPENING BALANCE':'BANKROLL');
  els.bankLabel.style.opacity=handoff.linked?handoff.titleOpacity:entrance.title;
  const total=startingTreasure.active?startingTreasure.bankCents:readout.total;
  const openingBank=polishedOpeningTreasure(r)&&!r.opened.length&&(!r.flight||time<r.flight.revealAt);
  if(openingBank)stableMoney(els.bank,money(total),openingMoney,50,340);
  else{els.bank.style.width=startingTreasure.active?Math.min(340,Math.max(110,openingMoney.length*32+24))+'px':'';
   fit(els.bank,entrance.pending?'···':r?money(total):'$ —',handoff.linked?handoff.fontSize:finished?50+18*(quiet?1:ease(finalAge/440)):50,340);
  }
  els.bank.setAttribute('aria-hidden',String(entrance.pending));
  els.bank.style.opacity=handoff.linked?1:finished?finale.amount:entrance.amount;
  els.bank.style.transform=handoff.linked?`scale(${handoff.pulse+(finished?finale.scale-1:0)})`:finished?`translateY(${finale.rise}px) scale(${finale.scale})`:`translateY(${entrance.amountY}px) scale(${entrance.amountScale})`;
  const emphasis=Math.max(cashPose.bankScale,bonusPose.bankScale,collection.scale);
  if(emphasis!==1)els.bank.style.transform+=` scale(${emphasis})`;
  els.bank.style.color=handoff.linked?handoff.color:'';
  els.bank.style.backgroundColor=handoff.linked?handoff.background:'';
  els.bank.style.boxShadow=handoff.linked?`inset 0 2px rgba(255,236,174,${.6+.4*handoff.gleam}),inset 0 -2px #a56788`:entrance.active?`inset 0 ${1+entrance.gleam}px rgb(${234+21*entrance.gleam} ${201+35*entrance.gleam} ${154+20*entrance.gleam}),inset 0 -2px #8a5d81`:'';
  if(startingTreasure.bankGleam)els.bank.style.boxShadow=`inset 0 2px rgba(255,239,181,${.6+.4*startingTreasure.bankGleam}),inset 0 -2px #bc8f68`;
  if(cashPose.gleam)els.bank.style.boxShadow=`inset 0 2px rgba(255,235,173,${.5+.5*cashPose.gleam}),inset 0 -2px #a57968`;
  if(collection.gleam)els.bank.style.boxShadow=`inset 0 2px rgba(255,239,181,${.55+.45*collection.gleam}),inset 0 -2px #bc8f68`;
  if(bonusPose.gleam)els.bank.style.boxShadow=`inset 0 2px rgba(241,210,255,${.65+.35*bonusPose.gleam}),inset 0 -2px #a567a7`;
  if(coda.bankGleam)els.bank.style.boxShadow=`inset 0 2px rgba(255,245,205,${.6+coda.bankGleam}),inset 0 -2px #a56788`;
  const story=vaultStory(r,time,quiet);
  text(els.calc,startingTreasure.active?(startingTreasure.ready?'First chamber ready':startingTreasure.guiding?'Preparing the first chamber…':startingTreasure.deposit?(startingTreasure.settled?'Starting treasure added to bankroll':'Adding your starting treasure…'):startingTreasure.phase==='deposit'?'Collecting your starting treasure…':startingTreasure.prize>0?(startingTreasure.cashCents===r.openingCents?'Treasure found · '+openingMoney:'Revealing your starting treasure…'):'Unlocking your starting treasure…'):story.text);els.calc.dataset.kind=story.kind;
  els.calc.style.marginTop=handoff.linked?handoff.gap+'px':'';
  els.calc.style.opacity=exit.labels*entrance.calc;
  els.calc.setAttribute('aria-hidden',String(entrance.calc===0));
  els.calc.style.fontSize=Math.min(14,376/(els.calc.textContent.length*.56))+'px';
  // Measure when text, size or position changes. Dock outside the plaque so even
  // very large totals stay unobstructed; all positions remain in stage pixels.
  const nextDockKey=els.bank.textContent+':'+els.bank.style.fontSize+':'+els.calc.style.fontSize+':'+els.bankWrap.style.bottom+':'+els.bank.style.width;
  if(nextDockKey!==dockKey){dockKey=nextDockKey;dock={left:Math.max(14,els.bankWrap.offsetLeft+els.bank.offsetLeft-8),right:Math.min(406,els.bankWrap.offsetLeft+els.bank.offsetLeft+els.bank.offsetWidth+8),y:els.bankWrap.offsetTop+els.bank.offsetTop+12};}
  const payoff=vaultMultiplierPayoff(r,time),tokenDock=payoff.linked?vaultPayoffDock(dock):dock;
  const anchor=payoff.linked?vaultStoryFlight({shot:payoff.boost},payoff.catchAt,vaultRewardPoint(r,payoff.boost.index),tokenDock,quiet):undefined;
  const storyToken=vaultPayoffFlight(payoff,vaultStoryFlight(story,time,point,tokenDock,quiet),time,tokenDock,quiet,anchor);
  if(storyKind!==storyToken.kind){storyKind=storyToken.kind;storyFlight.querySelector('span').innerHTML=vaultStoryGlyph(storyKind);}
  text(storyFlight.querySelector('b'),storyToken.label);storyFlight.dataset.kind=storyToken.kind;
  storyFlight.style.opacity=finished&&!payoff.linked?0:storyToken.opacity;storyFlight.style.transform=`translate(${storyToken.x}px,${storyToken.y}px) scale(${storyToken.scale})`;
  if(storyToken.kind==='extra'&&storyToken.catch)els.count.style.transform=`scale(${1+.08*storyToken.catch})`;
  receipt.setAttribute('aria-hidden',String(!story.receipt.length));
  [...receipt.children].forEach((el,i)=>{const item=story.receipt[i];el.style.opacity=(item?.opacity??0)*vaultReceiptExit(r,time,i,quiet);el.style.transform=`translateY(${item?.y??0}px) scale(${item?.scale??1})`;el.dataset.kind=item?.kind??'';text(el.querySelector('small'),item?.label??'');fit(el.querySelector('strong'),item?.value??'',21,105);});
  trails.forEach((el,i)=>{const openingGuide=vaultOpeningTrail(r,i,time,quiet,dock),guide=openingGuide.visible?openingGuide:vaultChamberTrail(between,i,time,quiet,dock,between.linked&&vaultSpecialTheme(r,between.link.index)?VAULT_SPECIAL_POINT:null),t=guide;el.dataset.guide=String(guide.visible);el.dataset.relay=String(!openingGuide.visible&&guide.visible);el.style.opacity=t.visible&&!finished?t.opacity:0;el.style.transform=`translate(${t.x}px,${t.y}px)`;});
  coins.forEach((el,i)=>{const coin=vaultCollectionCoin(shot,i,time,dock,quiet,point);el.style.opacity=finished?0:coin.opacity;el.style.transform=`translate(${coin.x}px,${coin.y}px) scale(${coin.flip},${coin.squash})`;});
  welcomePieces.forEach((el,i)=>{const spark=vaultWelcomeParticle(welcome,i,dock);el.style.opacity=spark.opacity;el.style.transform=`translate(${spark.x}px,${spark.y}px)`;});
  openingCoins.forEach((el,i)=>{const coin=vaultOpeningCoin(startingTreasure,i,dock,quiet||!r?.openingCents);el.style.opacity=coin.opacity;el.style.transform=`translate(${coin.x}px,${coin.y}px) scaleX(${coin.flip})`;});
  const bankCatch=Math.max(collection.catch,welcome.catch,startingTreasure.catch);
  catchStars.forEach((el,i)=>{const light=finished?coda.catches?.[i]??0:bankCatch;el.style.opacity=light;el.style.left=(i?dock.right:dock.left)-els.bankWrap.offsetLeft+'px';el.style.top=(dock.y-els.bankWrap.offsetTop)+'px';el.style.transform=`scale(${.6+light*.4})`;});
  const nextGatherStyle=bridge.linked?bridge.style:0;if(gatherStyle!==nextGatherStyle){gatherStyle=nextGatherStyle;gathers.forEach((el,i)=>setPiece(el,gatherStyle?vaultTreasureSpriteIndex(i,gatherStyle):2));}
  gathers.forEach((el,i)=>{const g=bridge.linked?vaultTreasureBridgeParticle(bridge,i,time,dock):vaultFinaleGather(r,i,time,level,quiet,dock);el.style.opacity=g.opacity;el.style.transform=`translate(${g.x}px,${g.y}px)`;});
  const burstAge=finished?finalAge-build:shot?time-shot.revealAt:10000;
  particles.forEach((el,i)=>{const particle=finished?vaultParticle(i,burstAge,{final:finished,level:finished?level:0,x:finished?210:point.x,y:finished?220:point.y,quiet}):{visible:false,opacity:0,x:0,y:0,rotation:0};el.style.opacity=particle.visible&&!(treasureFinal===1&&i>=52)?particle.opacity:0;el.style.transform=`translate(${particle.x}px,${particle.y}px) rotate(${particle.rotation}deg)`;});
  audio?.sync(snapshot?.round,actualTime);
 }
 render();
 return {update(next,opts={}){
  clock.receive(next.serverNow);
  const time=opts.frozenAt??clock.now();
  if(snapshot?.round&&!next.round)idleAt=vaultResetAt(presentedVaultRound(snapshot.round,time),time);
  else if(next.round)idleAt=null;
  snapshot=next;options={preview,show:true,...opts};
 },hide(){options.show=false;},dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();document.fonts?.removeEventListener('loadingdone',clearMoneyMetrics);}};
}
