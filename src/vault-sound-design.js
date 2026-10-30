// Original Crown Vault sound design: D-major jewels, damped gold mechanisms
// and warm bass. No downloads or background music; previews use the same PCM.
const midi=p=>440*2**((p-69)/12);
const note=(at,pitch,length,gain=.04,voice='jewel')=>({at,frequency:midi(pitch),length,gain,voice});
const foley=(at,voice,length,gain,seed=41)=>({at,voice,length,gain,seed});
export const VAULT_SOUND_LABELS={intro:'Opening balance',unlock:'Lock & heavy door',cash:'Cash treasure',multiply:'Total multiplier',extra:'Extra unlock',collect:'Coins collected',wing:'Bonus wing',settle:'Last treasure settles',standard:'Standard win',big:'Big win',royal:'Royal win',clear:'Round farewell'};
const trims={intro:1.2,unlock:1.35,cash:1.6,multiply:1,extra:1.85,collect:1.6,wing:1.1,settle:1,standard:1.25,big:1.04,royal:1,clear:1};
export function vaultSoundScore(name,{index=0,tier=0}={}){
 const room=((index%5)+5)%5,accent=[74,78,81,76,86][room];
 switch(name){
 case 'intro':return [foley(0,'air',.4,.025),note(.06,62,.65,.035,'warm'),...[[.13,74],[.3,78],[.48,81],[.7,86]].map(([at,p])=>note(at,p,.4,.045,'celesta')),foley(.72,'coin',.19,.03)];
 case 'unlock':return [foley(.045,'click',.075,.12,41+room),foley(.19,'click',.085,.1,77+room),foley(.285,'bolt',.18,.13,101+room),foley(.33,'hinge',.61,.17,151+room),note(.22,accent,.2,.018,'celesta'),foley(.89,'seat',.15,.075,201+room)];
 case 'cash':return [foley(0,'coin',.17,.045),note(.04,86,.29,.047),note(.13,90,.28,.039),note(.22,93,.28,.032),...(tier>0?[note(.32,98,.2,.023)]:[]),...(tier>1?[note(.4,102,.16,.016)]:[])];
 case 'multiply':return [...[62,69,74,78].map((p,i)=>note(i*.065,p,.19,.032,'pluck')),note(.18,86,.5,.045,'glass'),note(.18,90,.42,.03,'glass'),note(.18,93,.34,.024),note(.34,98,.29,.023)];
 case 'extra':return [foley(0,'click',.06,.055,301),...[74,76,78,81,86].map((p,i)=>note(.05+i*.1,p,.25,.038,'celesta')),foley(.47,'coin',.16,.025)];
 case 'collect':return [foley(0,'coin',.105,.032,401),foley(.11,'coin',.09,.027,409),foley(.23,'coin',.09,.022,419)];
 case 'wing':return [foley(0,'air',.3,.025),note(.015,74,.24,.019,'glass'),note(.1,81,.23,.021,'glass')];
 case 'settle':return [foley(0,'coin',.12,.032,701),note(.055,74,.25,.025,'warm'),note(.16,81,.23,.021,'glass')];
 case 'standard':return [note(0,81,.18,.035,'celesta'),note(.18,62,.46,.042,'warm'),note(.18,86,.42,.053),note(.33,90,.3,.032),note(.49,93,.3,.028),note(.72,86,.38,.035,'glass')];
 case 'big':return [note(0,78,.21,.031,'celesta'),note(.11,81,.2,.034,'celesta'),foley(.22,'seat',.26,.055),note(.22,50,.65,.046,'warm'),note(.22,74,.65,.041,'brass'),note(.22,78,.57,.027,'brass'),note(.22,81,.5,.022,'brass'),note(.22,86,.5,.044,'glass'),...[90,93,98].map((p,i)=>note(.38+i*.12,p,.28,.026)),note(.94,86,.48,.035,'glass')];
 case 'royal':return [note(0,50,.68,.025,'warm'),foley(.09,'air',.5,.055,501),...[74,78,81].map((p,i)=>note(.06+i*.18,p,.23,.034,'celesta')),note(.5,86,.12,.032),foley(.6,'seat',.42,.08),note(.6,38,.8,.042,'warm'),note(.6,62,.95,.049,'brass'),note(.6,66,.83,.032,'brass'),note(.6,69,.78,.026,'brass'),note(.6,86,.85,.048,'glass'),note(.6,90,.7,.03,'glass'),note(.6,93,.64,.023),...[98,102,105,102,98,93].map((p,i)=>note(.76+i*.115,p,.3,.022)),note(1.57,86,.62,.031,'glass'),note(1.57,74,.64,.027,'warm'),note(1.74,93,.47,.022)];
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
