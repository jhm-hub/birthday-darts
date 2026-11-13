import {renderWheel} from './double-wheel/render.js';
import {doubleAngles,restingDouble,operator,formatDouble,indexAtPointer,CLEAR_MS} from './double-game.js';
export function createDoubleAudio(){
 let ctx,enabled=false,volume=.45,lastTick=0,lastIndices='',roundId='',landed=false;const playing=new Set();
 async function unlock(){ctx??=new (window.AudioContext||window.webkitAudioContext)();await ctx.resume().catch(()=>{});}
 function tone(frequency,duration,gain){if(!ctx||!enabled||ctx.state!=='running')return;const osc=ctx.createOscillator(),g=ctx.createGain();osc.frequency.value=frequency;g.gain.setValueAtTime(gain*volume,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);osc.connect(g);g.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+duration);playing.add(osc);osc.onended=()=>{playing.delete(osc);osc.disconnect();g.disconnect();};}
 function stop(){for(const osc of playing)try{osc.stop();}catch{}playing.clear();}
 return {unlock,stop,setEnabled(value){enabled=value;if(value)void unlock().catch(()=>{});else stop();},setVolume(value){volume=value/100;},sync(r,now,angles){
  if(r?.id!==roundId){roundId=r?.id;lastIndices='';landed=false;stop();}if(!r)return;
  if(now<r.flight.landAt){const indices=indexAtPointer(r.config.outer,angles.outer)+':'+indexAtPointer(r.config.inner,angles.inner);if(indices!==lastIndices&&now-lastTick>60){tone(560,.025,.04);lastTick=now;}lastIndices=indices;}
  else if(r.result&&!landed){landed=true;if(now-r.flight.landAt<250)tone(880,.22,.08);}
 },dispose(){stop();void ctx?.close();}};
}
export function createDoubleView(root,{audio=null}={}){
 root.innerHTML='<div class="dw-stage"><header><h2></h2><p class="dw-viewer"></p></header><div class="dw-wheel"><div class="dw-disc"></div><div class="dw-hub"><span>DOUBLE</span><strong>+</strong></div></div><div class="dw-result"><small></small><strong></strong></div></div>';
 const stage=root.querySelector('.dw-stage'),disc=root.querySelector('.dw-disc'),title=root.querySelector('h2'),viewer=root.querySelector('.dw-viewer'),equation=root.querySelector('.dw-result strong'),caption=root.querySelector('.dw-result small');
 let snap=null,wheel,configKey='',visible=false,offset=0,frame,roundId=null,lastNow=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');stage.style.opacity='0';
 function render(time){if(!snap)return;const r=snap.round,c=r?.config??snap.config,key=JSON.stringify(c);if(key!==configKey){configKey=key;stage.dataset.palette=c.palette;wheel=renderWheel(disc,c);title.textContent=c.name;root.querySelector('.dw-hub strong').textContent=operator(c.operation);}
  if(roundId!==r?.id){roundId=r?.id;lastNow=0;}const now=Math.max(time,lastNow);lastNow=now;
  const a=r?doubleAngles(r,now,reduced.matches):restingDouble(c);wheel.draw(a);
  const done=!!r?.result&&now>=r.flight.landAt;
  wheel.highlight(done?indexAtPointer(c.outer,a.outer):undefined,done?indexAtPointer(c.inner,a.inner):undefined);
  viewer.textContent=r?.viewer||'OUTER ↶  ·  INNER ↷';
  caption.textContent=done?'BOTH WHEELS LANDED':r?'TWO WHEELS. ONE FINISH.':'READY TO SPIN';
  equation.textContent=done?`${formatDouble(r.result.outer)} ${operator(c.operation)} ${formatDouble(r.result.inner)} = ${formatDouble(r.result.result)}`:`— ${operator(c.operation)} — = —`;
  equation.style.fontSize=done&&equation.textContent.length>23?'20px':done&&equation.textContent.length>16?'26px':'34px';
  const alpha=r?.hideAt?Math.max(0,Math.min(1,1-(now-r.hideAt)/CLEAR_MS)):1;
  stage.style.opacity=visible?String(alpha):'0';if(audio&&visible&&alpha>0)audio.sync(r,now,a);
 }
 function tick(){render(Date.now()+offset);frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);
 return {update(next,{show=true}={}){snap=next;offset=next.serverNow-Date.now();visible=show;if(!show)audio?.stop();render(next.serverNow);},dispose(){cancelAnimationFrame(frame);root.replaceChildren();}};
}
