import test from 'node:test';
import assert from 'node:assert/strict';
import {createDemoArtwork} from '../src/demo-artwork.js';
import {readCentrePng,setCentreLayout} from '../src/centre-png.js';
function fixture(prepare=async file=>file){let n=0;const released=[],art=createDemoArtwork({prepare,createURL:()=>`blob:test-${++n}`,revokeURL:url=>released.push(url)});return {art,released};}
test('demo artwork is temporary and replacements/removal release only local object URLs',async()=>{
 const {art,released}=fixture(),config={enabled:true,diameter:120,assetId:'a'.repeat(64)},original=structuredClone(config);
 assert.equal(art.read().source,undefined);
 await art.choose({name:'Logo.png'});assert.equal(art.read().source,'blob:test-1');
 await art.choose({},{kind:'sample',label:'Faith sample'});assert.deepEqual(released,['blob:test-1']);
 art.clear();assert.equal(art.read().source,null);assert.deepEqual(released,['blob:test-1','blob:test-2']);
 art.saved();assert.equal(art.read().source,undefined);assert.deepEqual(config,original);
 assert.deepEqual(readCentrePng({...config,source:'blob:test'}),original,'view-only URL is never accepted into saved settings');
});
test('invalid files preserve the current preview and late preparations cannot resurrect removed artwork',async()=>{
 let finish;const {art,released}=fixture(file=>file.fail?Promise.reject(Error('invalid PNG')):file.wait?new Promise(resolve=>{finish=resolve;}):Promise.resolve(file));
 await art.choose({name:'Good.png'});await assert.rejects(art.choose({fail:true}),/invalid PNG/);assert.equal(art.read().source,'blob:test-1');
 const pending=art.choose({wait:true});art.clear();finish({});assert.equal(await pending,null);assert.equal(art.read().source,null);assert.deepEqual(released,['blob:test-1']);
 const late=art.choose({wait:true});art.dispose();finish({});assert.equal(await late,null);assert.equal(art.read().source,undefined);
});
test('page disposal releases the preview and saved image restoration does not revoke a remote asset',async()=>{
 const {art,released}=fixture();await art.choose({name:'Logo.png'});art.saved();assert.deepEqual(released,['blob:test-1']);await art.choose({name:'Other.png'});art.dispose();assert.deepEqual(released,['blob:test-1','blob:test-2']);assert.equal(await art.choose({}),null);
});
test('view override can hide, replace and restore a saved image without changing its config',()=>{
 const image={dataset:{},hidden:true,removeAttribute(){delete this.src;}},stage={dataset:{},style:{setProperty(){}},querySelector(){return image;}},c={centrePng:{enabled:true,diameter:120,assetId:'a'.repeat(64)}},before=structuredClone(c);
 setCentreLayout(stage,c);const saved=image.src;assert.match(saved,/\/image\/[a-f0-9]{64}\.png$/);
 setCentreLayout(stage,c,{imageSource:null});assert.equal(image.src,undefined);assert.equal(stage.dataset.centreImage,'false');
 setCentreLayout(stage,c,{imageSource:'blob:demo'});assert.equal(image.src,'blob:demo');image.onload();assert.equal(image.hidden,false);
 setCentreLayout(stage,c);assert.equal(image.src,saved);assert.deepEqual(c,before);
});
