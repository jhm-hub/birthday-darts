import {DEFAULT_PINATA,validatePinata} from './pinata-game.js';
import {validatePinataGameRanges,defaultPinataGameRanges} from './pinata-game-ranges.js';
import {validatePinataViewerRanges} from './pinata-targets.js';

const oldRewards=[{kind:'cash',value:25,weight:35},{kind:'cash',value:50,weight:25},{kind:'cash',value:100,weight:10},{kind:'multiply',value:2,weight:20},{kind:'extra',value:1,weight:10}];
export const MAIN_PINATA_CELEBRATION={royal:120,grand:140};

// Upgrade the original template once, including when it arrives over a shared
// link. Custom counts, caps, rewards and configured ranges remain as saved.
export function validateSavedPinata(input){
 const w={...input},ranges=validatePinataGameRanges(w.gameRanges);
 if(w.tuningVersion===undefined&&w.id===DEFAULT_PINATA.id){
  if(w.swings===3&&w.maxSwings===8)w.swings=5;
  if(JSON.stringify(w.outcomes)===JSON.stringify(oldRewards))w.outcomes=structuredClone(DEFAULT_PINATA.outcomes);
  if(ranges[0].min===null&&ranges[0].name==='Piñata 1')ranges[0]=defaultPinataGameRanges()[0];
  if(ranges[0].min===90&&ranges[0].max===150&&(!w.celebration||(w.celebration.royal===1500&&w.celebration.grand===5000)))w.celebration={...MAIN_PINATA_CELEBRATION};
 }
 return {...validatePinata(w),viewerRanges:validatePinataViewerRanges(w.viewerRanges),gameRanges:ranges};
}
