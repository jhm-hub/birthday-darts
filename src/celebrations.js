import {RESULT_HOLD_MS} from './widgets.js';

// A round UUID is already random. Hashing it chooses a cosmetic performance
// identically on every display, without consuming the prize random source.
// Each complete performance owns its poses, timing and reduced-motion hold.
export function chooseCelebration(roundId,variants){
 if(!variants?.length)return null;
 let seed=2166136261;
 for(const char of String(roundId??'')){seed^=char.charCodeAt(0);seed=Math.imul(seed,16777619);}
 return variants[(seed>>>0)%variants.length];
}

export function celebrationPerformance(round,time,variants,motion=true){
 if(round?.flight||!Number.isFinite(round?.hideAt)||!round.throws?.length)return null;
 const age=time-(round.hideAt-RESULT_HOLD_MS);
 if(age<0||time>=round.hideAt)return null;
 const variant=chooseCelebration(round.id,variants);
 if(!variant)return null;
 // Stay empty-handed until the result leaves. Do not replay the celebration
 // when a display reconnects or when another state update arrives.
 const pose={cel:0,expression:null,heldDart:false,active:true,reaction:'',celebration:variant.id,celebrationCel:0};
 if(!motion)return {...pose,celebrationCel:variant.reducedCel};
 if(age>=variant.duration)return pose;
 for(let i=1;i<variant.starts.length;i++){
  if(age<variant.starts[i])break;
  pose.celebrationCel=i;
 }
 return pose;
}
