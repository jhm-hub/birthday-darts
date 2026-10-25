export const DEFAULT_GIFT_VOLUME=100;
export function giftVolume(value){return typeof value==='number'&&Number.isFinite(value)?Math.round(Math.max(0,Math.min(100,value))):DEFAULT_GIFT_VOLUME;}
