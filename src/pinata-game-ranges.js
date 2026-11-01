import {validatePinataTotalRange,startPinataTotalRange} from './pinata-targets.js';
export const emptyPinataGameRanges=()=>Array.from({length:4},(_,i)=>({id:'range-'+(i+1),name:'Piñata '+(i+1),min:null,max:null}));
export function validatePinataGameRanges(input){
 if(input===undefined)return emptyPinataGameRanges();
 if(!Array.isArray(input)||input.length!==4)throw Error('Keep all four piñata range buttons.');
 const ranges=input.map((item,i)=>{
  if(item?.id!=='range-'+(i+1))throw Error('A piñata range button could not be read.');
  const name=typeof item.name==='string'?item.name.trim():'';
  if(!name||name.length>24)throw Error('Give each range button a name of 1–24 characters.');
  const blank=v=>v===null||v===undefined||v==='';
  if(blank(item.min)&&blank(item.max))return {id:item.id,name,min:null,max:null};
  if(blank(item.min)||blank(item.max))throw Error('Enter both amounts, or leave both blank to turn off a button.');
  return {id:item.id,name,...validatePinataTotalRange(item)};
 });
 if(new Set(ranges.map(r=>r.name.toLowerCase())).size!==4)throw Error('Give each range button a different name.');
 return ranges;
}
export function startPinataGameRange(widget,ranges,id,viewer='',now=Date.now(),draw){
 const range=validatePinataGameRanges(ranges).find(r=>r.id===id);
 if(!range||range.min===null)throw Error('Set and save this button’s minimum and maximum first.');
 const round=startPinataTotalRange(widget,range,viewer,now,draw);
 round.privateGameRange={...range};return round;
}
