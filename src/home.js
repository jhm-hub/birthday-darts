import {readSharedConnection,sharedStorageKey} from './shared-settings-connection.js';
import {GAMES,savedSummary,gameLinks,legacyDartsLink} from './home-catalog.js';
import {activeGiftSVG} from './gift-concept-art.js';
import {balloonPixelLayers} from './balloon-art.js';
import {brokieWheelSVG} from './brokie-view.js';
import {DEFAULT_BROKIE} from './brokie-game.js';
const legacy=legacyDartsLink(location.href);
if(legacy)location.replace(legacy);
else init();
function wheelArt(kind){
 const colors=kind==='birthday-scam'?['#f3a6cb','#d0b3ec','#ffe4a6','#95d8ca']:['#b186c4','#e5b1cd','#91bfb6','#dfbb8b'];
 const wedges=Array.from({length:12},(_,i)=>{const a=(i*30-90)*Math.PI/180,b=((i+1)*30-90)*Math.PI/180;return `<path d="M80 80L${80+66*Math.cos(a)} ${80+66*Math.sin(a)}A66 66 0 0 1 ${80+66*Math.cos(b)} ${80+66*Math.sin(b)}Z" fill="${colors[i%4]}" stroke="#fff0cc" stroke-width="1.6"/>`;}).join('');
 return `<svg viewBox="0 0 160 174" aria-hidden="true"><circle cx="80" cy="83" r="74" fill="#704264"/><circle cx="80" cy="80" r="73" fill="#f1c67d" stroke="#53334b" stroke-width="3"/>${wedges}<circle cx="80" cy="80" r="23" fill="#684468" stroke="#ffe5b1" stroke-width="4"/><path d="M67 73h7v5h5v-11h4v11h5v-5h7v16H67Z" fill="#ffe5a7"/><path d="M72 1h16v12l-8 10-8-10Z" fill="#fff0c5" stroke="#714261" stroke-width="3"/><g fill="#fff5d8">${Array.from({length:16},(_,i)=>`<circle cx="${80+70*Math.cos(i*Math.PI/8)}" cy="${80+70*Math.sin(i*Math.PI/8)}" r="1.7"/>`).join('')}</g></svg>`;
}
function doubleArt(id){
 const ring=(n,r,colors)=>Array.from({length:n},(_,i)=>{const a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n;return `<path d="M80 80L${80+r*Math.cos(a)} ${80+r*Math.sin(a)}A${r} ${r} 0 0 1 ${80+r*Math.cos(b)} ${80+r*Math.sin(b)}Z" fill="${colors[i%2]}" stroke="#724184"/>`;}).join('');
 return `<svg viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="75" fill="#633375"/>${ring(8,70,['#ab4bb8','#d9a9e8'])}<circle cx="80" cy="80" r="49" fill="#633375" stroke="#d6aadf"/>${ring(6,41,['#c42d9a','#f4a6cf'])}${(id.startsWith('bonus-')||id.startsWith('mirror-'))?ring(6,28,['#ffc86b','#ffe9ad']):''}<circle cx="80" cy="80" r="16" fill="#fbe1f1" stroke="#633375" stroke-width="3"/><text x="80" y="88" text-anchor="middle" fill="#633375" font-size="26">${id.endsWith('-add')?'+':'×'}</text>${id.startsWith('mirror-')?'<path d="M20 80L3 72v16Z M47 80L35 74v12Z" fill="#f4dfff" stroke="#633375"/>':''}<path d="M140 80l17-8v16Z M113 80l12-6v12Z" fill="#f4dfff" stroke="#633375"/></svg>`;
}
function art(id){
 if(id.startsWith('double-')||id.startsWith('bonus-')||id.startsWith('mirror-'))return doubleArt(id);
 if(id==='vault')return '<img src="./assets/vault/crown-v3-closed.png" width="1254" height="1254" alt="" fetchpriority="high">';
 if(id==='pinata')return '<img src="./assets/pinata/birthday-royalty-v4.png" width="1280" height="1280" alt="" loading="lazy">';
 if(id==='gifts')return '<div class="gift-cluster">'+[1,0,2].map(i=>activeGiftSVG(i)).join('')+'</div>';
 if(id==='brokie')return brokieWheelSVG(DEFAULT_BROKIE);
 if(id==='darts')return '<div class="balloon-cluster">'+['#ae8bd8','#f186bb','#7ecbbf'].map(color=>`<svg viewBox="0 0 88 160" aria-hidden="true" shape-rendering="crispEdges"><path d="M44 102v12h-3v16h4v16h-2v14" fill="none" stroke="#927184" stroke-width="1"/>${balloonPixelLayers(color).map(p=>`<path fill="${p.fill}" d="${p.d}"/>`).join('')}</svg>`).join('')+'</div>';
 return wheelArt(id);
}
function init(){
 const grid=document.querySelector('#games'),cards=new Map();
 for(const game of GAMES){
  const card=document.createElement('article');card.className='game-card '+(game.id==='vault'?'featured':'');card.dataset.game=game.id;card.dataset.category=game.category;card.setAttribute('aria-labelledby',game.id+'-title');
  card.innerHTML=`<div class="game-art art-${game.id}" aria-hidden="true">${art(game.id)}<i class="sparkle one"></i><i class="sparkle two"></i></div><div class="game-info"><p class="game-tag"></p><h2 id="${game.id}-title"></h2><p class="game-description"></p><p class="game-detail"></p></div><div class="game-bottom"><p class="saved-note"></p><div class="game-actions"><a class="button settings" target="_blank" rel="noopener">Edit saved settings</a><a class="button live" target="_blank" rel="noopener">Open live controls <span aria-hidden="true">↗</span></a></div></div>`;
  card.querySelector('h2').textContent=game.name;card.querySelector('.game-tag').textContent=game.tag;card.querySelector('.game-description').textContent=game.description;card.querySelector('.game-detail').textContent=game.detail;
  for(const [cls,label] of [['settings','Edit saved settings'],['live','Open live controls']])card.querySelector('.'+cls).setAttribute('aria-label',label+' for '+game.name+' (opens a new tab)');
  cards.set(game.id,card);grid.append(card);
 }
 function refresh(){
  for(const game of GAMES){
   let summary;try{summary=savedSummary({getItem:key=>localStorage.getItem(sharedStorageKey(key,readSharedConnection()))??localStorage.getItem(key)},game);}catch{summary={unavailable:true};}
   const card=cards.get(game.id),links=gameLinks(game,summary),note=card.querySelector('.saved-note');
   card.querySelector('a.settings').href=links.editor;card.querySelector('a.live').href=links.controls;
   note.textContent=summary.unavailable?'Open settings to check your saved versions.':summary.count?summary.count+' saved version'+(summary.count===1?'':'s')+' · '+summary.name:'Your first setup is ready to make yours.';
   note.title=note.textContent;
  }
 }
 for(const button of document.querySelectorAll('[data-filter]'))button.onclick=()=>{
  const filter=button.dataset.filter;for(const other of document.querySelectorAll('[data-filter]'))other.setAttribute('aria-pressed',String(other===button));
  let count=0;for(const game of GAMES){const card=cards.get(game.id);card.hidden=filter!=='all'&&filter!==game.category;if(!card.hidden)count++;}
  document.querySelector('#game-count').textContent=count+' games';
 };
 refresh();window.addEventListener('storage',refresh);window.addEventListener('focus',refresh);window.addEventListener('pageshow',refresh);
}
