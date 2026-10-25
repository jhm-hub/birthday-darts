import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_GIFTS,startGiftRound,unwrapGift,advanceGiftRound,giftTotal} from '../src/gift-game.js';
import {presentedGiftRound,giftFinishMotion,giftFinishSpark} from '../src/gift-finish-motion.js';
import {giftFinaleMotion} from '../src/gift-finale-motion.js';

function lastPick(prizes=[0,1,4],cell='2:2'){
 const round=startGiftRound(DEFAULT_GIFTS,'Demo',0);
 for(let i=0;i<2;i++){unwrapGift(round,i*2000,{cell:'0:'+i,forcedIndex:prizes[i]});advanceGiftRound(round,(i+1)*2000);}
 unwrapGift(round,4000,{cell,forcedIndex:prizes[2]});return round;
}
test('last prize has an uninterrupted reading beat before the shared handoff',()=>{
 const r=lastPick();
 for(const t of [4000,4849,4850,5500,5679])assert.equal(giftFinishMotion(r,t).active,false);
 const start=giftFinishMotion(r,5680);assert.equal(start.toast,1);assert.equal(start.board,1);
 const late=giftFinishMotion(r,5850);assert.ok(late.toast>0&&late.toast<1);assert.ok(late.board<1&&late.board>.25);
 assert.equal(giftFinishMotion(r,5999).toast,0);
});
test('presentation completes on the committed clock without mutating or awarding twice',()=>{
 const r=lastPick(),before=structuredClone(r);
 assert.equal(presentedGiftRound(r,5999),r);
 const shown=presentedGiftRound(r,6000);assert.equal(shown.flight,null);assert.equal(shown.completedAt,6000);assert.equal(shown.hideAt,11500);assert.equal(giftTotal(shown),'7000');assert.equal(shown.opened.length,3);
 assert.deepEqual(r,before);assert.deepEqual(presentedGiftRound(r,6200),shown);
 const committed=structuredClone(r);advanceGiftRound(committed,6000);assert.deepEqual(shown,committed);
 for(const t of [6000,6070,6140,6180,6600])assert.deepEqual(giftFinishMotion(presentedGiftRound(r,t),t),giftFinishMotion(committed,t));
});
test('each tier retains its own payoff and settles inside the same hold',()=>{
 for(const [prizes,tier]of [[[0,1,4],0],[[1,2,4],1],[[2,3,4],2]]){
  const r=lastPick(prizes),before=giftFinishMotion(r,5999),done=presentedGiftRound(r,6000),at=giftFinishMotion(done,6000);
  assert.ok(Math.abs(before.board-at.board)<.004);assert.ok(Math.abs(before.footer-at.footer)<.004);
  assert.equal(at.plaque,0);assert.equal(giftFinishMotion(done,6090).plaque,1);assert.equal(giftFinishMotion(done,6090).content,0);assert.equal(giftFinishMotion(done,6140).content,1);
  assert.equal(giftFinaleMotion(done,6000).level,tier);assert.equal(!!giftFinaleMotion(done,6000).building,tier===2);
  if(tier===2){assert.equal(at.footer,0);assert.equal(giftFinishMotion(done,6600).footer,0);assert.equal(giftFinishMotion(done,6760).footer,.5);}
  const hold=giftFinishMotion(done,9000);assert.equal(hold.board,.25);assert.equal(hold.footer,.5);assert.equal(hold.plaque,1);
 }
});
test('bonus picks and ordinary picks never trigger a false final celebration',()=>{
 const normal=startGiftRound(DEFAULT_GIFTS);unwrapGift(normal,0,{forcedIndex:0});
 assert.equal(giftFinishMotion(normal,1900).active,false);
 for(const bonus of [5,6,7]){const r=lastPick([0,1,bonus]);assert.equal(giftFinishMotion(r,5900).active,false);const shown=presentedGiftRound(r,6100);assert.equal(shown.completedAt,null);assert.ok(shown.remaining>0);assert.equal(giftFinishMotion(shown,6100).active,false);}
});
test('quiet mode and direct previews do not invent a trail or replay an old handoff',()=>{
 const r=lastPick(),done=presentedGiftRound(r,6000);
 for(const t of [5680,5900]){const m=giftFinishMotion(r,t,true);assert.equal(m.board,1);assert.equal(m.toast,1);assert.equal(m.toastY,0);assert.equal(giftFinishSpark(m,0,r,t,true),null);}
 const quiet=giftFinishMotion(done,6000,true);assert.equal(quiet.plaque,1);assert.equal(quiet.board,.25);assert.equal(quiet.toastY,0);
 const sample={...done,opened:[],completedAt:8000};assert.equal(giftFinishMotion(sample,8000).linked,false);assert.equal(giftFinishMotion(sample,8000).board,1);
 for(const t of [8000,11000])for(let i=0;i<3;i++)assert.equal(giftFinishSpark(giftFinishMotion(done,t),i,done,t),null);
});
test('handoff sparkles stay within compact boards for every possible final cell',()=>{
 for(let rows=2;rows<=6;rows++)for(let cols=2;cols<=6;cols++)for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const r=lastPick();r.rows=rows;r.cols=cols;r.flight.cell=row+':'+col;
  for(let t=5680;t<=6200;t+=25){const shown=presentedGiftRound(r,t),m=giftFinishMotion(shown,t);for(let i=0;i<3;i++){const p=giftFinishSpark(m,i,shown,t);if(p){assert.ok(p.x>=0&&p.x<=420);assert.ok(p.y>=76&&p.y<=396);assert.ok(p.opacity>=0&&p.opacity<=1);assert.deepEqual(p,giftFinishSpark(m,i,shown,t));}}}
 }
});
