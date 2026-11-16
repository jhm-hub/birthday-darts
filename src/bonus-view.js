import {bonusReveal} from './bonus-presentation.js';
import {setCentreLayout} from './centre-png.js';
import {renderWheel} from './bonus-wheel.js';
import {bonusAngles,restingBonus,operator,formatBonus,landingText} from './bonus-game.js';
import {readAppearance,loadWheelFont} from './double-appearance.js';
export {createBonusAudio} from './bonus-audio.js';
export function createBonusView(root,{audio=null,onFontStatus=()=>{}}={}){
 root.innerHTML='<div class="dw-stage bw-stage"><div class="dw-wheel"><div class="dw-disc"></div><img class="dw-centre-image" alt="" referrerpolicy="no-referrer" hidden><div class="dw-centre-guide" aria-hidden="true"><span>PNG</span></div><div class="bw-celebration" aria-hidden="true"><div class="bw-shockwave"></div><div class="bw-rays"></div><div class="bw-sparks"></div><div class="bw-unlocked"><span>✦ BONUS ✦</span><strong>UNLOCKED</strong></div></div><div class="dw-hub"><span>BONUS</span><strong>+</strong></div></div><div class="dw-result" hidden><div class="bw-score-row"><p class="dw-viewer-total"><span class="bw-total-label"></span><b class="bw-total-number"></b></p><strong class="bw-equation"></strong></div><small></small><div class="dw-line-breakdown" hidden><p data-line="outer" hidden></p><p data-line="inner" hidden></p><p data-line="bonus" hidden></p></div></div></div>';
 const stage=root.querySelector('.dw-stage'),disc=root.querySelector('.dw-disc'),equation=root.querySelector('.dw-result strong'),caption=root.querySelector('.dw-result small');
 let snap=null,wheel,configKey='',visible=false,offset=0,frame,roundId=null,lastNow=0,font='',fontTimer,fontTicket=0,imageSource;
 let revealKey='';
 const sparks=root.querySelector('.bw-sparks');for(let i=0;i<14;i++){const el=document.createElement('i'),angle=(i*360/14-90)*Math.PI/180,radius=92+(i%3)*23;el.className=i%3?'bw-spark':'bw-coin';el.textContent=i%3?'✦':'$';el.style.setProperty('--spark-x',Math.cos(angle)*radius+'px');el.style.setProperty('--spark-y',Math.sin(angle)*radius+'px');el.style.setProperty('--spark-turn',(i%2?210:-210)+'deg');el.style.setProperty('--spark-delay',(i%4)*.025+'s');sparks.append(el);}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');stage.style.opacity='0';
 function render(time){if(!snap)return;const r=snap.round,c=r?.config??snap.config,key=JSON.stringify([c,imageSource===undefined?'saved':imageSource]);if(key!==configKey){configKey=key;setCentreLayout(stage,c,{imageSource});stage.dataset.palette=c.palette;stage.dataset.lineLandings=String(!!c.lineLandings);
  const a=readAppearance(c.appearance,c),vars={rim:'rim',divider:'divider',ring:'ring-light',hub:'hub',labelA:'label-a',labelB:'label-b',pointer:'pointer',title:'title-color',resultBackground:'result-background',resultText:'result-text'};
  for(const [key,variable] of Object.entries(vars))stage.style.setProperty('--'+variable,a.colors[key]);
  stage.style.setProperty('--wheel-font','"'+a.fontFamily+'", Nunito, system-ui, sans-serif');
  if(font!==a.fontFamily){font=a.fontFamily;const family=font,ticket=++fontTicket;clearTimeout(fontTimer);onFontStatus('Loading '+font+'…');fontTimer=setTimeout(()=>{void loadWheelFont(family).then(()=>{if(ticket===fontTicket)onFontStatus(family+' is ready.');}).catch(()=>{if(ticket===fontTicket)onFontStatus('Could not load '+family+'. Check the font name or connection; the preview is using a fallback.');});},300);}
  wheel=renderWheel(disc,c);root.querySelector('.dw-wheel').setAttribute('role','img');root.querySelector('.dw-wheel').setAttribute('aria-label',c.name);root.querySelector('.dw-hub strong').textContent=operator(c.operation);}
  if(roundId!==r?.id){roundId=r?.id;lastNow=0;}const now=Math.max(time,lastNow);lastNow=now;
  const a=r?bonusAngles(r,now,reduced.matches):restingBonus(c),shown=r?.result??r?.base,unlocked=!!r?.bonusFlight;
  root.querySelector('.dw-hub span').textContent=c.bonusEnabled===false?'SPIN':'BONUS';
  const mirrorActive=c.mirrorEnabled!==false&&(c.mirrorUnlock!=='slot'||!!r?.mirrorUnlocked);stage.dataset.unlocked=String(unlocked);stage.dataset.mirrorActive=String(mirrorActive);stage.dataset.demo=String(!!r?.demo);wheel.draw(a,unlocked,mirrorActive);
  const reveal=bonusReveal(r,now);if(reveal?.active&&reveal.key!==revealKey){revealKey=reveal.key;stage.style.setProperty('--bonus-reveal-delay',-reveal.age+'ms');}stage.dataset.revealing=String(!!reveal?.active);
  const done=!!r?.result;

  const spins=c.spins,taken=r?.results.length??0,number=['spinning','mirror','bonus'].includes(r?.phase)?taken+1:taken;
  const bonusPhase=r?.phase==='bonus',mirrorPhase=r?.phase==='mirror',opening=bonusPhase&&now<r.bonusFlight.startAt;
  const phaseText=mirrorPhase?(now<r.mirrorFlight.startAt?'MIRROR BONUS UNLOCKED':'MIRRORED WHEELS SPINNING'):bonusPhase?(opening?'BONUS UNLOCKED':'BONUS WHEEL SPINNING'):r?(r.phase==='complete'?`${taken} ${taken===1?'SPIN':'SPINS'} COMPLETE`:(r.manualEnd?`SPIN ${number}`:`SPIN ${number} OF ${spins}`)):`${spins} ${spins===1?'SPIN':'SPINS'} PER VIEWER`;
  caption.textContent=[r?.demo?'DEMO':r?.viewer,phaseText].filter(Boolean).join(' · ');
  const breakdown=root.querySelector('.dw-line-breakdown');let any=false;
  for(const side of ['outer','inner','bonus']){const landing=shown?.[side+'Landing'],text=landing&&(landing.type==='line'||landing.mirrored)?landingText(shown,side):'',el=breakdown.querySelector('[data-line="'+side+'"]');el.hidden=!text;el.textContent=text?(side==='outer'?'Outer':side==='inner'?'Inner':'Bonus')+': '+text:'';any ||= !!text;}
  breakdown.hidden=!any;
  equation.textContent=mirrorPhase?'MIRROR BONUS · RESPIN':done?`${formatBonus(r.result.outer)} ${operator(c.operation)} ${formatBonus(r.result.inner)} = ${formatBonus(r.result.result)}`:bonusPhase?`${formatBonus(r.base.outer)} ${operator(c.operation)} BONUS = …`:`— ${operator(c.operation)} — = —`;
  const length=equation.textContent.length;equation.style.fontSize=length>36?'11px':length>26?'12px':length>16?'14px':'16px';
  const result=root.querySelector('.dw-result');result.hidden=!r;result.dataset.final=String(r?.phase==='complete');
  root.querySelector('.bw-total-label').textContent=r?.phase==='complete'?'FINAL TOTAL ':'TOTAL ';
  root.querySelector('.bw-total-number').textContent=formatBonus(r?.total??0);
  stage.style.opacity=visible?'1':'0';if(audio&&visible)audio.sync(r,now,a);
 }
 function tick(){render(Date.now()+offset);frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);
 return {update(next,{show=true,centreImage}={}){imageSource=centreImage;snap=next;offset=next.serverNow-Date.now();visible=show;if(!show)audio?.stop();render(next.serverNow);},dispose(){fontTicket++;clearTimeout(fontTimer);cancelAnimationFrame(frame);root.replaceChildren();}};
}
