import test from 'node:test';
import assert from 'node:assert/strict';
import {vaultWelcomeFlow,vaultWelcomeParticle,VAULT_WELCOME_START_MS} from '../src/vault-welcome-flow.js';
import {vaultIntro,VAULT_OPENING_REVEAL_MS} from '../src/vault-intro-motion.js';
import {sampleVaultReturn,vaultResetSampleRound} from '../src/vault-reset-preview.js';
import {DEFAULT_VAULT,startVaultRound,unlockVault,cleanVaultRound} from '../src/vault-game.js';
const fresh=()=>startVaultRound(DEFAULT_VAULT,'Next viewer',10000,()=>100);

test('the welcome uses only the fresh round clock, never the old win or private viewer settings',()=>{
 const r=fresh(),before=JSON.stringify(r);
 for(let age=0;age<950;age+=17){
  const expected=vaultWelcomeFlow(r,10000+age),copy=structuredClone(r);copy.privateExperience={id:'extreme'};copy.privateViewerRange={min:9999,max:10000};copy.prizePlan=[{cashIndex:9}];copy.openingCents=99999999;copy.cashCents=99999999;
  assert.deepEqual(vaultWelcomeFlow(copy,10000+age),expected);assert.deepEqual(vaultWelcomeFlow(cleanVaultRound(copy),10000+age),expected);
 }
 assert.equal(JSON.stringify(r),before);assert.equal(vaultWelcomeFlow(r,9999).active,false);
});
test('glints arrive on the existing reveal beat, without revealing the money early or delaying the first click',()=>{
 const r=fresh();let visible=0;
 for(let age=0;age<=1200;age+=5){const flow=vaultWelcomeFlow(r,10000+age),intro=vaultIntro(r,10000+age);
  for(let i=0;i<6;i++){const p=vaultWelcomeParticle(flow,i);if(p.opacity){visible++;assert.ok(age>VAULT_WELCOME_START_MS&&age<VAULT_OPENING_REVEAL_MS);assert.equal(intro.amount,0);assert.equal(intro.calc,0);}}
  if(age<VAULT_OPENING_REVEAL_MS)assert.equal(flow.catch,0);
  if(age>=940)assert.equal(flow.active,false);
 }
 assert.ok(visible>0);assert.equal(vaultIntro(r,10730).amount,1);assert.equal(r.readyAt,11200);assert.throws(()=>unlockVault(r,11199));assert.ok(unlockVault(r,11200));
});
test('the small paired trails remain inside the transparent stage for narrow and wide plaques',()=>{
 for(const dock of [{left:174,right:246,y:386},{left:14,right:406,y:405},{left:140,right:280,y:380}]){
  const r=fresh();for(let age=0;age<940;age+=3){const flow=vaultWelcomeFlow(r,10000+age);for(let i=0;i<6;i++){
   const p=vaultWelcomeParticle(flow,i,dock);assert.ok(Object.values(p).every(Number.isFinite));assert.ok(p.opacity>=0&&p.opacity<=.9);
   if(p.opacity){assert.ok(p.x>=4&&p.x<=416);assert.ok(p.y>=60&&p.y<=456);if(i%2)assert.ok(p.x>=210);else assert.ok(p.x<=210);}
  }}
 }
});
test('balance-edge glints are a short response and reduced motion removes all extra motion',()=>{
 const r=fresh();assert.equal(vaultWelcomeFlow(r,10620).catch,0);assert.ok(vaultWelcomeFlow(r,10730).catch>.7);assert.equal(vaultWelcomeFlow(r,10920).catch,0);
 for(let age=0;age<1400;age+=11){const quiet=vaultWelcomeFlow(r,10000+age,true);assert.equal(quiet.active,false);assert.equal(quiet.catch,0);for(let i=0;i<6;i++)assert.equal(vaultWelcomeParticle(quiet,i).opacity,0);}
});
test('old snapshots, a first click and subsequent chambers cannot restart the welcome',()=>{
 const r=fresh(),sample=sampleVaultReturn();assert.equal(vaultWelcomeFlow(null,0).active,false);assert.equal(vaultWelcomeFlow(sample.outgoing,sample.startAt).active,false);
 for(const t of [10180,10400,10620,10940,70000])assert.deepEqual(vaultWelcomeFlow(structuredClone(r),t),vaultWelcomeFlow(r,t));
 unlockVault(r,r.readyAt,{forcedCash:0,forcedBonus:null});assert.equal(vaultWelcomeFlow(r,10400).active,false);assert.equal(vaultWelcomeFlow(r,11250).active,false);
});
test('the focused reset preview has a silent blank beat, a separate viewer and the entire balance reveal',()=>{
 const s=sampleVaultReturn();assert.ok(s.startAt<s.clearAt);assert.equal(s.nextAt-s.clearAt,450);
 assert.equal(vaultResetSampleRound(s,s.clearAt),null);assert.equal(vaultResetSampleRound(s,s.nextAt-1),null);
 const next=vaultResetSampleRound(s,s.nextAt);assert.notEqual(next.id,s.outgoing.id);assert.equal(next.viewer,'Next viewer');assert.equal(next.multiplier,1);assert.equal(next.opened.length,0);
 assert.equal(s.startAt+s.duration,next.readyAt+400);assert.equal(vaultIntro(next,next.startedAt+619).amount,0);assert.equal(vaultIntro(next,next.startedAt+730).amount,1);
 const delayed=structuredClone(next);delayed.startedAt+=60000;delayed.readyAt+=60000;assert.deepEqual(vaultWelcomeFlow(delayed,delayed.startedAt+400),vaultWelcomeFlow(next,next.startedAt+400));
});
