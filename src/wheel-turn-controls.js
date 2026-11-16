import {formatDouble} from './double-game.js';

export function addWheelSpin(round){
 if(!round||!['spinning','mirror','bonus','ready','complete'].includes(round.phase))throw Error('Start a viewer’s turn first.');
 const spins=round.config.spins??1;if(spins>=20)throw Error('A viewer can have up to 20 spins.');
 round.results??=round.result?[round.result]:[];
 round.total??=round.results.reduce((sum,r)=>sum+Math.round(r.result*10000),0)/10000;
 const extend=r=>{r.config.spins=spins+1;if(r.phase==='complete'){r.phase='ready';r.completedAt=null;r.hideAt=null;delete r.endRequested;}};
 extend(round);
 // Undoing a scoring call must keep spins granted later in this same turn.
 if(round.lineCallOriginal)extend(round.lineCallOriginal);
 return round;
}
export function recordLastTurn(widget){
 const r=widget.round;if(!r)return false;
 const m=widget.metrics??={total:0,spins:0,history:[]};
 if(r.phase!=='complete'){
  if(m.lastTurn?.id===r.id){delete m.lastTurn;return true;}return false;
 }
 const next={id:r.id,viewer:r.viewer,spins:r.results?.length??1,total:r.total??r.result?.result??0};
 if(JSON.stringify(m.lastTurn)===JSON.stringify(next))return false;
 m.lastTurn=next;return true;
}
export function createTurnControls(anchor,command){
 const panel=document.createElement('section');panel.className='wheel-turn-total';panel.setAttribute('aria-label','Viewer turn total');
 panel.innerHTML='<div><span data-turn-caption>Viewer total</span><strong data-turn-total>0</strong><small data-turn-spins>No active viewer</small></div><button type="button" data-add-spin>+1 spin</button><p class="hint" data-add-spin-note>Adds to this viewer only, up to 20 spins. Saved defaults stay the same.</p>';
 anchor.before(panel);let current=null;
 let manual=false;
 panel.querySelector('[data-add-spin]').onclick=()=>manual?command('end-game',{roundId:current?.id,completedSpins:current?.results?.length??0}):command('add-spin',{roundId:current?.id,spins:current?.config.spins??1});
 return {update(round,lastTurn,{disabled=false,allowAdd=true,manualEnd=false}={}){current=round;manual=manualEnd||!!round?.manualEnd;const final=round?.phase==='complete',summary=round??lastTurn;
  panel.dataset.complete=String(final||!round&&!!lastTurn);
  panel.querySelector('[data-turn-caption]').textContent=final?'Final total':round?'Viewer total':lastTurn?'Last viewer · final total':'Viewer total';
  panel.querySelector('[data-turn-total]').textContent=formatDouble(summary?.total??0);
  panel.querySelector('[data-turn-spins]').textContent=round?(round.viewer?round.viewer+' · ':'')+(round.results?.length??0)+(manual?'':' of '+(round.config.spins??1))+' spins complete':lastTurn?(lastTurn.viewer?lastTurn.viewer+' · ':'')+lastTurn.spins+' spins complete':'No active viewer';
  const button=panel.querySelector('[data-add-spin]');button.textContent=manual?'End game':'+1 spin';
  button.disabled=disabled||!round||!allowAdd||(manual?round.phase!=='ready':(round.config.spins??1)>=20);
  panel.querySelector('[data-add-spin-note]').textContent=!allowAdd?'Bonus showcase ends automatically after one staged spin.':manual?'No spin limit. Keep spinning, then choose End game to show the final total.':'Adds to this viewer only, up to 20 spins. Saved defaults stay the same.';
 }};
}
