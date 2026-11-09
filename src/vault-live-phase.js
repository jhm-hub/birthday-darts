import {vaultRoundTime} from './vault-hold.js';
export function vaultLivePhase(r,now=Date.now()){
 const time=vaultRoundTime(r,now),t=r?.tokenFinale;
 const opening=!!r&&!t&&time<r.readyAt,handoff=!!t&&time<r.readyAt;
 const busy=!!r?.flight||!!t?.flight||!!t&&t.finishedAt!==null&&r.completedAt===null;
 const skipId=t?(t.flight?'token-'+t.flight.serial:t.finishedAt!==null&&r.completedAt===null?'token-finale':handoff?'token-handoff':null):r?.flight?.id??null;
 return {opening,handoff,busy,skipId,canSkip:opening||handoff||busy,
  label:handoff?'Preparing your tokens…':t?.flight?'Spinning token…':t?.finishedAt!=null&&r.completedAt===null?'Grand reveal…':t?'Spend token · spin ('+t.remaining+' left)':null};
}
