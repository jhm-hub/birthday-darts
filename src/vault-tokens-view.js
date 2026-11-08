import {money} from './vault-game.js';
import {tokenHandoffPose,tokenHandoffToken} from './vault-token-handoff.js';
import {TOKEN_TIMING,tokenSpinPose,reelTape,ease,clamp} from './vault-tokens-model.js';
export function tokenGlyph(){return '<svg viewBox="0 0 32 34" shape-rendering="crispEdges" aria-hidden="true"><path d="M10 1H22V3H27V7H30V12H32V24H29V29H24V32H8V30H3V26H0V11H3V6H7V3H10Z" fill="#40263d"/><path d="M10 3H22V5H26V9H29V13H30V23H27V27H23V30H9V28H5V25H2V12H5V8H9V5H10Z" fill="#b76e40"/><path d="M10 3H22V5H26V9H29V20H27V24H23V27H9V25H5V22H3V12H5V8H9V5H10Z" fill="#edba66"/><path d="M10 5H21V7H25V10H27V15H25V11H21V9H11V11H8V20H6V12H8V8H10Z" fill="#fff1bd"/><path d="M11 9H21V11H24V23H21V25H11V23H8V12H11Z" fill="#8c456e"/><path d="M9 13L13 16L16 10L19 16L23 13L21 22H11Z" fill="#ffe3a5"/><path d="M13 20H20V22H12Z" fill="#d49b53"/><path d="M15 17H18V20H15Z" fill="#ee88bc"/><path d="M10 29H22V30H10ZM29 14H30V21H29Z" fill="#ffdd94"/></svg>';}
export function createTokenFinaleView(root){
 root.innerHTML=`<section class="token-stage" aria-label="Royal token finale"><h2 class="token-heading">FAITH’S <b>BIRTHDAY VAULT</b></h2><div class="token-subtitle">THE ROYAL FINISH</div><div class="token-counter token-counter-left"><small>SPINS LEFT</small><strong></strong><div class="token-tray">${tokenGlyph()}${tokenGlyph()}</div></div><div class="token-counter token-counter-right"><small>BEST LOCKED</small><strong></strong></div><div class="token-cabinet-arrival"><img class="token-cabinet" src="./assets/vault-tokens/royal-machine-v1.png" alt="" draggable="false"><div class="token-reel-window"><span class="token-times">×</span><div class="token-reel-clip"><div class="token-reel-strip"></div><span class="token-reel-rest">?</span></div><i class="token-reel-shade"></i></div><div class="token-window-gleam"></div></div><div class="token-transfer" aria-hidden="true">${tokenGlyph()}${tokenGlyph()}</div><div class="token-tray-catches" aria-hidden="true"><i>✦</i><i>✦</i></div><div class="token-insertion">${tokenGlyph()}</div><div class="token-result-note"></div><div class="token-bank token-ledger"><small>CASH BANKED</small><strong>$500</strong><span></span></div><div class="token-finale-particles">${Array.from({length:38},(_,i)=>'<i data-i="'+i+'"></i>').join('')}</div><div class="token-side-stars"><i>✦</i><i>✦</i><i>✦</i><i>✦</i></div></section>`;
 const $=s=>root.querySelector(s),stage=$('.token-stage'),strip=$('.token-reel-strip'),rest=$('.token-reel-rest'),clip=$('.token-reel-clip'),insertion=$('.token-insertion'),remaining=$('.token-counter-left strong'),best=$('.token-counter-right strong'),tray=[...root.querySelectorAll('.token-tray svg')],bank=$('.token-bank strong'),label=$('.token-bank small'),math=$('.token-bank span'),note=$('.token-result-note'),gleam=$('.token-window-gleam'),stars=[...root.querySelectorAll('.token-side-stars i')],particles=[...root.querySelectorAll('.token-finale-particles i')];
 const arrival=$('.token-cabinet-arrival'),transfers=[...root.querySelectorAll('.token-transfer svg')],catches=[...root.querySelectorAll('.token-tray-catches i')],subtitle=$('.token-subtitle'),counterRight=$('.token-counter-right'),counterLabel=$('.token-counter-left small');
 let flightId='',lastAmount='';
 const resize=()=>{if(root.clientWidth&&root.clientHeight)stage.style.transform=`translate(-50%,-50%) scale(${Math.min(root.clientWidth/420,root.clientHeight/460)})`;};
 const observer=new ResizeObserver(resize);observer.observe(root);resize();
 return {update(s,time,{quiet=false,handoffAge=null}={}){
  const p=tokenSpinPose(s,time,quiet),f=p.f,h=handoffAge===null?null:tokenHandoffPose(handoffAge,quiet);
  stage.style.opacity=1;stage.dataset.phase=h?'handoff':p.phase;stage.dataset.best=String(s.best);
  arrival.style.opacity=h?h.cabinet:1;arrival.style.transform=`translateY(${h?h.cabinetY:0}px)`;
  subtitle.style.opacity=h?h.labels:1;counterRight.style.opacity=h?h.labels:1;
  counterLabel.style.opacity=remaining.style.opacity=h?ease((h.age-1890)/180):1;
  remaining.textContent=s.remaining;best.textContent=s.best===1?'—':'×'+s.best;best.dataset.max=String(s.best===8);
  tray.forEach((el,i)=>{const t=h?tokenHandoffToken(i,h.age,quiet):null;el.style.opacity=t?t.tray:i<s.remaining?1:.16;el.style.transform='none';
   transfers[i].style.opacity=t?t.opacity:0;transfers[i].style.transform=t?`translate(${t.x-10.5}px,${t.y-11.5}px) rotate(${t.rotation}deg)`:'none';catches[i].style.opacity=t?t.catchLight:0;
  });
  const key=f?f.startAt+':'+f.serial:'';
  if(key!==flightId){flightId=key;strip.innerHTML=f?reelTape(f).map(v=>'<span>'+v+'</span>').join(''):'';}
  strip.hidden=!f||quiet;rest.hidden=!!f&&!quiet;
  if(f&&!quiet)strip.style.transform=`translateY(${-64*p.offset}px)`;
  rest.textContent=quiet&&f&&!p.landed?'…':p.shown??'?';clip.dataset.settled=String(!f||p.landed);
  const t=f?clamp(p.age/TOKEN_TIMING.insert):1,u=ease(t);
  insertion.style.opacity=f&&!quiet&&t<1?Math.min(1,t*7,(1-t)*8):0;
  insertion.style.transform=`translate(${44+(210-44)*u-16}px,${86+(265-86)*u-Math.sin(t*Math.PI)*45-17}px) scale(${1-.8*u},${1-.88*u}) rotate(${u*130}deg)`;
  note.textContent=h?h.caption:p.status;note.style.opacity=h?h.labels*h.captionOpacity:1;note.dataset.kind=p.finished?'final':p.improve?'improved':'held';
  label.textContent=p.finished?'FINAL TOTAL':s.best>1?'TOTAL WITH YOUR BEST':'CASH BANKED';
  const amount=money(p.total);if(amount!==lastAmount){lastAmount=amount;bank.textContent=amount;}
  math.textContent=h?'Cash secured · '+s.earned+' earned spins':f&&p.landed&&p.count<1?'Applying your best multiplier…':s.best>1?money(s.cashCents)+' ×'+s.best+' = '+money(s.cashCents*s.best):'Every token is another chance at ×2–×8';
  const hit=f?time-f.landAt:s.finishedAt!==null?time-s.finishedAt+TOKEN_TIMING.finish-TOKEN_TIMING.land:5000;
  gleam.style.opacity=h?h.light*.26:quiet?0:Math.sin(Math.PI*clamp(hit/580))*.34;gleam.style.transform=`translateX(${180*(h?h.lightProgress:clamp(hit/580))}px)`;
  stars.forEach((el,i)=>{const t=(hit-i*65)/650;el.style.opacity=h?h.light*.7:quiet||t<0||t>1?0:Math.sin(t*Math.PI);el.style.transform=`translateY(${-6*clamp(t)}px)`;});
  const finaleAge=s.finishedAt===null?-10000:time-s.finishedAt;
  particles.forEach((el,i)=>{const t=(finaleAge-(i%5)*34)/1600;if(quiet||t<=0||t>=1){el.style.opacity=0;return;}const side=i%2?1:-1;el.style.opacity=Math.min(1,t*6,(1-t)*5);el.style.transform=`translate(${210+side*(65+(i%7)*14)*Math.sin(t*Math.PI/2)}px,${335-(160+(i%6)*15)*t+155*t*t}px) rotate(${side*t*(90+i*13)}deg)`;});
  return p;
 },dispose(){observer.disconnect();root.innerHTML='';}};
}
