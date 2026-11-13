import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {GAMES,savedSummary,gameLinks,legacyDartsLink} from '../src/home-catalog.js';

const game=id=>GAMES.find(g=>g.id===id);
function store(entries={}){return {getItem:key=>entries[key]??null,setItem(){assert.fail('The homepage must not write game state');},removeItem(){assert.fail('The homepage must not remove game state');}};}
test('all thirteen editors and controls remain separate, with relative routes',async()=>{
 assert.equal(GAMES.length,13);assert.equal(new Set(GAMES.map(g=>g.id)).size,13);
 for(const g of GAMES){
  const links=gameLinks(g,{});assert.equal(links.editor,g.editor);assert.equal(links.controls,g.controls);
  for(const link of Object.values(links))if(link.startsWith('./'))await access(new URL('../public/'+link.slice(2).split('?')[0],import.meta.url));
 }
 assert.equal(gameLinks(game('brokie'),{}).controls,'./brokie.html?live=1');
 assert.equal(gameLinks(game('birthday-scam'),{}).editor,'../birthday-scam-wheel/?panel=settings');
 assert.equal(gameLinks(game('scam'),{}).controls,'../scam-wheel/browser.html');
});
test('widget summaries prefer the active saved version and never expose rooms or rounds',()=>{
 for(const id of ['vault','gifts','darts','pinata','double-add','double-multiply','bonus-add','bonus-multiply','mirror-add','mirror-multiply']){
  const g=game(id),a={id:'first',name:'First',room:'secret'},b={id:'chosen & #',name:'Saved birthday game',viewerRanges:[{username:'private'}],round:{viewer:'private'}};
  const state=JSON.stringify({widgets:[a,b],stream:{activeId:b.id,room:'private'}});
  const storage=store({[g.key]:state}),summary=savedSummary(storage,g);
  assert.deepEqual(summary,{count:2,name:b.name,id:b.id});
  assert.equal(new URL(gameLinks(g,summary).editor,'https://example.test/birthday-darts/').searchParams.get('id'),b.id);
  assert.equal(gameLinks(g,summary).controls,g.controls);
  assert.equal(storage.getItem(g.key),state);
 }
});
test('Brokie nested configs and both Scam libraries retain their chosen names',()=>{
 const b=game('brokie');assert.deepEqual(savedSummary(store({[b.key]:JSON.stringify({wheels:[{config:{id:'wheel',name:'Friday'}}],stream:{activeId:'wheel'}})}),b),{count:1,name:'Friday',id:'wheel'});
 for(const id of ['birthday-scam','scam']){
  const g=game(id),summary=savedSummary(store({[g.key]:JSON.stringify({selected:'b',versions:[{id:'a',name:'First'},{id:'b',name:'Selected'}]})}),g);
  assert.equal(summary.name,'Selected');assert.equal(summary.count,2);assert.equal(summary.id,undefined);
  assert.equal(gameLinks(g,summary).editor,g.editor);
 }
});
test('missing, legacy, unavailable and malformed storage stay untouched',()=>{
 for(const g of GAMES){
  assert.deepEqual(savedSummary(store(),g),{count:0});
  for(const text of ['{bad','null','{}','{"widgets":[]}'])assert.deepEqual(savedSummary(store({[g.key]:text}),g),{unavailable:true});
  assert.deepEqual(savedSummary({getItem(){throw Error('Storage disabled');}},g),{unavailable:true});
 }
 for(const id of ['scam','birthday-scam']){const g=game(id);assert.deepEqual(savedSummary(store({[g.legacy]:'{}'}),g),{count:1,name:'My saved settings'});}
});
test('legacy Darts bookmarks preserve their saved ID and demo payload',()=>{
 const base='https://jhm-hub.github.io/birthday-darts/';
 assert.equal(legacyDartsLink(base),null);assert.equal(legacyDartsLink(base+'?v=home#games'),null);
 for(const suffix of ['?id=old%20id&v=old#demo=Test','index.html#game=encoded-demo','index.html#demo=Viewer']){
  const original=new URL(suffix,base),result=new URL(legacyDartsLink(original.href));
  assert.equal(result.pathname,'/birthday-darts/darts.html');assert.equal(result.search,original.search);assert.equal(result.hash,original.hash);
 }
});
test('home navigation is only added to private pages, not transparent overlays',async()=>{
 for(const file of ['darts','play','gifts','gift-play','vault','vault-play','pinata','pinata-play','brokie','double-add','double-add-play','double-multiply','double-multiply-play','bonus-add','bonus-add-play','bonus-multiply','bonus-multiply-play','mirror-add','mirror-add-play','mirror-multiply','mirror-multiply-play'])assert.match(await readFile(new URL('../public/'+file+'.html',import.meta.url),'utf8'),/class="game-home-nav"/);
 for(const file of ['display','gift-display','vault-display','pinata-display','brokie-display','double-add-display','double-multiply-display','bonus-add-display','bonus-multiply-display','mirror-add-display','mirror-multiply-display'])assert.doesNotMatch(await readFile(new URL('../public/'+file+'.html',import.meta.url),'utf8'),/game-home-nav/);
});
