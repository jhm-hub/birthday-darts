import {createDemo} from './demo.js';

export function connectDemo(onSnapshot,audio){
 const game=createDemo();let timer;
 function send(data){parent.postMessage({kind:'darts-demo',...data},location.origin);}
 function publish(error=game.error){
  const snapshot=game.snapshot();if(snapshot)onSnapshot(snapshot);
  send({type:'state',snapshot,error,sound:audio.enabled});
 }
 function message(event){
  if(event.source!==parent||event.origin!==location.origin||event.data?.kind!=='darts-demo')return;
  const data=event.data;
  try{
   if(data.type==='configure'){game.configure(data.widget,data.error);game.selectCelebration(data.celebration);}
   else if(data.type==='throw'){void audio.unlock();game.throw();}
   else if(data.type==='finale'){audio.cancel();game.previewFinale();}
   else if(data.type==='bonus'){audio.cancel();void audio.unlock();game.previewBonus(data.bonus);}
   else if(data.type==='celebration')game.selectCelebration(data.id);
   else if(data.type==='reset')game.reset();
   else if(data.type==='sound'){audio.setEnabled(!!data.enabled);if(data.enabled)void audio.unlock();}
   else return;
   publish();
  }catch(e){publish(e.message);}
 }
 return {
  ready:true,
  start(){document.body.dataset.connection='connected';window.addEventListener('message',message);timer=setInterval(()=>{if(game.advance())publish();},60);send({type:'ready'});},
  dispose(){clearInterval(timer);window.removeEventListener('message',message);audio.cancel();}
 };
}
