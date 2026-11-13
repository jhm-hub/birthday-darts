export const COLOR_FIELDS = {
 rim:'Wheel rim', divider:'Spot dividers', ring:'Ring highlight', hub:'Centre',
 labelA:'Numbers · odd spots', labelB:'Numbers · even spots', pointer:'Pointer',
 title:'Game title', resultBackground:'Result background', resultText:'Result text',
};
const themes={
 landaire:{outer:['#ab4bb8','#d9a9e8'],inner:['#c42d9a','#f4a6cf'],rim:'#633375',divider:'#7c3e88',ring:'#d6aadf',hub:'#fbe1f1',labelB:'#492450'},
 sweetheart:{outer:['#d77c95','#ffd1dc'],inner:['#b96280','#f8c3d6'],rim:'#854259',divider:'#a9526b',ring:'#f1bbc9',hub:'#ffe7e8',labelB:'#63283f'},
 reference:{outer:['#3667cf','#f4aa4b'],inner:['#e44565','#73d36a'],rim:'#56526b',divider:'#42415c',ring:'#a29ab9',hub:'#f2e7ff',labelB:'#28223e'},
};
export function hexColor(value){
 if(typeof value!=='string'||!/^#?(?:[\da-f]{3}|[\da-f]{6})$/i.test(value.trim()))throw Error('Use a hex colour such as #AB4BB8.');
 let hex=value.trim().replace(/^#/,'');if(hex.length===3)hex=[...hex].map(c=>c+c).join('');return '#'+hex.toUpperCase();
}
export function fontName(value){
 if(typeof value!=='string'||!value.trim()||value.trim().length>60||! /^[\p{L}\p{N} -]+$/u.test(value.trim()))throw Error('Enter a font family name, such as Nunito or Fredoka.');
 return value.trim();
}
export function presetAppearance(palette,outerCount,innerCount,fontFamily='Fredoka'){
 const p=themes[palette];if(!p)throw Error('Choose a valid colour preset.');
 const colors=Object.fromEntries(Object.keys(COLOR_FIELDS).map(key=>[key,hexColor(p[key]??({labelA:'#FFFFFF',pointer:'#E6C5FF',title:'#F8D7EE',resultBackground:'#2D1B38',resultText:'#FFE8F7'})[key])]));
 return {fontFamily:fontName(fontFamily),colors,outerColors:Array.from({length:outerCount},(_,i)=>hexColor(p.outer[i%2])),innerColors:Array.from({length:innerCount},(_,i)=>hexColor(p.inner[i%2]))};
}
export function readAppearance(raw,config){
 const fallback=presetAppearance(config.palette,config.outer.length,config.inner.length);
 if(raw===undefined)return fallback;
 if(!raw||typeof raw!=='object'||!raw.colors)throw Error('The wheel colours could not be read.');
 const colors=Object.fromEntries(Object.keys(COLOR_FIELDS).map(key=>[key,hexColor(raw.colors[key])]));
 const list=(key,n)=>{if(!Array.isArray(raw[key])||raw[key].length!==n)throw Error('Every spot needs a hex colour.');return raw[key].map(hexColor);};
 return {fontFamily:fontName(raw.fontFamily),colors,outerColors:list('outerColors',config.outer.length),innerColors:list('innerColors',config.inner.length)};
}
export function spotCount(value){const n=Number(value);if(!Number.isInteger(n)||n<2||n>24)throw Error('Choose 2–24 spots on each wheel.');return n;}
export function resizeSpots(spots,count,pair){return Array.from({length:spotCount(count)},(_,i)=>spots[i]?{...spots[i]}:{value:'0',color:pair[i%2]});}

const fonts=new Map();
export function loadWheelFont(family,doc=document){
 family=fontName(family);if(fonts.has(family))return fonts.get(family);
 const task=(async()=>{
  if(!['Fredoka','Nunito'].includes(family))await new Promise((resolve,reject)=>{
   const link=doc.createElement('link');link.rel='stylesheet';link.referrerPolicy='no-referrer';
   link.href='https://fonts.googleapis.com/css2?family='+encodeURIComponent(family).replace(/%20/g,'+')+'&display=swap';
   const timer=setTimeout(()=>{link.remove();reject(Error('Font request timed out.'));},10000);
   link.onload=()=>{clearTimeout(timer);resolve();};link.onerror=()=>{clearTimeout(timer);link.remove();reject(Error('Font could not be loaded.'));};doc.head.append(link);
  });
  const loaded=await doc.fonts.load('600 24px "'+family+'"');if(!loaded.length)throw Error('Font could not be loaded.');
 })();fonts.set(family,task);task.catch(()=>fonts.delete(family));return task;
}
