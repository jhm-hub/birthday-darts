import {createVaultView} from './vault-view.js';
import {createVaultClock} from './vault-clock.js';
import {createTokenFinaleView} from './vault-tokens-view.js';
import {tokenGlyph} from './vault-token-art.js';
import {advanceTokenSpin} from './vault-token-game.js';
import {vaultPlaybackScale} from './vault-playback.js';
import {vaultRoundTime} from './vault-hold.js';
import {tokenHandoffPose,TOKEN_HANDOFF} from './vault-token-handoff.js';
import {vaultBonusAt} from './vault-timing.js';
import {VAULT_BONUS_LAND_MS} from './vault-bonus-motion.js';
export function createVaultLiveView(root,{audio,preview=false}={}){
 root.classList.add('vault-live-root');
 const original=document.createElement('div'),machine=document.createElement('div');
 original.className=machine.className='vault-live-layer';root.replaceChildren(original,machine);
 const vault=createVaultView(original,{preview}),tokens=createTokenFinaleView(machine),clock=createVaultClock(),quiet=matchMedia('(prefers-reduced-motion: reduce)');
 const tray=document.createElement('div');tray.className='earned-token-tray';original.querySelector('.vault-stage').append(tray);
 let snapshot=null,options={},raf,disposed=false,trayCount=-1;
 function paint(){
  if(disposed)return;raf=requestAnimationFrame(paint);
  const r=snapshot?.round,time=vaultRoundTime(r,options.frozenAt??clock.now()),show=options.show!==false;
  const t=r?.tokenFinale,age=t?time-r.tokenHandoffAt:0,handoff=!!t&&age<TOKEN_HANDOFF.duration;
  root.classList.toggle('token-preview-sizer',!!r?.tokenMachine);
  original.style.visibility=show&&(!t||handoff)?'visible':'hidden';machine.style.visibility=show&&!!t?'visible':'hidden';
  original.classList.toggle('is-token-handoff',handoff);original.style.opacity=handoff?tokenHandoffPose(age).vault:1;
  original.querySelector('.vault-bankroll').classList.toggle('token-ledger',!!r?.tokenMachine);
  if(t&&show){if(!handoff)vault.hide();const projected=structuredClone(t);advanceTokenSpin(projected,time);tokens.update(projected,time,{quiet:options.quiet??quiet.matches,handoffAge:handoff?age:null});}
  const earned=r?.tokenMachine?(r.tokenCount??0)+(r.flight?.bonus?.kind==='token'&&time>=r.flight.revealAt+(vaultBonusAt(r.flight)-r.flight.revealAt+VAULT_BONUS_LAND_MS)*vaultPlaybackScale(r)?1:0):0;
  if(trayCount!==earned){trayCount=earned;tray.innerHTML=earned?tokenGlyph()+earned+' SPIN'+(earned===1?'':'S')+' SAVED':'';}
  if(show)audio?.sync(r,time);
 }
 paint();
 return {update(next,opts={}){
  snapshot=next;options={show:true,...opts};clock.receive(next.serverNow);
  vault.update(next,{...opts,preview,show:options.show&&(!next.round?.tokenFinale||vaultRoundTime(next.round,clock.now())<next.round.readyAt)});
 },hide(){options.show=false;vault.hide();audio?.reset();},dispose(){disposed=true;cancelAnimationFrame(raf);vault.dispose();tokens.dispose();}};
}
