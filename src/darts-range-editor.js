import {validateDartsGameRanges} from './darts-game-ranges.js';

export function createDartsRangeEditor(root,{change,demo,error}){
 function update(ranges){
  root.replaceChildren();
  for(const range of validateDartsGameRanges(ranges)){
   const card=document.createElement('div');card.className='game-range-card';card.dataset.rangeId=range.id;
   for(const [field,label] of [['name','Game name'],['min','Minimum total ($)'],['max','Maximum total ($)']]){
    const wrap=document.createElement('label'),input=document.createElement('input');
    wrap.textContent=label;input.dataset.field=field;input.value=range[field];input.required=true;
    input.setAttribute('aria-label',range.id+' '+label);
    if(field==='name'){input.maxLength=24;input.autocomplete='off';}
    else Object.assign(input,{type:'number',min:'1',max:'1000000',step:'1'});
    input.addEventListener('input',change);wrap.append(input);card.append(wrap);
   }
   const play=document.createElement('button');play.type='button';play.className='range-demo';play.textContent='▶ Demo';play.setAttribute('aria-label','Demo '+range.id+' game');
   play.onclick=()=>{try{demo(range.id);}catch(e){error(e.message);}};card.append(play);root.append(card);
  }
 }
 return {update,read:()=>[...root.children].map(card=>({id:card.dataset.rangeId,...Object.fromEntries([...card.querySelectorAll('input')].map(input=>[input.dataset.field,input.dataset.field==='name'?input.value:Number(input.value)]))}))};
}
