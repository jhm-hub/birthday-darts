import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {PINATA_SOUND_LABELS,renderPinataSound,renderPinataSequence,pinataAudioCues} from '../src/pinata-sound-design.js';
import {DEFAULT_PINATA,startPinata,swingPinata,advancePinata} from '../src/pinata-game.js';
const directory=process.argv[2];if(!directory)throw Error('Pass the external review audio directory.');
await mkdir(directory,{recursive:true});const rate=48000,volume=.45;
function wav(data){
 const b=Buffer.alloc(44+data.length*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(data.length*2,40);
 for(let i=0;i<data.length;i++)b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,data[i]*volume))*32767),44+i*2);return b;
}
const metrics=data=>{let peak=0,sum=0;for(const n of data){peak=Math.max(peak,Math.abs(n));sum+=n*n;}return {seconds:data.length/rate,peakDbFS:20*Math.log10(peak),rmsDbFS:20*Math.log10(Math.sqrt(sum/data.length)),defaultVolumePeakDbFS:20*Math.log10(peak*volume)};};
const report={};
for(const [kind,label] of Object.entries(PINATA_SOUND_LABELS)){
 const data=renderPinataSound(kind,{},rate);report[kind]={label,...metrics(data)};await writeFile(join(directory,kind+'.wav'),wav(data));
}
function sequence(indices,gap){
 const round=startPinata(DEFAULT_PINATA,'Audio preview',0),events=[];
 for(let i=0;i<indices.length;i++){
  const start=i*gap;swingPinata(round,start,{forcedIndex:indices[i]});
  for(const cue of pinataAudioCues(round))events.push({at:cue.at/1000,kind:cue.kind,options:{index:cue.index}});
  advancePinata(round,start+1500);
 }
 return renderPinataSequence(events,rate);
}
for(const [name,indices,gap] of [['sample-round',[0,3,1],1850],['fastest-round',[0,3,1],1500],['encore-round',[0,4,3,1],1500]]){
 const data=sequence(indices,gap);report[name]=metrics(data);await writeFile(join(directory,name+'.wav'),wav(data));
}
const comparison=renderPinataSequence([
 {at:.31,kind:'swing'},{at:.48,kind:'hit'},{at:.64,kind:'cash'},
 {at:2.31,kind:'swing',options:{index:2}},{at:2.48,kind:'hit',options:{index:2}},
 {at:2.62,kind:'burst'},{at:2.64,kind:'cash'},{at:3.66,kind:'final'}
],rate);
report['hit-and-break']=metrics(comparison);await writeFile(join(directory,'hit-and-break.wav'),wav(comparison));
await writeFile(join(directory,'metrics.json'),JSON.stringify({rate,previewVolume:volume,report},null,2));
console.log(JSON.stringify(report,null,2));
