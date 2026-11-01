import {VAULT_OPENING_GUIDE_MS} from './vault-opening-handoff.js';
import {VAULT_WELCOME_START_MS} from './vault-welcome-flow.js';
import {VAULT_TREASURE_FAREWELL_MS} from './vault-treasure-coda.js';
// Original Crown Vault arcade sound design: reel stops, bright register bells
// and short electronic payouts. No background loop; previews use the live PCM.
import {VAULT_SPECIAL_PREPARE_MS,VAULT_SPECIAL_HIT_MS} from './vault-special-arrival.js';
import {VAULT_WING_LEAD_MS} from './vault-chamber-handoff.js';
import {VAULT_FAREWELL_LEAD_MS,VAULT_DOORS_SEATED_MS,VAULT_DOOR_CLOSE_START_MS} from './vault-exit-motion.js';
import {finalePose} from './vault-effects.js';
import {VAULT_TREASURE_CORONATION_MS,VAULT_TREASURE_ENCORE_MS} from './vault-treasure.js';
import {VAULT_COLLECT_TRAVEL_MS,VAULT_COLLECT_STAGGER_MS,vaultCollectionCount} from './vault-collection-motion.js';
import {VAULT_CHAMBER_GUIDE_TRAVEL_MS} from './vault-chamber-handoff.js';
import {VAULT_CASH_LAND_MS} from './vault-cash-motion.js';
import {VAULT_BONUS_LAND_MS} from './vault-bonus-motion.js';
import {VAULT_OPENING_REVEAL_MS} from './vault-intro-motion.js';
const midi=p=>440*2**((p-69)/12);
const note=(at,pitch,length,gain=.04,voice='bell')=>({at,frequency:midi(pitch),length,gain,voice});
const foley=(at,voice,length,gain,seed=41)=>({at,voice,length,gain,seed});
export const VAULT_SOUND_LABELS={welcome:'Next viewer entrance',intro:'Opening balance',ready:'First chamber invitation',next:'Bankroll → next lock','linked-unlock':'Prepared chamber unlock','first-unlock':'First chamber unlock',unlock:'Lock & heavy door',cash:'Cash treasure',multiply:'Total multiplier',extra:'Extra unlock',collect:'Coins collected',wing:'Next crown wing',special:'Special vault entrance',settle:'Last treasure settles','finish-gold':'Gold finale build-up','finish-jewel':'Jewel finale build-up',standard:'Standard win',big:'Big win',royal:'Royal win','rich-lock':'Treasure lock accent','rich-cash':'Grand cash flourish','final-ovation':'Gilded ovation finale','final-coronation':'Crown coronation finale','rest-gold':'Gold celebration settles','rest-jewel':'Jewel celebration settles','clear-gold':'Gold vault farewell','clear-jewel':'Jewel vault farewell',rest:'Celebration settles',clear:'Soft vault farewell'};
const trims={welcome:1,'rest-gold':1,'rest-jewel':1,'clear-gold':1,'clear-jewel':1,'finish-gold':1,'finish-jewel':1,'linked-final':1,'final-ovation':1,'final-coronation':1,'rich-lock':1,'rich-cash':1,'rich-final':1,intro:1.2,'intro-arrive':1.2,'intro-balance':1.2,ready:2.4,next:2,'linked-unlock':1.35,'first-unlock':1.35,unlock:1.35,cash:1.6,multiply:1,extra:1.85,collect:1.6,wing:1.1,special:1.2,'special-prepare':1.2,'special-arrive':1.2,settle:1,standard:1.05,big:1.2,royal:1,rest:1.4,clear:1.45};
export function vaultSoundScore(name,{index=0,tier=0,richness=1,bridgeMs=888}={}){
 const bonusLand=VAULT_BONUS_LAND_MS/1000,room=((index%5)+5)%5,accent=[74,78,81,76,86][room];
 switch(name){
 case 'welcome':return [...vaultSoundScore('intro').map(c=>({...c,gain:c.gain*trims.intro})),...vaultSoundScore('ready').map(c=>({...c,at:c.at+VAULT_OPENING_GUIDE_MS/1000,gain:c.gain*trims.ready}))];
 // Four layers: a quick reel pickup, an electronic tick, then one register
 // hit on the balance. Decorative lights still have no separate sound.
 case 'intro':{const reveal=VAULT_OPENING_REVEAL_MS/1000;return [foley(.04,'reel',.12,.035,801),note(VAULT_WELCOME_START_MS/1000,74,.10,.021,'arcade'),note(reveal,62,.12,.022,'punch'),note(reveal,86,.18,.043,'bell')];}
 case 'intro-arrive':return vaultSoundScore('intro').filter(c=>c.at<VAULT_OPENING_REVEAL_MS/1000);
 case 'intro-balance':return vaultSoundScore('intro').filter(c=>c.at>=VAULT_OPENING_REVEAL_MS/1000).map(c=>({...c,at:c.at-VAULT_OPENING_REVEAL_MS/1000}));
 case 'ready':return [note(0,81,.13,.016,'arcade')];
 case 'next':return [note(0,accent,VAULT_CHAMBER_GUIDE_TRAVEL_MS/1000,.016,'arcade')];
 // The sparse physical mechanism and its hinge clock remain unchanged.
 case 'linked-unlock':return vaultSoundScore('unlock',{index});
 case 'first-unlock':return vaultSoundScore('unlock',{index:0});
 case 'unlock':return [foley(.06,'click',.07,.085,41+room),foley(.285,'bolt',.16,.09,101+room),foley(.33,'hinge',.61,.14,151+room)];
 case 'cash':{const land=VAULT_CASH_LAND_MS/1000;return [foley(0,'coin',.07,.024,431),note(.025,74,.07,.023,'arcade'),note(land,[86,90,93][tier],.13+tier*.025,.039+tier*.003,'bell'),note(land,62,.10,.016+tier*.004,'punch'),...(tier>0?[note(.235,86,.065,.018,'arcade')]:[]),...(tier>1?[note(.30,98,.08,.019,'bell')]:[])];}
 case 'multiply':return [...[74,81,86].map((p,i)=>note(i*.055,p,.065,.019,'arcade')),foley(bonusLand,'coin',.055,.021,919),note(bonusLand,50,.12,.025,'punch'),note(bonusLand,93,.19,.044,'bell'),note(bonusLand+.095,98,.08,.023,'arcade')];
 case 'extra':return [foley(0,'reel',.10,.030,301),note(.03,74,.07,.018,'arcade'),note(.10,81,.07,.018,'arcade'),foley(bonusLand,'click',.06,.035,313),note(bonusLand,62,.11,.016,'punch'),note(bonusLand,86,.16,.032,'bell'),note(bonusLand+.09,90,.075,.021,'arcade')];
 case 'collect':{const land=VAULT_COLLECT_TRAVEL_MS/1000,count=vaultCollectionCount(tier);return [...Array.from({length:count},(_,i)=>foley(land+i*VAULT_COLLECT_STAGGER_MS/1000,'coin',.055,.027-i*.0015,401+i*13)),note(land,62,.09,.014,'punch'),note(land+(count-1)*VAULT_COLLECT_STAGGER_MS/1000,86,.065,.013,'arcade')];}
 case 'wing':return [foley(0,'reel',.18,.023,857)];
 case 'special':{
  const melody=[[78,90],[81,93],[74,86]][((index%3)+3)%3],arrive=(VAULT_SPECIAL_PREPARE_MS-VAULT_WING_LEAD_MS)/1000,hit=(VAULT_SPECIAL_PREPARE_MS+VAULT_SPECIAL_HIT_MS)/1000;
  return [note(0,melody[0],.10,.022,'arcade'),foley(arrive,'reel',.11,.020,859),foley(hit,'seat',.12,.020,863),note(hit,62,.12,.018,'punch'),note(hit,melody[1],.18,.033,'bell')];
 }
 case 'special-prepare':return vaultSoundScore('special',{index}).filter(c=>c.at<(VAULT_SPECIAL_PREPARE_MS-VAULT_WING_LEAD_MS)/1000);
 case 'special-arrive':return vaultSoundScore('special',{index}).filter(c=>c.at>=(VAULT_SPECIAL_PREPARE_MS-VAULT_WING_LEAD_MS)/1000).map(c=>({...c,at:c.at-(VAULT_SPECIAL_PREPARE_MS-VAULT_WING_LEAD_MS)/1000}));
 case 'settle':return [foley(0,'coin',.065,.019,701),note(.025,74,.09,.018,'arcade'),note(.14,81+tier*4,.10,.020,'arcade')];
 case 'finish-gold':case 'finish-jewel':{
  const span=Math.max(.3,bridgeMs/1000),jewel=name==='finish-jewel';
  return [note(0,jewel?38:50,.12,.016,'punch'),foley(.02,'reel',span-.04,jewel?.026:.022,jewel?1213:1201),note(span-.14,jewel?86:81,.09,.022,'arcade')];
 }
 // One rhythmic payoff on the same reveal beat; the bridge already supplies
 // anticipation. Long music-box tails and overlapping flourishes are gone.
 case 'linked-final':{const name=['standard','big','royal'][tier],hit=finalePose(0,tier).build/1000;return vaultSoundScore(name).filter(c=>c.at>=hit).map(c=>({...c,gain:c.gain*trims[name]}));}
 case 'standard':{const hit=finalePose(0,0).build/1000;return [note(0,74,.07,.022,'arcade'),foley(hit,'seat',.11,.030,727),note(hit,50,.13,.025,'punch'),note(hit,86,.18,.042,'bell'),note(hit+.11,90,.09,.027,'arcade'),note(hit+.22,93,.20,.034,'bell')];}
 case 'big':{const hit=finalePose(0,1).build/1000;return [note(0,74,.07,.022,'arcade'),note(.11,81,.07,.020,'arcade'),foley(hit,'seat',.14,.038,733),note(hit,50,.16,.034,'punch'),note(hit,86,.22,.048,'bell'),note(hit,74,.12,.014,'arcade'),note(hit+.11,86,.08,.026,'arcade'),note(hit+.22,90,.20,.036,'bell'),note(hit+.31,93,.08,.027,'arcade'),note(hit+.44,98,.24,.041,'bell')];}
 case 'royal':{const hit=finalePose(0,2).build/1000;return [foley(0,'reel',.53,.025,501),note(.05,74,.07,.020,'arcade'),note(.22,81,.07,.018,'arcade'),note(.40,86,.08,.022,'arcade'),foley(hit,'seat',.18,.054,751),note(hit,38,.16,.041,'punch'),note(hit,86,.22,.052,'bell'),note(hit,90,.18,.022,'bell'),note(hit+.11,93,.09,.025,'arcade'),note(hit+.22,98,.22,.037,'bell'),note(hit+.34,93,.09,.025,'arcade'),note(hit+.44,102,.26,.040,'bell'),note(hit+.70,98,.24,.030,'bell'),note(hit+.70,62,.12,.018,'punch')];}
 case 'rich-lock':return [note(0,richness>1?38:50,.12,richness>1?.017:.013,'punch')];
 case 'rich-cash':return [note(0,50,.10,.014,'punch'),note(.05,86,.07,.015,'arcade'),note(.13,98,.14,.020,'bell'),...(richness>1?[foley(.13,'coin',.055,.010,1129),note(.22,102,.07,.015,'arcade')]:[])];
 case 'final-ovation':return vaultSoundScore('rich-final',{richness:1});
 case 'final-coronation':return vaultSoundScore('rich-final',{richness:2});
 case 'rich-final':{
  if(richness<2)return [foley(0,'coin',.055,.016,1151),note(0,50,.11,.012,'punch'),foley(.33,'coin',.055,.014,1153),note(.33,86,.07,.013,'arcade')];
  const crown=VAULT_TREASURE_CORONATION_MS/1000,encore=VAULT_TREASURE_ENCORE_MS/1000;
  return [foley(0,'reel',.25,.014,1163),foley(crown,'seat',.14,.026,1171),note(crown,38,.12,.018,'punch'),note(crown,98,.16,.027,'bell'),foley(encore,'coin',.055,.014,1181),note(encore,102,.18,.025,'bell')];
 }
 case 'rest-gold':return [note(0,86,.08,.008,'arcade'),foley(.14,'coin',.05,.010,1237)];
 case 'rest-jewel':return [foley(0,'reel',.16,.009,1249),note(.12,81,.08,.008,'arcade')];
 case 'clear-gold':case 'clear-jewel':{
  const jewel=name==='clear-jewel',lead=VAULT_TREASURE_FAREWELL_MS[jewel?2:1]/1000,seat=lead+VAULT_DOORS_SEATED_MS/1000;
  const mechanism=vaultSoundScore('clear').filter(c=>['hinge','click','seat'].includes(c.voice)).map(c=>({...c,at:c.at+lead-VAULT_FAREWELL_LEAD_MS/1000,gain:c.gain*trims.clear}));
  return [note(0,jewel?81:74,.08,.006,'arcade'),...mechanism,note(seat,62,.10,.008,'punch')];
 }
 case 'rest':return [foley(0,'reel',.13,.009,601),note(.10,74,.08,.007,'arcade')];
 case 'clear':{const close=(VAULT_FAREWELL_LEAD_MS+VAULT_DOOR_CLOSE_START_MS)/1000,seat=(VAULT_FAREWELL_LEAD_MS+VAULT_DOORS_SEATED_MS)/1000;return [note(0,74,.07,.005,'arcade'),foley(.12,'reel',.12,.009,601),note(.30,69,.08,.006,'arcade'),foley(close,'hinge',.34,.022,603),foley(seat,'click',.045,.016,607),foley(seat,'seat',.12,.018,613)];}
 default:throw Error('Unknown vault sound: '+name);
 }
}

// Rounded edges and band-limited deterministic noise make clicks intentional
// transients rather than buffer discontinuities. Every voice finishes at zero.
function renderVoice(cue,sampleRate){
 const length=Math.ceil(cue.length*sampleRate),data=new Float32Array(length);
 let seed=cue.seed??41,low=0,bass=0;
 const partials=[[1,.74],[3,.20],[5,.10],[7,.05]].filter(([h])=>h*cue.frequency*1.18<sampleRate/2);
 const hiCut=1-Math.exp(-2*Math.PI*4800/sampleRate),loCut=1-Math.exp(-2*Math.PI*700/sampleRate);
 for(let i=0;i<length;i++){
  const t=i/sampleRate,u=i/(length-1),end=(length-1-i)/sampleRate;
  seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
  const noise=(seed>>>0)/2147483648-1;
  low+=hiCut*(noise-low);bass+=loCut*(noise-bass);
  const band=low-bass,edge=Math.sin(Math.PI/2*Math.min(1,t/.003))**2*Math.sin(Math.PI/2*Math.min(1,end/.025))**2;
  let value=0;
  if(cue.frequency){
   const phase=2*Math.PI*cue.frequency*t;
   if(cue.voice==='arcade'){
    // Finite odd harmonics give a bright, band-limited cabinet pulse. A tiny
    // downward attack bend makes a crisp electronic stop rather than a pad.
    const p=2*Math.PI*cue.frequency*(t+.18*(1-Math.exp(-40*t))/40);
    value=partials.reduce((sum,[h,gain])=>sum+gain*Math.sin(p*h),0)*Math.exp(-u*2.3);
   }else if(cue.voice==='punch'){
    const p=2*Math.PI*cue.frequency*(t+.12*(1-Math.exp(-35*t))/35);
    value=(.85*Math.sin(p)+.16*Math.sin(p*2))*Math.exp(-t*24);
   }else if(cue.voice==='bell'){
    // Short register bell: fast FM attack, bright partials, no reverb tail.
    value=(.72*Math.sin(phase+.9*Math.sin(phase*1.41421356)*Math.exp(-t*40))+.18*Math.sin(phase*2.01)*Math.exp(-t*38)+.10*Math.sin(phase*3.91)*Math.exp(-t*55))*Math.exp(-u*3.2);
   }
  }else if(cue.voice==='click')value=(.66*band+.3*Math.sin(2*Math.PI*(1250+cue.seed)*t)+.11*Math.sin(2*Math.PI*2690*t))*Math.exp(-t*68);
  else if(cue.voice==='bolt'){
   const phase=2*Math.PI*(95*t+100*(1-Math.exp(-32*t))/32);
   value=(.7*Math.sin(phase)+.3*band*(.65+.35*Math.cos(t*2*Math.PI*53)))*Math.exp(-t*22);
  }else if(cue.voice==='hinge'){
   const motion=Math.sin(Math.PI*u)**.8,phase=2*Math.PI*(110*t-24*t*t/cue.length);
   value=motion*(.23*Math.sin(phase)+.11*Math.sin(phase*2)+bass*(.7+.3*Math.sin(2*Math.PI*29*t))*.48);
  }else if(cue.voice==='seat'){
   const phase=2*Math.PI*(57*t+73*(1-Math.exp(-20*t))/20);
   value=(.82*Math.sin(phase)+.15*Math.sin(phase*2)+.18*bass)*Math.exp(-t*15);
  }else if(cue.voice==='coin'){
   const f=[1174.66,1479.98,1760,1975.53][cue.seed%4],phase=2*Math.PI*f*t;
   value=(.62*Math.sin(phase+.6*Math.sin(phase*2.8)*Math.exp(-t*70))+.18*Math.sin(phase*2.01)+.16*band)*Math.exp(-t*48);
  }else if(cue.voice==='reel'){
   const long=cue.length>.4,cycles=(long?12:28)*t+(long?10:0)*t*t/cue.length;
   const tooth=Math.exp(-(cycles%1)*13);
   value=(.55*band+.22*Math.sin(2*Math.PI*1850*t))*tooth*(.8+.2*u);
  }else if(cue.voice==='air')value=band*Math.sin(Math.PI*u)**1.4;
  data[i]=value*edge*cue.gain;
 }
 return data;
}
export function renderVaultSound(name,options={},sampleRate=48000){
 const score=vaultSoundScore(name,options),duration=Math.max(...score.map(c=>c.at+c.length))+.025;
 const data=new Float32Array(Math.ceil(duration*sampleRate));
 for(const cue of score){const part=renderVoice(cue,sampleRate),offset=Math.round(cue.at*sampleRate);for(let i=0;i<part.length;i++)data[offset+i]+=part[i]*trims[name];}
 return data;
}

// Offline listening and headroom checks use the exact same layers as playback.
export function renderVaultSequence(events,sampleRate=48000){
 const rendered=events.map(e=>({...e,data:renderVaultSound(e.sound,e.options,sampleRate)}));
 const frames=Math.max(...rendered.map(e=>Math.round(e.at*sampleRate)+e.data.length));
 const mix=new Float32Array(frames);
 for(const e of rendered){const offset=Math.round(e.at*sampleRate);for(let i=0;i<e.data.length;i++)mix[offset+i]+=e.data[i];}
 return mix;
}
