import {randomInt} from './random.js';

// Choose the lower of two independent uniform draws. For an even-sized range,
// 75% of targets fall in its lower half; every inclusive value remains possible.
// Only use this for the complete round's budget, never for each prize or bonus.
export function lowerWeightedRange(min,max,draw=randomInt){
 const count=max-min+1;
 if(!Number.isSafeInteger(min)||!Number.isSafeInteger(max)||min<0||max<min||count>2**32)throw Error('Invalid total range.');
 const pick=()=>{const n=draw(count);if(!Number.isInteger(n)||n<0||n>=count)throw Error('Invalid total-range draw.');return n;};
 return min+Math.min(pick(),pick());
}
