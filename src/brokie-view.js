import {slices,money,spinRotation,visibleTotal,CLEAR_MS} from './brokie-game.js';
import {giftSVG} from './gift-art.js';
import {renderVaultSound} from './vault-sound-design.js';

const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=n=>Math.max(0,Math.min(1,n));
const point=(r,a)=>{const t=a*Math.PI/180;return [210+Math.sin(t)*r,210-Math.cos(t)*r].map(n=>Math.round(n/2)*2);};
const poly=(r,steps=120)=>Array.from({length:steps},(_,i)=>point(r,i*360/steps).join(',')).join(' ');
const crown=`<path d="M4 18H10V22H14V26H18V16H22V8H28V16H32V26H36V22H40V18H46V28H44V38H6V28H4Z" fill="#4e2a39"/><path d="M8 22H12V26H18V30H22V18H24V12H26V18H28V30H34V26H40V22H42V30H40V34H10V30H8Z" fill="#f4be66"/><path d="M8 22H10V28H12V30H20V32H10V30H8ZM24 14H26V24H24ZM34 28H40V24H42V30H34Z" fill="#fff4c8"/><path d="M10 34H40V38H10Z" fill="#a95b49"/><path d="M10 34H40V36H10Z" fill="#ffe1a1"/><path d="M22 28H28V34H22Z" fill="#cf4c91"/><path d="M24 28H28V30H24Z" fill="#ffb5d6"/>`;
const cake=`<path d="M8 28H48V52H8Z" fill="#4d293c"/><path d="M10 30H46V48H10Z" fill="#da83ac"/><path d="M12 34H44V40H12Z" fill="#fff2d0"/><path d="M10 28H46V32H42V35H38V32H28V35H24V32H14V35H10Z" fill="#fff7de"/><path d="M12 44H44V48H12Z" fill="#a75586"/><path d="M6 50H50V54H6Z" fill="#f9d089"/><path d="M18 18H22V28H18ZM34 18H38V28H34Z" fill="#b4a0e1"/><path d="M18 16V12H20V8H22V12H24V16H22V18H20V16ZM34 16V12H36V8H38V12H40V16H38V18H36V16Z" fill="#ffc86d"/><path d="M18 12H20V16H18ZM34 12H36V16H34Z" fill="#fff5c2"/>`;
function icon(kind){if(kind==='gift')return giftSVG(2);return `<svg viewBox="0 0 56 64" shape-rendering="crispEdges" aria-hidden="true">${kind==='cake'?cake:`<path d="M8 24H12V18H20V14H40V18H46V24H50V42H44V48H14V44H8Z" fill="#512742"/><path d="M12 26H16V20H40V24H44V42H40V44H16V40H12Z" fill="#f5c16c"/><path d="M16 22H38V26H16Z" fill="#fff3c8"/><path d="M14 38H42V42H14Z" fill="#b67a49"/><text x="28" y="36" text-anchor="middle" fill="#6b3152" font-size="19" font-weight="700">↻</text>`}</svg>`;}
export function brokieWheelSVG(config){
 const colors=[['#e6a2c2','#b7538c'],['#d1b5e8','#9773ba'],['#b5e0d4','#649d9c'],['#f4d3a0','#cd945f']];
 return `<svg class="bw-wheel" viewBox="0 0 420 420" aria-label="15 equal wheel slices"><defs><clipPath id="bw-vault-rim"><path clip-rule="evenodd" d="M0 0H1254V1254H0Z M1097 660A470 470 0 1 0 157 660A470 470 0 1 0 1097 660Z"/></clipPath>${colors.map(([a,b],i)=>`<radialGradient id="bw-slice-${i}" cx=".38" cy=".3" r=".85"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`).join('')}</defs><g shape-rendering="crispEdges"><polygon points="${poly(190)}" fill="#3e223c"/><polygon points="${poly(186)}" fill="#8b4b55"/><polygon points="${poly(183)}" fill="#ffe4a4"/><polygon points="${poly(178)}" fill="#d69a54"/><polygon points="${poly(174)}" fill="#6b3650"/><polygon points="${poly(171)}" fill="#f7d7a0"/></g><g class="bw-rotor">${slices(config).map((s,i)=>{
 const pts=['210,210',...Array.from({length:9},(_,k)=>point(168,i*24+k*3).join(','))];
 const p=point(123,(i+.5)*24),angle=(i+.5)*24,fill=i<12?'url(#bw-slice-'+(i%4)+')':['#8d4c86','#b6547f','#7655a1'][i-12];
 return `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="#f8dba9" stroke-width="1.4"/><g transform="translate(${p.join(' ')}) rotate(${angle})">${i<12?`<text class="bw-cash" style="font-size:${Math.min(26,70/s.label.length)}px" y="7">${esc(s.label)}</text>`:`<text class="bw-bonus-label" y="-10">${i===12?'GIFT':i===13?'CAKE OR':'DOUBLE'}</text><text class="bw-bonus-label" y="8">${i===12?'GRAB':i===13?'CRUMBS':'DAMAGE'}</text><path d="M-3 17H3V23H-3Z" fill="#fff0bc"/>`}</g>`;
 }).join('')}</g><g transform="translate(21 12) scale(.3)"><image href="./assets/vault/crown-v3-closed.png" width="1254" height="1254" clip-path="url(#bw-vault-rim)" style="image-rendering:pixelated"/></g><g shape-rendering="crispEdges"><polygon points="${poly(42,48)}" fill="#4b2944"/><polygon points="${poly(38,48)}" fill="#e9ae66"/><polygon points="${poly(33,48)}" fill="#fff0bd"/><polygon points="${poly(29,48)}" fill="#cf83b6"/><svg x="184" y="191" width="52" height="35" viewBox="470 0 310 205"><image href="./assets/vault/crown-v3-closed.png" width="1254" height="1254" style="image-rendering:pixelated"/></svg><g class="bw-pointer" transform="translate(0 34)"><path d="M198 19H222V39H218V45H214V51H206V45H202V39H198Z" fill="#4b2944"/><path d="M202 23H218V37H214V43H210V47H208V41H206V35H202Z" fill="#ffdf88"/><path d="M202 23H218V27H206V35H202Z" fill="#fff7d7"/><path d="M208 29H214V37H208Z" fill="#f174b2"/></g></g></svg>`;
}
export function createBrokieAudio(){
 let ctx,master,enabled=false,volume=65,roundId=null,lastTick=0,lastSeam=null;const seen=new Set(),playing=new Set(),buffers=new Map();
 function unlock(){if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=volume/100;master.connect(ctx.destination);}return ctx.resume().catch(()=>{});}
 function stop(){for(const s of playing)try{s.stop();}catch{}playing.clear();}
 function play(key,gain=1){if(!enabled||!ctx||ctx.state!=='running')return;let b=buffers.get(key);if(!b){const [sound,tier]=key.split(':');let pcm=renderVaultSound(sound==='tick'?'next':sound,{tier:Number(tier)||0});if(sound==='tick')pcm=pcm.slice(Math.round(.22*48000));b=ctx.createBuffer(1,pcm.length,48000);b.getChannelData(0).set(pcm);buffers.set(key,b);}const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=b;g.gain.value=gain;s.connect(g).connect(master);playing.add(s);s.onended=()=>{playing.delete(s);s.disconnect();g.disconnect();};s.start();}
 function cue(id,at,now,sound,gain){if(now<at||seen.has(id))return;seen.add(id);if(now-at<180)play(sound,gain);}
 return {unlock,stop,setEnabled(v){enabled=!!v;if(v)void unlock();else stop();},setVolume(v){volume=v;if(master)master.gain.setTargetAtTime(v/100,ctx.currentTime,.015);},
  sync(r,now,rotation){if(r?.id!==roundId){stop();seen.clear();roundId=r?.id;lastSeam=null;}if(!r)return;
   if(r.phase==='spinning'&&now<r.flight.landAt){const seam=Math.floor(rotation/24);if(seam!==lastSeam&&now-lastTick>65){lastTick=now;play('tick',.65);}lastSeam=seam;}
   if(r.phase==='choosing')cue(r.flight.id+':choose',r.flight.landAt,now,'extra',.7);
   if(r.result&&r.phase==='revealing')cue(r.result.id+':reveal',r.result.revealAt,now,r.result.kind==='double'?'multiply':r.result.kind==='gift'?'cash:1':r.result.kind==='cake'?'cash:2':'cash',.85);
   if(r.completedAt)cue(r.id+':end',r.completedAt+200,now,r.total>=5000?'royal':r.total>=3000?'big':'standard',.75);
  },dispose(){stop();if(ctx)void ctx.close();}
 };
}
export function createBrokieView(root,{onPick=()=>{},audio=null}={}){
 root.innerHTML='<div class="bw-stage"><header><h2></h2><div class="bw-sub"><span class="bw-viewer"></span><span class="bw-progress"></span></div></header><div class="bw-disc"></div><div class="bw-result" hidden></div><div class="bw-gifts" hidden></div><div class="bw-confetti" aria-hidden="true"></div><div class="bw-total"><small>ROUND TOTAL</small><strong>$0</strong></div></div>';
 const $=s=>root.querySelector(s),stage=$('.bw-stage'),reduced=matchMedia('(prefers-reduced-motion: reduce)');stage.style.opacity='0';let snap=null,configKey='',resultKey='',frame,offset=0,allowPick=false,hidden=false;
 function render(now){if(!snap)return;const r=snap.round,c=r?.config??snap.config,key=JSON.stringify(c);if(key!==configKey){configKey=key;$('.bw-disc').innerHTML=brokieWheelSVG(c);$('h2').textContent=c.name;}
  const total=visibleTotal(r,now),rotation=r?.phase==='spinning'?spinRotation(r.flight,now,reduced.matches):r?.rotation??-12;
  $('.bw-rotor').style.transform=`rotate(${rotation}deg)`;
  $('.bw-viewer').textContent=r?.viewer||'A LITTLE LUCK. A LITTLE LUXURY.';
  $('.bw-progress').textContent=!r?'3 SPINS':r.phase==='complete'?'ALL THREE IN':`${r.turn+1} / 3`;
  $('.bw-total strong').textContent=money(total);$('.bw-total small').textContent=r?.phase==='complete'?'BIRTHDAY TOTAL':'ROUND TOTAL';
  stage.dataset.phase=r?.phase??'idle';stage.classList.toggle('bw-reduced',reduced.matches);
  stage.style.opacity=hidden?'0':r?.hideAt?1-clamp((now-r.hideAt)/CLEAR_MS):'1';
  const choosing=r?.phase==='choosing',unwrapping=r?.phase==='revealing'&&r.result.kind==='gift'&&now<r.result.revealAt;
  const keyNow=choosing?'choice:'+r.flight.id:unwrapping?'unwrap:'+r.result.id:r?.phase==='complete'?'final:'+r.id:r?.phase==='revealing'&&now>=r.result.revealAt?'result:'+r.result.id:'none';
  if(keyNow!==resultKey){resultKey=keyNow;$('.bw-result').hidden=true;$('.bw-gifts').hidden=true;$('.bw-confetti').innerHTML='';
   if(choosing||unwrapping){const box=$('.bw-gifts');box.hidden=false;box.innerHTML=`<div class="bw-choice-title">GIFT GRAB<small>Choose a birthday present</small></div><div class="bw-choice-pair">${[0,1].map(i=>`<button type="button" aria-label="Choose ${i?'right':'left'} present" class="${unwrapping&&r.result.choice===i?'bw-open-gift':''}" data-pick="${i}">${giftSVG(i?0:2,{unwrap:true})}<span>${i?'RIGHT':'LEFT'}</span></button>`).join('')}</div>`;box.querySelectorAll('button').forEach(b=>{b.disabled=!choosing||!allowPick;b.onclick=()=>onPick(Number(b.dataset.pick));});}
   else if(r?.phase==='revealing'&&now>=r.result.revealAt){const el=$('.bw-result'),s=slices(c)[r.result.index];el.hidden=false;el.innerHTML=`<div class="bw-result-icon">${icon(r.result.kind)}</div><small>${esc(s.kind==='cash'?'BIRTHDAY MONEY':s.label)}</small><strong>+${money(r.result.amount)}</strong><span>${esc(r.result.detail)}</span>`;}
   else if(r?.phase==='complete'){const el=$('.bw-result');el.hidden=false;el.classList.add('bw-final');el.innerHTML=`<svg class="bw-final-crown" viewBox="470 0 310 205"><image href="./assets/vault/crown-v3-closed.png" width="1254" height="1254" style="image-rendering:pixelated"/></svg><small>THAT’S YOUR BIRTHDAY TOTAL</small><strong>${money(r.total)}</strong><span>Three spins. One birthday bill.</span>`;if(!reduced.matches)$('.bw-confetti').innerHTML=Array.from({length:28},(_,i)=>`<i style="--dx:${(i*67%350)-175}px;--dy:${-70-(i*31%150)}px;--r:${i*47}deg;--delay:${i%4*50}ms;--color:${['#ffd68b','#f29bcd','#bc9fe9','#9ae2ce'][i%4]}"></i>`).join('');}
   if(r?.phase!=='complete')$('.bw-result').classList.remove('bw-final');
  }
  const result=r?.phase==='revealing'?r.result:null;$('.bw-total').classList.toggle('bw-bank',!!result&&now>=result.creditAt&&now<result.creditAt+400);
  if(audio&&!hidden)audio.sync(r,now,rotation);
 }
 function tick(){render(Date.now()+offset);frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);
 return {update(next,{interactive=false,show=true}={}){snap=next;offset=next.serverNow-Date.now();allowPick=interactive;hidden=!show;render(next.serverNow);},dispose(){cancelAnimationFrame(frame);root.replaceChildren();}};
}
