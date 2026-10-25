import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_GIFTS,startGiftRound,unwrapGift,advanceGiftRound} from '../src/gift-game.js';
import {BONUS_MOTION_MS,giftBonusMotion,giftCellMotion,giftBonusBands,pixelBandPath} from '../src/gift-bonus-motion.js';
function round(index){const r=startGiftRound(DEFAULT_GIFTS);unwrapGift(r,100,{forcedIndex:index,cell:'1:1'});return r;}
test('bonus motion uses the committed reveal time and never replays an old hit',()=>{
 const r=round(6),at=r.flight.revealAt;assert.equal(giftBonusMotion(r,at-1),null);assert.equal(giftBonusMotion(round(0),at+300),null);
 assert.equal(giftBonusMotion(r,at).age,0);assert.deepEqual(giftBonusMotion(JSON.parse(JSON.stringify(r)),at+370),giftBonusMotion(r,at+370));
 assert.equal(giftBonusMotion(r,at+BONUS_MOTION_MS),null);assert.ok(at+BONUS_MOTION_MS<r.flight.finishAt);
 advanceGiftRound(r,2200);assert.equal(giftBonusMotion(r,2500),null);
});
test('row, column and growth animate only their new cells, with no duplicate corner',()=>{
 for(const [index,newCount]of [[6,3],[7,3],[5,7]]){
  const r=round(index),b=giftBonusMotion(r,r.flight.revealAt+100),cells=[];
  for(let row=0;row<b.rows;row++)for(let col=0;col<b.cols;col++)cells.push(giftCellMotion(row,col,b.rows,b.cols,b));
  assert.equal(cells.filter(c=>c.newCell).length,newCount);assert.ok(cells.filter(c=>c.newCell).every(c=>c.opacity===0));
  assert.ok(cells.filter(c=>!c.newCell).every(c=>c.opacity===1&&c.sx===1&&c.sy===1));
 }
});
test('existing cells make room smoothly while the added row arrives in order',()=>{
 const r=round(6),at=r.flight.revealAt;
 const cell=age=>giftCellMotion(2,1,4,3,giftBonusMotion(r,at+age));
 assert.equal(cell(0).height,314/3);assert.equal(cell(260).height,314/4);assert.ok(cell(130).height<cell(0).height&&cell(130).height>cell(260).height);
 const b=giftBonusMotion(r,at+210);assert.ok(giftCellMotion(3,0,4,3,b).opacity>0);assert.equal(giftCellMotion(3,1,4,3,b).opacity,0);
});
test('all rectangular and largest-board arrivals settle inside the fixed scene before unlock',()=>{
 for(const [kind,rows,cols]of [['row',6,4],['column',4,6],['extra',6,6]]){
  const r={flight:{revealAt:0,prize:{kind,nextRows:rows,nextCols:cols}}};
  for(let age=0;age<1000;age+=20)for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const c=giftCellMotion(row,col,rows,cols,giftBonusMotion(r,age));assert.ok(Object.values(c).every(v=>typeof v!=='number'||Number.isFinite(v)));assert.ok(c.opacity>=0&&c.opacity<=1);
  }
  const b=giftBonusMotion(r,999);
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const c=giftCellMotion(row,col,rows,cols,b);assert.equal(c.opacity,1);assert.equal(c.sx,1);assert.equal(c.sy,1);assert.equal(c.x,0);assert.equal(c.y,0);assert.equal(c.spark,0);assert.ok(c.left+c.width<=396.001&&c.top+c.height<=314.001);
  }
  for(const band of giftBonusBands(b)){assert.ok(band.x>=0&&band.y>=0&&band.x+band.width<=396&&band.y+band.height<=314);assert.ok(!pixelBandPath(band).includes('NaN'));}
 }
});
test('reduced motion shows the completed board immediately without bounces or sparkles',()=>{
 const r=round(5),b=giftBonusMotion(r,r.flight.revealAt,true),c=giftCellMotion(3,3,4,4,b);
 assert.equal(b.pop,0);assert.deepEqual(giftBonusBands(b),[]);assert.equal(c.opacity,1);assert.equal(c.sx,1);assert.equal(c.sy,1);assert.equal(c.spark,0);assert.equal(c.left,297);assert.equal(c.top,235.5);
});
test('multiplier announcement has a pop but does not move the board',()=>{
 const r=round(4),b=giftBonusMotion(r,r.flight.revealAt+180);assert.equal(b.pop,1);assert.deepEqual(giftBonusBands(b),[]);
 assert.deepEqual(giftCellMotion(1,1,3,3,b),giftCellMotion(1,1,3,3,null));
});


test('polished landings carry horizontal momentum through the first peak without over-stretching gifts',()=>{
 const r={flight:{revealAt:0,prize:{kind:'row',nextRows:4,nextCols:3}}};
 const pose=t=>giftCellMotion(3,0,4,3,giftBonusMotion(r,160+t*430));
 for(let t=0;t<=1;t+=.001){const p=pose(t);assert.ok(p.sx>=.7-1e-9&&p.sx<=1.035+1e-9);assert.ok(p.sy>=.66-1e-9&&p.sy<=1.065+1e-9);assert.ok(p.y>=-4&&p.y<=12);}
 const before=(pose(.44).sx-pose(.4399).sx)/.0001,after=(pose(.4401).sx-pose(.44).sx)/.0001;
 assert.ok(before>.1&&after>.1,'first contact keeps moving into the soft settle');assert.ok(Math.abs(before-after)<.005,'velocity is continuous across the first pose');
 assert.equal(pose(1).sx,1);assert.equal(pose(1).sy,1);assert.equal(pose(1).y,0);
});
