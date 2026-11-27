import {randomInt} from './random.js';
import {chooseOutcome} from './game.js';

export const DEFAULT_PINATA_BONUS_RULES={chance:55,guaranteeEarly:true};
export function validatePinataBonusRules(input){
 if(input===undefined)return {...DEFAULT_PINATA_BONUS_RULES};
 if(!input||!Number.isInteger(input.chance)||input.chance<0||input.chance>100)throw Error('Choose a bonus chance from 0% to 100%.');
 if(typeof input.guaranteeEarly!=='boolean')throw Error('Choose whether to guarantee an early bonus.');
 return {chance:input.chance,guaranteeEarly:input.guaranteeEarly};
}

// Keep category frequency separate from the individual cash/bonus weights.
// Missing rules identify an already-running legacy game, whose odds stay intact.
export function selectPinataOutcome(rewards,{rules,hitCount=0,hasBonus=false,startingSwings=3},draw=randomInt){
 if(rules===undefined)return chooseOutcome(rewards,draw);
 const {chance,guaranteeEarly}=validatePinataBonusRules(rules);
 const cash=rewards.map((o,i)=>({o,i})).filter(({o})=>o.kind==='cash'&&o.weight>0);
 const bonuses=rewards.map((o,i)=>({o,i})).filter(({o})=>o.kind!=='cash'&&o.weight>0);
 const deadline=Math.min(3,startingSwings),due=guaranteeEarly&&hitCount>=deadline-1&&!hasBonus;
 let group=cash;
 if(chance>0&&bonuses.length){
  if(due||chance===100||!cash.length)group=bonuses;
  else{const n=draw(100);if(!Number.isInteger(n)||n<0||n>=100)throw Error('Invalid random draw.');if(n<chance)group=bonuses;}
 }
 if(!group.length)throw Error('No eligible reward is available for this swing.');
 return group[chooseOutcome(group.map(({o})=>o),draw)].i;
}
