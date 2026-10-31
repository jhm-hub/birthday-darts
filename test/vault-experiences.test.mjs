import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DEFAULT_VAULT,unlockVault,advanceVault,vaultTotal,cleanVaultRound,vaultCashPrizes,VAULT_CLEAR_MS} from '../src/vault-game.js';
import {VAULT_EXPERIENCES,validateVaultExperience,vaultExperiencePreset,startVaultExperience} from '../src/vault-experiences.js';
import {createVaultStore,exportVaultSettings,importVaultSettings,VAULT_STORE_KEY} from '../src/vault-store.js';

function rng(seed){let n=seed>>>0;return bound=>{n=(Math.imul(1664525,n)+1013904223)>>>0;return n%bound;};}
function complete(r){let time=r.readyAt;while(r.remaining){const prizes=vaultCashPrizes(r),shot=unlockVault(r,time,{draw:()=>{throw Error('A planned round must not draw again.');}});assert.ok(prizes.some(p=>p.weight>0&&Math.round(p.value*100)===shot.cashCents));advanceVault(r,shot.finishAt);time=shot.finishAt;}return r;}
function assertRange(r,e){assert.ok(BigInt(vaultTotal(r))>=BigInt(e.min*100));assert.ok(BigInt(vaultTotal(r))<=BigInt(e.max*100));}

test('four preset ranges match Faith’s request and preserve custom settings independently',()=>{
 assert.deepEqual(VAULT_EXPERIENCES.map(({id,min,max})=>[id,min,max]),[['low',500,1500],['medium',1000,2000],['high',1500,4000],['extreme',2500,10000]]);
 const w={...structuredClone(DEFAULT_VAULT),chambers:2,openingMin:1,openingMax:3,bonusChance:0,outcomes:[{value:3.33,weight:1}]},before=structuredClone(w);
 for(const e of VAULT_EXPERIENCES){const p=vaultExperiencePreset(w,e.id);assert.equal(p.chambers,5);assert.equal(p.maxChambers,12);assert.equal(p.name,w.name);assert.equal(p.multiplyValue,2);assert.equal(p.guarantee,true);for(let i=0;i<4;i++)assert.ok(p.specialOutcomes[i].value>p.outcomes[i].value);}
 assert.deepEqual(w,before);assert.equal(vaultExperiencePreset(w,'custom').chambers,2);assert.equal(validateVaultExperience(),'custom');assert.throws(()=>validateVaultExperience('royal'));
});
test('2,000 complete preset rounds stay within bounds with natural cash, bonus vaults and stacked multipliers',()=>{
 for(const e of VAULT_EXPERIENCES){const totals=new Set();let extras=0,stacked=0;
  for(let seed=1;seed<=500;seed++){
   let r=startVaultExperience(DEFAULT_VAULT,e.id,'Viewer',1000,rng(seed*97));
   assert.equal(r.opened.length,0);assert.equal(r.multiplier,1);assert.equal(r.remaining,5);assert.equal(r.allocated,5);assert.equal(r.flight,null);assert.equal(r.completedAt,null);
   r=JSON.parse(JSON.stringify(r));complete(r);assertRange(r,e);totals.add(vaultTotal(r));
   const extraCount=r.opened.filter(s=>s.bonus?.kind==='extra').length;extras+=extraCount;stacked+=Number(BigInt(r.multiplier)>=4n);
   assert.equal(r.opened.length,5+extraCount);assert.ok(r.opened.length<=12);assert.ok(r.opened.slice(0,3).some(s=>s.bonus));
   assert.equal(r.cashCents,r.openingCents+r.opened.reduce((sum,s)=>sum+s.cashCents,0));
   assert.equal(BigInt(r.multiplier),2n**BigInt(r.opened.filter(s=>s.bonus?.kind==='multiply').length));
  }
  assert.ok(totals.size>40,e.id+' varies its final totals');assert.ok(extras>0);assert.ok(stacked>0);
 }
});
test('pathological draws terminate with a valid guaranteed-bonus round; invalid RNG values fail before start',()=>{
 for(const e of VAULT_EXPERIENCES)for(const draw of [()=>0,max=>max-1]){let calls=0;const r=startVaultExperience(DEFAULT_VAULT,e.id,'',0,max=>{calls++;return draw(max);});complete(r);assertRange(r,e);assert.ok(calls<6000);assert.ok(r.opened.slice(0,3).some(s=>s.bonus));}
 assert.throws(()=>startVaultExperience(DEFAULT_VAULT,'low','',0,max=>max),/draw/);
});
test('planned awards cannot be forced, duplicated, or accidentally resumed without their plan',()=>{
 const r=startVaultExperience(DEFAULT_VAULT,'high','',0,rng(5));
 assert.throws(()=>unlockVault(r,r.readyAt,{forcedCash:0}),/planned prizes/);assert.throws(()=>unlockVault(r,r.readyAt,{forcedBonus:'extra'}),/planned prizes/);
 const shot=unlockVault(r,r.readyAt);assert.throws(()=>unlockVault(r,r.readyAt+1));advanceVault(r,shot.finishAt);const total=vaultTotal(r);assert.equal(advanceVault(r,shot.finishAt+1),false);assert.equal(vaultTotal(r),total);
 const broken=structuredClone(r);delete broken.prizePlan;assert.throws(()=>unlockVault(broken,shot.finishAt),/missing its next prize/);
});
test('custom rounds retain their independent RNG and have no bounded private prize plan',()=>{
 const r=startVaultExperience({...DEFAULT_VAULT,chambers:1,maxChambers:1,openingMin:5,openingMax:5,bonusChance:0,outcomes:[{value:1,weight:1}]},'custom','',0,()=>0);
 assert.equal(r.prizePlan,undefined);assert.equal(r.privateExperience,undefined);const shot=unlockVault(r,r.readyAt,{draw:()=>0});advanceVault(r,shot.finishAt);assert.equal(vaultTotal(r),'600');
});
function fixture(){const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};let tail=Promise.resolve();const locks={request:(_,fn)=>{const next=tail.then(fn);tail=next.catch(()=>{});return next;}};return {data,storage,locks,store:createVaultStore(storage,locks)};}
test('experience choice is private, persists per widget, and locks for the entire active round',async()=>{
 const f=fixture();await f.store.init();const id=DEFAULT_VAULT.id;await f.store.setExperience(id,'extreme',0);
 assert.equal(f.store.controlSnapshot(id).control.experience,'extreme');assert.equal(f.store.snapshot(id).control,undefined);
 await f.store.action(id,'Viewer',1000);const raw=()=>JSON.parse(f.data.get(VAULT_STORE_KEY)).widgets[0].round;const before=raw();
 assert.equal(before.privateExperience.id,'extreme');await assert.rejects(f.store.setExperience(id,'low',1100),/before starting/);assert.deepEqual(raw(),before);
 const publicRound=f.store.snapshot(id).round;assert.equal(publicRound.privateExperience,undefined);assert.equal(publicRound.prizePlan,undefined);assert.equal(publicRound.preset.outcomes,undefined);assert.equal(publicRound.preset.specialOutcomes,undefined);
 assert.deepEqual(cleanVaultRound(before),publicRound);assert.equal(f.store.controlSnapshot(id).control.activeExperience,'extreme');
 const resumed=createVaultStore(f.storage,f.locks);assert.equal(resumed.controlSnapshot(id).control.experience,'extreme');
 let time=before.readyAt;while(resumed.snapshot(id,time).round.remaining){await resumed.action(id,'',time);const shot=resumed.snapshot(id,time).round.flight;await resumed.advance(shot.finishAt);time=shot.finishAt;}
 const done=resumed.snapshot(id,time).round;assertRange(done,VAULT_EXPERIENCES[3]);await assert.rejects(resumed.setExperience(id,'low',time+1),/before starting/);
 await resumed.advance(done.hideAt+VAULT_CLEAR_MS);await resumed.setExperience(id,'low',done.hideAt+VAULT_CLEAR_MS+1);assert.equal(resumed.controlSnapshot(id).control.experience,'low');
});
test('mode selection and start serialize; editing custom amounts does not rewrite active plans or the selected mode',async()=>{
 const f=fixture();await f.store.init();const id=DEFAULT_VAULT.id;
 await Promise.all([f.store.setExperience(id,'medium',1000),f.store.action(id,'Viewer',1000)]);
 const before=JSON.parse(f.data.get(VAULT_STORE_KEY)).widgets[0].round;assert.equal(before.privateExperience.id,'medium');
 await assert.rejects(f.store.save({...DEFAULT_VAULT,experience:'high'}),/before starting/);
 await f.store.save({...DEFAULT_VAULT,outcomes:[{value:999999,weight:1}]});
 assert.equal(f.store.controlSnapshot(id).control.experience,'medium');assert.deepEqual(JSON.parse(f.data.get(VAULT_STORE_KEY)).widgets[0].round,before);
 const other=await f.store.save({...DEFAULT_VAULT,id:'second-vault'});await f.store.setExperience(other.id,'high',0);assert.equal(f.store.controlSnapshot(id).control.experience,'medium');
});
test('the actual control publisher sends only public snapshots, including action and reconnect publishes',async()=>{
 const f=fixture();await f.store.init();await f.store.setExperience(DEFAULT_VAULT.id,'extreme',0);
 const wire=[],controls=[];let roomOptions;
 const source=(await readFile(new URL('../src/vault-session.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replaceAll('export ','');
 const load=new Function('vaultStore','connectRoom','validKey','navigator','window','location','setInterval','clearInterval','setTimeout','clearTimeout',source+'\nreturn connectVaultControl;');
 const connect=load(f.store,options=>{roomOptions=options;return {send:message=>wire.push(structuredClone(message)),dispose(){}};},()=>true,{locks:{request:(_key,_options,fn)=>fn({})}},{addEventListener(){}},{href:'https://example.test/vault-play.html'},()=>1,()=>{},()=>1,()=>{});
 const session=await connect(DEFAULT_VAULT.id,s=>controls.push(s),()=>{});session.start();
 await session.action('Viewer');roomOptions.ready();
 assert.ok(wire.length>=2);assert.equal(controls.at(-1).control.activeExperience,'extreme');
 for(const message of wire){assert.equal(message.type,'vault-state');assert.equal(message.snapshot.control,undefined);assert.equal(message.snapshot.widget.experience,undefined);if(message.snapshot.round){assert.equal(message.snapshot.round.privateExperience,undefined);assert.equal(message.snapshot.round.prizePlan,undefined);}}
 session.dispose();
});
test('settings backups retain the private choice but contain no plan; old backups stay custom',()=>{
 const round=startVaultExperience(DEFAULT_VAULT,'high','Viewer',0,rng(2));
 const backup=exportVaultSettings([{...DEFAULT_VAULT,experience:'high',round,room:'private-key'}]);
 assert.equal(importVaultSettings(backup)[0].experience,'high');assert.ok(!JSON.stringify(backup).includes('prizePlan'));assert.ok(!JSON.stringify(backup).includes('private-key'));
 assert.equal(importVaultSettings({format:'faith-birthday-vault',version:1,widgets:[DEFAULT_VAULT]})[0].experience,'custom');
 assert.throws(()=>importVaultSettings({format:'faith-birthday-vault',version:1,widgets:[{...DEFAULT_VAULT,experience:'oops'}]}));
});
