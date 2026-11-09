import test from 'node:test';
import assert from 'node:assert/strict';
import {createTokenAudio} from '../src/vault-tokens-audio.js';
import {createTokenFinale,beginTokenSpin} from '../src/vault-token-game.js';
function fixture(){
 const nodes=[],jobs=[],param={setValueAtTime(){},linearRampToValueAtTime(){},setTargetAtTime(){},cancelScheduledValues(){}};
 const node=()=>{const n={gain:{...param},connect(n){return n;},disconnect(){},start(...v){this.startArgs=v;},stop(){this.stopped=true;}};nodes.push(n);return n;};
 const ctx={sampleRate:48000,currentTime:1,destination:{},resume:async()=>{},createGain:node,createBufferSource:node,createBuffer:(_,length)=>({duration:length/48000,copyToChannel(){}})};
 const worker={postMessage:data=>jobs.push(data),terminate(){this.terminated=true;}};
 const audio=createTokenAudio(()=>ctx,{createWorker:()=>worker});audio.setEnabled(true);
 return {audio,worker,jobs,nodes,reply:i=>worker.onmessage({data:{...jobs[i],samples:new Float32Array(480000)}})};
}
test('live token synthesis is asynchronous and stopped work cannot restart after hold or reset',()=>{
 const f=fixture(),spin=beginTokenSpin(createTokenFinale(),0,{forced:8});f.audio.spin(spin);
 assert.equal(f.jobs.length,1);assert.equal(f.nodes.filter(n=>n.startArgs).length,0);
 f.audio.stop();f.reply(0);assert.equal(f.nodes.filter(n=>n.startArgs).length,0);
 f.audio.spin(spin,2000);f.reply(1);assert.equal(f.nodes.filter(n=>n.startArgs).length,1);assert.ok(f.nodes.at(-2).startArgs[1]>=2);
 f.audio.dispose();assert.ok(f.worker.terminated);
});
test('only the newest cue plays; mute and disposal invalidate pending worker replies',()=>{
 const f=fixture();f.audio.handoff();f.audio.finale(16);f.reply(0);assert.equal(f.nodes.filter(n=>n.startArgs).length,0);
 f.reply(1);assert.equal(f.nodes.filter(n=>n.startArgs).length,1);
 f.audio.spin(beginTokenSpin(createTokenFinale(),0,{forced:3}));f.audio.setEnabled(false);f.reply(2);assert.equal(f.nodes.filter(n=>n.startArgs).length,1);
 f.audio.setEnabled(true);f.audio.handoff();f.audio.dispose();f.reply(3);assert.equal(f.nodes.filter(n=>n.startArgs).length,1);
});
