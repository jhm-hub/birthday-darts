import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_VAULT,unlockVault,advanceVault,vaultTotal,cleanVaultRound} from '../src/vault-game.js';
import {VAULT_AZOME,VAULT_EXPERIENCES,VAULT_START_CHOICES,startVaultExperience,validateVaultExperience,vaultExperienceRange} from '../src/vault-experiences.js';
import {DEFAULT_VAULT_GAME_RANGES} from '../src/vault-game-ranges.js';
import {TOKEN_FINALE} from '../src/vault-token-game.js';
import {createVaultStore,VAULT_STORE_KEY,exportVaultSettings,importVaultSettings} from '../src/vault-store.js';
const rng=seed=>{let n=seed;return bound=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n%bound;};};
function finish(r){
 while(r.remaining){const shot=unlockVault(r,r.opened.at(-1)?.finishAt??r.readyAt);advanceVault(r,shot.finishAt);}
 let now=r.readyAt;
 while(r.tokenFinale?.remaining){const spin=unlockVault(r,now);advanceVault(r,spin.finishAt);now=spin.finishAt;}
 if(r.tokenFinale)advanceVault(r,r.tokenFinale.finishedAt+TOKEN_FINALE.settle);
 return r;
}
const normalise=r=>JSON.parse(JSON.stringify(cleanVaultRound(r),(key,value)=>key==='id'?undefined:value));
function fixture(){const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};let tail=Promise.resolve();const locks={request:(_,fn)=>{const p=tail.then(fn);tail=p.catch(()=>{});return p;}};return {data,storage,locks,store:createVaultStore(storage,locks),raw:()=>JSON.parse(data.get(VAULT_STORE_KEY)).widgets[0]};}
test('Azome is an extra fixed private choice and does not replace the four editable games',()=>{
 assert.equal(VAULT_EXPERIENCES.length,4);assert.equal(DEFAULT_VAULT_GAME_RANGES.length,4);
 assert.deepEqual(VAULT_START_CHOICES.map(e=>e.id),['low','medium','high','extreme','azome']);
 assert.equal(validateVaultExperience('azome'),'azome');assert.equal(vaultExperienceRange('azome'),'$8,000–$10,000');
 assert.deepEqual([VAULT_AZOME.min,VAULT_AZOME.max],[8000,10000]);
});
test('1,000 complete Azome rounds stay in range and are identical to the existing game at the same range',()=>{
 for(const finaleMode of ['original','tokens'])for(let seed=1;seed<=500;seed++){
  const base={...DEFAULT_VAULT,finaleMode},azome=startVaultExperience(base,'azome','Demo',0,rng(seed));
  const gameRanges=DEFAULT_VAULT_GAME_RANGES.map(r=>r.id==='extreme'?{...r,min:8000,max:10000}:r);
  const ordinary=startVaultExperience({...base,gameRanges},'extreme','Demo',0,rng(seed));
  assert.deepEqual(normalise(azome),normalise(ordinary));finish(azome);finish(ordinary);
  const total=BigInt(vaultTotal(azome));assert.ok(total>=800000n&&total<=1000000n);
  assert.deepEqual(normalise(azome),normalise(ordinary),'no mode-specific public labels, timings, art or celebration data');
  assert.ok(!JSON.stringify(cleanVaultRound(azome)).toLowerCase().includes('azome'));
 }
});
test('Azome supports the exact lower and upper boundaries in both finales',()=>{
 for(const finaleMode of ['original','tokens'])for(const [draw,total] of [[()=>0,'800000'],[n=>n-1,'1000000']]){
  assert.equal(vaultTotal(finish(startVaultExperience({...DEFAULT_VAULT,finaleMode},'azome','',0,draw))),total);
 }
});
test('saved names, ranges, active rounds, backups and permanent OBS identity survive selecting Azome',async()=>{
 const f=fixture(),id=DEFAULT_VAULT.id;await f.store.init();const room=f.store.displayKey(),alias=f.store.roomKey(id);
 const ranges=DEFAULT_VAULT_GAME_RANGES.map((r,i)=>({...r,name:['Regular','High Stakes','Third','Fourth'][i]}));
 await f.store.setGameRanges(id,ranges,0);await f.store.setFinaleMode(id,'tokens',0);
 await f.store.startExperience(id,'azome','Demo',1000);const initial=f.raw().round;
 assert.equal(initial.privateExperience.id,'azome');assert.deepEqual(f.store.list()[0].gameRanges,ranges);
 await assert.rejects(f.store.startExperience(id,'low','Other',1001));assert.deepEqual(f.raw().round,initial);
 const reloaded=createVaultStore(f.storage,f.locks);assert.equal(reloaded.controlSnapshot(id).control.experience,'azome');assert.deepEqual(f.raw().round,initial);
 const restored=importVaultSettings(exportVaultSettings(reloaded.list()))[0];assert.equal(restored.experience,'azome');assert.equal(restored.finaleMode,'tokens');assert.deepEqual(restored.gameRanges,ranges);
 assert.equal(reloaded.displayKey(),room);assert.equal(reloaded.roomKey(id),alias);
 assert.ok(!JSON.stringify(reloaded.snapshot(id)).toLowerCase().includes('azome'));
 await reloaded.reset(id);await reloaded.action(id,'Next',10000);assert.equal(f.raw().round.privateExperience.id,'azome');
 assert.ok(BigInt(vaultTotal(finish(f.raw().round)))>=800000n);
});
test('Azome keeps its requested range for named viewers without deleting their rules for other games',async()=>{
 const f=fixture(),id=DEFAULT_VAULT.id;await f.store.init();await f.store.setViewerRange(id,{username:'vip',min:200,max:300});
 await f.store.startExperience(id,'azome','@VIP',0);assert.equal(f.raw().round.privateViewerRange,undefined);assert.equal(f.raw().round.privateExperience.min,8000);
 await f.store.reset(id);await f.store.action(id,'VIP',1000);assert.equal(f.raw().round.privateExperience.min,8000);
 await f.store.reset(id);await f.store.startExperience(id,'low','VIP',2000);assert.equal(f.raw().round.privateViewerRange.min,200);
 assert.deepEqual(f.store.list()[0].viewerRanges,[{username:'vip',min:200,max:300}]);
});
