import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {throwCel,spriteLayout,characterFrameLayout,dartReleasePoint,balloonDeformation,popCel,fragmentMotion,confettiMotion} from '../src/motion.js';
import {BALLOON_BURST_MS} from '../src/balloon-timing.js';

test('first and later throws expose all twenty-four full-body cels and release on the empty-hand cel',()=>{
 for(const lead of [750,410]){
  const shot={startAt:1000,releaseAt:1000+lead},seen=new Set();
  for(let t=1000;t<shot.releaseAt+900;t++)seen.add(throwCel(shot,t));
  assert.deepEqual([...seen],Array.from({length:24},(_,i)=>i));
  assert.equal(throwCel(shot,shot.releaseAt-1),7);
  assert.equal(throwCel(shot,shot.releaseAt),8);
  assert.equal(throwCel(shot,shot.releaseAt+870),0);
  assert.equal(throwCel(shot,shot.releaseAt,false),8);
  assert.equal(throwCel(null,2000),0);
 }
});

test('atlas crops stay inside the sheet and the release point follows the registered hand',async()=>{
 const config=JSON.parse(await readFile(new URL('../public/character.json',import.meta.url),'utf8'));
 assert.equal(config.frames.length,24);
 for(let i=0;i<24;i++){
  const f=config.frames[i];
  const bytes=await readFile(new URL('../public/'+(f.image||config.throwStudy).replace('./',''),import.meta.url));
  assert.ok(f.x>=0&&f.x+f.width<=bytes.readUInt32BE(16));
  assert.ok(f.y>=0&&f.y+f.height<=bytes.readUInt32BE(20));
  assert.ok(f.anchor>=f.x&&f.anchor<=f.x+f.width);
  assert.ok(!JSON.stringify(spriteLayout(config,i)).includes('NaN'));
  const box=characterFrameLayout(config,i);
  assert.ok(box.left>=0&&box.left+box.width<=config.canvasWidth,`cel ${i} fits horizontally`);
  assert.ok(box.top>=0&&box.top+box.height<=config.canvasHeight,`cel ${i} fits vertically`);
  assert.equal(box.top+(f.baseline-f.y)*box.scale,config.groundY,'front boot remains planted');
  assert.equal(box.scale,config.frames[0].scale,'all cels in an atlas share one scale');
 }
 const f=config.frames[config.release.frame];assert.ok(config.release.x>=f.x&&config.release.x<=f.x+f.width);
 const birthday=dartReleasePoint(config,true),classic=dartReleasePoint(config,false);
 assert.ok(birthday.x>220&&birthday.x<310);assert.equal(birthday.x,classic.x);assert.ok(Math.abs(birthday.y-classic.y-42)<1e-9);
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

test('the approved throw art is unchanged and win overlays are confined inside its face',async()=>{
 const read=name=>readFile(new URL('../public/'+name,import.meta.url),'utf8').then(JSON.parse);
 const [config,previous]=await Promise.all([read('character.json'),read('character-full-body-v6.json')]);
 assert.deepEqual(config.frames,previous.frames.slice(0,24));
 for(const key of ['bodyAnchorX','groundY','canvasWidth','canvasHeight','canvasOffsetX','canvasOffsetY'])assert.equal(config[key],previous[key]);
 const face=config.expressions;assert.equal(face.frames.length,6);
 const bytes=await readFile(new URL('../public/'+face.image.replace('./',''),import.meta.url));
 for(const f of face.frames){assert.ok(f.x>=0&&f.x+f.width<=bytes.readUInt32BE(16));assert.ok(f.y>=0&&f.y+f.height<=bytes.readUInt32BE(20));}
 for(const [x,y] of face.clip){assert.ok(x>=138&&x<=164);assert.ok(y>=27&&y<=54);}
 assert.deepEqual(face.target,{x:138,y:27,width:26,height:27});
});
