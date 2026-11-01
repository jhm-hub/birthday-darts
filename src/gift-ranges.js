export const GIFT_RANGE_IDS=Object.freeze(['range1','range2','range3','range4']);
export const emptyGiftRanges=()=>GIFT_RANGE_IDS.map((id,i)=>({id,name:'Game '+(i+1),min:null,max:null}));
export const defaultGiftRanges=()=>emptyGiftRanges().map((r,i)=>({...r,min:[10,100,1000,2500][i],max:[100,1000,2500,10000][i]}));
export function validateGiftRanges(input=defaultGiftRanges()){
 if(!Array.isArray(input)||input.length!==4)throw Error('Use four gift game ranges.');
 return input.map((r,i)=>{
  if(r?.id!==GIFT_RANGE_IDS[i]||typeof r.name!=='string'||!r.name.trim()||r.name.trim().length>24)throw Error('Name each of the four games using 1–24 characters.');
  const min=r.min,max=r.max;
  if(!(min===null&&max===null)&&(!Number.isInteger(min)||!Number.isInteger(max)||min<1||max<min||max>1000000))throw Error('Enter both limits for each game: whole dollars from $1 to $1,000,000, with maximum at least minimum.');
  return {id:r.id,name:r.name.trim(),min,max};
 });
}
export const configuredGiftRanges=w=>validateGiftRanges(w.gameRanges).filter(r=>r.min!==null);
export const giftRangeText=r=>r.min===null?'Set limits in Edit gift games':'$'+r.min.toLocaleString('en-US')+'–$'+r.max.toLocaleString('en-US');
