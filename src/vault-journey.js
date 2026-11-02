import {vaultSpecialScene} from './vault-special.js';
import {vaultBonusAt,VAULT_BONUS_LAND_MS} from './vault-bonus-motion.js';
import {vaultBonusBuildAt,vaultBonusBuildMs} from './vault-timing.js';

const chapters=['FIRST FIND','DEEPER INSIDE','TREASURE TRAIL','CROWN RESERVE','INNER TREASURY','JEWEL CACHE','ROYAL ARCHIVE','GODDESS RESERVE','GILDED SANCTUM','CROWN CHAMBER'];
export const vaultChapter=(round,index)=>{
 const number=Math.max(0,index-(round?.preset.chambers??5)+1);
 return {number,level:Math.min(5,number),title:chapters[Math.min(chapters.length-1,Math.max(0,number-1))]};
};
// Public, already-revealed history is the entire source of the story. Nothing
// here inspects the selected game, a target amount, or the unplayed plan.
export function vaultJourney(round,time){
 const off={visible:false,number:0,level:0,title:'',keys:0,multiplier:'1',building:false};
 if(!round||round.completedAt!=null)return off;
 const scene=vaultSpecialScene(round,time),index=scene.current?.index;
 const shots=[...round.opened,...(round.flight?[round.flight]:[])];
 const revealed=shots.filter(s=>s.bonus&&time>=vaultBonusAt(s)+VAULT_BONUS_LAND_MS);
 const keys=revealed.filter(s=>s.bonus.kind==='extra').length;
 const multiplier=revealed.reduce((m,s)=>s.bonus.kind==='multiply'?m*BigInt(s.bonus.value):m,1n).toString();
 const shot=round.flight,building=!!shot&&vaultBonusBuildMs(shot)>0&&time>=vaultBonusBuildAt(shot)&&time<vaultBonusAt(shot)+VAULT_BONUS_LAND_MS;
 return {...off,...(index==null?{}:vaultChapter(round,index)),visible:index!=null,keys,multiplier,building};
}
