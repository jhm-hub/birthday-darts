import {DEFAULT_VAULT,startVaultRound,unlockVault,advanceVault,cleanVaultRound} from './vault-game.js';
import {prepareVaultPlay,vaultPresentation} from './vault-playback.js';
import {vaultBonusAt,VAULT_BONUS_LAND_MS} from './vault-bonus-motion.js';

export const VAULT_CONCEPTS=[
 {id:'route',letter:'A',name:'The Treasure Route',short:'Chamber route',tag:'FOLLOW THE JOURNEY',description:'A little trail of vault doors tracks the run. Each +1 unlock grows a new room at the end, so everyone can see the adventure getting longer.',moment:'Watch a bonus room appear',detail:'Gold marks the current room. Mint marks opened rooms. Pink rooms are extra unlocks already earned.'},
 {id:'crown',letter:'B',name:'Crown the Win',short:'Assembling crown',tag:'BUILD SOMETHING BEAUTIFUL',description:'Every earned bonus sends a jewel into a waiting gold crown. The crown you build becomes the centerpiece of the final celebration.',moment:'Watch a jewel find its place',detail:'Each jewel records a real bonus. The crown is a visual keepsake; it adds no extra payout or new odds.'},
 {id:'crest',letter:'C',name:'Your Lucky Crest',short:'Lucky crest',tag:'MAKE THE RUN YOURS',description:'Choose a crown, ruby or key for the viewer. Their crest accompanies the run, colors its little flourishes, and takes center stage at the finish.',moment:'Watch your crest celebrate',detail:'The crest changes the artwork only. All three choices play the exact same sample prizes.'},
 {id:'current',letter:'•',name:'Current Crown Vault',short:'Current · saved',tag:'THE SAVED ORIGINAL',description:'The current Vault, just as Faith knows it: the starting treasure, chamber openings, bonuses and casino finale.',moment:'Watch the current finale',detail:'The live game stays on this version. A tagged source backup and an asset archive preserve the version from before these experiments.'}
];
export const CRESTS={crown:{name:'Crown',light:'#ffe6a5',mid:'#e5ac58',dark:'#9b574a'},ruby:{name:'Ruby',light:'#ffc2e3',mid:'#eb6ca9',dark:'#8b366e'},key:{name:'Key',light:'#b9ffeb',mid:'#64cdb7',dark:'#397e81'}};
const origin=10000;
export function createConceptSample(){
 const preset={...structuredClone(DEFAULT_VAULT),chambers:5,maxChambers:8,openingMin:100,openingMax:100,guarantee:false,outcomes:[{value:25,weight:1},{value:50,weight:1}],specialOutcomes:[{value:25,weight:1},{value:50,weight:1}]};
 const r=prepareVaultPlay(startVaultRound(preset,'Birthday royalty',origin,()=>0));r.id='faith-vault-concept-comparison';
 r.prizePlan=[{cashIndex:0,bonus:'extra'},{cashIndex:0,bonus:'multiply',multiplier:2},{cashIndex:0,bonus:'extra'},{cashIndex:0,bonus:null},{cashIndex:1,bonus:'multiply',multiplier:2},{cashIndex:0,bonus:'extra'},{cashIndex:1,bonus:null},{cashIndex:0,bonus:'multiply',multiplier:6}];
 const states=[{at:origin,round:cleanVaultRound(r)}],shots=[];let at=r.readyAt+350;
 for(let i=0;i<8;i++){
  const shot=unlockVault(r,at);shot.id='concept-chamber-'+i;shots.push(structuredClone(shot));states.push({at,round:cleanVaultRound(r)});
  at=shot.finishAt;advanceVault(r,at);states.push({at,round:cleanVaultRound(r)});at+=520;
 }
 const bonusTime=shot=>{const p=vaultPresentation({...states[0].round,flight:shot},shot.startAt),s=p.round.flight;return origin+(vaultBonusAt(s)+VAULT_BONUS_LAND_MS-origin)*1.5;};
 const cues=[{label:'Starting treasure',at:0},{label:'+1 room',at:shots[0].startAt-origin},{label:'×2 bonus',at:shots[1].startAt-origin},{label:'Bonus vault',at:shots[5].startAt-origin-300},{label:'Final ×6',at:shots[7].startAt-origin},{label:'Finale',at:r.completedAt-origin-550}];
 return {origin,states,shots,cues,duration:r.completedAt-origin+6800,final:cleanVaultRound(r),moments:{route:bonusTime(shots[0])-origin-650,crown:bonusTime(shots[4])-origin-650,crest:shots[1].revealAt-origin-500,current:r.completedAt-origin-550}};
}
export function conceptFrame(sample,elapsed){
 const time=sample.origin+Math.max(0,Math.min(sample.duration,elapsed));
 const state=sample.states.findLast(s=>s.at<=time)??sample.states[0];
 return {round:state.round,time};
}
// Only already-revealed public history drives the additions. This also works
// with clean OBS snapshots: future prizes and private ranges are unnecessary.
export function conceptProgress(round,time){
 if(!round)return {bonuses:[],rooms:[],finished:false,totalMultiplier:1n};
 const shots=[...round.opened,...(round.flight?[round.flight]:[])];
 const bonuses=shots.filter(s=>s.bonus&&time>=vaultBonusAt(s)+VAULT_BONUS_LAND_MS).map(s=>({shot:s,at:vaultBonusAt(s)+VAULT_BONUS_LAND_MS,kind:s.bonus.kind,value:s.bonus.value}));
 const extras=bonuses.filter(b=>b.kind==='extra'),count=round.preset.chambers+extras.length;
 const finished=round.completedAt!==null&&time>=round.completedAt;
 const rooms=Array.from({length:count},(_,i)=>{const shot=shots.find(s=>s.index===i);return {index:i,bonus:i>=round.preset.chambers,born:i<round.preset.chambers?round.readyAt:extras[i-round.preset.chambers].at,done:!!shot&&time>=shot.finishAt,current:!finished&&i===(round.flight?.index??round.opened.length)};});
 return {bonuses,rooms,finished,totalMultiplier:bonuses.reduce((m,b)=>b.kind==='multiply'?m*BigInt(b.value):m,1n)};
}
export const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function conceptFlight(event,time,from,to,quiet=false){
 const t=(time-event.at)/640;if(quiet||t<0||t>1)return {opacity:0,x:to.x,y:to.y,scale:1};
 const u=smooth(t);return {opacity:Math.min(1,t*8,(1-t)*8),x:from.x+(to.x-from.x)*u,y:from.y+(to.y-from.y)*u-Math.sin(t*Math.PI)*48,scale:1+.3*Math.sin(t*Math.PI)};
}
