import test from 'node:test';
import assert from 'node:assert/strict';
import {restoreAtlasHair} from '../src/atlas-hair.js';

test('body matte cleanup restores cut copper locks and their dark edge without restoring the wider body',()=>{
 const width=12,height=16,pixels=new Uint8ClampedArray(width*height*4),reference=new Uint8ClampedArray(pixels.length);
 const put=(a,x,y,rgba)=>a.set(rgba,(y*width+x)*4),get=(a,x,y)=>Array.from(a.slice((y*width+x)*4,(y*width+x)*4+4));
 put(reference,2,5,[220,80,20,250]); // The body cutoff removed this lock.
 put(reference,1,5,[24,12,8,245]); // Its dark outline is part of the lock.
 put(reference,3,5,[90,30,20,70]); // Faint matte is not hair.
 put(pixels,3,5,[90,30,20,210]);
 put(reference,7,5,[220,80,20,250]); // Warm shading inside the torso guard.
 put(pixels,7,5,[30,28,32,0]); // Keep the corrected, narrower silhouette.
 put(reference,2,10,[220,80,20,250]); // Similar colors on legs must not grow.
 put(pixels,2,10,[80,45,40,210]);
 put(reference,5,1,[190,70,20,230]); // Fine crown shading survives intact.
 put(pixels,5,1,[90,30,20,0]);
 const before=new Uint8ClampedArray(pixels),source=new Uint8ClampedArray(reference);
 restoreAtlasHair(pixels,reference,width,height,{cellWidth:12,cellHeight:16,headEnd:4,hairEnd:8,hairRight:6,cutoff:192});
 assert.deepEqual(get(pixels,2,5),get(reference,2,5));
 assert.deepEqual(get(pixels,1,5),get(reference,1,5));
 assert.equal(get(pixels,3,5)[3],0);
 assert.deepEqual(get(pixels,7,5),get(before,7,5));
 assert.deepEqual(pixels.slice(8*width*4),before.slice(8*width*4));
 assert.deepEqual(get(pixels,5,1),get(reference,5,1));
 assert.deepEqual(reference,source);
});

test('hair outlines cannot bleed across atlas cell boundaries',()=>{
 const width=12,height=16,pixels=new Uint8ClampedArray(width*height*4),reference=new Uint8ClampedArray(pixels.length);
 const i=(5*width+5)*4;reference.set([220,80,20,255],i);
 const neighbor=(5*width+6)*4;reference.set([20,10,8,255],neighbor);
 restoreAtlasHair(pixels,reference,width,height,{cellWidth:6,cellHeight:8,headEnd:2,hairEnd:7,hairRight:6,cutoff:192});
 assert.equal(pixels[i+3],255);assert.equal(pixels[neighbor+3],0);
});
