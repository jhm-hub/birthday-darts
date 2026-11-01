import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleVaultChamberHandoff,vaultChamberHandoff,vaultChamberTrail,vaultChamberSampleRound,VAULT_CHAMBER_GUIDE_TRAVEL_MS,VAULT_CHAMBER_GUIDE_LEAD_MS} from '../src/vault-chamber-handoff.js';
import {vaultCollectAt,vaultCollectionCoin,vaultCollectionBank,vaultCollectionCount,VAULT_COLLECT_TRAVEL_MS,VAULT_COLLECT_STAGGER_MS} from '../src/vault-collection-motion.js';
import {vaultSoundScore,renderVaultSound,renderVaultSequence} from '../src/vault-sound-design.js';
import {vaultTotal,cleanVaultRound} from '../src/vault-game.js';
const dock={left:138,right:282,y:386};

test('every coin faces forward before landing and settles into the edge without a rebound or a label crossing',()=>{
 for(const bonus of [null,'multiply','extra'])for(let tier=0;tier<3;tier++)for(let index=0;index<20;index++){
  const s={...sampleVaultChamberHandoff(0,400,10000,bonus).before.flight,index,cashCents:[1000,2500,10000][tier]};
  for(let i=0;i<vaultCollectionCount(tier);i++){
   const land=vaultCollectAt(s)+VAULT_COLLECT_TRAVEL_MS+i*VAULT_COLLECT_STAGGER_MS;
   const before=vaultCollectionCoin(s,i,land-1,dock),hit=vaultCollectionCoin(s,i,land,dock);
   assert.ok(Math.abs(before.flip-1)<.001);assert.equal(hit.flip,1);
   assert.ok(Math.abs(before.x-hit.x)<=1&&Math.abs(before.y-hit.y)<=1);
   let previous=hit;
   for(let age=1;age<55;age++){
    const p=vaultCollectionCoin(s,i,land+age,dock);
    assert.ok(p.y>=previous.y&&p.y<=dock.y+2);
    assert.ok(p.opacity<=previous.opacity&&p.squash<=previous.squash);
    assert.ok(p.x<=dock.left||p.x>=dock.right);previous=p;
   }
   assert.equal(vaultCollectionCoin(s,i,land+55,dock).visible,false);
  }
 }
});

test('a single bank catch holds through the last coin and overlaps the departing guide, without changing numbers',()=>{
 for(let tier=0;tier<3;tier++)for(const bonus of [null,'multiply','extra']){
  const sample=sampleVaultChamberHandoff(0,0,10000,bonus),r=sample.before,s=r.flight;s.cashCents=[1000,2500,10000][tier];
  const saved=JSON.stringify(r),guideAt=s.finishAt-VAULT_CHAMBER_GUIDE_LEAD_MS,first=vaultCollectAt(s)+VAULT_COLLECT_TRAVEL_MS;
  const last=first+(vaultCollectionCount(tier)-1)*VAULT_COLLECT_STAGGER_MS;
  assert.ok(vaultCollectionBank(s,last+20).catch>.9);
  assert.ok(vaultCollectionBank(s,guideAt).catch>.2);
  const handoff=vaultChamberHandoff(r,guideAt+12);
  assert.ok(vaultChamberTrail(handoff,0,guideAt+12).opacity>0);
  assert.ok(vaultCollectionBank(s,guideAt+12).catch>0);
  assert.equal(vaultCollectionBank(s,first+220).catch,0);
  assert.equal(vaultCollectionBank(s,first+100,true).catch,0);
  assert.equal(JSON.stringify(r),saved);assert.equal(vaultTotal(cleanVaultRound(r)),vaultTotal(r));
 }
});

test('lock light meets the arriving guide and carries through immediate or paused clicks with no audio loop',()=>{
 for(const wait of [0,400,60000])for(const index of [0,1,2,3,4]){
  const s=sampleVaultChamberHandoff(index,wait),at=s.readyAt-VAULT_CHAMBER_GUIDE_LEAD_MS+VAULT_CHAMBER_GUIDE_TRAVEL_MS;
  const approach=vaultChamberHandoff(s.before,at-10);
  assert.ok(approach.lock>0);assert.ok(vaultChamberTrail(approach,0,at-10).visible);
  const a=vaultChamberHandoff(vaultChamberSampleRound(s,s.clickAt-1),s.clickAt-1);
  const b=vaultChamberHandoff(s.flight,s.clickAt);
  assert.ok(Math.abs(a.lock-b.lock)<.001);
  assert.equal(b.lock,.14);assert.equal(vaultChamberHandoff(s.flight,s.clickAt+220).lock,0);
  const score=vaultSoundScore('next',{index:index+1});assert.equal(score.length,1);assert.equal(score[0].voice,'click');
  assert.equal(score[0].at,VAULT_CHAMBER_GUIDE_TRAVEL_MS/1000);
  assert.ok(score[0].at+score[0].length<VAULT_CHAMBER_GUIDE_LEAD_MS/1000+.06,'clears before the next key turn');
 }
});

test('the complete deposit audition has the live gains and timing with a quiet gap before the ready click',()=>{
 for(const rate of [44100,48000])for(let tier=0;tier<3;tier++){
  const s=sampleVaultChamberHandoff(),gap=(s.readyAt-VAULT_CHAMBER_GUIDE_LEAD_MS-vaultCollectAt(s.before.flight))/1000;
  const events=[{at:0,sound:'collect',options:{tier,bonus:true}},{at:gap,sound:'next',options:{index:1}}];
  const live=renderVaultSequence(events,rate),preview=renderVaultSound('deposit-next',{tier,index:1},rate);
  assert.ok(Math.abs(live.length-preview.length)<=1);let peak=0;
  for(let i=0;i<live.length;i++){assert.ok(Math.abs(live[i]-(preview[i]??0))<1e-8);peak=Math.max(peak,Math.abs(live[i]));}
  assert.ok(peak>0&&peak<.07);assert.equal(live[0],0);assert.equal(live.at(-1),0);
  const end=renderVaultSound('collect',{tier,bonus:true},rate).length;
  const click=Math.round((gap+VAULT_CHAMBER_GUIDE_TRAVEL_MS/1000)*rate);
  assert.ok(click-end>rate*.20);assert.ok(live.slice(end,click).every(v=>v===0));
 }
});
