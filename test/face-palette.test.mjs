import test from 'node:test';
import assert from 'node:assert/strict';
import {matchFaceSkin} from '../src/face-palette.js';

test('facial overlays retain original skin shading while preserving eye and mouth ink',()=>{
 const skin=[246,150,99,253],differentSkin=[255,190,140,252],eye=[27,83,143,254],lip=[215,105,65,253];
 const reference=new Uint8ClampedArray([...skin,...eye,...skin,...skin]);
 const source=new Uint8ClampedArray([...differentSkin,...differentSkin,...eye,...lip]);
 const result=matchFaceSkin(reference,source,4,1,[{x:3,y:0,width:1,height:1}]);
 assert.deepEqual([...result.slice(0,3)],skin.slice(0,3),'unchanged skin retains the exact original color');
 assert.deepEqual([...result.slice(4,7)],skin.slice(0,3),'a closing eye fills from nearby original skin');
 assert.deepEqual([...result.slice(8,12)],eye,'blue eye features keep their ink');
 assert.deepEqual([...result.slice(12,16)],lip,'warm lip colors are not mistaken for cheek skin');
 for(let i=3;i<source.length;i+=4)assert.equal(result[i],source[i],'alpha is unchanged');
 assert.deepEqual([...source.slice(0,4)],differentSkin,'source artwork is not mutated');
});
