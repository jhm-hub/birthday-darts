import {defaultBonus,validateBonus,startBonus} from './bonus-game.js';
export {continueBonus as continueMirror,advanceBonus as advanceMirror,publicBonus as publicMirror,bonusResults as mirrorResults,formatBonus as formatMirror,resultEquation,CLEAR_MS} from './bonus-game.js';
export const mirrorKey=mode=>'faith-mirror-wheel-live-'+mode+'-v1';
export const gameId=mode=>'mirror-'+mode;
export function defaultMirror(mode){return {...defaultBonus(mode),id:gameId(mode),name:'Mirror Wheel '+(mode==='add'?'Add':'Multiply'),mirrorMode:'all',mirrorUnlock:'slot',mirrorSlots:[4]};}
export function validateMirror(raw,mode=raw?.operation){
 if(!['outer','main','all'].includes(raw?.mirrorMode))throw Error('Choose outer, main or all wheels for the mirrored pointers.');
 // Older prototype setups gain one trigger without changing their numbers or
 // colours. Captured rounds keep their original rules until they finish.
 const candidate=raw.inner?.findLastIndex((_,i)=>!raw.bonusSlots?.includes(i));
 const mirrorSlots=raw.mirrorSlots===undefined?(candidate>=0?[candidate]:[]):raw.mirrorSlots;
 return validateBonus({...raw,mirrorUnlock:'slot',mirrorSlots},mode);
}
export function startMirror(config,viewer='',now=Date.now(),choose){return startBonus(validateMirror(config),viewer,now,choose);}
