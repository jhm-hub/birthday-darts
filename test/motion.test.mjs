import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {throwCel,spriteLayout,dartReleasePoint,balloonDeformation,popCel,fragmentMotion,confettiMotion} from '../src/motion.js';
import {BALLOON_BURST_MS} from '../src/balloon-timing.js';

test('first and later throws expose all sixteen painted cels and release on the empty-hand cel',()=>{
 for(const lead of [750,410]){
  const shot={startAt:1000,releaseAt:1000+lead},seen=new Set();
  for(let t=1000;t<shot.releaseAt+900;t++)seen.add(throwCel(shot,t));
  assert.deepEqual([...seen],Array.from({length:16},(_,i)=>i));
  assert.equal(throwCel(shot,shot.releaseAt-1),7);
  assert.equal(throwCel(shot,shot.releaseAt),8);
  assert.equal(throwCel(shot,shot.releaseAt+870),0);
  assert.equal(throwCel(shot,shot.releaseAt,false),8);
  assert.equal(throwCel(null,2000),0);
 }
});

test('atlas crops stay inside the sheet and the release point follows the registered hand',async()=>{
 const config=JSON.parse(await readFile(new URL('../public/character.json',import.meta.url),'utf8'));
 assert.equal(config.frames.length,16);
 for(let i=0;i<16;i++){
  const f=config.frames[i];assert.ok(f.x>=0&&f.x+f.width<=config.sheetWidth);
  assert.ok(f.y>=0&&f.y+f.height<=config.sheetHeight);
  assert.ok(f.anchor>=f.x&&f.anchor<=f.x+f.width);
  assert.ok(!JSON.stringify(spriteLayout(config,i)).includes('NaN'));
  assert.equal(spriteLayout(config,i).height,'298px');
  const bytes=await readFile(new URL('../public/'+(f.image||config.throwStudy).replace('./',''),import.meta.url));
  assert.equal(bytes.readUInt32BE(16),config.sheetWidth);assert.equal(bytes.readUInt32BE(20),config.sheetHeight);
 }
 const f=config.frames[config.release.frame];assert.ok(config.release.x>=f.x&&config.release.x<=f.x+f.width);
 const birthday=dartReleasePoint(config,true),classic=dartReleasePoint(config,false);
 assert.ok(birthday.x>220&&birthday.x<280);assert.equal(birthday.x,classic.x);assert.equal(birthday.y-classic.y,42);
});

test('balloon holds through impact then transitions to eight rupture cels without respawning',()=>{
 for(let age=-320;age<0;age++)assert.equal(balloonDeformation(age).alpha,1);
 for(const age of [0,60,240,2000,100000])assert.equal(balloonDeformation(age).alpha,0);
 assert.equal(popCel(-1),-1);assert.equal(popCel(480),-1);
 assert.deepEqual(Array.from({length:8},(_,i)=>popCel(i*60)),[0,1,2,3,4,5,6,7]);
 assert.deepEqual(balloonDeformation(-160,false),{x:1,y:1,alpha:1});
});

test('particles sample deterministically, remain finite, finish cleanly and reduce motion',()=>{
 for(let i=0;i<24;i++)for(let t=-100;t<=1600;t+=20){
  const p=confettiMotion(i,t);assert.deepEqual(p,confettiMotion(i,t));
  assert.ok(Object.values(p).every(Number.isFinite));assert.ok(p.alpha>=0&&p.alpha<=1);
  assert.equal(confettiMotion(i,t,false).alpha,0);
 }
 for(let i=0;i<8;i++){
  assert.equal(fragmentMotion(i,-1).alpha,0);
  assert.equal(fragmentMotion(i,BALLOON_BURST_MS).alpha,0);
  assert.equal(fragmentMotion(i,300,false).turn,0);
 }
});
