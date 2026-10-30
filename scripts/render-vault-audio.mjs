import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {VAULT_SOUND_LABELS,renderVaultSound,renderVaultSequence} from '../src/vault-sound-design.js';
const output=process.argv[2];
if(!output)throw Error('Pass an output directory for the listening previews.');
await mkdir(output,{recursive:true});
const rate=48000,volume=.7;
function wav(data){
 const out=Buffer.alloc(44+data.length*2);out.write('RIFF');out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*2,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(data.length*2,40);
 for(let i=0;i<data.length;i++)out.writeInt16LE(Math.round(Math.max(-1,Math.min(1,data[i]*volume))*32767),44+i*2);
 return out;
}
const db=v=>v>0?20*Math.log10(v):null;
function metrics(data){let peak=0,sum=0;for(const s of data){peak=Math.max(peak,Math.abs(s));sum+=s*s;}return {seconds:data.length/rate,peakDbFS:db(peak),rmsDbFS:db(Math.sqrt(sum/data.length)),defaultVolumePeakDbFS:db(peak*volume)};}
const report={},reel=[];let at=0;
for(const [name,label] of Object.entries(VAULT_SOUND_LABELS)){
 const data=renderVaultSound(name,{index:4,tier:2},rate);report[name]={label,...metrics(data)};
 await writeFile(join(output,name+'.wav'),wav(data));reel.push({at,sound:name,options:{index:4,tier:2}});at+=data.length/rate+.65;
}
for(const bonus of ['multiply','extra']){
 const sequence=[{at:0,sound:'unlock'},{at:0,sound:'wing'},{at:.78,sound:'cash',options:{tier:2}},{at:1.04,sound:bonus},{at:1.24,sound:'collect'}];
 const data=renderVaultSequence(sequence,rate);report['chamber-'+bonus]=metrics(data);await writeFile(join(output,'chamber-'+bonus+'.wav'),wav(data));
}
for(const sound of ['standard','big','royal']){
 const data=renderVaultSequence([{at:0,sound:'unlock',options:{index:4}},{at:.78,sound:'cash',options:{tier:2}},{at:1.04,sound:'multiply'},{at:1.24,sound:'collect'},{at:1.72,sound:'settle'},{at:2,sound}],rate);
 report['last-chamber-'+sound]=metrics(data);await writeFile(join(output,'last-chamber-'+sound+'.wav'),wav(data));
}
await writeFile(join(output,'crown-vault-sound-reel.wav'),wav(renderVaultSequence(reel,rate)));
await writeFile(join(output,'farewell-and-next-viewer.wav'),wav(renderVaultSequence([{at:.88,sound:'clear'},{at:1.9,sound:'intro'}],rate)));
await writeFile(join(output,'crown-vault-quick-listen.wav'),wav(renderVaultSequence([
 {at:0,sound:'intro'},{at:1.4,sound:'unlock',options:{index:4}},
 {at:2.18,sound:'cash',options:{tier:2}},{at:2.44,sound:'multiply'},
 {at:2.64,sound:'collect'},{at:3.12,sound:'settle'},{at:3.4,sound:'royal'}
],rate)));
await writeFile(join(output,'audio-metrics.json'),JSON.stringify({sampleRate:rate,previewVolume:70,cues:report,reel},null,2)+'\n');
console.log(JSON.stringify({directory:resolve(output),cues:report},null,2));
