import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {PINATA_SOUND_LABELS,renderPinataSound,renderPinataSequence,pinataAudioCues,ROYAL_BUILDUP_MS} from '../src/pinata-sound-design.js';
import {DEFAULT_PINATA,startPinata,swingPinata,advancePinata} from '../src/pinata-game.js';
import {FINALE_REVEAL_MS} from '../src/pinata-finale.js';
import {finaleRevealAt} from '../src/pinata-finale-timing.js';
const directory=process.argv[2];if(!directory)throw Error('Pass the external review audio directory.');
await mkdir(directory,{recursive:true});const rate=48000,volume=.45;
function wav(data){
 const b=Buffer.alloc(44+data.length*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(data.length*2,40);
 for(let i=0;i<data.length;i++)b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,data[i]*volume))*32767),44+i*2);return b;
}
const metrics=data=>{let peak=0,sum=0,rolling=0,best=0;const window=Math.round(rate*.1);for(let i=0;i<data.length;i++){const n=data[i];peak=Math.max(peak,Math.abs(n));sum+=n*n;rolling+=n*n;if(i>=window)rolling-=data[i-window]**2;if(i>=window-1)best=Math.max(best,rolling/window);}return {seconds:data.length/rate,peakDbFS:20*Math.log10(peak),rmsDbFS:20*Math.log10(Math.sqrt(sum/data.length)),max100msRmsDbFS:20*Math.log10(Math.sqrt(best)),defaultVolumePeakDbFS:20*Math.log10(peak*volume)};};
const report={};
for(const [kind,label] of Object.entries(PINATA_SOUND_LABELS)){
 const data=renderPinataSound(kind,{},rate);report[kind]={label,...metrics(data)};await writeFile(join(directory,kind+'.wav'),wav(data));
}
function sequence(indices,gap){
 const round=startPinata(DEFAULT_PINATA,'Audio preview',0),events=[],seen=new Set();
 for(let i=0;i<indices.length;i++){
  const start=i*gap;swingPinata(round,start,{forcedIndex:indices[i]});
  for(const cue of pinataAudioCues(round))if(!seen.has(cue.id)){seen.add(cue.id);events.push({at:cue.at/1000,kind:cue.kind,options:{index:cue.index}});}
  advancePinata(round,start+1500);
 }
 return renderPinataSequence(events,rate);
}
for(const [name,indices,gap] of [['sample-round',[0,3,1],1850],['fastest-round',[0,3,1],1500],['encore-round',[0,4,3,1],1500]]){
 const data=sequence(indices,gap);report[name]=metrics(data);await writeFile(join(directory,name+'.wav'),wav(data));
}
// Hear both bonuses after a thwack, then the special case where a final
// multiplier overlaps the crown break and leads into the existing finale.
for(const kind of ['cash','multiply','extra']){
 const data=renderPinataSequence([{at:.31,kind:'swing',options:{index:1}},
  {at:.48,kind:'hit',options:{index:1}},{at:.64,kind}],rate);
 report[kind+'-hit']=metrics(data);await writeFile(join(directory,kind+'-hit.wav'),wav(data));
}
const bonusComparison=renderPinataSequence([{at:.1,kind:'multiply'},{at:1.5,kind:'extra'}],rate);
report['bonus-comparison']=metrics(bonusComparison);await writeFile(join(directory,'bonus-comparison.wav'),wav(bonusComparison));
const rewardComparison=renderPinataSequence([{at:.1,kind:'cash'},{at:1.2,kind:'multiply'},{at:2.65,kind:'extra'}],rate);
report['reward-celebrations']=metrics(rewardComparison);await writeFile(join(directory,'reward-celebrations.wav'),wav(rewardComparison));
const lastBonus=sequence([0,0,3],1500);report['final-multiplier-round']=metrics(lastBonus);await writeFile(join(directory,'final-multiplier-round.wav'),wav(lastBonus));
const comparison=renderPinataSequence([
 {at:.31,kind:'swing'},{at:.48,kind:'hit'},{at:.64,kind:'cash'},
 {at:2.31,kind:'swing',options:{index:2}},{at:2.48,kind:'hit',options:{index:2}},
 {at:2.62,kind:'burst'},{at:2.64,kind:'cash'},{at:3.5+ROYAL_BUILDUP_MS/1000,kind:'rise'},{at:3.5+FINALE_REVEAL_MS/1000,kind:'final'}
],rate);
report['hit-and-break']=metrics(comparison);await writeFile(join(directory,'hit-and-break.wav'),wav(comparison));
const tierPreview=[];
for(let tier=0;tier<3;tier++){
 const pickup=['rise','royal-rise','grand-rise'][tier],payoff=['final','royal-final','grand-final'][tier],gap=(finaleRevealAt(tier)-ROYAL_BUILDUP_MS)/1000;
 const data=renderPinataSequence([{at:.1,kind:pickup},{at:.1+gap,kind:payoff}],rate);
 const name=['birthday-finale','royal-finale','grand-finale'][tier];report[name]=metrics(data);await writeFile(join(directory,name+'.wav'),wav(data));
 tierPreview.push({at:.1+tier*1.85,kind:pickup},{at:.1+tier*1.85+gap,kind:payoff});
}
const preview=renderPinataSequence(tierPreview,rate);report['three-win-tiers']=metrics(preview);await writeFile(join(directory,'three-win-tiers.wav'),wav(preview));
const welcome=sequence([0],1850);report['welcome-and-first-hit']=metrics(welcome);await writeFile(join(directory,'welcome-and-first-hit.wav'),wav(welcome));
await writeFile(join(directory,'metrics.json'),JSON.stringify({rate,previewVolume:volume,report},null,2));
console.log(JSON.stringify(report,null,2));
