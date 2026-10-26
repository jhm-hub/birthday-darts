import {CELEBRATION_CHOICES,chooseCelebration} from './celebrations.js';
const money=c=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:c%100?2:0,maximumFractionDigits:2}).format(c/100);

export function createEditorPreview(readDraft){
 const frame=document.querySelector('#demo-frame'),button=document.querySelector('#demo-throw'),reset=document.querySelector('#demo-reset'),sound=document.querySelector('#demo-sound'),status=document.querySelector('#demo-status'),celebration=document.querySelector('#demo-celebration'),finale=document.querySelector('#demo-finale');
 let ready=false,artReady=false,artError=false,latest=null,lastState=null,validationError='',soundEnabled=false;
 function send(data){if(ready)frame.contentWindow.postMessage({kind:'darts-demo',...data},location.origin);}
 function configure(){send({type:'configure',widget:latest,error:validationError,celebration:celebration.value});}
 function refresh(){
  latest=readDraft();
  validationError=[...document.querySelectorAll('#settings input')].some(input=>!input.validity.valid)?'Finish the highlighted settings before throwing a demo dart.':'';
  frame.parentElement.style.aspectRatio='1 / 1';
  button.disabled=true;finale.disabled=true;status.textContent=ready?'Updating preview…':'Loading preview…';
  configure();
 }
 function show(data){
  if(!data)return;
  const r=data.snapshot?.round,finished=!!r?.hideAt,flight=!!r?.flight;
  button.disabled=!artReady||!!data.error||!data.snapshot||flight||finished;
  finale.disabled=!artReady||!!data.error||!data.snapshot||flight;
  celebration.disabled=!artReady||flight;reset.disabled=!data.snapshot;sound.disabled=false;
  button.textContent=flight?'Throwing…':finished?'Total revealed':r?'Throw next demo dart':'Throw demo dart';
  soundEnabled=!!data.sound;sound.textContent=soundEnabled?'Sound on':'Sound off';sound.setAttribute('aria-pressed',String(soundEnabled));
  const selected=data.snapshot?.previewCelebration,variant=selected?CELEBRATION_CHOICES.find(c=>c.id===selected):chooseCelebration(r?.id,CELEBRATION_CHOICES);
  status.classList.toggle('error',!!data.error||artError);frame.parentElement.classList.toggle('preview-invalid',!!data.error);
  status.textContent=artError?'The character artwork could not load. Refresh to try again.':!artReady?'Loading character artwork…':data.error||(flight?'Watch the dart land and reveal its prize.':finished?money(r.throws.reduce((sum,shot)=>sum+shot.amountCents,0))+' demo total · '+variant.label+'. The preview resets automatically.':r?'Dart '+(r.throws.length+1)+' of '+r.preset.darts+' is ready. Celebration after the last dart.':data.snapshot?.lastResult?'Last demo total: '+money(data.snapshot.lastResult.totalCents)+'. Ready to try again.':'Click once per dart, or choose Preview finale.');
 }
 window.addEventListener('message',event=>{
  if(event.source!==frame.contentWindow||event.origin!==location.origin||event.data?.kind!=='darts-demo')return;
  const data=event.data;
  if(data.type==='ready'){ready=true;artReady=false;artError=false;if(latest)configure();return;}
  if(data.type==='art-ready'){artReady=true;artError=false;show(lastState);return;}
  if(data.type==='art-error'){artError=true;artReady=false;show(lastState);return;}
  if(data.type!=='state')return;lastState=data;show(data);
 });
 button.addEventListener('click',()=>{button.disabled=true;send({type:'throw'});});
 reset.addEventListener('click',()=>send({type:'reset'}));
 sound.addEventListener('click',()=>send({type:'sound',enabled:!soundEnabled}));
 celebration.addEventListener('change',()=>send({type:'celebration',id:celebration.value}));
 finale.addEventListener('click',()=>{finale.disabled=true;send({type:'finale'});});
 return {refresh};
}
