import {connectDemo} from './demo-session.js';
import {connectControl,connectDisplay} from './session.js';
import {balloonPopAt} from './balloon-timing.js';
import {throwCel,dartReleasePoint} from './motion.js';
import {loadCharacterArt,createCharacterRenderer} from './sprite-renderer.js';
import {buildBalloons,animateBalloons,balloonPoint,balloonSlotForShot} from './balloons.js';
import {createPartyAudio} from './party-audio.js';
const $=s=>document.querySelector(s),control=!document.documentElement.classList.contains('overlay-page'),demo=document.documentElement.classList.contains('demo-page');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const money=c=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:c%100?2:0,maximumFractionDigits:2}).format(c/100);
const colors=['#9980cf','#7eacca','#86c6b1','#e9b975','#f077a4','#b79add','#efc792','#f393af'];
let session,characterRenderer=null;
let widgetId=new URLSearchParams(location.search).get('id'),state=null,connected=false,pending=false,offset=0,config=null,artReady=false,boardKey='',historyKey='',raf,poseIndex=-2,errorMessage='';
const clock=()=>Date.now()+offset;
let previewSound=true;try{previewSound=localStorage.getItem('faith-birthday-preview-sound')!=='off';}catch{}
const partyAudio=createPartyAudio({enabled:demo?false:control?previewSound:true,onState:({enabled,state:audioState})=>{document.documentElement.dataset.audioState=audioState;if(control){$('#sound-toggle').textContent=enabled?'Sound on':'Sound off';$('#sound-toggle').setAttribute('aria-pressed',String(enabled));}}});
void partyAudio.unlock().then(()=>partyAudio.sync(state?.round?.preset.theme==='balloons'?state.round.flight:null,clock()));
if(control)$('#sound-toggle').addEventListener('click',()=>{partyAudio.setEnabled(!partyAudio.enabled);try{localStorage.setItem('faith-birthday-preview-sound',partyAudio.enabled?'on':'off');}catch{}if(partyAudio.enabled)void partyAudio.unlock().then(()=>partyAudio.sync(state?.round?.preset.theme==='balloons'?state.round.flight:null,clock()));});
document.addEventListener('pointerdown',()=>{void partyAudio.unlock();},{once:true});
function status(text){if(control)$('#status').textContent=text;}
function size(){const screen=$('#screen'),anchor=$('#widget-anchor'),width=screen.clientWidth,height=screen.clientHeight,nativeHeight=(state?.round?.preset||state?.widget)?.theme==='balloons'?540:450;anchor.style.height=nativeHeight+'px';const scale=control?Math.min((width-24)/720,(height-24)/nativeHeight):Math.min(width/720,height/nativeHeight);anchor.style.transform='scale('+scale+')';{anchor.style.left=(width-720*scale)/2+'px';anchor.style.top=(height-nativeHeight*scale)/2+'px';}}
new ResizeObserver(size).observe($('#screen'));
fetch('./character.json?v=throw-v5').then(r=>r.json()).then(c=>{
 config=c;$('#faith img').src=c.idle;
 loadCharacterArt(c).then(images=>{characterRenderer=createCharacterRenderer($('#sprite'),c,images);artReady=true;poseIndex=-2;render();}).catch(()=>{});
}).catch(()=>{});
function pose(index){
 if(index===poseIndex&&artReady)return;poseIndex=index;
 const idle=$('#faith img'),sprite=$('#sprite');
 if(!artReady){idle.style.display='';sprite.style.display='none';return;}
 idle.style.display='none';sprite.style.display='block';characterRenderer.draw(index);
}
function board(p){const theme=p.theme||'dartboard',key=JSON.stringify([theme,p.outcomes]);if(key===boardKey)return;boardKey=key;historyKey='';$('#widget').dataset.theme=theme;size();const brand=$('.arcade-brand'),accent=document.createElement('b');accent.textContent=theme==='balloons'?'FAITH!':'DARTS';brand.replaceChildren(document.createTextNode(theme==='balloons'?'HAPPY BIRTHDAY, ':'FAITH’S '),accent);if(control)$('#sound-toggle').hidden=theme!=='balloons';$('#target').replaceChildren();$('#balloons').replaceChildren();if(theme==='balloons'){buildBalloons($('#balloons'),p.outcomes,money);return;}const n=p.outcomes.length,indices=[...Array(2*n-1).keys()].map(i=>i<n?i:2*n-2-i),maxChars=Math.max(...p.outcomes.map(o=>money(o.amountCents).length)),font=Math.min(19,213/indices.length*.85,98/(maxChars*.62));$('#target').style.setProperty('--amount-size',font+'px');for(const i of indices){const band=document.createElement('div');band.className='band';band.dataset.amount=money(p.outcomes[i].amountCents);band.style.setProperty('--color',colors[i%colors.length]);$('#target').append(band);}}
function visibleThrows(r,t){return r?.flight&&t>=(r.preset.theme==='balloons'?balloonPopAt(r.flight):r.flight.landAt)?[...r.throws,r.flight]:r?.throws||[];}
function history(r,p,t){const shots=visibleThrows(r,t),key=(r?.id||'')+':'+p.darts+':'+shots.map(s=>s.id).join(',');if(key===historyKey)return;historyKey=key;$('#receipts').replaceChildren();$('#stuck').replaceChildren();$('#receipts').classList.toggle('many',p.darts>5);for(let i=0;i<p.darts;i++){const chip=document.createElement('span');chip.textContent=shots[i]?money(shots[i].amountCents):'—';if(shots[i])chip.className='hit';$('#receipts').append(chip);}if(p.theme!=='balloons')for(const s of shots){const dart=document.createElement('div');dart.className='stuck-dart';dart.style.left='555px';dart.style.top=(83+(s.bandIndex+.5+s.offset)*213/(2*p.outcomes.length-1)+2)+'px';$('#stuck').append(dart);}$('#running-total').textContent=money(shots.reduce((sum,s)=>sum+s.amountCents,0));}
function receive(next){const old=state?.round;state=next;connected=control?session?.ready??false:true;offset=next.serverNow-Date.now();partyAudio.sync(next.round?.preset.theme==='balloons'?next.round.flight:null,clock());if(control){if(old&&!next.round)$('#viewer').value='';else if(next.round&&!old)$('#viewer').value=next.round.viewer;document.title=next.widget.name+' — Faith Darts';$('h1').textContent=next.widget.name;$('#manage-widgets').href='./index.html?id='+encodeURIComponent(widgetId);}cancelAnimationFrame(raf);render();window.dispatchEvent(new Event('widget-state'));}
function render(){cancelAnimationFrame(raf);if(!state)return;const r=state.round,p=r?.preset||state.widget,t=clock(),finished=!!r?.hideAt,visible=demo||!!r&&(!r.hideAt||t<r.hideAt),balloons=p.theme==='balloons';board(p);history(r,p,t);if(balloons)animateBalloons($('#balloons'),r,p.outcomes.length,t,!reducedMotion.matches);$('#widget').classList.toggle('visible',visible);$('#widget').classList.toggle('finished',finished);$('#widget').setAttribute('aria-hidden',String(!visible));$('#reveal').setAttribute('aria-hidden',String(!finished||!visible));$('#player').textContent=r?.viewer||'';$('.name-line').hidden=!r?.viewer;$('#counter').textContent=r?(finished?r.throws.length:Math.min(p.darts,r.throws.length+(r.flight?1:0)))+' / '+(finished?r.throws.length:p.darts):p.darts+' DART'+(p.darts===1?'':'S');
 if(finished){const sum=r.throws.reduce((sum,s)=>sum+s.amountCents,0),formatted=money(sum);$('#reveal-name').textContent=r.viewer?r.viewer.toUpperCase()+'’S TOTAL':'ROUND TOTAL';$('#final-total').textContent=formatted;$('#final-total').style.fontSize=Math.min(108,290/(formatted.length*.62))+'px';$('#addition').textContent=r.throws.map(s=>money(s.amountCents)).join(' + ');}
 const f=r?.flight;for(const band of $('#target').children)band.classList.remove('lit');$('#dart').style.display='none';$('#throw-pop').style.opacity=0;
 if(f){pose(throwCel(f,t,!reducedMotion.matches));const target=balloons?balloonPoint(balloonSlotForShot(f,p.outcomes.length),p.outcomes.length,f.landAt,!reducedMotion.matches):{x:583,y:83+(f.bandIndex+.5+f.offset)*213/(2*p.outcomes.length-1)},start=dartReleasePoint(artReady?config:null,balloons),cx=(start.x+target.x)/2,cy=Math.min(30,target.y-80);
  if(t>=f.releaseAt&&t<f.landAt){const u=(t-f.releaseAt)/(f.landAt-f.releaseAt),x=(1-u)*(1-u)*start.x+2*(1-u)*u*cx+u*u*target.x,py=(1-u)*(1-u)*start.y+2*(1-u)*u*cy+u*u*target.y,dx=2*(1-u)*(cx-start.x)+2*u*(target.x-cx),dy=2*(1-u)*(cy-start.y)+2*u*(target.y-cy);$('#dart').style.display='block';$('#dart').style.left=x-31+'px';$('#dart').style.top=py-4+'px';$('#dart').style.transform='rotate('+Math.atan2(dy,dx)*180/Math.PI+'deg)';}
  if(balloons&&t>=f.landAt&&t<balloonPopAt(f)){
   $('#dart').style.display='block';$('#dart').style.left=target.x-31+'px';$('#dart').style.top=target.y-4+'px';$('#dart').style.transform='rotate(0deg)';
  }
  const revealAt=balloons?balloonPopAt(f):f.landAt;
  if(t>=revealAt){const age=t-revealAt;if(!balloons)$('#target').children[f.bandIndex]?.classList.add('lit');$('#throw-pop').textContent='+'+money(f.amountCents);$('#throw-pop').style.left=(balloons?Math.min(550,target.x-50):390)+'px';$('#throw-pop').style.top=(balloons?target.y-16:115)+'px';$('#throw-pop').style.fontSize=Math.min(48,165/(money(f.amountCents).length*.62))+'px';$('#throw-pop').style.opacity=balloons?Math.min(1,Math.max(0,(1400-age)/400)):Math.max(0,1-age/650);$('#throw-pop').style.transform='translateY('+(-age/(balloons?100:40))+'px)';}

 }else pose(0);
 if(control){$('#empty-hint').classList.toggle('hidden',visible);$('#empty-hint').setAttribute('aria-hidden',String(visible));$('#throw').disabled=!connected||pending||!!f||finished;$('#button-label').textContent=!connected?'Connecting…':f?(balloons&&t>=f.landAt?'Popping…':'Throwing…'):finished?'Total revealed':r?'Throw next dart':'Throw dart';$('#viewer').disabled=!!r||pending;
  status(errorMessage||(!connected?'Reconnecting. Your round is saved.':f?'Dart '+(r.throws.length+1)+' of '+p.darts+'.':finished?money(r.throws.reduce((n,s)=>n+s.amountCents,0))+' total. Clearing automatically…':r?'Click once for dart '+(r.throws.length+1)+' of '+p.darts+'.':state.lastResult?'Ready for the next viewer. Last total: '+money(state.lastResult.totalCents):'First click: appear + throw. Last hit: total + auto-hide.'));
 }
 if(demo&&balloons||r&&(f||r.hideAt||balloons))raf=requestAnimationFrame(render);
}
async function throwOne(){if(!control||pending||!connected||state?.round?.flight||state?.round?.hideAt)throw Error('Wait until this widget is ready.');void partyAudio.unlock().then(()=>partyAudio.sync(state?.round?.preset.theme==='balloons'?state.round.flight:null,clock()));pending=true;errorMessage='';render();try{const display=await session.throw($('#viewer').value);receive(display);return display;}catch(e){errorMessage=e.message;throw e;}finally{pending=false;cancelAnimationFrame(raf);render();}}
if(control){$('#remote').addEventListener('submit',event=>{event.preventDefault();void throwOne().catch(()=>{});});window.addEventListener('keydown',event=>{if(event.code!=='Space'||event.repeat||event.target.closest('input,button,textarea,select,a'))return;event.preventDefault();void throwOne().catch(()=>{});});}
async function connect(){
 if(demo)session=connectDemo(receive,partyAudio);
 else if(control){
  session=await connectControl(widgetId,receive,(ready,message)=>{connected=ready;$('#connection-status').textContent=message;cancelAnimationFrame(raf);render();});
  widgetId=session.id;const url=session.displayURL;$('#display-url').value=url;$('#open-overlay').href=url;$('#open-display').href=url;
  $('#copy-display').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(url);$('#copy-display').textContent='Copied';}catch{$('#display-url').focus();$('#display-url').select();}});
 }else session=await connectDisplay(receive);
 session.start();
 if(demo)window.addEventListener('pagehide',()=>session.dispose(),{once:true});
}
connect().catch(e=>{errorMessage=e.message;status(e.message);if(control)$('#throw').disabled=true;});
if(document.modelContext?.registerTool){document.modelContext.registerTool({name:'read_darts_widget',title:'Read this darts widget',description:'Read only this widget’s visible amounts, current viewer and round result.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:async()=>({content:[{type:'text',text:JSON.stringify(state)}]})});if(control)document.modelContext.registerTool({name:'throw_widget_dart',title:'Throw one dart',description:'Start and throw if idle, or throw the next dart for this widget. Uses saved weighted amounts. No payment or posting.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,consequentialHint:false},execute:async()=>{const next=await throwOne();return {content:[{type:'text',text:JSON.stringify({widget:next.widget.name,roundId:next.round.id,animation:'started'})}]};}});}
