import {startBonus,advanceBonus} from '../../src/bonus-game.js';
import {startDouble,advanceDouble} from '../../src/double-game.js';
const sum=xs=>xs.reduce((s,n)=>s+n,0);
class NeedChoice{constructor(limit){this.limit=limit;}}
export function exactSpin(config){
 const pmf=new Map();let terminals=0;
 function explore(path,prob){
  let i=0;
  try{
   const choose=limit=>{if(i===path.length)throw new NeedChoice(limit);const choice=path[i++];if(choice>=limit)throw Error('Bad choice');return choice;};
   const bonus=!!config.bonus,round=(bonus?startBonus:startDouble)({...config,spins:1},'',0,choose);(bonus?advanceBonus:advanceDouble)(round,1e9,choose);
   if(round.results.length!==1||i!==path.length)throw Error('Bad terminal');
   const result=round.results[0].result;pmf.set(result,(pmf.get(result)||0)+prob);terminals++;
  }catch(e){
   if(!(e instanceof NeedChoice))throw e;
   const choices=e.limit===100?[[0,config.lineChance/100],[99,1-config.lineChance/100]]:Array.from({length:e.limit},(_,v)=>[v,1/e.limit]);
   for(const [v,p] of choices)if(p)explore([...path,v],prob*p);
  }
 }
 explore([],1);return {pmf,terminals};
}
export function convolve(a,b){const c=new Map();for(const [x,p]of a)for(const [y,q]of b)c.set(x+y,(c.get(x+y)||0)+p*q);return c;}
export function describe(pmf){
 const pairs=[...pmf].sort((a,b)=>a[0]-b[0]);const mass=sum(pairs.map(x=>x[1]));if(Math.abs(mass-1)>1e-9)throw Error('Mass !=1');
 const quantile=q=>{let p=0;for(const[x,v]of pairs){p+=v;if(p>=q-1e-12)return x;}};
 return {mean:sum(pairs.map(([x,p])=>x*p)),min:pairs[0][0],max:pairs.at(-1)[0],chanceMaximum:pairs.at(-1)[1],median:quantile(.5),p10:quantile(.1),p90:quantile(.9),chance75to200:sum(pairs.filter(([x])=>x>=75&&x<=200).map(x=>x[1])),chanceBelow75:sum(pairs.filter(([x])=>x<75).map(x=>x[1])),chanceAbove200:sum(pairs.filter(([x])=>x>200).map(x=>x[1]))};
}
