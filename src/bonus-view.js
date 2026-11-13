import {setCentreLayout} from './centre-png.js';
import {renderWheel} from './bonus-wheel.js';
import {bonusAngles,restingBonus,operator,formatBonus,indexAtPointer,landingText,landingIndices,CLEAR_MS} from './bonus-game.js';
import {readAppearance,loadWheelFont} from './double-appearance.js';
export function createBonusAudio(){
 let ctx,enabled=false,volume=.45,lastTick=0,lastIndices='',roundId='',landed=false;const playing=new Set();
 async function unlock(){ctx??=new (window.AudioContext||window.webkitAudioContext)();await ctx.resume().catch(()=>{});}
 function tone(frequency,duration,gain){if(!ctx||!enabled||ctx.state!=='running')return;const osc=ctx.createOscillator(),g=ctx.createGain();osc.frequency.value=frequency;g.gain.setValueAtTime(gain*volume,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);osc.connect(g);g.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+duration);playing.add(osc);osc.onended=()=>{playing.delete(osc);osc.disconnect();g.disconnect();};}
 function stop(){for(const osc of playing)try{osc.stop();}catch{}playing.clear();}
 return {unlock,stop,setEnabled(value){enabled=value;if(value)void unlock().catch(()=>{});else stop();},setVolume(value){volume=value/100;},sync(r,now,angles){
  const f=r?.bonusFlight??r?.mirrorFlight??r?.flight,spin=r?r.id+':'+f.startAt:'';if(spin!==roundId){roundId=spin;lastIndices='';landed=false;stop();}if(!r)return;
  if(now>=f.startAt&&now<f.landAt){const indices=r.bonusFlight?'bonus:'+indexAtPointer(r.config.bonus,angles.bonus):indexAtPointer(r.config.outer,angles.outer)+':'+indexAtPointer(r.config.inner,angles.inner);if(indices!==lastIndices&&now-lastTick>60){tone(560,.025,.04);lastTick=now;}lastIndices=indices;}
  else if((r.result||r.base)&&now>=f.landAt&&!landed){landed=true;if(now-f.landAt<250)tone(880,.22,.08);}
 },dispose(){stop();void ctx?.close();}};
}
export function createBonusView(root,{audio=null,onFontStatus=()=>{}}={}){
 root.innerHTML='<div class="dw-stage bw-stage"><header><h2></h2><p class="dw-viewer"></p></header><div class="dw-wheel"><div class="dw-disc"></div><div class="dw-centre-guide" aria-hidden="true"><span>PNG</span></div><div class="dw-hub"><span>BONUS</span><strong>+</strong></div></div><div class="dw-result"><small></small><div class="dw-line-breakdown" hidden><p data-line="outer" hidden></p><p data-line="inner" hidden></p><p data-line="bonus" hidden></p></div><strong></strong><p class="dw-viewer-total" hidden></p></div></div>';
 const stage=root.querySelector('.dw-stage'),disc=root.querySelector('.dw-disc'),title=root.querySelector('h2'),viewer=root.querySelector('.dw-viewer'),equation=root.querySelector('.dw-result strong'),caption=root.querySelector('.dw-result small');
 let snap=null,wheel,configKey='',visible=false,offset=0,frame,roundId=null,lastNow=0,font='',fontTimer,fontTicket=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');stage.style.opacity='0';
 function render(time){if(!snap)return;const r=snap.round,c=r?.config??snap.config,key=JSON.stringify(c);if(key!==configKey){configKey=key;setCentreLayout(stage,c);stage.dataset.palette=c.palette;stage.dataset.lineLandings=String(!!c.lineLandings);
  const a=readAppearance(c.appearance,c),vars={rim:'rim',divider:'divider',ring:'ring-light',hub:'hub',labelA:'label-a',labelB:'label-b',pointer:'pointer',title:'title-color',resultBackground:'result-background',resultText:'result-text'};
  for(const [key,variable] of Object.entries(vars))stage.style.setProperty('--'+variable,a.colors[key]);
  stage.style.setProperty('--wheel-font','"'+a.fontFamily+'", Fredoka, system-ui, sans-serif');
  if(font!==a.fontFamily){font=a.fontFamily;const family=font,ticket=++fontTicket;clearTimeout(fontTimer);onFontStatus('Loading '+font+'…');fontTimer=setTimeout(()=>{void loadWheelFont(family).then(()=>{if(ticket===fontTicket)onFontStatus(family+' is ready.');}).catch(()=>{if(ticket===fontTicket)onFontStatus('Could not load '+family+'. Check the font name or connection; the preview is using a fallback.');});},300);}
  wheel=renderWheel(disc,c);title.textContent=c.name;root.querySelector('.dw-hub strong').textContent=operator(c.operation);}
  if(roundId!==r?.id){roundId=r?.id;lastNow=0;}const now=Math.max(time,lastNow);lastNow=now;
  const a=r?bonusAngles(r,now,reduced.matches):restingBonus(c),shown=r?.result??r?.base,unlocked=!!r?.bonusFlight;
  const mirrorActive=c.mirrorUnlock!=='slot'||!!r?.mirrorUnlocked;stage.dataset.unlocked=String(unlocked);stage.dataset.mirrorActive=String(mirrorActive);stage.dataset.demo=String(!!r?.demo);wheel.draw(a,unlocked,mirrorActive);
  const done=!!r?.result;
  wheel.highlight(shown?landingIndices(shown,'outer',c.outer,a.outer):undefined,shown?landingIndices(shown,'inner',c.inner,a.inner):undefined,done&&unlocked?landingIndices(r.result,'bonus',c.bonus,a.bonus):undefined);
  viewer.textContent=r?.demo?'DEMO · STAGED BONUS':r?.viewer||(unlocked?'BONUS WHEEL UNLOCKED':c.mirrorUnlock==='slot'?'LAND BONUS OR MIRROR TO UNLOCK':'HIT BONUS TO UNLOCK THE INNER WHEEL');
  const spins=c.spins,taken=r?.results.length??0,number=['spinning','mirror','bonus'].includes(r?.phase)?taken+1:taken;
  const bonusPhase=r?.phase==='bonus',mirrorPhase=r?.phase==='mirror',opening=bonusPhase&&now<r.bonusFlight.startAt;
  caption.textContent=mirrorPhase?(now<r.mirrorFlight.startAt?'MIRROR BONUS UNLOCKED':'MIRRORED WHEELS SPINNING'):bonusPhase?(opening?'BONUS UNLOCKED':'BONUS WHEEL SPINNING'):r?(r.phase==='complete'?'ALL SPINS COMPLETE':`SPIN ${number} OF ${spins}`)+(done?((r.mirrorUnlocked?' · MIRROR':'')+(unlocked?' · BONUS LANDED':' · BOTH LANDED')):''):`${spins} ${spins===1?'SPIN':'SPINS'} PER VIEWER`;
  const breakdown=root.querySelector('.dw-line-breakdown');let any=false;
  for(const side of ['outer','inner','bonus']){const text=shown?landingText(shown,side):'',el=breakdown.querySelector('[data-line="'+side+'"]');el.hidden=!text;el.textContent=text?(side==='outer'?'Outer':side==='inner'?'Inner':'Bonus')+': '+text:'';any ||= !!text;}
  breakdown.hidden=!any;
  equation.textContent=mirrorPhase?'MIRROR BONUS · RESPIN':done?`${formatBonus(r.result.outer)} ${operator(c.operation)} ${formatBonus(r.result.inner)} = ${formatBonus(r.result.result)}`:bonusPhase?`${formatBonus(r.base.outer)} ${operator(c.operation)} BONUS = …`:`— ${operator(c.operation)} — = —`;
  const length=equation.textContent.length;equation.style.fontSize=length>36?'16px':length>26?'20px':length>16?'26px':'34px';
  const total=root.querySelector('.dw-viewer-total');total.hidden=spins===1;total.textContent=`${r?.phase==='complete'?'FINAL':'VIEWER'} TOTAL · ${formatBonus(r?.total??0)}`;
  const alpha=r?.hideAt?Math.max(0,Math.min(1,1-(now-r.hideAt)/CLEAR_MS)):1;
  stage.style.opacity=visible?String(alpha):'0';if(audio&&visible&&alpha>0)audio.sync(r,now,a);
 }
 function tick(){render(Date.now()+offset);frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);
 return {update(next,{show=true}={}){snap=next;offset=next.serverNow-Date.now();visible=show;if(!show)audio?.stop();render(next.serverNow);},dispose(){fontTicket++;clearTimeout(fontTimer);cancelAnimationFrame(frame);root.replaceChildren();}};
}
