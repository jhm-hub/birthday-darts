import {money,vaultTotal} from './vault-game.js';
import {ease,clamp} from './vault-motion.js';
import {vaultBonusAt,vaultBonusBuildAt,vaultBonusBuildMs} from './vault-timing.js';
import {VAULT_BONUS_LAND_MS} from './vault-bonus-motion.js';
import {vaultMultiplierPayoff} from './vault-multiplier-payoff.js';

// A receipt of revealed awards only. Private names, ranges and future plans
// are deliberately unnecessary: the OBS snapshot has everything this needs.
export function vaultStory(round,time,quiet=false){
 const off={text:'Cash in every chamber. Bonuses on top.',kind:'idle',pulse:0,shot:null,receipt:[]};
 if(!round)return off;
 const ended=round.completedAt!=null&&time>=round.completedAt;
 const shots=round.opened.filter(s=>time>=s.revealAt),flight=round.flight&&time>=round.flight.revealAt?round.flight:null;
 const shot=flight??shots.at(-1);
 if(ended){
  const earned=round.cashCents-round.openingCents,extra=shots.filter(s=>s.bonus?.kind==='extra').length;
  // Synthetic celebration-only previews do not have a real award history.
  if(round.celebrationPreview)return {...off,text:money(round.cashCents)+' collected · ×'+round.multiplier,kind:'final'};
  const age=time-round.completedAt;
  const entries=[{label:'OPENING',value:money(round.openingCents),kind:'opening'},
   {label:'CHAMBER CASH',value:'+'+money(earned),kind:'cash'},
   {label:'MULTIPLIER',value:'×'+round.multiplier,kind:'multiply'}];
  const payoff=vaultMultiplierPayoff(round,time),holdMath=payoff.linked&&payoff.direct&&time<payoff.revealAt+300;
  const total=BigInt(vaultTotal(round)),math=holdMath?money(total/BigInt(payoff.boost.bonus.value))+' ×'+payoff.boost.bonus.value+' = '+money(total):null;
  return {...off,kind:'final',text:math??shots.length+' chambers opened'+(extra?' · '+extra+' bonus vault'+(extra===1?'':'s'):''),
   receipt:entries.map((e,i)=>{const p=quiet?Number(age>=1000):ease((age-1000-i*130)/300);return {...e,opacity:p,y:quiet?0:Math.round(9*(1-p)),scale:quiet?1:1+.045*Math.sin(clamp((age-1000-i*130)/430)*Math.PI)};})};
 }
 if(!shot)return {...off,kind:'opening',text:'Opening balance · '+money(round.openingCents)};
 const settled=!flight,afterCash=BigInt(settled?round.cashCents:round.cashCents+shot.cashCents);
 const hasBonus=!!shot.bonus&&time>=vaultBonusAt(shot)+VAULT_BONUS_LAND_MS;
 const oldMultiplier=BigInt(round.multiplier)/(settled&&shot.bonus?.kind==='multiply'?BigInt(shot.bonus.value):1n);
 const beforeCash=afterCash-BigInt(shot.cashCents),cashTotal=afterCash*oldMultiplier;
 let kind='cash',text=money(beforeCash*oldMultiplier)+' + '+money(BigInt(shot.cashCents)*oldMultiplier)+' = '+money(cashTotal);
 if(oldMultiplier>1n)text=money(shot.cashCents)+' ×'+oldMultiplier+' → +'+money(BigInt(shot.cashCents)*oldMultiplier);
 if(!hasBonus&&vaultBonusBuildMs(shot)&&time>=vaultBonusBuildAt(shot)){
  kind='building';text=money(cashTotal)+' banked · ×'+shot.bonus.value+' incoming';
 }
 if(hasBonus&&shot.bonus.kind==='multiply'){kind='multiply';text=money(cashTotal)+' ×'+shot.bonus.value+' = '+money(cashTotal*BigInt(shot.bonus.value));}
 if(hasBonus&&shot.bonus.kind==='extra'){kind='extra';text=shot.index>=round.preset.chambers?'+1 unlock earned · the vault goes deeper':'+1 unlock earned · another vault to explore';}
 const at=kind==='cash'?shot.revealAt:vaultBonusAt(shot)+VAULT_BONUS_LAND_MS;
 return {...off,shot,kind,text,pulse:quiet?0:Math.sin(clamp((time-at)/420)*Math.PI)};
}

// A won key travels up to the unlock counter; a multiplier seal travels to
// the side of the amount. The digits remain clear and all motion fits 420×460.
export function vaultStoryFlight(story,time,source,dock,quiet=false){
 const off={opacity:0,x:0,y:0,scale:1,kind:'',label:'',catch:0};
 const shot=story.shot;if(quiet||!shot?.bonus)return off;
 const start=vaultBonusAt(shot)+VAULT_BONUS_LAND_MS,t=(time-start)/520;
 if(t<0||t>1.25)return off;
 const extra=shot.bonus.kind==='extra',u=ease(t),v=1-u;
 const revealX=Math.max(8,Math.min(192,source.x-110)),revealY=Math.max(112,Math.min(255,source.y-39));
 const from={x:Math.min(390,revealX+220),y:revealY+76},to=extra?{x:360,y:50}:{x:Math.min(396,dock.right+8),y:dock.y};
 const x=v*v*v*from.x+3*v*v*u*399+3*v*u*u*399+u*u*u*to.x;
 const y=v*v*v*from.y+3*v*v*u*(extra?from.y-35:from.y+30)+3*v*u*u*(extra?85:to.y-30)+u*u*u*to.y;
 return {kind:shot.bonus.kind,label:extra?'+1':'×'+shot.bonus.value,x:Math.round(x),y:Math.round(y),
  opacity:ease(t/.12)*(1-ease((t-.84)/.22)),scale:1-.22*u,catch:t>=1?Math.sin(clamp((t-1)/.25)*Math.PI):0};
}
export function vaultStoryGlyph(kind){
 const key='<path d="M3 2H11V4H13V10H11V12H9V19H12V22H9V24H5V12H3V10H1V4H3Z" fill="#3d284b"/><path d="M4 3H10V5H12V9H10V11H8V20H11V21H8V23H6V11H4V9H2V5H4Z" fill="#e4b770"/><path d="M4 4H10V5H11V7H9V6H5V10H3V5H4ZM6 12H7V22H6Z" fill="#fff5c7"/><path d="M5 6H9V9H5Z" fill="#6fcfbd"/>';
 const gem='<path d="M7 1H17L24 8V16L16 24H8L0 16V8Z" fill="#402447"/><path d="M8 3H16L22 9V15L15 22H9L2 15V9Z" fill="#cf9de9"/><path d="M8 3H16L12 9H7L3 10Z" fill="#fff2ce"/><path d="M12 9H18L22 14L15 22H12Z" fill="#9860bc"/><path d="M7 10H16V15H7Z" fill="#edc9ff"/>';
 return '<svg viewBox="0 0 24 26" shape-rendering="crispEdges" aria-hidden="true">'+(kind==='extra'?key:gem)+'</svg>';
}
