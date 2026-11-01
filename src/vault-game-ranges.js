import {validateVaultTotalRange} from './vault-targets.js';
export const DEFAULT_VAULT_GAME_RANGES=Object.freeze([
 {id:'low',name:'Low',min:500,max:1500},{id:'medium',name:'Medium',min:1000,max:2000},
 {id:'high',name:'High',min:1500,max:4000},{id:'extreme',name:'Extreme',min:2500,max:10000}
].map(Object.freeze));
export function validateVaultGameRanges(input=DEFAULT_VAULT_GAME_RANGES){
 if(!Array.isArray(input)||input.length!==4)throw Error('Save one range for each of the four games.');
 if(new Set(input.map(r=>r?.id)).size!==4)throw Error('Keep one range each for Low, Medium, High and Extreme.');
 return DEFAULT_VAULT_GAME_RANGES.map(({id,name:defaultName})=>{
  const range=input.find(r=>r?.id===id);if(!range)throw Error('Keep Low, Medium, High and Extreme games.');
  const name=range.name===undefined?defaultName:typeof range.name==='string'?range.name.trim():'';
  if(!name||name.length>24||/[\x00-\x1f\x7f]/.test(name))throw Error('Give each game a name using 1–24 characters.');
  return {id,name,...validateVaultTotalRange(range)};
 });
}
