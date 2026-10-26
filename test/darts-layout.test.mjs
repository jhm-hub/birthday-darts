import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DARTS_STAGE,stageFit,classicPoint} from '../src/darts-layout.js';
import {dartReleasePoint,characterFrameLayout} from '../src/motion.js';
test('square stage fits compact, legacy-wide and portrait sources without stretching',()=>{
 for(const [w,h]of [[540,540],[420,420],[280,280],[720,540],[720,450],[390,844],[844,390],[0,0]]){
  const box=stageFit(w,h);assert.ok(Number.isFinite(box.scale));assert.ok(box.left>=0&&box.top>=0);assert.ok(box.scale*540<=Math.min(w,h));
  assert.equal(box.left*2+box.scale*540,w);assert.equal(box.top*2+box.scale*540,h);
 }
 assert.equal(stageFit(420,420).scale,420/540);
});
test('square stage keeps dart release registered to the same original hand and body scale',async()=>{
 const c=JSON.parse(await readFile(new URL('../public/character.json',import.meta.url),'utf8'));
 const old=dartReleasePoint(c,true),now=dartReleasePoint(c,true,DARTS_STAGE.character);
 assert.equal(now.x-old.x,DARTS_STAGE.character.x-37);assert.equal(now.y-old.y,DARTS_STAGE.character.y-50);
 assert.deepEqual(now,dartReleasePoint(c,false,DARTS_STAGE.character));
 for(const f of c.frames){const b=characterFrameLayout(c,c.frames.indexOf(f));assert.equal(b.top+(f.baseline-f.y)*b.scale+DARTS_STAGE.sceneTop+DARTS_STAGE.character.y+(c.canvasOffsetY||0),420);}
});
test('all classic dart hit positions remain within the square target',()=>{
 for(let n=1;n<=8;n++)for(let bandIndex=0;bandIndex<2*n-1;bandIndex++)for(const offset of [-.35,0,.35]){
  const p=classicPoint({bandIndex,offset},n);assert.equal(p.x,380);assert.ok(p.y>80&&p.y<340);assert.ok(p.y+DARTS_STAGE.sceneTop<468);
 }
});
