// Original Crown Vault sound design: D-major jewels, damped gold mechanisms
// and warm bass. No downloads or background music; previews use the same PCM.
import {finalePose} from './vault-effects.js';
import {VAULT_COLLECT_TRAVEL_MS,VAULT_COLLECT_STAGGER_MS,vaultCollectionCount} from './vault-collection-motion.js';
import {VAULT_CHAMBER_GUIDE_TRAVEL_MS} from './vault-chamber-handoff.js';
import {VAULT_CASH_LAND_MS} from './vault-cash-motion.js';
import {VAULT_BONUS_LAND_MS} from './vault-bonus-motion.js';
import {VAULT_OPENING_REVEAL_MS,VAULT_OPENING_LOCK_MS} from './vault-intro-motion.js';
const midi=p=>440*2**((p-69)/12);
const note=(at,pitch,length,gain=.04,voice='jewel')=>({at,frequency:midi(pitch),length,gain,voice});
const foley=(at,voice,length,gain,seed=41)=>({at,voice,length,gain,seed});
export const VAULT_SOUND_LABELS={intro:'Opening balance',ready:'First chamber invitation',next:'Bankroll → next lock','linked-unlock':'Prepared chamber unlock','first-unlock':'First chamber unlock',unlock:'Lock & heavy door',cash:'Cash treasure',multiply:'Total multiplier',extra:'Extra unlock',collect:'Coins collected',wing:'Bonus wing',settle:'Last treasure settles',standard:'Standard win',big:'Big win',royal:'Royal win',clear:'Round farewell'};
const trims={intro:1.2,'intro-arrive':1.2,'intro-balance':1.2,ready:2.4,next:2,'linked-unlock':1.35,'first-unlock':1.35,unlock:1.35,cash:1.6,multiply:1,extra:1.85,collect:1.6,wing:1.1,settle:1,standard:1.05,big:1.2,royal:1,clear:1};
export function vaultSoundScore(name,{index=0,tier=0}={}){
 const bonusLand=VAULT_BONUS_LAND_MS/1000,room=((index%5)+5)%5,accent=[74,78,81,76,86][room];
 switch(name){
 case 'intro':{const reveal=VAULT_OPENING_REVEAL_MS/1000;return [foley(0,'air',.34,.018),note(.04,62,.45,.021,'warm'),...VAULT_OPENING_LOCK_MS.map((at,i)=>foley(at/1000,'click',.055,.028,801+i*13)),...[74,78,81].map((p,i)=>note(VAULT_OPENING_LOCK_MS[i*2]/1000,p,.18,.025+i*.002,'celesta')),foley(reveal,'coin',.16,.025,887),note(reveal,62,.46,.026,'warm'),note(reveal,86,.42,.044,'glass'),note(reveal,90,.35,.021,'glass'),note(reveal+.13,93,.27,.025),note(reveal+.24,86,.27,.021,'glass')];}
 case 'intro-arrive':return vaultSoundScore('intro').filter(c=>c.at<VAULT_OPENING_REVEAL_MS/1000);
 case 'intro-balance':return vaultSoundScore('intro').filter(c=>c.at>=VAULT_OPENING_REVEAL_MS/1000).map(c=>({...c,at:c.at-VAULT_OPENING_REVEAL_MS/1000}));
 case 'ready':return [note(0,86,.14,.015,'glass'),note(.1,90,.14,.014,'celesta'),note(.22,93,.18,.014,'glass')];
 case 'next':return [foley(0,'air',.15,.006,829),note(0,86,.13,.011,'glass'),note(.11,90,.13,.012,'celesta'),note(VAULT_CHAMBER_GUIDE_TRAVEL_MS/1000,accent+12,.16,.013,'glass')];
 case 'linked-unlock':return [note(0,accent,.18,.009,'pluck'),note(0,62,.17,.008,'warm'),...vaultSoundScore('unlock',{index}).map(c=>c.voice==='click'?{...c,gain:c.gain*.9}:c)];
 case 'first-unlock':return [note(0,74,.22,.012,'warm'),...vaultSoundScore('unlock',{index:0}).map(c=>c.voice==='click'?{...c,gain:c.gain*.85}:c)];
 case 'unlock':return [foley(.045,'click',.075,.12,41+room),foley(.19,'click',.085,.1,77+room),foley(.285,'bolt',.18,.13,101+room),foley(.33,'hinge',.61,.17,151+room),note(.22,accent,.2,.018,'celesta'),foley(.89,'seat',.15,.075,201+room)];
 case 'cash':{const land=VAULT_CASH_LAND_MS/1000;return [foley(0,'coin',.14,.035,431),note(.025,86,.18,.03),note(land,90,.22,.038,'glass'),note(land,86,.18,.02,'celesta'),note(.235,93,.13,.024),...(tier>0?[foley(.07,'coin',.09,.022,443),note(land,62,.2,.015,'warm'),note(land,93,.2,.024,'glass')]:[]),...(tier>1?[foley(.11,'coin',.09,.018,449),note(land,50,.24,.018,'warm'),note(land,98,.22,.02,'glass'),note(.275,102,.12,.015)]:[])];}
 case 'multiply':return [...[62,69,74,78].map((p,i)=>note(i*.04,p,.16,.023,'pluck')),note(bonusLand,50,.28,.018,'warm'),foley(bonusLand,'coin',.08,.022,919),note(bonusLand,86,.42,.055,'glass'),note(bonusLand,90,.33,.028,'glass'),note(bonusLand,93,.28,.024),note(.33,98,.22,.022),note(.46,102,.17,.015,'glass')];
 case 'extra':return [foley(0,'click',.06,.035,301),...[74,78,81].map((p,i)=>note(i*.07,p,.14,.026,'celesta')),foley(bonusLand,'click',.075,.055,313),note(bonusLand,74,.22,.014,'warm'),note(bonusLand,86,.32,.043,'celesta'),note(.31,90,.24,.028,'celesta'),note(.43,93,.23,.022,'glass')];
 case 'collect':{const land=VAULT_COLLECT_TRAVEL_MS/1000;return [foley(0,'air',.22,.012,397),note(.015,81,.18,.009,'pluck'),...Array.from({length:vaultCollectionCount(tier)},(_,i)=>foley(land+i*VAULT_COLLECT_STAGGER_MS/1000,'coin',.055,.029-i*.0018,401+i*13)),note(land,74,.14,.02,'warm'),note(land,93,.14,.02,'glass'),...(tier>0?[note(land,86,.13,.012,'celesta')]:[])];}
 case 'wing':return [foley(0,'air',.3,.025),note(.015,74,.24,.019,'glass'),note(.1,81,.23,.021,'glass')];
 case 'settle':return [foley(0,'coin',.10,.026,701),note(.025,74,.26,.024,'warm'),note(.09,81,.20,.019,'celesta'),note(.19,86,.20,.020,'glass'),...(tier>0?[note(.12,90,.17,.013,'glass')]:[]),...(tier>1?[foley(.04,'air',.25,.012,709),note(.23,93,.22,.015,'celesta')]:[])];
 case 'standard':{const hit=finalePose(0,0).build/1000;return [note(0,81,.18,.026,'celesta'),foley(hit,'coin',.11,.023,727),note(hit,50,.46,.022,'warm'),note(hit,62,.46,.032,'warm'),note(hit,86,.42,.041,'glass'),note(hit,90,.32,.019,'glass'),note(.34,93,.28,.026),note(.49,98,.23,.022),note(.70,90,.36,.024,'glass'),note(.70,86,.4,.025,'warm'),note(.85,93,.35,.018,'glass')];}
 case 'big':{const hit=finalePose(0,1).build/1000;return [note(0,78,.21,.027,'celesta'),note(.11,81,.2,.030,'celesta'),foley(hit,'seat',.26,.047),foley(hit,'coin',.12,.022,733),note(hit,50,.65,.039,'warm'),note(hit,74,.65,.034,'brass'),note(hit,78,.57,.025,'brass'),note(hit,81,.5,.022,'brass'),note(hit,86,.5,.037,'glass'),...[90,93,98].map((p,i)=>note(.36+i*.085,p,.25,.023)),foley(hit+.31,'air',.26,.026,739),foley(hit+.31,'coin',.10,.018,743),note(hit+.31,98,.38,.026,'glass'),note(.79,93,.32,.024,'celesta'),note(.94,90,.44,.027,'glass'),note(.94,74,.48,.020,'warm'),note(1.08,86,.48,.030,'glass')];}
 case 'royal':{const hit=finalePose(0,2).build/1000;return [note(0,50,.68,.023,'warm'),foley(.09,'air',.5,.046,501),...[74,78,81].map((p,i)=>note(.06+i*.18,p,.23,.029,'celesta')),note(.5,86,.12,.028),foley(hit,'seat',.42,.068),foley(hit,'coin',.12,.023,751),note(hit,38,.8,.035,'warm'),note(hit,62,.95,.043,'brass'),note(hit,66,.83,.029,'brass'),note(hit,69,.78,.024,'brass'),note(hit,86,.85,.040,'glass'),note(hit,90,.7,.026,'glass'),note(hit,93,.64,.020),...[98,102,105].map((p,i)=>note(.73+i*.07,p,.26,.021)),foley(hit+.34,'air',.4,.035,757),foley(hit+.34,'coin',.1,.021,761),note(hit+.34,50,.35,.021,'warm'),note(hit+.34,98,.48,.029,'glass'),note(hit+.34,102,.42,.019,'glass'),...[105,102,98,93].map((p,i)=>note(1.10+i*.115,p,.29,.021)),note(1.57,86,.62,.032,'glass'),note(1.57,74,.64,.026,'warm'),note(1.57,90,.55,.020,'glass'),note(1.74,93,.47,.023)];}
 case 'clear':return [foley(0,'air',.47,.014,601),note(0,86,.3,.015,'glass'),note(.12,81,.25,.014,'glass'),note(.24,74,.22,.013,'warm'),foley(.44,'click',.055,.028,607),foley(.44,'seat',.08,.024,613)];
 default:throw Error('Unknown vault sound: '+name);
 }
}

// Rounded edges and band-limited deterministic noise make clicks intentional
// transients rather than buffer discontinuities. Every voice finishes at zero.
function renderVoice(cue,sampleRate){
 const length=Math.ceil(cue.length*sampleRate),data=new Float32Array(length);
 let seed=cue.seed??41,low=0,bass=0;
 const hiCut=1-Math.exp(-2*Math.PI*4800/sampleRate),loCut=1-Math.exp(-2*Math.PI*700/sampleRate);
 for(let i=0;i<length;i++){
  const t=i/sampleRate,u=i/(length-1),end=(length-1-i)/sampleRate;
  seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
  const noise=(seed>>>0)/2147483648-1;
  low+=hiCut*(noise-low);bass+=loCut*(noise-bass);
  const band=low-bass,edge=Math.sin(Math.PI/2*Math.min(1,t/.003))**2*Math.sin(Math.PI/2*Math.min(1,end/.025))**2;
  let value=0;
  if(cue.frequency){
   const phase=2*Math.PI*cue.frequency*t,sine=Math.sin(phase);
   if(cue.voice==='warm')value=(sine+.12*Math.sin(phase*2))*Math.exp(-u*3.2);
   else if(cue.voice==='brass')value=(sine+.24*Math.sin(phase*2)+.1*Math.sin(phase*3))*Math.min(1,t/.035)*Math.exp(-u*2.7);
   else if(cue.voice==='pluck')value=(sine+.14*Math.sin(phase*2)+.05*Math.sin(phase*3))*Math.exp(-u*6);
   else if(cue.voice==='celesta')value=(sine+.22*Math.sin(phase*3.98)*Math.exp(-u*12))*Math.exp(-u*4.8);
   else value=(sine+.19*Math.sin(phase*2.01)*Math.exp(-u*6)+.045*Math.sin(phase*3.96)*Math.exp(-u*12))*Math.exp(-u*(cue.voice==='glass'?3.8:5.2));
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
   const f=2050+(cue.seed%7)*115;
   value=(.55*Math.sin(2*Math.PI*f*t)+.18*Math.sin(2*Math.PI*f*1.43*t)+.2*band)*Math.exp(-t*38);
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
