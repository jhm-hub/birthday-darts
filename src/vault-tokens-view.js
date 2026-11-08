import {money} from './vault-game.js';
import {tokenHandoffPose,tokenHandoffToken} from './vault-token-handoff.js';
import {TOKEN_TIMING,tokenSpinPose,reelTape,ease,clamp} from './vault-tokens-model.js';
import {tokenInsertionPose,tokenStackFlight,tokenSpinLight,tokenFinalePose,tokenFinaleParticle} from './vault-token-spin-motion.js';
export function tokenGlyph(){return '<svg viewBox="0 0 32 34" shape-rendering="crispEdges" aria-hidden="true"><path d="M10 1H22V3H27V7H30V12H32V24H29V29H24V32H8V30H3V26H0V11H3V6H7V3H10Z" fill="#40263d"/><path d="M10 3H22V5H26V9H29V13H30V23H27V27H23V30H9V28H5V25H2V12H5V8H9V5H10Z" fill="#b76e40"/><path d="M10 3H22V5H26V9H29V20H27V24H23V27H9V25H5V22H3V12H5V8H9V5H10Z" fill="#edba66"/><path d="M10 5H21V7H25V10H27V15H25V11H21V9H11V11H8V20H6V12H8V8H10Z" fill="#fff1bd"/><path d="M11 9H21V11H24V23H21V25H11V23H8V12H11Z" fill="#8c456e"/><path d="M9 13L13 16L16 10L19 16L23 13L21 22H11Z" fill="#ffe3a5"/><path d="M13 20H20V22H12Z" fill="#d49b53"/><path d="M15 17H18V20H15Z" fill="#ee88bc"/><path d="M10 29H22V30H10ZM29 14H30V21H29Z" fill="#ffdd94"/></svg>';}

const lamps=[...Array.from({length:7},(_,i)=>[128+i*27,180]),...Array.from({length:7},(_,i)=>[128+i*27,246]),...[196,212,228].flatMap(y=>[[115,y],[302,y]])];
function royalRays(){return '<svg viewBox="0 0 420 460" shape-rendering="crispEdges" aria-hidden="true">'+Array.from({length:12},(_,i)=>'<path transform="rotate('+i*30+' 210 215)" d="M206 129V99H202V72H206V47H214V72H218V99H214V129Z" fill="'+(i%3?'#ffe1a0':'#f5acd8')+'"/>').join('')+'</svg>';}
export function createTokenFinaleView(root){
 root.innerHTML=`<section class="token-stage" aria-label="Royal token finale"><div class="token-royal-rays">${royalRays()}</div><h2 class="token-heading">FAITH’S <b>BIRTHDAY VAULT</b></h2><div class="token-subtitle">THE ROYAL FINISH</div><div class="token-counter token-counter-left"><small>SPINS LEFT</small><strong></strong><div class="token-tray">${tokenGlyph()}${tokenGlyph()}</div></div><div class="token-counter token-counter-right"><small>STACKED BOOST</small><strong></strong></div><div class="token-cabinet-arrival"><img class="token-cabinet" src="./assets/vault-tokens/royal-machine-v1.png" alt="" draggable="false"><div class="token-reel-window"><span class="token-times">×</span><div class="token-reel-clip"><div class="token-reel-strip"></div><span class="token-reel-rest">?</span></div><i class="token-reel-shade"></i></div><div class="token-window-gleam"></div><div class="token-reel-lamps">${lamps.map(([x,y])=>'<i style="left:'+x+'px;top:'+y+'px"></i>').join('')}</div><div class="token-slot-light"></div></div><div class="token-transfer" aria-hidden="true">${tokenGlyph()}${tokenGlyph()}</div><div class="token-tray-catches" aria-hidden="true"><i>✦</i><i>✦</i></div><div class="token-insertion">${tokenGlyph()}</div><div class="token-insertion-trail" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="token-stack-flight" aria-hidden="true"></div><div class="token-result-note"></div><div class="token-bank token-ledger"><i class="token-bank-halo" aria-hidden="true"></i><small>VAULT CASH</small><strong>$500</strong><span></span></div><div class="token-finale-particles" aria-hidden="true">${Array.from({length:56},(_,i)=>'<i class="'+(i%7===0?'token-confetti-coin':'')+'" data-i="'+i+'">'+(i%7===0?tokenGlyph():'')+'</i>').join('')}</div><div class="token-side-stars" aria-hidden="true"><i>✦</i><i>✦</i><i>✦</i><i>✦</i></div></section>`;
 const $=s=>root.querySelector(s),all=s=>[...root.querySelectorAll(s)],stage=$('.token-stage'),strip=$('.token-reel-strip'),rest=$('.token-reel-rest'),clip=$('.token-reel-clip'),insertion=$('.token-insertion'),remaining=$('.token-counter-left strong'),boost=$('.token-counter-right strong'),tray=all('.token-tray svg'),bank=$('.token-bank strong'),label=$('.token-bank small'),math=$('.token-bank span'),note=$('.token-result-note'),gleam=$('.token-window-gleam'),stars=all('.token-side-stars i'),particles=all('.token-finale-particles>i');
 const arrival=$('.token-cabinet-arrival'),transfers=all('.token-transfer svg'),catches=all('.token-tray-catches i'),subtitle=$('.token-subtitle'),counterRight=$('.token-counter-right'),counterLabel=$('.token-counter-left small'),slot=$('.token-slot-light'),rail=all('.token-reel-lamps i'),trail=all('.token-insertion-trail i'),stack=$('.token-stack-flight'),rays=$('.token-royal-rays'),bankHalo=$('.token-bank-halo');
 let flightId='',lastAmount='';
 const resize=()=>{if(root.clientWidth&&root.clientHeight)stage.style.transform=`translate(-50%,-50%) scale(${Math.min(root.clientWidth/420,root.clientHeight/460)})`;};
 const observer=new ResizeObserver(resize);observer.observe(root);resize();
 return {update(s,time,{quiet=false,handoffAge=null}={}){
  const p=tokenSpinPose(s,time,quiet),f=p.f,h=handoffAge===null?null:tokenHandoffPose(handoffAge,quiet),light=tokenSpinLight(f,p.age,quiet),finale=tokenFinalePose(p.finaleAge,quiet);
  stage.style.opacity=1;stage.dataset.phase=h?'handoff':p.phase;stage.dataset.multiplier=String(p.multiplier);stage.dataset.revealed=String(p.revealed);
  arrival.style.opacity=h?h.cabinet:1;arrival.style.transform=`translateY(${h?h.cabinetY:0}px)`;
  subtitle.style.opacity=h?h.labels:1;counterRight.style.opacity=h?h.labels:1;
  subtitle.textContent=p.ending?(p.revealed?'EVERY SPIN · ONE ROYAL TOTAL':'THE ROYAL REVEAL'):f?'SPIN '+f.serial+' OF '+s.earned:s.results.length?'THE MULTIPLIERS KEEP STACKING':'THE ROYAL FINISH';
  counterLabel.style.opacity=remaining.style.opacity=h?ease((h.age-1890)/180):1;
  remaining.textContent=s.remaining;boost.textContent=p.multiplier===1?'—':'×'+p.multiplier;boost.dataset.max=String(p.multiplier>=16);boost.style.fontSize=Math.min(25,Math.floor(82/(boost.textContent.length*.64)))+'px';
  boost.style.textShadow=light.stack?'0 0 2px #ffe8b5':'';
  tray.forEach((el,i)=>{const t=h?tokenHandoffToken(i,h.age,quiet):null;el.style.opacity=t?t.tray:i<s.remaining?1:.12;el.style.transform='none';
   transfers[i].style.opacity=t?t.opacity:0;transfers[i].style.transform=t?`translate(${t.x-10.5}px,${t.y-11.5}px) rotate(${t.rotation}deg)`:'none';catches[i].style.opacity=t?t.catchLight:0;
  });
  const key=f?f.startAt+':'+f.serial:'';
  if(key!==flightId){flightId=key;strip.innerHTML=f?reelTape(f).map(v=>'<span>'+v+'</span>').join(''):'';}
  const turning=!!f&&p.age>=TOKEN_TIMING.reelStart&&!quiet;
  strip.hidden=!turning;rest.hidden=turning;
  if(turning)strip.style.transform=`translateY(${-64*p.offset}px)`;
  rest.textContent=f&&!p.landed?(quiet?'…':s.results.at(-1)?.value??'?'):p.shown??'?';clip.dataset.settled=String(!f||p.landed);
  const coin=tokenInsertionPose(f,p.age,quiet);
  insertion.style.opacity=coin.opacity;insertion.style.transform=`translate(${coin.x-10.5}px,${coin.y-11.5}px) scale(${coin.scaleX},${coin.scaleY}) rotate(${coin.rotation}deg)`;
  trail.forEach((el,i)=>{const t=tokenInsertionPose(f,p.age-(i+1)*30,quiet);el.style.opacity=coin.opacity&&p.age>TOKEN_TIMING.pickup?t.opacity*(.5-i*.09):0;el.style.transform=`translate(${t.x}px,${t.y}px)`;});
  slot.style.opacity=light.slot;
  const flying=tokenStackFlight(f,p.age,quiet);stack.textContent=f?'×'+f.value:'';stack.style.opacity=flying.opacity;stack.style.transform=`translate(${flying.x}px,${flying.y}px) translate(-50%,-50%) scale(${flying.scale})`;
  note.textContent=h?h.caption:p.status;note.style.opacity=h?h.labels*h.captionOpacity:1;note.dataset.kind=p.revealed?'final':p.stacked?'improved':'held';
  label.textContent=p.revealed?'FINAL TOTAL':'VAULT CASH';
  const amount=money(p.total);if(amount!==lastAmount){lastAmount=amount;bank.textContent=amount;bank.style.setProperty('--token-font-size',Math.min(47,Math.floor(340/(amount.length*.64)))+'px');bankHalo.style.width=Math.min(382,Math.max(196,amount.length*29+30))+'px';}
  math.textContent=h?'Cash secured · '+s.earned+' earned spins':p.revealed?money(s.cashCents)+' ×'+s.multiplier+' = '+money(tokenTotalForView(s)):p.ending?'The full stack is about to pay…':s.results.length?'×'+p.multiplier+' stacked · payout revealed after all spins':'Every spin multiplies the whole bankroll';
  const hit=f?time-f.landAt:5000;
  gleam.style.opacity=h?h.light*.26:Math.max(light.land*.38,finale.shine*.42);gleam.style.transform=`translateX(${180*(h?h.lightProgress:p.ending?finale.progress:clamp(hit/580))}px)`;
  stars.forEach((el,i)=>{const t=(hit-i*65)/650;el.style.opacity=h?h.light*.7:quiet?0:Math.max(t<0||t>1?0:Math.sin(t*Math.PI),finale.crown);el.style.transform=`translateY(${-6*clamp(t)}px)`;});
  rail.forEach((el,i)=>{const spinning=f&&p.age>=TOKEN_TIMING.reelStart&&p.age<TOKEN_TIMING.reelStop,chase=(Math.floor(p.offset*2)+i)%lamps.length;el.style.opacity=quiet?0:Math.max(spinning?(chase<3?.75:.12):0,light.land*.9,finale.build*.65,finale.crown);});
  rays.style.opacity=finale.rays*.62;bankHalo.style.opacity=finale.crown*.8;
  particles.forEach((el,i)=>{const t=tokenFinaleParticle(i,p.finaleAge,quiet);el.style.opacity=t.opacity;el.style.transform=`translate(${t.x}px,${t.y}px) rotate(${t.rotation}deg)`;});
  return p;
 },dispose(){observer.disconnect();root.innerHTML='';}};
}
const tokenTotalForView=s=>s.cashCents*s.multiplier;
