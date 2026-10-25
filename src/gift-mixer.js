import {giftVolume} from './gift-volume.js';

export function bindGiftVolume(root,audio,onInput){
 const input=root.querySelector('input'),output=root.querySelector('output');
 function update(value){
  const level=giftVolume(value);audio.setVolume(level);input.value=level;
  output.textContent=level===0?'Muted':level+'%';
  input.setAttribute('aria-valuetext',level===0?'Muted':level+' percent');
  input.style.setProperty('--volume',level+'%');
 }
 input.addEventListener('input',()=>{const level=Number(input.value);update(level);onInput(level);});
 update(audio.volume);
 return {update,setEnabled(value){input.disabled=!value;}};
}

// Preview mixes are local and separate from each saved game's stream mix.
export function bindGiftPreviewVolume(root,audio){
 const key='faith-gift-preview-volume-v1';
 try{const stored=localStorage.getItem(key);if(stored!==null)audio.setVolume(giftVolume(JSON.parse(stored)));}catch{}
 return bindGiftVolume(root,audio,value=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}});
}
