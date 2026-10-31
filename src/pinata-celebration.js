export const DEFAULT_PINATA_CELEBRATION={royal:1500,grand:5000};
export const PINATA_TIER_NAMES=['Birthday win','Royal win','Grand Royal'];
export function validatePinataCelebration(input=DEFAULT_PINATA_CELEBRATION){
 if(!input||typeof input!=='object')throw Error('Enter both royal celebration thresholds.');
 const royal=input.royal??DEFAULT_PINATA_CELEBRATION.royal,grand=input.grand??DEFAULT_PINATA_CELEBRATION.grand;
 if(!Number.isInteger(royal)||!Number.isInteger(grand)||royal<1||grand>1000000||grand<=royal)throw Error('Use whole-dollar thresholds from $1–$1,000,000, with Grand Royal above Royal.');
 return {royal,grand};
}
export function pinataCelebrationTier(totalCents,settings){
 const {royal,grand}=validatePinataCelebration(settings),total=BigInt(totalCents??0);
 return total>=BigInt(grand)*100n?2:total>=BigInt(royal)*100n?1:0;
}
export function celebrationSampleAmount(tier,settings){
 const {royal,grand}=validatePinataCelebration(settings);
 return tier===2?grand:tier===1?royal:Math.min(150,royal/2);
}
