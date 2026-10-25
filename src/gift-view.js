import {giftSVG} from './gift-art.js';
import {money,giftTotal,prizeLabel,projectedGiftRound} from './gift-game.js';

const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function createGiftView(root,{interactive=false,onPick=()=>{},onReady=()=>{},onError=()=>{},audio=null}={}){
 root.innerHTML=`<section class="gift-stage" aria-label="Faith’s gift game"><div class="gift-head"><span>FAITH’S <b>GIFT PILE</b><i aria-hidden="true">✦</i></span><span class="gift-count"></span></div><div class="gift-caption"><span class="gift-viewer"></span><small class="gift-board-size"></small></div><div class="gift-board" aria-label="Wrapped presents"></div><div class="gift-toast" aria-live="polite"><strong></strong><span></span></div><div class="gift-footer"><div><small>COLLECTED</small><strong class="gift-subtotal">$0</strong></div><div class="gift-multiplier"><small>MULTIPLIER</small><strong>×1</strong></div><div class="gift-running"><small>TOTAL SO FAR</small><strong>$0</strong></div></div><div class="gift-finale" hidden><span class="gift-final-star" aria-hidden="true">✦</span><small></small><strong></strong><p></p><span class="gift-final-count"></span></div></section>`;
 const $=s=>root.querySelector(s),stage=$('.gift-stage'),board=$('.gift-board'),buttons=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let round=null,preset=null,offset=0,preview=false,canPick=false,show=true,raf=0,disposed=false,ready=false,oldRoundId=null;
 const resize=()=>{const s=Math.min(root.clientWidth/420,root.clientHeight/460);stage.style.transform=`translate(-50%,-50%) scale(${s})`;};
 const observer=new ResizeObserver(resize);observer.observe(root);resize();
 // Inline gift art needs no character downloads. Defer readiness until callers initialize.
 void Promise.resolve().then(()=>{if(disposed)return;ready=true;onReady();render();}).catch(onError);
 function render(){
  cancelAnimationFrame(raf);if(!preset)return;const time=Date.now()+offset,shown=projectedGiftRound(round,time),flight=round?.flight,age=flight?time-flight.startAt:0,finished=round?.completedAt!==null&&!!round,visible=show&&(preview||!!round&&time<round.hideAt||!!round&&!round.hideAt);
  stage.classList.toggle('stage-visible',visible);stage.classList.toggle('stage-finished',finished);stage.setAttribute('aria-hidden',String(!visible));
  const side=shown?.side??preset.side,remaining=shown?.remaining??preset.picks;
  $('.gift-count').textContent=finished?'ROUND COMPLETE':remaining+' PICK'+(remaining===1?'':'S')+' LEFT';
  $('.gift-viewer').textContent=round?.viewer?'FOR '+round.viewer:finished?'A LITTLE LUCK, ALL YOURS':flight?'UNWRAPPING…':'PICK A LITTLE MAGIC';
  $('.gift-board-size').textContent=side+' × '+side;
  const boardIdentity=(round?.id??'preview')+':'+preset.id+':'+preset.side;
  if(oldRoundId!==boardIdentity){board.replaceChildren();buttons.clear();oldRoundId=boardIdentity;}
  const opened=new Map(shown?.opened.map(s=>[s.cell,s])??[]);
  for(let row=0;row<side;row++)for(let col=0;col<side;col++){
   const id=row+':'+col,shot=opened.get(id),active=flight?.cell===id;let b=buttons.get(id);
   if(!b){b=document.createElement('button');b.type='button';b.className='gift-cell';b.dataset.cell=id;b.innerHTML=giftSVG(row*3+col)+`<span class="gift-cell-prize"></span><span class="gift-cell-number"></span><span class="gift-glints" aria-hidden="true">${Array.from({length:8},(_,i)=>`<i style="--angle:${i*45}deg"></i>`).join('')}</span>`;b.addEventListener('click',()=>onPick(id));board.append(b);buttons.set(id,b);}
   Object.assign(b.style,{left:(col*100/side)+'%',top:(row*100/side)+'%',width:(100/side)+'%',height:(100/side)+'%'});
   const label=shot?prizeLabel(shot.prize):'';b.style.setProperty('--prize-size',Math.min(26,106/side,(396/side*.88)/(Math.max(1,label.length)*.55))+'px');
   b.disabled=!interactive||!ready||!canPick||!!flight||finished||!!shot;b.tabIndex=interactive?0:-1;
   b.setAttribute('aria-label',shot?'Opened present: '+prizeLabel(shot.prize):`Open present, row ${row+1}, column ${col+1}`);
   b.classList.toggle('gift-opened',!!shot);b.classList.toggle('gift-opening',active);b.classList.toggle('gift-special',!!shot&&shot.prize.kind!=='cash');
   b.querySelector('.gift-cell-number').textContent=shot?'':String.fromCharCode(65+row)+(col+1);
   b.querySelector('.gift-cell-prize').textContent=label;
   const shake=active&&age<650&&!reduced.matches?Math.sin(age/28)*Math.sin(Math.PI*age/650)*3:0,lift=active?ease((age-400)/450):shot?1:0;
   b.style.setProperty('--shake',shake+'deg');b.style.setProperty('--lid-y',(-34*lift)+'px');b.style.setProperty('--lid-turn',(-14*lift)+'deg');b.style.setProperty('--lid-opacity',String(1-ease((age-900)/300)*(active?1:0)));b.style.setProperty('--open',String(lift));
   const burst=active&&!reduced.matches?Math.max(0,(age-850)/650):2;b.style.setProperty('--glint-distance',(10+burst*35)+'px');b.style.setProperty('--glint-opacity',String(burst>0&&burst<1?1-burst:0));
  }
  const reveal=flight&&time>=flight.revealAt,toast=$('.gift-toast');toast.classList.toggle('show',!!reveal);toast.setAttribute('aria-hidden',String(!reveal));toast.dataset.kind=flight?.prize.kind??'';
  if(reveal){toast.querySelector('strong').textContent=prizeLabel(flight.prize);toast.querySelector('span').textContent=flight.prize.kind==='extra'?`${flight.prize.nextSide} × ${flight.prize.nextSide} BOARD · MORE TO UNWRAP`:flight.prize.kind==='multiply'?`FINAL TOTAL MULTIPLIER: ×${shown.multiplier}`:'A LITTLE SOMETHING FOR YOU';}
  $('.gift-subtotal').textContent=money(shown?.cashCents??0);$('.gift-multiplier strong').textContent='×'+(shown?.multiplier??1);$('.gift-running strong').textContent=money(giftTotal(shown));
  for(const [selector,width,max]of [['.gift-subtotal',100,22],['.gift-multiplier strong',72,22],['.gift-running strong',154,27]]){const element=$(selector);element.style.fontSize=Math.min(max,width/(element.textContent.length*.58))+'px';}
  $('.gift-finale').hidden=!finished;
  if(finished){const value=money(giftTotal(round));$('.gift-finale>small').textContent=round.viewer?round.viewer+'’s total':'ROUND TOTAL';$('.gift-finale>strong').textContent=value;$('.gift-finale>strong').style.fontSize=Math.min(68,480/value.length)+'px';$('.gift-finale>p').textContent=money(round.cashCents)+' collected × '+round.multiplier;$('.gift-final-count').textContent=round.opened.length+' presents opened';}
  if(audio)audio.sync(flight,time);
  root.dataset.side=side;root.dataset.picks=remaining;root.dataset.total=giftTotal(shown);root.dataset.phase=finished?'total':flight?'unwrapping':'ready';
  if(round)raf=requestAnimationFrame(render);
 }
 return {get ready(){return ready;},update({widget,round:r,serverNow=Date.now()},options={}){preset=widget;round=r;offset=serverNow-Date.now();preview=!!options.preview;canPick=options.canPick??true;show=options.show??true;render();},setInteractive(value){interactive=value;render();},hide(){show=false;render();},dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();}};
}
