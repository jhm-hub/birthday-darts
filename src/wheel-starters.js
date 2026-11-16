// Starting values target an average total of 75–200 across three spins.
// They are editable defaults, never a cap or an adjustment to random outcomes.
const outerMeans={double:{add:[35,57],multiply:[11,18]},bonus:{add:[35,55],multiply:[12,20]},mirror:{add:[25,45],multiply:[7,11]}};
const around=n=>[n-3,n-2,n-1,n,n+3,n+2,n+1,n];
export function starterValues(family,operation,tier='regular'){
 if(!outerMeans[family]?.[operation]||!['regular','high'].includes(tier))throw Error('Choose a Regular or High Roller starter.');
 const add=operation==='add',bonus=family!=='double',mirror=family==='mirror';
 const fields={outer:around(outerMeans[family][operation][tier==='high'?1:0]),inner:bonus?(add?[2,4,6,8,4,0]:[1,2,3,4,2,0]):(add?[2,4,6,8,4,6]:[1,2,3,4,5,6]),spins:3,lineLandings:false,lineChance:25};
 if(bonus)Object.assign(fields,{bonus:add?[4,8,12,24,20,16]:[2,4,6,12,10,8],bonusSlots:[5],bonusEnabled:true,mirrorMode:mirror?'all':'none'});
 if(mirror)Object.assign(fields,{mirrorSlots:[4],mirrorUnlock:'slot',mirrorEnabled:true});
 return fields;
}
export const starterFamily=c=>c.mirrorUnlock==='slot'?'mirror':c.bonus?'bonus':'double';
export function applyStarter(source,tier='regular'){
 const next={...structuredClone(source),...starterValues(starterFamily(source),source.operation,tier)};
 const resize=(colors,count,fallback)=>Array.from({length:count},(_,i)=>colors?.[i]??colors?.[i%2]??fallback[i%2]);
 if(next.appearance){next.appearance.outerColors=resize(next.appearance.outerColors,8,['#AB4BB8','#D9A9E8']);next.appearance.innerColors=resize(next.appearance.innerColors,6,['#C42D9A','#F4A6CF']);}
 if(next.bonus)next.bonusColors=resize(next.bonusColors,6,['#FFC86B','#FFE9AD']);
 return next;
}
// Only unedited numeric/rule bundles from the original demo examples qualify.
// Names, artwork, font, colours and timing are kept; custom values stay saved.
export function legacyDemoStarter(source,tier){
 const high=tier==='high',scale=(xs,n)=>xs.map(x=>x*n),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),mirror=starterFamily(source)==='mirror';
 return source.name===(high?'High Roller':'Regular')&&source.spins===1&&!source.lineLandings&&source.lineChance===25&&source.bonusEnabled!==false&&source.mirrorEnabled!==false&&source.mirrorMode===(mirror?'all':'none')&&same(source.outer,scale([5,4,9,5,6,7,8,10],high?5:1))&&same(source.inner,scale([6,7,4,3,4,5],high?2:1))&&same(source.bonus,scale([10,20,30,40,50,100],high?2:1))&&same(source.bonusSlots,[5])&&(!mirror||same(source.mirrorSlots,[4]));
}
