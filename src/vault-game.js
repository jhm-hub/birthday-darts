import {randomInt,randomUUID} from './random.js';
import {chooseOutcome} from './game.js';
import {money} from './gift-game.js';
import {validateGiftCelebration,giftCelebrationLevel} from './gift-celebration.js';
export {money};
export const VAULT_INTRO_MS=1200,VAULT_REVEAL_MS=780,VAULT_UNLOCK_MS=2000,VAULT_HOLD_MS=6500,VAULT_CLEAR_MS=450;
export const DEFAULT_VAULT={id:'birthday-vault',name:'Faith’s Birthday Vault',openingMin:100,openingMax:300,chambers:5,maxChambers:12,bonusChance:35,multiplyValue:2,multiplyWeight:1,extraWeight:1,guarantee:true,celebration:{big:500,royal:1500},outcomes:[{value:10,weight:35},{value:25,weight:27},{value:50,weight:15},{value:100,weight:5}],specialOutcomes:[{value:25,weight:35},{value:50,weight:27},{value:100,weight:15},{value:250,weight:5}]};
const integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
function validateCashPrizes(prizes,label){
 if(!Array.isArray(prizes)||prizes.length<1||prizes.length>10)throw Error(`${label}: use 1–10 cash prizes.`);
 const outcomes=prizes.map(o=>{
  if(!o||!Number.isFinite(o.value)||o.value<.01||o.value>1000000||Math.abs(o.value*100-Math.round(o.value*100))>.00001)throw Error(`${label}: use $0.01–$1,000,000, with up to two decimals.`);
  if(!Number.isFinite(o.weight)||o.weight<0||o.weight>1000||Math.abs(o.weight*100-Math.round(o.weight*100))>.00001)throw Error(`${label}: weights must be 0–1,000, with up to two decimals.`);
  return {value:o.value,weight:o.weight};
 });
 if(!outcomes.some(o=>o.weight>0))throw Error(`${label}: give at least one prize a weight above zero.`);
 return outcomes;
}
// Older settings gain a separate richer pool for new rounds. Preserve their
// weights; custom amounts start at double, within the existing per-prize cap.
function initialSpecialPrizes(outcomes){
 const standard=outcomes.length===DEFAULT_VAULT.outcomes.length&&outcomes.every((o,i)=>o.value===DEFAULT_VAULT.outcomes[i].value);
 return outcomes.map((o,i)=>({value:standard?DEFAULT_VAULT.specialOutcomes[i].value:Math.min(1000000,Math.round(o.value*200)/100),weight:o.weight}));
}
export function validateVault(input){
 if(!input||typeof input.name!=='string'||!input.name.trim()||input.name.trim().length>40)throw Error('Give this vault a name using 1–40 characters.');
 if(!integer(input.openingMin,0,1000000)||!integer(input.openingMax,input.openingMin,1000000))throw Error('Opening balances use whole dollars from $0–$1,000,000. Maximum must be at least the minimum.');
 if(!integer(input.chambers,1,10)||!integer(input.maxChambers,input.chambers,20))throw Error('Use 1–10 starting chambers and a round limit up to 20.');
 if(!Number.isFinite(input.bonusChance)||input.bonusChance<0||input.bonusChance>100||Math.abs(input.bonusChance*100-Math.round(input.bonusChance*100))>.00001)throw Error('Bonus chance must be 0–100%, with up to two decimals.');
 if(!integer(input.multiplyValue,2,10))throw Error('Choose a total multiplier from ×2 to ×10.');
 for(const k of ['multiplyWeight','extraWeight'])if(!Number.isFinite(input[k])||input[k]<0||input[k]>1000||Math.abs(input[k]*100-Math.round(input[k]*100))>.00001)throw Error('Bonus weights must be 0–1,000, with up to two decimals.');
 if(input.bonusChance>0&&input.multiplyWeight+input.extraWeight<=0)throw Error('Give at least one bonus a weight above zero.');
 const outcomes=validateCashPrizes(input.outcomes,'Starting chamber cash');
 const specialOutcomes=validateCashPrizes(input.specialOutcomes===undefined?initialSpecialPrizes(outcomes):input.specialOutcomes,'Special vault cash');
 const id=input.id??randomUUID();if(!/^[\w-]{1,80}$/.test(id))throw Error('Invalid vault identifier.');
 return {id,name:input.name.trim(),openingMin:input.openingMin,openingMax:input.openingMax,chambers:input.chambers,maxChambers:input.maxChambers,bonusChance:input.bonusChance,multiplyValue:input.multiplyValue,multiplyWeight:input.multiplyWeight,extraWeight:input.extraWeight,guarantee:input.guarantee!==false,celebration:validateGiftCelebration(input.celebration),outcomes,specialOutcomes};
}
// A saved round from before separate pools keeps its original prizes until it
// finishes. Never migrate the frozen round preset while selecting an award.
export const vaultCashPrizes=r=>r.opened.length>=r.preset.chambers?(r.preset.specialOutcomes??r.preset.outcomes):r.preset.outcomes;
export const vaultTotal=r=>r?(BigInt(r.cashCents)*BigInt(r.multiplier)).toString():'0';
export const vaultLevel=giftCelebrationLevel;
export function vaultBonuses(r){return [{kind:'multiply',value:r.preset.multiplyValue,weight:r.preset.multiplyWeight},{kind:'extra',value:1,weight:r.allocated<r.preset.maxChambers?r.preset.extraWeight:0}];}
export const vaultBonusDue=r=>!!r?.bonusBy&&r.opened.length+1>=r.bonusBy&&!r.opened.some(x=>x.bonus);
export function startVaultRound(widget,viewer='',now=Date.now(),draw=randomInt){
 const preset=validateVault(widget);
 if(typeof viewer!=='string'||viewer.trim().length>32)throw Error('Keep viewer names to 32 characters.');
 const opening=preset.openingMin+draw(preset.openingMax-preset.openingMin+1);
 if(!integer(opening,preset.openingMin,preset.openingMax))throw Error('Invalid opening draw.');
 const r={id:randomUUID(),viewer:viewer.trim(),preset,startedAt:now,readyAt:now+VAULT_INTRO_MS,openingCents:opening*100,cashCents:opening*100,multiplier:1,allocated:preset.chambers,remaining:preset.chambers,opened:[],flight:null,completedAt:null,hideAt:null,bonusBy:0};
 if(preset.guarantee&&preset.chambers>=3&&preset.bonusChance>0&&vaultBonuses(r).some(b=>b.weight>0))r.bonusBy=3;
 return r;
}
export function unlockVault(r,now=Date.now(),{draw=randomInt,forcedCash=null,forcedBonus=undefined}={}){
 if(!r||r.completedAt!==null||r.remaining<1)throw Error('Start a new vault round.');
 if(r.flight||now<r.readyAt)throw Error('Wait for the vault to finish opening.');
 const p=r.preset,prizes=vaultCashPrizes(r),index=forcedCash===null?chooseOutcome(prizes,draw):forcedCash;
 if(!Number.isInteger(index)||!prizes[index]||prizes[index].weight<=0)throw Error('That cash prize is unavailable.');
 const bonuses=vaultBonuses(r),available=bonuses.some(b=>b.weight>0),due=vaultBonusDue(r)&&available;
 let bonus=null;
 if(forcedBonus!==undefined){
  if(forcedBonus===null&&due)throw Error('A bonus is guaranteed in this chamber.');
  if(forcedBonus!==null){const b=bonuses.find(b=>b.kind===forcedBonus&&b.weight>0);if(!b||p.bonusChance===0)throw Error('That bonus is unavailable.');bonus={kind:b.kind,value:b.value};}
 }else if(available&&(due||draw(10000)<Math.round(p.bonusChance*100))){const b=bonuses[chooseOutcome(bonuses,draw)];bonus={kind:b.kind,value:b.value};}
 r.flight={id:randomUUID(),index:r.opened.length,cashCents:Math.round(prizes[index].value*100),bonus,startAt:now,revealAt:now+VAULT_REVEAL_MS,finishAt:now+VAULT_UNLOCK_MS};
 return r.flight;
}
function award(r,shot){
 r.cashCents+=shot.cashCents;r.remaining--;
 if(shot.bonus?.kind==='multiply')r.multiplier=(BigInt(r.multiplier)*BigInt(shot.bonus.value)).toString();
 if(shot.bonus?.kind==='extra'){r.remaining++;r.allocated++;}
 r.opened.push(structuredClone(shot));
}
export function projectedVault(r,now){if(!r?.flight||now<r.flight.revealAt)return r;const copy=structuredClone(r);award(copy,copy.flight);return copy;}
export function advanceVault(r,now=Date.now()){
 if(!r?.flight||now<r.flight.finishAt)return false;
 const shot=r.flight;award(r,shot);r.flight=null;
 if(!r.remaining){r.completedAt=shot.finishAt;r.hideAt=shot.finishAt+VAULT_HOLD_MS;}return true;
}
export function cleanVaultRound(r){
 if(!r)return null;const copy=structuredClone(r),{outcomes,specialOutcomes,bonusChance,multiplyWeight,extraWeight,openingMin,openingMax,...preset}=copy.preset;
 copy.preset=preset;return copy;
}
export function sampleVaultFinale(widget,level=2,now=Date.now()){
 const r=startVaultRound(widget,'Demo viewer',now-20000,()=>0);
 const bigCents=Math.round(r.preset.celebration.big*100);
 const total=level===2?Math.round(r.preset.celebration.royal*100):level===1?bigCents:Math.min(Math.floor(bigCents/2),10000);
 r.cashCents=Math.max(0,total);r.multiplier=1;r.remaining=0;r.completedAt=now;r.hideAt=now+VAULT_HOLD_MS;r.celebrationPreview=true;return r;
}
