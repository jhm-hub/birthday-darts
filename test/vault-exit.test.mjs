import test from 'node:test';
import assert from 'node:assert/strict';
import {vaultExit,vaultResetAt,vaultIdleOpacity,VAULT_FAREWELL_LEAD_MS,VAULT_IDLE_FADE_MS,VAULT_DOORS_SEATED_MS} from '../src/vault-exit-motion.js';
import {sampleVaultReset,vaultResetSampleRound} from '../src/vault-reset-preview.js';
import {VAULT_CLEAR_MS,vaultTotal,vaultLevel} from '../src/vault-game.js';
import {renderVaultSound,renderVaultSequence,vaultSoundScore} from '../src/vault-sound-design.js';
import {finalePose,VAULT_REST_AT_MS,VAULT_REST_MS} from '../src/vault-effects.js';

test('each crest and halo settle gently while the exact amount stays still and fully visible',()=>{
 for(let level=0;level<3;level++){
  const at=VAULT_REST_AT_MS[level];let previous=finalePose(at,level);
  for(let age=at+1;age<=at+VAULT_REST_MS;age++){
   const p=finalePose(age,level);
   assert.ok(p.crestY>=previous.crestY&&p.crestY-previous.crestY<.02);
   assert.ok(p.halo<=previous.halo&&p.halo>=.21);
   assert.equal(p.scale,1);assert.equal(p.rise,0);assert.equal(p.amount,1);assert.equal(p.crestScale,1);
   previous=p;
  }
  assert.equal(previous.crestY,3);assert.equal(previous.rest,1);
 }
});
test('the total is the last layer to leave and the farewell cannot change its amount or deadline',()=>{
 for(let level=0;level<3;level++){
  const {outgoing:r}=sampleVaultReset(level),value=vaultTotal(r),before=JSON.stringify(r);
  for(let age=-820;age<=450;age+=5){const p=vaultExit(r,r.hideAt+age);
   assert.equal(p.lift,0);assert.ok(p.crestY>=0&&p.crestY<=5);
   assert.ok(p.stage>=p.machine&&p.stage>=p.crest&&p.stage>=p.halo);
   if(age<=140)assert.equal(p.stage,1);
   assert.equal(vaultTotal(r),value);
  }
  assert.equal(JSON.stringify(r),before);
 }
});

test('all tiers retain the total through its hold and clear at the existing deadline',()=>{
 for(let level=0;level<3;level++){
  const {outgoing:r}=sampleVaultReset(level),before=JSON.stringify(r);
  assert.equal(vaultLevel(r),level);
  assert.equal(vaultExit(r,r.hideAt-1).stage,1);assert.equal(vaultExit(r,r.hideAt).stage,1);
  const end=vaultExit(r,r.hideAt+VAULT_CLEAR_MS);assert.equal(end.stage,0);assert.equal(end.done,true);assert.equal(end.machine,0);
  assert.equal(vaultExit(r,r.hideAt+VAULT_CLEAR_MS-1).done,false);
  assert.equal(JSON.stringify(r),before);
 }
});
test('exit layers and staggered doors settle monotonically without resizing the frame',()=>{
 const {outgoing:r}=sampleVaultReset(2);let previous=vaultExit(r,r.hideAt-1000);
 for(let age=-990;age<=1000;age+=10){
  const p=vaultExit(r,r.hideAt+age);
  for(const key of ['stage','machine','crest','halo','labels','heading']){assert.ok(p[key]>=0&&p[key]<=1);assert.ok(p[key]<=previous[key],key);}
  assert.ok(p.lift>=previous.lift&&p.lift<=4);
  p.doors.forEach((close,i)=>{assert.ok(close>=previous.doors[i]&&close<=1);if(i)assert.ok(close<=p.doors[i-1]);});previous=p;
 }
 assert.equal(vaultExit(r,r.hideAt+20).crest,0);
 assert.equal(vaultExit(r,r.hideAt+140).stage,1);
 assert.equal(vaultExit(r,r.hideAt+140).lift,0);
 assert.equal(vaultExit(r,r.hideAt+342).doors.every(v=>v===1),true);
});
test('quiet mode uses a stationary fade and inactive rounds have no ending effects',()=>{
 const {outgoing:r,next}=sampleVaultReset(2);
 for(const age of [-500,0,120,300,450]){const p=vaultExit(r,r.hideAt+age,true);assert.equal(p.lift,0);assert.deepEqual(p.doors,[0,0,0,0,0]);assert.equal(p.machine,1);assert.equal(p.crest,1);}
 assert.equal(vaultExit(r,r.hideAt+450,true).stage,0);
 assert.deepEqual(vaultExit(next,next.startedAt),vaultExit(null,0));
});
test('idle preview returns gently once and late snapshots do not replay the return',()=>{
 const {outgoing:r,clearAt}=sampleVaultReset();
 assert.equal(vaultResetAt(r,clearAt),clearAt);assert.equal(vaultIdleOpacity(clearAt,clearAt),0);
 assert.equal(vaultIdleOpacity(clearAt,clearAt+VAULT_IDLE_FADE_MS),1);
 assert.ok(vaultIdleOpacity(clearAt,clearAt+100)>0&&vaultIdleOpacity(clearAt,clearAt+100)<1);
 assert.equal(vaultResetAt(r,clearAt+2000),clearAt);assert.equal(vaultIdleOpacity(vaultResetAt(r,clearAt+2000),clearAt+2000),1);
 const manual=r.hideAt-2000;assert.equal(vaultResetAt(r,manual),manual);assert.equal(vaultIdleOpacity(null,manual),1);
});
test('reset tour includes a truly empty stream before a separate fresh viewer',()=>{
 for(let level=0;level<3;level++){
  const s=sampleVaultReset(level);
  assert.ok(s.startAt<s.outgoing.completedAt+VAULT_REST_AT_MS[level]);
  assert.equal(s.startAt+s.duration,s.next.readyAt+400);
  assert.equal(vaultResetSampleRound(s,s.clearAt-1),s.outgoing);
  assert.equal(vaultResetSampleRound(s,s.clearAt),null);assert.equal(vaultResetSampleRound(s,s.nextAt-1),null);
  const next=vaultResetSampleRound(s,s.nextAt);assert.notEqual(next.id,s.outgoing.id);assert.equal(next.viewer,'Next viewer');assert.equal(next.opened.length,0);assert.equal(next.multiplier,1);assert.equal(next.remaining,5);assert.equal(next.flight,null);assert.equal(next.completedAt,null);assert.equal(vaultTotal(next),'20000');
 }
});
test('farewell resolves with the closing doors and its tail finishes before reset',()=>{
 const score=vaultSoundScore('clear'),seat=score.find(c=>c.voice==='seat');
 assert.equal(Math.round(seat.at*1000-VAULT_FAREWELL_LEAD_MS),VAULT_DOORS_SEATED_MS);
 for(const rate of [44100,48000]){
  const data=renderVaultSound('clear',{},rate);assert.ok(data.length/rate*1000-VAULT_FAREWELL_LEAD_MS<VAULT_CLEAR_MS);
  assert.equal(data[0],0);assert.equal(data.at(-1),0);assert.ok(data.reduce((m,x)=>Math.max(m,Math.abs(x)),0)<.04);
  const mix=renderVaultSequence([{at:1-VAULT_FAREWELL_LEAD_MS/1000,sound:'clear'},{at:1.9,sound:'intro'}],rate);
  assert.ok(mix.every(Number.isFinite));assert.ok(mix.slice(Math.round(1.45*rate),Math.round(1.9*rate)).every(x=>x===0),'empty stream stays silent');
 }
});
