import {validateBonus} from './bonus-game.js';
import {validateMirror} from './mirror-game.js';
import {DEMO_GAMES} from './wheel-demo.js';
import {checkPngFile} from './centre-png-upload.js';
export const demoPresetKey=game=>'faith-wheel-demo-presets-v1:'+game;
export function validateDemoArtwork(raw={kind:'sample'}){
 if(!raw||!['sample','none','saved','upload'].includes(raw.kind))throw Error('The demo artwork could not be read.');
 if(raw.kind!=='upload')return {kind:raw.kind};
 if(typeof raw.png!=='string'||raw.png.length>710000||!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(raw.png))throw Error('The saved demo PNG could not be read.');
 let bytes;try{bytes=Uint8Array.from(atob(raw.png.slice(22)),c=>c.charCodeAt(0));}catch{throw Error('The saved demo PNG could not be read.');}
 const size=checkPngFile(bytes);if(size.width>300||size.height>300||bytes.length>512*1024)throw Error('The demo PNG is too large. Upload it again.');
 return {kind:'upload',png:raw.png,label:String(raw.label||'Your PNG').slice(0,100)};
}
export async function demoPngData(blob){
 if(blob.size>512*1024)throw Error('This prepared PNG is too large to save in the demo. Try a simpler image.');
 const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return 'data:image/png;base64,'+btoa(binary);
}
// Demo storage has its own namespace. It never uses the live stores, API writes,
// pairing keys or totals. Failed writes leave the previous library intact.
export function createDemoPresetStore(game,{storage=localStorage,locks=navigator.locks,idFactory=()=>crypto.randomUUID()}={}){
 if(!DEMO_GAMES.includes(game))throw Error('Choose a demo game.');
 const key=demoPresetKey(game),validate=c=>(game.startsWith('mirror-')?validateMirror:validateBonus)(c,game.endsWith('multiply')?'multiply':'add');
 const record=raw=>({config:validate(raw.config),artwork:validateDemoArtwork(raw.artwork)});
 function normalize(raw){
  if(raw?.version!==1||!Number.isSafeInteger(raw.revision)||raw.revision<1||!Array.isArray(raw.wheels)||!raw.wheels.length||raw.wheels.length>30)throw Error('Saved demo wheels could not be read. They have not been overwritten.');
  const wheels=raw.wheels.map(record),ids=wheels.map(w=>w.config.id);if(new Set(ids).size!==ids.length||!ids.includes(raw.selected))throw Error('Saved demo wheels could not be read. They have not been overwritten.');
  return {version:1,revision:raw.revision,selected:raw.selected,wheels};
 }
 function read(){const text=storage.getItem(key);if(!text)return null;try{return normalize(JSON.parse(text));}catch{throw Error('Saved demo wheels could not be read. They have not been overwritten.');}}
 function write(raw){const state=normalize(raw);try{storage.setItem(key,JSON.stringify(state));}catch{throw Error('This browser could not save the demo wheel. Your earlier saves are safe. Try a smaller PNG or free browser storage.');}return state;}
 const lock=fn=>locks.request(key,fn);
 function current(expected){const state=read();if(!state)throw Error('Load the demo wheels first.');if(expected!==undefined&&state.revision!==expected)throw Error('Demo wheels changed in another tab. Reload the page before saving.');return state;}
 return {key,read,async init(source,artwork={kind:'sample'}){return lock(()=>{const old=read();if(old)return old;const base=validate(source),regular=record({config:{...base,id:idFactory(),name:'Regular'},artwork});const scale=(values,factor)=>values.map(n=>Math.min(9999.99,Math.round(n*100*factor)/100));const high=record({config:{...base,id:idFactory(),name:'High Roller',outer:scale(base.outer,5),inner:scale(base.inner,2),bonus:scale(base.bonus,2)},artwork});return write({version:1,revision:1,selected:regular.config.id,wheels:[regular,high]});});},
 async save(raw,{copyName,expectedRevision}={}){return lock(()=>{const state=current(expectedRevision);let next=record(raw);if(copyName!==undefined){const name=String(copyName).trim();if(!name||name.length>40)throw Error('Name the new demo wheel (up to 40 characters).');if(state.wheels.some(w=>w.config.name.toLowerCase()===name.toLowerCase()))throw Error('That demo wheel name is already saved. Choose another name.');if(state.wheels.length>=30)throw Error('This demo already has 30 saved wheels.');next=record({...next,config:{...next.config,id:idFactory(),name}});state.wheels.push(next);}else{const index=state.wheels.findIndex(w=>w.config.id===next.config.id);if(index<0)throw Error('That demo wheel is no longer available.');state.wheels[index]=next;}state.selected=next.config.id;state.revision++;return write(state);});},
 async select(id,expectedRevision){return lock(()=>{const state=current(expectedRevision);if(!state.wheels.some(w=>w.config.id===id))throw Error('Choose a saved demo wheel.');state.selected=id;state.revision++;return write(state);});}
 };
}
