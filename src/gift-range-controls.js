import {validateGiftRanges,giftRangeText} from './gift-ranges.js';

export function bindGiftRangeFields(container,onChange){
 function set(ranges){
  container.replaceChildren();
  for(const r of validateGiftRanges(ranges)){
   const row=document.createElement('fieldset');row.className='gift-range-row';row.dataset.id=r.id;
   const legend=document.createElement('legend');legend.textContent='Game '+r.id.slice(-1);row.append(legend);
   for(const [key,label] of [['name','Button name'],['min','Minimum ($)'],['max','Maximum ($)']]){
    const wrap=document.createElement('div'),caption=document.createElement('label'),input=document.createElement('input');
    input.id='gift-'+r.id+'-'+key;input.dataset.field=key;caption.htmlFor=input.id;caption.textContent=label;
    input.type=key==='name'?'text':'number';input.value=r[key]??'';
    if(key==='name'){input.required=true;input.maxLength=24;}else{input.min=1;input.max=1000000;input.step=1;input.placeholder='Set amount';}
    input.addEventListener('input',onChange);wrap.append(caption,input);row.append(wrap);
   }
   container.append(row);
  }
 }
 function read(){return validateGiftRanges([...container.children].map(row=>{
  const r={id:row.dataset.id};for(const key of ['name','min','max']){const value=row.querySelector('[data-field="'+key+'"]').value;r[key]=key==='name'?value:value===''?null:Number(value);}return r;
 }));}
 return {set,read};
}

export function renderGiftRangeButtons(container,ranges,{disabled=false,activeId=null,onStart}){
 const clean=validateGiftRanges(ranges),signature=JSON.stringify(clean);
 if(container.dataset.ranges!==signature){
  container.dataset.ranges=signature;container.replaceChildren();
  for(const r of clean){
   const button=document.createElement('button');button.type='button';button.className='gift-range-button';button.dataset.range=r.id;
   const name=document.createElement('strong'),limits=document.createElement('span');name.textContent=r.name;limits.textContent=giftRangeText(r);button.append(name,limits);
   button.addEventListener('click',()=>onStart(r.id));container.append(button);
  }
 }
 for(const [i,button] of [...container.children].entries()){
  button.disabled=disabled||clean[i].min===null;
  button.setAttribute('aria-pressed',String(clean[i].id===activeId));
 }
}
