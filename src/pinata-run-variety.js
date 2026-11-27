import {randomInt} from './random.js';

// Two independent, half-width draws give a symmetric triangular distribution.
// Every inclusive dollar remains possible; the midpoint is the most likely.
export function centerWeightedPinataTotal(min,max,draw=randomInt){
 const count=max-min+1;
 if(!Number.isSafeInteger(min)||!Number.isSafeInteger(max)||min<0||max<min||count>2**32)throw Error('Invalid total range.');
 const pick=bound=>{const n=draw(bound);if(!Number.isInteger(n)||n<0||n>=bound)throw Error('Invalid total-range draw.');return n;};
 const a=Math.ceil(count/2),b=count-a+1;
 return min+pick(a)+pick(b);
}

// Vary the shape of the cash reveals, independently of the chosen total and
// bonus sequence. The planner still apportions an exact, positive cash budget.
export function pinataCashWeights(count,draw=randomInt){
 const style=draw(4),spotlight=draw(count);
 return Array.from({length:count},(_,i)=>{
  const weight=40+draw(161);
  return weight*(style===1?i+1:style===2?count-i:style===3&&i===spotlight?4:1);
 });
}
