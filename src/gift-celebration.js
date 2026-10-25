export const DEFAULT_GIFT_CELEBRATION={big:100,royal:250};
export const GIFT_CELEBRATIONS=[
 {id:'standard',label:'Standard',particles:72,motionMs:2600},
 {id:'big',label:'Big win',particles:96,motionMs:2900},
 {id:'royal',label:'Royal win',particles:120,motionMs:3200}
];
export function validateGiftCelebration(value=DEFAULT_GIFT_CELEBRATION){
 if(!value||typeof value!=='object')throw Error('Enter both celebration thresholds.');
 for(const key of ['big','royal'])if(!Number.isFinite(value[key])||value[key]<.01||value[key]>1000000000||Math.abs(value[key]*100-Math.round(value[key]*100))>.00001)
  throw Error('Celebration thresholds must be $0.01–$1,000,000,000, with up to two decimal places.');
 if(Math.round(value.royal*100)<=Math.round(value.big*100))throw Error('Royal win must start above Big win.');
 return {big:value.big,royal:value.royal};
}
// Read the frozen round, never the editor's current settings. Older active rounds
// without thresholds retain their original standard celebration after refresh.
export function giftCelebrationLevel(round){
 const settings=round?.preset?.celebration;
 if(!settings)return 0;
 const total=BigInt(round.cashCents)*BigInt(round.multiplier);
 return total>=BigInt(Math.round(settings.royal*100))?2:total>=BigInt(Math.round(settings.big*100))?1:0;
}
