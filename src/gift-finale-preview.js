// Editor-only, clearly labelled sample totals. Never imported by live controls.
import {startGiftRound,GIFT_HOLD_MS} from './gift-game.js';
export function sampleGiftTierFinale(widget,level,now=Date.now()){
 if(![0,1,2].includes(level))throw Error('Choose a celebration level.');
 const round=startGiftRound(widget,'Demo viewer',now),settings=round.preset.celebration;
 round.cashCents=level===2?Math.round(settings.royal*100):level===1?Math.round(settings.big*100):Math.floor(Math.round(settings.big*100)/2);
 round.remaining=0;round.completedAt=now;round.hideAt=now+GIFT_HOLD_MS;
 round.celebrationPreview=true;return round;
}
