const money=c=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:c%100?2:0,maximumFractionDigits:2}).format(c/100);

export function createEditorPreview(readDraft){
 const frame=document.querySelector('#demo-frame'),button=document.querySelector('#demo-throw'),reset=document.querySelector('#demo-reset'),sound=document.querySelector('#demo-sound'),status=document.querySelector('#demo-status');
 let ready=false,latest=null,validationError='',soundEnabled=false;
 function send(data){if(ready)frame.contentWindow.postMessage({kind:'darts-demo',...data},location.origin);}
 function refresh(){
  latest=readDraft();
  validationError=[...document.querySelectorAll('#settings input')].some(input=>!input.validity.valid)?'Finish the highlighted settings before throwing a demo dart.':'';
  frame.parentElement.style.aspectRatio=latest.theme==='balloons'?'4 / 3':'8 / 5';
  button.disabled=true;status.textContent=ready?'Updating preview…':'Loading preview…';
  send({type:'configure',widget:latest,error:validationError});
 }
 window.addEventListener('message',event=>{
  if(event.source!==frame.contentWindow||event.origin!==location.origin||event.data?.kind!=='darts-demo')return;
  const data=event.data;
  if(data.type==='ready'){ready=true;if(latest)send({type:'configure',widget:latest,error:validationError});return;}
  if(data.type!=='state')return;
  const r=data.snapshot?.round,finished=!!r?.hideAt,flight=!!r?.flight;
  button.disabled=!!data.error||!data.snapshot||flight||finished;
  reset.disabled=!data.snapshot;sound.disabled=false;
  button.textContent=flight?'Throwing…':finished?'Total revealed':r?'Throw next demo dart':'Throw demo dart';
  soundEnabled=!!data.sound;sound.textContent=soundEnabled?'Sound on':'Sound off';sound.setAttribute('aria-pressed',String(soundEnabled));
  status.classList.toggle('error',!!data.error);frame.parentElement.classList.toggle('preview-invalid',!!data.error);
  status.textContent=data.error||(flight?'Watch the dart land and reveal its prize.':finished?money(r.throws.reduce((sum,shot)=>sum+shot.amountCents,0))+' demo total. The preview resets automatically.':r?'Dart '+(r.throws.length+1)+' of '+r.preset.darts+' is ready.':data.snapshot?.lastResult?'Last demo total: '+money(data.snapshot.lastResult.totalCents)+'. Ready to try again.':'Try the values you’re editing. Click once per dart.');
 });
 button.addEventListener('click',()=>{button.disabled=true;send({type:'throw'});});
 reset.addEventListener('click',()=>send({type:'reset'}));
 sound.addEventListener('click',()=>send({type:'sound',enabled:!soundEnabled}));
 return {refresh};
}
