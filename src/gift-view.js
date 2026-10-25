import {activeGiftSVG} from './gift-concept-art.js';
import {money,giftTotal,prizeLabel,projectedGiftRound,giftDimensions,isGiftExpansion,giftBonusName,giftPickLabel} from './gift-game.js';
import {giftBonusMotion,giftCellMotion,giftBonusBands,pixelBandPath} from './gift-bonus-motion.js';
import {FINALE_PARTICLES,giftFinaleMotion,giftConfetti,pixelConfettiPath,giftFinalGleam} from './gift-finale-motion.js';
import {giftUnwrapMotion,applyGiftUnwrap} from './gift-unwrap-motion.js';
import {giftPrizeMotion,giftPrizeSpark,applyGiftPrize,PRIZE_COLORS} from './gift-prize-motion.js';
import {giftPrizeEmblem} from './gift-prize-art.js';
import {presentedGiftRound,giftFinishMotion,giftFinishSpark} from './gift-finish-motion.js';
import {giftIntroMotion,giftIntroCell,giftIntroLight,GIFT_INTRO_LIGHTS} from './gift-intro-motion.js';
import {isGiftOpeningPick,giftOpeningFocus} from './gift-opening-handoff.js';
import {createGiftPresence} from './gift-exit-motion.js';
import {giftFinalFrame,giftFinalCrown,giftFinalBow,giftFinalBadge} from './gift-finale-art.js';

const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function createGiftView(root,{interactive=false,onPick=()=>{},onReady=()=>{},onError=()=>{},audio=null,art=activeGiftSVG}={}){
 root.innerHTML=`<section class="gift-stage" aria-label="Faith’s gift game"><div class="gift-head"><span>FAITH’S <b>GIFT PILE</b><i aria-hidden="true">✦</i></span><span class="gift-count"></span></div><div class="gift-caption"><span class="gift-viewer"></span><small class="gift-board-size"></small></div><div class="gift-board" aria-label="Wrapped presents"></div><div class="gift-toast" aria-live="polite"><strong></strong><span></span></div><div class="gift-footer"><div><small>COLLECTED</small><strong class="gift-subtotal">$0</strong></div><div class="gift-multiplier"><small>MULTIPLIER</small><strong>×1</strong></div><div class="gift-running"><small>TOTAL SO FAR</small><strong>$0</strong></div></div><div class="gift-finale" hidden><i class="gift-final-frame" aria-hidden="true"></i><i class="gift-final-sheen" aria-hidden="true"></i><span class="gift-final-star" aria-hidden="true"></span><span class="gift-final-rank"><b></b><i aria-hidden="true"><em></em><em></em><em></em></i></span><span class="gift-royal-build" hidden><b>Here it comes…</b><i aria-hidden="true"><em></em><em></em><em></em></i></span><small></small><strong></strong><p></p><span class="gift-final-count"></span></div></section>`;
 const $=s=>root.querySelector(s),stage=$('.gift-stage'),board=$('.gift-board'),buttons=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const bands=document.createElementNS('http://www.w3.org/2000/svg','svg');bands.setAttribute('class','gift-bonus-bands');bands.setAttribute('viewBox','0 0 396 314');bands.setAttribute('aria-hidden','true');bands.innerHTML='<path/><path/>';stage.insertBefore(bands,board);
 const introLights=document.createElementNS('http://www.w3.org/2000/svg','svg');introLights.setAttribute('class','gift-intro-lights');introLights.setAttribute('viewBox','0 0 396 314');introLights.setAttribute('aria-hidden','true');introLights.innerHTML=GIFT_INTRO_LIGHTS.map(([x,y],i)=>`<g opacity="0"><path d="M${x} ${y}h4v4h-4Z" fill="${i%3===0?'#ffb8d7':'#f6cf86'}"/><path d="M${x} ${y}h2v1h-2Z" fill="#fff3d5"/></g>`).join('');stage.insertBefore(introLights,board);
 const confetti=document.createElementNS('http://www.w3.org/2000/svg','svg');confetti.setAttribute('class','gift-final-confetti');confetti.setAttribute('viewBox','0 0 420 460');confetti.setAttribute('aria-hidden','true');confetti.innerHTML='<path/>'.repeat(FINALE_PARTICLES);stage.insertBefore(confetti,$('.gift-finale'));
 const finishTrail=document.createElementNS('http://www.w3.org/2000/svg','svg');finishTrail.setAttribute('class','gift-finish-trail');finishTrail.setAttribute('viewBox','0 0 420 460');finishTrail.setAttribute('aria-hidden','true');
 finishTrail.innerHTML=Array.from({length:3},(_,i)=>i===0?'<g><path d="M2 0h2v2h2v2H4v2H2V4H0V2h2Z"/><path d="M2 1h2v2H2Z" fill="#fff6db"/></g>':'<g><path d="M0 0h4v4H0Z"/><path d="M0 0h2v1H0Z" fill="#fff6db"/></g>').join('');stage.insertBefore(finishTrail,$('.gift-finale'));
 $('.gift-final-frame').innerHTML=giftFinalFrame();$('.gift-final-star').innerHTML=giftFinalCrown();
 const gleams=document.createElementNS('http://www.w3.org/2000/svg','svg');gleams.setAttribute('class','gift-final-gleams');gleams.setAttribute('viewBox','0 0 364 228');gleams.setAttribute('aria-hidden','true');
 gleams.innerHTML=[[20,24],[336,196],[338,24],[18,196],[44,8],[310,214]].map(([x,y])=>`<path d="M${x} ${y}h2v3h3v2h-3v3h-2v-3h-3v-2h3Z"/>`).join('');$('.gift-finale').append(gleams);
 const toast=$('.gift-toast');toast.innerHTML='<i class="gift-prize-emblem" aria-hidden="true"></i><strong></strong><span class="gift-toast-detail"></span><i class="gift-title-spark" aria-hidden="true"></i>';
 let snapshotRound=null,preset=null,offset=0,preview=false,canPick=false,show=true,raf=0,disposed=false,ready=false,oldRoundId=null,oldPrizeKind=null,oldFinalLevel=null;
 const presence=createGiftPresence();
 const resize=()=>{const s=Math.min(root.clientWidth/420,root.clientHeight/460);stage.style.transform=`translate(-50%,-50%) scale(${s})`;};
 const observer=new ResizeObserver(resize);observer.observe(root);resize();
 // Inline gift art needs no character downloads. Defer readiness until callers initialize.
 void Promise.resolve().then(()=>{if(disposed)return;ready=true;onReady();render();}).catch(onError);
 function render(){
  cancelAnimationFrame(raf);if(!preset)return;const time=Date.now()+offset,round=presentedGiftRound(snapshotRound,time),shown=projectedGiftRound(round,time),flight=round?.flight,age=flight?time-flight.startAt:0,finished=round?.completedAt!==null&&!!round;
  const display=presence(preset.id,round,time,{preview,show,reduced:reduced.matches}),exit=display.exit,visible=display.visible;
  stage.style.setProperty('--presence-opacity',String(display.opacity));
  stage.classList.toggle('stage-visible',visible);stage.classList.toggle('stage-finished',finished);stage.setAttribute('aria-hidden',String(!visible));
  const finish=giftFinishMotion(round,time,reduced.matches);
  for(const [key,value,unit]of [['finish-board',finish.board*exit.back,''],['finish-footer',finish.footer*exit.back,''],['finish-header',finish.header*exit.back,''],['finish-toast',finish.toast,''],['finish-toast-y',finish.toastY,'px'],['finish-plaque',finish.plaque*exit.plaque,''],['finish-content',finish.content*exit.content,'']])stage.style.setProperty('--'+key,value+unit);
  finishTrail.style.display=finish.linked&&!reduced.matches?'':'none';finishTrail.style.fill=PRIZE_COLORS[finish.shot?.prize.kind]??PRIZE_COLORS.cash;
  [...finishTrail.children].forEach((g,i)=>{const p=giftFinishSpark(finish,i,round,time,reduced.matches);g.setAttribute('opacity',String(p?.opacity??0));if(p)g.setAttribute('transform',`translate(${p.x-Math.floor(p.size/2)} ${p.y-Math.floor(p.size/2)})`);});
  const {rows,cols}=giftDimensions(shown??preset),remaining=shown?.remaining??preset.picks,bonus=giftBonusMotion(round,time,reduced.matches);
  const intro=giftIntroMotion(round,time,reduced.matches),openingPick=isGiftOpeningPick(round),focus=giftOpeningFocus(round,time,reduced.matches);
  introLights.style.display=intro?'':'none';if(intro)[...introLights.children].forEach((g,i)=>g.setAttribute('opacity',String(giftIntroLight(i,intro))));
  stage.classList.toggle('gift-intro-active',!!intro);
  stage.style.setProperty('--bonus-color',bonus?.color??'#ffe8ad');stage.style.setProperty('--bonus-pop',String(bonus?.pop??0));
  stage.classList.toggle('gift-bonus-active',!!bonus);bands.style.opacity=String(bonus?.trace??0);
  const traces=giftBonusBands(bonus);[...bands.children].forEach((path,i)=>path.setAttribute('d',traces[i]?pixelBandPath(traces[i]):''));
  $('.gift-count').textContent=finished||finish.active?'ROUND COMPLETE':remaining+' PICK'+(remaining===1?'':'S')+' LEFT';
  $('.gift-viewer').textContent=round?.viewer?'FOR '+round.viewer:finished?'A LITTLE LUCK, ALL YOURS':flight?'UNWRAPPING…':'PICK A LITTLE MAGIC';
  $('.gift-board-size').textContent=rows+' × '+cols;$('.gift-board-size').setAttribute('aria-label',rows+' rows, '+cols+' columns');
  const boardIdentity=(round?.id??'preview')+':'+preset.id+':'+preset.side;
  if(oldRoundId!==boardIdentity){board.replaceChildren();buttons.clear();oldRoundId=boardIdentity;}
  const opened=new Map(shown?.opened.map(s=>[s.cell,s])??[]);
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const id=row+':'+col,shot=opened.get(id),active=flight?.cell===id;let b=buttons.get(id);
   if(!b){b=document.createElement('button');b.type='button';b.className='gift-cell';b.dataset.cell=id;b.innerHTML=art(row*3+col)+`<span class="gift-pick-focus" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="gift-glints" aria-hidden="true">${'<i></i>'.repeat(8)}</span><span class="gift-cell-prize"><span class="gift-cell-main"></span><small class="gift-cell-detail"></small></span><span class="gift-cell-number"></span><span class="gift-spawn-glints" aria-hidden="true">${Array.from({length:6},(_,i)=>`<i style="--angle:${i*60}deg"></i>`).join('')}</span>`;b.addEventListener('click',()=>onPick(id));board.append(b);buttons.set(id,b);}
   b.style.setProperty('--focus-opacity',String(active?focus.opacity:0));b.style.setProperty('--focus-inset',focus.inset+'px');
   b.classList.toggle('candy-unwrap',!!b.querySelector('svg[data-unwrap="candy"]'));
   const arrival=giftCellMotion(row,col,rows,cols,bonus),opening=giftIntroCell(row,col,intro);
   b.classList.toggle('gift-intro-cell',!!intro&&!active);b.style.setProperty('--intro-color',['#ffe4a2','#ffb8d7','#d4bbf4'][(row+col)%3]);
   Object.assign(b.style,{left:arrival.left+'px',top:arrival.top+'px',width:arrival.width+'px',height:arrival.height+'px',transform:`translate(${arrival.x}px,${arrival.y+opening.y}px) scale(${arrival.sx*opening.scale},${arrival.sy*opening.scale})`});
   b.style.setProperty('--arrival-opacity',String(arrival.opacity*opening.opacity));b.style.setProperty('--spawn-opacity',String(Math.max(arrival.spark,opening.spark)));b.style.setProperty('--spawn-radius',(intro?Math.round(Math.min(arrival.width,arrival.height)*opening.radius):arrival.radius)+'px');b.classList.toggle('gift-new',arrival.newCell);
   const expansion=shot&&isGiftExpansion(shot.prize.kind),label=shot?(expansion?{extra:'GROW',row:'ROW',column:'COL'}[shot.prize.kind]:prizeLabel(shot.prize)):'';b.style.setProperty('--prize-size',Math.min(26,arrival.height*106/314,(arrival.width*.88)/(Math.max(1,label.length)*.55))+'px');b.dataset.kind=shot?.prize.kind??'';
   b.disabled=!interactive||!ready||!canPick||!!snapshotRound?.flight||finished||!!shot;b.tabIndex=interactive?0:-1;
   b.setAttribute('aria-label',shot?'Opened present: '+prizeLabel(shot.prize):`Open present, row ${row+1}, column ${col+1}`);
   b.classList.toggle('gift-opened',!!shot);b.classList.toggle('gift-opening',active);b.classList.toggle('gift-special',!!shot&&shot.prize.kind!=='cash');
   b.querySelector('.gift-cell-number').textContent=shot?'':String.fromCharCode(65+row)+(col+1);
   b.querySelector('.gift-cell-main').textContent=label;b.querySelector('.gift-cell-detail').textContent=expansion?giftPickLabel(shot.prize):'';
   if(b.classList.contains('candy-unwrap'))applyGiftUnwrap(b,giftUnwrapMotion(active?flight:null,time,{opened:!!shot,reduced:reduced.matches,opening:active&&openingPick}));
   else {
    const shake=active&&age<650&&!reduced.matches?Math.sin(age/28)*Math.sin(Math.PI*age/650)*3:0,lift=active?ease((age-400)/450):shot?1:0;
    b.style.setProperty('--shake',shake+'deg');b.style.setProperty('--lid-y',(-34*lift)+'px');b.style.setProperty('--lid-turn',(-14*lift)+'deg');b.style.setProperty('--lid-opacity',String(1-ease((age-900)/300)*(active?1:0)));b.style.setProperty('--open',String(lift));
   }
   const prize=giftPrizeMotion(active?flight:null,time,{opened:!!shot,reduced:reduced.matches});
   applyGiftPrize(b,prize);b.style.setProperty('--prize-color',PRIZE_COLORS[shot?.prize.kind??flight?.prize.kind]??PRIZE_COLORS.cash);
   b.style.setProperty('--spark-size',Math.min(6,arrival.height*.1)+'px');
   const glints=b.querySelector('.gift-glints');glints.style.display=active&&prize.visible&&!reduced.matches?'':'none';
   if(active&&prize.visible)[...glints.children].forEach((star,i)=>{
    const p=giftPrizeSpark(i,prize.age,{reduced:reduced.matches});star.style.left=p.x+'%';star.style.top=p.y+'%';star.style.opacity=p.opacity;
   });
  }
  const reveal=flight&&time>=flight.revealAt,prizeMotion=giftPrizeMotion(flight,time,{reduced:reduced.matches}),kind=flight?.prize.kind??'';
  toast.classList.toggle('show',!!reveal);toast.setAttribute('aria-hidden',String(!reveal));toast.dataset.kind=kind;
  stage.style.setProperty('--reveal-color',PRIZE_COLORS[kind]??PRIZE_COLORS.cash);
  for(const [key,value,unit]of [['announce-opacity',prizeMotion.announce,''],['title-y',prizeMotion.titleY,'px'],['title-scale',prizeMotion.titleScale,''],['reveal-flare',prizeMotion.flare,'']])stage.style.setProperty('--'+key,value+unit);
  if(kind!==oldPrizeKind){toast.querySelector('.gift-prize-emblem').innerHTML=kind?giftPrizeEmblem(kind):'';oldPrizeKind=kind;}
  if(reveal){
   const expansion=isGiftExpansion(kind),title=toast.querySelector('strong'),detail=toast.querySelector('.gift-toast-detail');
   title.textContent=expansion?giftBonusName(kind).toUpperCase():prizeLabel(flight.prize);
   title.style.fontSize=Math.min(expansion?27:36,280/(title.textContent.length*.6))+'px';
   detail.textContent=expansion?`${giftPickLabel(flight.prize).toUpperCase()} · ${rows} ROWS × ${cols} COLUMNS`:kind==='multiply'?`FINAL TOTAL MULTIPLIER: ×${shown.multiplier}`:'CASH PRIZE';
   detail.style.fontSize=Math.min(expansion?11:10,292/(detail.textContent.length*.62))+'px';
  }
  $('.gift-subtotal').textContent=money(shown?.cashCents??0);$('.gift-multiplier strong').textContent='×'+(shown?.multiplier??1);$('.gift-running strong').textContent=money(giftTotal(shown));
  for(const [selector,width,max]of [['.gift-subtotal',100,22],['.gift-multiplier strong',72,22],['.gift-running strong',154,27]]){const element=$(selector);element.style.fontSize=Math.min(max,width/(element.textContent.length*.58))+'px';}
  $('.gift-finale').hidden=!finished;
  const finale=giftFinaleMotion(round,time,reduced.matches);
  $('.gift-finale').dataset.tier=finale?.tier.id??'standard';
  const crestLevel=finale?.level??0;
  if(crestLevel!==oldFinalLevel){$('.gift-final-star').innerHTML=crestLevel===2?giftFinalCrown():crestLevel===1?giftFinalBow():giftFinalBadge();oldFinalLevel=crestLevel;}
  stage.style.setProperty('--crest-turn',(finale?.crestTurn??0)+'deg');
  stage.style.setProperty('--bow-spread',String(finale?.bowSpread??0));
  stage.style.setProperty('--final-amount-y',(finale?.amountY??0)+'px');
  $('.gift-finale').dataset.phase=finale?.building?'build':'reveal';
  $('.gift-royal-build').hidden=!finale?.building;
  $('.gift-royal-build').dataset.charge=String(finale?.charge??0);
  stage.classList.toggle('stage-royal-build',!!finale?.building);
  $('.gift-final-rank').hidden=!finale?.level;
  $('.gift-final-rank b').textContent=finale?.level?finale.tier.label.toUpperCase():'';
  $('.gift-finale').style.transform=`translateY(${finale?.y??0}px) scale(${finale?.scale??1})`;
  stage.style.setProperty('--final-glow',String(finale?.glow??0));
  for(const [key,value,unit]of [['crown-y',finale?.crownY??0,'px'],['crown-scale',finale?.crownScale??1,''],['final-shine',finale?.shine??0,''],['final-shine-x',finale?.shineX??-35,'%']])stage.style.setProperty('--'+key,value+unit);
  gleams.style.display=finale&&!reduced.matches?'':'none';
  if(finale)[...gleams.children].forEach((path,i)=>path.setAttribute('opacity',String(giftFinalGleam(i,finale.age,reduced.matches,finale.level))));
  confetti.style.display=finale?.particles?'':'none';
  if(finale?.particles)[...confetti.children].forEach((path,i)=>{const p=giftConfetti(round.id,i,finale.age,finale.level);path.setAttribute('d',p?pixelConfettiPath(p):'');if(p){path.setAttribute('opacity',String(p.opacity));path.setAttribute('fill',['#ffe4a2','#ffafd1','#c7b2ef','#afe4d0','#c3ddff'][p.color]);}});
  if(finished){const value=money(giftTotal(round));$('.gift-finale>small').textContent=round.viewer?round.viewer+'’s total':'ROUND TOTAL';$('.gift-finale>strong').textContent=value;$('.gift-finale>strong').style.fontSize=Math.min(68,480/value.length)+'px';const calculation=$('.gift-finale>p');calculation.textContent=money(round.cashCents)+' collected × '+round.multiplier;calculation.style.fontSize=Math.min(13,308/(calculation.textContent.length*.61))+'px';$('.gift-final-count').textContent=round.celebrationPreview?'Sample total · celebration preview':round.opened.length+' presents opened';}
  if(audio){audio.intro(round,time);audio.unwrap(flight,time,{candy:buttons.get(flight?.cell)?.classList.contains('candy-unwrap')??true,opening:openingPick});audio.sync(flight,time);audio.finale(round,time);}
  root.dataset.rows=rows;root.dataset.cols=cols;root.dataset.side=Math.max(rows,cols);root.dataset.picks=remaining;root.dataset.total=giftTotal(shown);root.dataset.phase=finished?'total':flight?'unwrapping':'ready';
  root.dataset.presentation=!visible?'hidden':exit.exiting?'exiting':display.entering?'entering':finished?'total':round?'playing':'ready';
  if(round||display.entering)raf=requestAnimationFrame(render);
 }
 return {get ready(){return ready;},update({widget,round:r,serverNow=Date.now()},options={}){preset=widget;snapshotRound=r;offset=serverNow-Date.now();preview=!!options.preview;canPick=options.canPick??true;show=options.show??true;render();},setInteractive(value){interactive=value;render();},hide(){show=false;render();},dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();}};
}
