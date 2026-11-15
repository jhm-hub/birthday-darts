import {CONCEPTS,labDefaults,validateLab,cents} from './wheel-lab-game.js';
export const labKey=kind=>'faith-wheel-lab-v1:'+kind;
export function createLabStore(kind,{storage=localStorage,locks=navigator.locks,idFactory=()=>crypto.randomUUID()}={}){
 if(!CONCEPTS[kind])throw Error('Choose a prototype.');const key=labKey(kind);
 function normalize(raw){
  if(raw?.version!==1||!Number.isSafeInteger(raw.revision)||raw.revision<1||!Array.isArray(raw.presets)||!raw.presets.length||raw.presets.length>30)throw Error('Invalid prototype library.');
  const presets=raw.presets.map(p=>{const config=validateLab(p.config);if(config.kind!==kind||!Number.isInteger(p.poolCents)||p.poolCents<cents(config.seed)||p.poolCents>cents(config.cap))throw Error('Invalid prototype preset.');return {config,poolCents:p.poolCents};});
  const ids=presets.map(p=>p.config.id);if(new Set(ids).size!==ids.length||!ids.includes(raw.selected))throw Error('Invalid prototype selection.');return {version:1,revision:raw.revision,selected:raw.selected,presets};
 }
 function read(){const raw=storage.getItem(key);if(!raw)return null;try{return normalize(JSON.parse(raw));}catch{throw Error('Saved prototypes could not be read. They have not been overwritten.');}}
 function write(raw){const state=normalize(raw);try{storage.setItem(key,JSON.stringify(state));}catch{throw Error('Browser storage is full or unavailable. Your earlier saves are safe. Try a smaller PNG.');}return state;}
 const lock=fn=>locks.request(key,fn);
 function current(rev){const s=read();if(!s||s.revision!==rev)throw Error('This prototype changed in another tab. Reload before saving or spinning again.');return s;}
 return {key,read,init:()=>lock(()=>{const saved=read();if(saved)return saved;const presets=[false,true].map(high=>{const config=labDefaults(kind,high);return {config,poolCents:cents(config.seed)};});return write({version:1,revision:1,selected:presets[0].config.id,presets});}),
 save:(raw,rev,copyName)=>lock(()=>{const s=current(rev);let config=validateLab(raw);if(config.kind!==kind)throw Error('Wrong prototype.');let record;
  if(copyName!==undefined){if(s.presets.length>=30)throw Error('This prototype already has 30 presets.');config=validateLab({...config,id:idFactory(),name:copyName});record={config,poolCents:cents(config.seed)};}
  else{record=s.presets.find(p=>p.config.id===config.id);if(!record)throw Error('Preset is unavailable.');record={config,poolCents:Math.max(cents(config.seed),Math.min(cents(config.cap),record.poolCents))};}
  if(s.presets.some(p=>p.config.id!==config.id&&p.config.name.toLowerCase()===config.name.toLowerCase()))throw Error('That name is already saved. Choose a different name.');
  if(copyName!==undefined)s.presets.push(record);else s.presets=s.presets.map(p=>p.config.id===config.id?record:p);s.selected=config.id;s.revision++;return write(s);
 }),
 select:(id,rev)=>lock(()=>{const s=current(rev);if(!s.presets.some(p=>p.config.id===id))throw Error('Choose a saved prototype.');s.selected=id;s.revision++;return write(s);}),
 pool:(id,value,rev)=>lock(()=>{if(kind!=='jackpot')throw Error('Only the jackpot has a pot.');const s=current(rev),p=s.presets.find(p=>p.config.id===id);if(!p||s.selected!==id)throw Error('The active prototype changed.');p.poolCents=value;s.revision++;return write(s);})};
}
