import {VAULT_FIRST_CASH_LAND_MS} from './vault-first-chamber.js';
import {VAULT_TREASURE_TRAVEL_MS,VAULT_TREASURE_STAGGER_MS,VAULT_TREASURE_COUNT_MS,VAULT_TREASURE_GUIDE_MS,VAULT_TREASURE_CATCH_MS} from './vault-opening-treasure.js';
import {VAULT_PLAYBACK_SCALE} from './vault-playback.js';
import {VAULT_UNLOCK_MS,VAULT_COLLECT_START_MS,VAULT_REVEAL_MS,VAULT_BONUS_DELAY_MS} from './vault-timing.js';
import {VAULT_OPENING_GUIDE_MS} from './vault-opening-handoff.js';
import {VAULT_WELCOME_START_MS} from './vault-welcome-flow.js';
import {VAULT_TREASURE_FAREWELL_MS} from './vault-treasure-coda.js';
// Original Crown Vault casino palette: dry key/bolt mechanics, struck metal
// register bells and short payout pulses. Previews use the same PCM as play.
import {VAULT_SPECIAL_PREPARE_MS,VAULT_SPECIAL_HIT_MS} from './vault-special-arrival.js';
import {VAULT_WING_LEAD_MS} from './vault-chamber-handoff.js';
import {VAULT_FAREWELL_LEAD_MS,VAULT_DOORS_SEATED_MS,VAULT_DOOR_CLOSE_START_MS} from './vault-exit-motion.js';
import {finalePose} from './vault-effects.js';
import {VAULT_TREASURE_CORONATION_MS,VAULT_TREASURE_ENCORE_MS} from './vault-treasure.js';
import {VAULT_COLLECT_TRAVEL_MS,VAULT_COLLECT_STAGGER_MS,vaultCollectionTicks} from './vault-collection-motion.js';
import {VAULT_CHAMBER_GUIDE_TRAVEL_MS,VAULT_CHAMBER_GUIDE_LEAD_MS} from './vault-chamber-handoff.js';
import {VAULT_CASH_LAND_MS} from './vault-cash-motion.js';
import {VAULT_BONUS_LAND_MS} from './vault-bonus-motion.js';
import {VAULT_OPENING_REVEAL_MS} from './vault-intro-motion.js';
const midi=p=>440*2**((p-69)/12);
const note=(at,pitch,length,gain=.04,voice='bell')=>({at,frequency:midi(pitch),length,gain,voice});
const foley=(at,voice,length,gain,seed=41)=>({at,voice,length,gain,seed});
export const VAULT_SOUND_LABELS={welcome:'Next viewer entrance',intro:'Opening balance',ready:'First chamber invitation',next:'Next lock ready','deposit-next':'Coins → next lock','linked-unlock':'Prepared chamber unlock','first-unlock':'First chamber unlock',unlock:'Key turn & vault latch',cash:'Cash treasure',multiply:'Total multiplier',extra:'Extra unlock','multiply-build':'Late multiplier anticipation','multiply-payout':'Multiplier → coin payout','extra-payout':'+1 unlock → coin payout',collect:'Coins collected',wing:'Next crown wing',special:'Special vault entrance',settle:'Last treasure settles','finish-boost':'Multiplier into jackpot','finish-gold':'Gold finale build-up','finish-jewel':'Jewel finale build-up',standard:'Standard win',big:'Big win',royal:'Royal win','final-ovation':'Gilded ovation finale','final-coronation':'Crown coronation finale','rest-gold':'Gold celebration settles','rest-jewel':'Jewel celebration settles','clear-gold':'Gold vault farewell','clear-jewel':'Jewel vault farewell',rest:'Celebration settles',clear:'Soft vault farewell'};
Object.assign(VAULT_SOUND_LABELS,{'boost-4-build':'Final ×4 · gold reel stops','boost-4-reveal':'Final ×4 · gold payout','boost-6-build':'Final ×6 · crown reel stops','boost-6-reveal':'Final ×6 · crown payout'});
Object.assign(VAULT_SOUND_LABELS,{'opening-treasure-lock':'Opening treasure · key & lid','opening-treasure-reveal':'Opening treasure · cash found','opening-treasure-deposit':'Opening treasure → bankroll','opening-treasure-count':'Starting balance · count & catch','opening-treasure-ready':'Starting treasure → first lock'});
Object.assign(VAULT_SOUND_LABELS,{'treasure-first-unlock':'First chamber · key, bolt & catch','treasure-first-cash':'First chamber · cash arrival'});
const trims={'treasure-first-unlock':1,'treasure-first-cash':1,'opening-treasure-count':1,'opening-treasure-ready':1,'opening-treasure-lock':1,'opening-treasure-reveal':1,'opening-treasure-deposit':1,'boost-4-build':1,'boost-6-build':1,'boost-4-reveal':1,'boost-6-reveal':1,'finish-boost':1,'multiply-build':1,'deposit-next':1,'multiply-payout':1,'extra-payout':1,welcome:1,'rest-gold':1,'rest-jewel':1,'clear-gold':1,'clear-jewel':1,'finish-gold':1,'finish-jewel':1,'linked-final':1,'final-ovation':1,'final-coronation':1,'rich-lock':1,'rich-cash':1,'rich-final':1,intro:1.2,'intro-arrive':1.2,'intro-balance':1.2,ready:2.4,next:2,'linked-unlock':1.35,'first-unlock':1.35,unlock:1.35,cash:1.6,multiply:1,extra:1.85,collect:1.6,wing:1.1,special:1.2,'special-prepare':1.2,'special-arrive':1.2,settle:1,standard:1.05,big:1.2,royal:1,rest:1.4,clear:1.45};
export function vaultSoundScore(name,{index=0,tier=0,richness=1,bridgeMs=888,bonus=false,depth=1}={}){
 const bonusLand=VAULT_BONUS_LAND_MS/1000,room=((index%5)+5)%5;
 switch(name){
 case 'opening-treasure-lock':return [foley(0,'key',.18,.085,1821),foley(.19,'bolt',.11,.07,1822),foley(.62,'latch',.055,.04,1823)];
 case 'opening-treasure-reveal':return [note(.08,86,.18,.06,'bell'),note(.08,62,.10,.022,'punch')];
 // A short reel pickup and one cash-register catch, not a tick for every digit.
 case 'opening-treasure-count':return [foley(0,'reel',.12,.03,1841),note(VAULT_TREASURE_COUNT_MS/1000,86,.16,.05,'bell'),note(VAULT_TREASURE_COUNT_MS/1000,62,.09,.018,'punch')];
 // A dry ratchet under the travelling light, then a latch as it reaches the door.
 case 'opening-treasure-ready':return [foley(0,'key',.09,.04,1842),foley((VAULT_TREASURE_CATCH_MS-VAULT_TREASURE_GUIDE_MS)/1000,'latch',.065,.052,1843)];
 case 'opening-treasure-deposit':return [0,2,4].map(i=>foley((VAULT_TREASURE_TRAVEL_MS+i*VAULT_TREASURE_STAGGER_MS)/1000,'coin',.045,.035-i*.002,1830+i));
 case 'welcome':return [...vaultSoundScore('intro').map(c=>({...c,gain:c.gain*trims.intro})),...vaultSoundScore('ready').map(c=>({...c,at:c.at+VAULT_OPENING_GUIDE_MS/1000,gain:c.gain*trims.ready}))];
 // Four layers: a quick reel pickup, an electronic tick, then one register
 // hit on the balance. Decorative lights still have no separate sound.
 case 'intro':{const reveal=VAULT_OPENING_REVEAL_MS/1000;return [foley(.04,'reel',.12,.035,801),note(VAULT_WELCOME_START_MS/1000,74,.10,.021,'slot'),note(reveal,62,.12,.022,'punch'),note(reveal,86,.18,.043,'bell')];}
 case 'intro-arrive':return vaultSoundScore('intro').filter(c=>c.at<VAULT_OPENING_REVEAL_MS/1000);
 case 'intro-balance':return vaultSoundScore('intro').filter(c=>c.at>=VAULT_OPENING_REVEAL_MS/1000).map(c=>({...c,at:c.at-VAULT_OPENING_REVEAL_MS/1000}));
 case 'ready':return [note(0,81,.13,.016,'slot')];
 // One dry cabinet click as the guide reaches the next lock. No note under
 // the travelling light, and no extra coin flourish between these beats.
 case 'deposit-next':return [...vaultSoundScore('collect',{tier,bonus:true}).map(c=>({...c,gain:c.gain*trims.collect})),...vaultSoundScore('next',{index}).map(c=>({...c,at:c.at+(VAULT_UNLOCK_MS-VAULT_CHAMBER_GUIDE_LEAD_MS-VAULT_COLLECT_START_MS)/1000,gain:c.gain*trims.next}))];
 case 'next':return [foley(VAULT_CHAMBER_GUIDE_TRAVEL_MS/1000,'click',.045,.021,907+room*13)];
 // A key turns, the bolt releases, then a dry catch seats as the door stops.
 // No sustained motor/hinge hum beneath the cash reveal.
 case 'linked-unlock':return vaultSoundScore('unlock',{index});
 case 'treasure-first-unlock':return [foley(.025,'key',.17,.085,1861),foley(.21,'bolt',.10,.08,1867),foley(.96,'latch',.06,.055,1871)];
 case 'treasure-first-cash':return [foley(.02,'coin',.04,.026,1873),note(VAULT_FIRST_CASH_LAND_MS/1000,[86,90,93][tier],.16,.052,'bell')];
 case 'first-unlock':return vaultSoundScore('unlock',{index:0});
 case 'unlock':return [foley(.06,'key',.20,.105,41+room),foley(.285,'bolt',.15,.10,101+room),foley(.86,'latch',.075,.075,151+room)];
 case 'cash':{const land=VAULT_CASH_LAND_MS/1000;return [foley(.015,'coin',.045,.026,431),note(land,[86,90,93][tier],.18,.046+tier*.005,'bell'),...(tier>1?[note(land+.10,98,.12,.022,'bell')]:[])];}
 // Multiplier: an octave-up register pickup resolves into a short cabinet
 // chord on the badge. Extra unlock: physical key contact, then a two-note
 // credit confirmation. Both use the established voices, with no extra bed.
 case 'multiply-build':return [foley(.025,'reel',.23,.026,1433),foley(.33,'click',.05,.020,1439)];
 case 'multiply':return [note(0,74,.070,.040,'slot'),note(.09,86,.060,.034,'slot'),note(bonusLand,86,.150,.065,'jackpot'),note(bonusLand,98,.130,.025,'bell')];
 // Final boosts replace the ordinary cue. Two gold reel stops for ×4;
 // three jeweled stops for ×6, then one rounded cabinet hit on the award.
 // All tails clear before the first deposit coin. More shape, not volume.
 case 'boost-4-build':return [foley(.025,'reel',.14,.022,1451),foley(.025,'click',.045,.026,1453),foley(.275,'click',.045,.032,1459)];
 case 'boost-6-build':return [foley(.025,'reel',.25,.020,1471),foley(.025,'click',.045,.024,1481),foley(.175,'click',.045,.027,1483),foley(.33,'click',.045,.032,1487)];
 case 'boost-4-reveal':return [note(0,81,.07,.030,'slot'),note(.09,86,.065,.032,'slot'),note(bonusLand,81,.19,.069,'jackpot'),note(bonusLand,98,.16,.026,'bell')];
 case 'boost-6-reveal':return [note(0,74,.075,.029,'slot'),note(.09,93,.065,.030,'slot'),note(bonusLand,86,.23,.070,'jackpot'),note(bonusLand,50,.11,.025,'punch'),note(bonusLand,98,.19,.024,'bell')];
 case 'extra':return [foley(.015,'key',.110,.055,301),foley(bonusLand,'click',.040,.030,313),note(bonusLand,81,.070,.033,'slot'),note(bonusLand+.10,86,.065,.040,'slot')];
 case 'collect':{const land=VAULT_COLLECT_TRAVEL_MS/1000;return vaultCollectionTicks(tier,bonus).map(i=>foley(land+i*VAULT_COLLECT_STAGGER_MS/1000,'coin',.035,.027-i*.0015,401+i*13));}
 // Complete auditions use the same cue gains and deposit clock as live play.
 case 'multiply-payout':case 'extra-payout':{
  const kind=name==='multiply-payout'?'multiply':'extra',gap=(VAULT_COLLECT_START_MS-VAULT_REVEAL_MS-VAULT_BONUS_DELAY_MS)/1000;
  return [...vaultSoundScore(kind).map(c=>({...c,gain:c.gain*trims[kind]})),...vaultSoundScore('collect',{tier,bonus:true}).map(c=>({...c,at:c.at+gap,gain:c.gain*trims.collect}))];
 }
 case 'wing':return [foley(0,'reel',.18,.023,857)];
 case 'special':{
  const melody=[[78,90],[81,93],[74,86]][((index%3)+3)%3],arrive=(VAULT_SPECIAL_PREPARE_MS-VAULT_WING_LEAD_MS)/1000,hit=(VAULT_SPECIAL_PREPARE_MS+VAULT_SPECIAL_HIT_MS)/1000;
  const step=Math.max(0,Math.min(4,depth-1));
  return [note(0,melody[0]+step,.10,.022,'slot'),foley(arrive,'reel',.11,.020,859),foley(hit,'seat',.12,.020,863),note(hit,62,.12,.018,'punch'),note(hit,melody[1]+step,.18+step*.01,.033,'bell')];
 }
 case 'special-prepare':return vaultSoundScore('special',{index,depth}).filter(c=>c.at<(VAULT_SPECIAL_PREPARE_MS-VAULT_WING_LEAD_MS)/1000);
 case 'special-arrive':return vaultSoundScore('special',{index,depth}).filter(c=>c.at>=(VAULT_SPECIAL_PREPARE_MS-VAULT_WING_LEAD_MS)/1000).map(c=>({...c,at:c.at-(VAULT_SPECIAL_PREPARE_MS-VAULT_WING_LEAD_MS)/1000}));
 case 'settle':return [foley(0,'coin',.065,.019,701),note(.025,74,.09,.018,'slot'),note(.14,81+tier*4,.10,.020,'slot')];
 // Carry the multiplier's octave motif to the jackpot. No second reel
 // build or bass impact competes with the last coin landings.
 case 'finish-boost':{const span=Math.max(.5,bridgeMs/1000);return [note(.22,86,.075,.018,'slot'),note(span-.14,98,.09,.024,'slot')];}
 case 'finish-gold':case 'finish-jewel':{
  const span=Math.max(.3,bridgeMs/1000),jewel=name==='finish-jewel';
  return [note(0,jewel?38:50,.12,.016,'punch'),foley(.02,'reel',span-.04,jewel?.026:.022,jewel?1213:1201),note(span-.14,jewel?86:81,.09,.022,'slot')];
 }
 // One jackpot phrase: a short pickup, separated chord strikes, then a
 // small payout tail. The last-coins bridge replaces the pickup in live play.
 case 'linked-final':{const name=['standard','big','royal'][tier],hit=finalePose(0,tier).build/1000;return vaultSoundScore(name).filter(c=>c.at>=hit).map(c=>({...c,gain:c.gain*trims[name]}));}
 case 'standard':{const hit=finalePose(0,0).build/1000;return [foley(0,'reel',.09,.018,727),note(hit,74,.14,.078,'jackpot'),foley(hit,'seat',.10,.023,729),foley(hit,'coin',.035,.018,731),note(hit+.22,86,.18,.045,'bell')];}
 case 'big':{const hit=finalePose(0,1).build/1000;return [foley(.015,'reel',.12,.022,733),note(hit,74,.18,.073,'jackpot'),foley(hit,'seat',.12,.025,739),note(hit,86,.16,.022,'bell'),note(hit+.31,81,.21,.060,'jackpot'),note(hit+.62,98,.20,.035,'bell'),foley(hit+.62,'coin',.045,.018,743)];}
 case 'royal':{const hit=finalePose(0,2).build/1000;return [foley(.04,'reel',.44,.030,751),note(hit,74,.22,.085,'jackpot'),foley(hit,'seat',.16,.045,757),note(hit,86,.18,.030,'bell'),note(hit+.34,81,.22,.073,'jackpot'),foley(hit+.34,'coin',.04,.021,761),note(hit+.84,86,.26,.075,'jackpot'),note(hit+.84,98,.24,.031,'bell'),...[0,1,2].map(i=>foley(hit+.97+i*.06,'coin',.035,.022-i*.003,769+i*13))];}
 case 'rich-lock':return [note(0,richness>1?38:50,.12,richness>1?.017:.013,'punch')];
 case 'rich-cash':return [note(0,50,.10,.014,'punch'),note(.05,86,.07,.015,'slot'),note(.13,98,.14,.020,'bell'),...(richness>1?[foley(.13,'coin',.055,.010,1129),note(.22,102,.07,.015,'slot')]:[])];
 // Palette auditions are the complete live arrangement, not isolated
 // accents that could make a large-win preview sound unexpectedly small.
 case 'final-ovation':case 'final-coronation':{
  const richness=name==='final-coronation'?2:1,hit=finalePose(0,2).build/1000;
  return [...vaultSoundScore('royal'),...vaultSoundScore('rich-final',{richness}).map(c=>({...c,at:c.at+hit}))];
 }
 case 'rich-final':{
  // The main jackpot carries the melody. Gold/jewel flourishes add only a
  // quiet physical accent at the existing fan/crown/encore animation beats.
  if(richness<2)return [foley(.33,'coin',.045,.014,1153)];
  return [foley(VAULT_TREASURE_CORONATION_MS/1000,'seat',.09,.016,1171),foley(VAULT_TREASURE_ENCORE_MS/1000,'coin',.045,.014,1181)];
 }
 case 'rest-gold':return [foley(0,'coin',.045,.016,1237),note(.10,86,.10,.015,'slot')];
 case 'rest-jewel':return [foley(0,'coin',.045,.016,1249),foley(.09,'coin',.04,.012,1259),note(.18,86,.12,.020,'bell')];
 case 'clear-gold':case 'clear-jewel':{
  const jewel=name==='clear-jewel',lead=VAULT_TREASURE_FAREWELL_MS[jewel?2:1]/1000,seat=lead+VAULT_DOORS_SEATED_MS/1000,close=lead+VAULT_DOOR_CLOSE_START_MS/1000;
  // One departing credit, a short key turn and a seated cabinet latch. No
  // sustained hinge/reel or new melody underneath the held winning amount.
  return [foley(0,'coin',.045,.010,jewel?1277:1279),foley(close,'key',.14,.022,jewel?1283:1289),foley(seat,'click',.035,.018,1291),foley(seat,'seat',.10,.024,1297)];
 }
 case 'rest':return [foley(0,'reel',.13,.009,601),note(.10,74,.08,.007,'slot')];
 case 'clear':{const close=(VAULT_FAREWELL_LEAD_MS+VAULT_DOOR_CLOSE_START_MS)/1000,seat=(VAULT_FAREWELL_LEAD_MS+VAULT_DOORS_SEATED_MS)/1000;return [note(0,74,.07,.005,'slot'),foley(.12,'reel',.12,.009,601),note(.30,69,.08,.006,'slot'),foley(close,'hinge',.34,.022,603),foley(seat,'click',.045,.016,607),foley(seat,'seat',.12,.018,613)];}
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
   if(cue.voice==='slot'){
    // A dry, fixed-pitch cabinet pulse. No swooping pitch or sustained pad.
    value=partials.reduce((sum,[h,gain])=>sum+gain*Math.sin(phase*h),0)*Math.exp(-u*4);
   }else if(cue.voice==='jackpot'){
    // A single staccato cabinet chord: root, third, fifth and octave. Finite
    // harmonics stay below Nyquist; no detuning, vibrato, echo or reverb bed.
    for(const [steps,weight] of [[0,.46],[4,.22],[7,.18],[12,.14]]){
     const frequency=cue.frequency*2**(steps/12),p=2*Math.PI*frequency*t;
     for(const [h,g] of [[1,.78],[2,.14],[3,.08]])if(h*frequency<sampleRate/2)value+=weight*g*Math.sin(p*h);
    }
    value*=Math.exp(-u*2.5);
   }else if(cue.voice==='punch'){
    const p=2*Math.PI*cue.frequency*(t+.12*(1-Math.exp(-35*t))/35);
    value=(.85*Math.sin(p)+.16*Math.sin(p*2))*Math.exp(-t*24);
   }else if(cue.voice==='bell'){
    // Damped modes of a struck register bell, without the old FM warble.
    value=.76*Math.sin(phase)*Math.exp(-t*18)+.22*Math.sin(phase*2.756)*Math.exp(-t*36)+.08*Math.sin(phase*5.404)*Math.exp(-t*65);
   }
  }else if(cue.voice==='click')value=(.66*band+.3*Math.sin(2*Math.PI*(1250+cue.seed)*t)+.11*Math.sin(2*Math.PI*2690*t))*Math.exp(-t*68);
  else if(cue.voice==='key'){
   // Irregular, tightly damped tumbler contacts; friction only between teeth.
   for(const [at,g] of [[.006,1],[.037,.60],[.081,.85],[.132,.55]]){
    const d=t-at;if(d>=0)value+=g*(.7*band+.24*Math.sin(2*Math.PI*(2160+cue.seed)*d)+.10*Math.sin(2*Math.PI*3471*d))*Math.exp(-d*125);
   }
   value+=.075*band*Math.sin(Math.PI*u)**2;
  }else if(cue.voice==='latch'){
   value=.64*Math.sin(2*Math.PI*138*t)*Math.exp(-t*48)+.42*band*Math.exp(-t*85)+.14*Math.sin(2*Math.PI*614*t)*Math.exp(-t*65);
  }else if(cue.voice==='bolt'){
   value=.7*Math.sin(2*Math.PI*106*t)*Math.exp(-t*32)+.21*Math.sin(2*Math.PI*317*t)*Math.exp(-t*45)+.4*band*Math.exp(-t*65);
  }else if(cue.voice==='hinge'){
   const motion=Math.sin(Math.PI*u)**.8,phase=2*Math.PI*(110*t-24*t*t/cue.length);
   value=motion*(.23*Math.sin(phase)+.11*Math.sin(phase*2)+bass*(.7+.3*Math.sin(2*Math.PI*29*t))*.48);
  }else if(cue.voice==='seat'){
   const phase=2*Math.PI*(57*t+73*(1-Math.exp(-20*t))/20);
   value=(.82*Math.sin(phase)+.15*Math.sin(phase*2)+.18*bass)*Math.exp(-t*15);
  }else if(cue.voice==='coin'){
   const f=[2063,2311,2539,2789][cue.seed%4],phase=2*Math.PI*f*t;
   value=(.50*Math.sin(phase)*Math.exp(-t*65)+.22*Math.sin(phase*1.483)*Math.exp(-t*100)+.42*band*Math.exp(-t*145));
  }else if(cue.voice==='reel'){
   const long=cue.length>.4,cycles=(long?12:28)*t+(long?10:0)*t*t/cue.length;
   const tooth=Math.exp(-(cycles%1)*13);
   value=(.7*band+.12*Math.sin(2*Math.PI*2731*t))*tooth*(.8+.2*u);
  }else if(cue.voice==='air')value=band*Math.sin(Math.PI*u)**1.4;
  data[i]=value*edge*cue.gain;
 }
 return data;
}
export function renderVaultSound(name,options={},sampleRate=48000){
 const pace=options.pace===VAULT_PLAYBACK_SCALE?VAULT_PLAYBACK_SCALE:1;
 // Space the original strikes to match the artwork; retain their pitch and decay.
 const score=vaultSoundScore(name,options).map(c=>({...c,at:c.at*pace})),duration=Math.max(...score.map(c=>c.at+c.length))+.025;
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
