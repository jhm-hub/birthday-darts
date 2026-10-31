import {createDemo} from './demo.js';

export function connectDemo(onSnapshot,audio){
 const game=createDemo(),instance=crypto.randomUUID();let timer;
 function send(data){parent.postMessage({kind:'darts-demo',...data},location.origin);}
 function ready(){send({type:'ready',instance});window.dispatchEvent(new Event('darts-demo-handshake'));}
 function publish(error=game.error){
  const snapshot=game.snapshot();if(snapshot)onSnapshot(snapshot);
  send({type:'state',snapshot,error,sound:audio.enabled});
 }
 function message(event){
  if(event.source!==parent||event.origin!==location.origin||event.data?.kind!=='darts-demo')return;
  const data=event.data;
  try{
   if(data.type==='hello'){ready();return;}
   if(data.type==='configure'||data.type==='play'){audio.cancel();game.configure(data.widget,data.error,data.viewer);game.selectCelebration(data.celebration);if(data.type==='play'){void audio.unlock();game.play();}}
   else if(data.type==='stop')game.stop();
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
  start(){document.body.dataset.connection='connected';window.addEventListener('message',message);timer=setInterval(()=>{if(game.advance())publish();},60);ready();},
  dispose(){clearInterval(timer);window.removeEventListener('message',message);audio.cancel();}
 };
}
