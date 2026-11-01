import {validateVaultTotalRange} from './vault-targets.js';
export const DEFAULT_VAULT_GAME_RANGES=Object.freeze([
 {id:'low',min:500,max:1500},{id:'medium',min:1000,max:2000},
 {id:'high',min:1500,max:4000},{id:'extreme',min:2500,max:10000}
].map(Object.freeze));
export function validateVaultGameRanges(input=DEFAULT_VAULT_GAME_RANGES){
 if(!Array.isArray(input)||input.length!==4)throw Error('Save one range for each of the four games.');
 if(new Set(input.map(r=>r?.id)).size!==4)throw Error('Keep one range each for Low, Medium, High and Extreme.');
 return DEFAULT_VAULT_GAME_RANGES.map(({id})=>{
  const range=input.find(r=>r?.id===id);if(!range)throw Error('Keep Low, Medium, High and Extreme games.');
  return {id,...validateVaultTotalRange(range)};
 });
}
