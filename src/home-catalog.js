export const GAMES = [
 {id:'vault',name:'Crown Vault',category:'prizes',tag:'Birthday Bankroll',description:'Unlock the chambers. Build the bankroll. Finish with a royal reveal.',detail:'Cash · multipliers · bonus vaults',editor:'./vault.html',controls:'./vault-play.html',key:'faith-birthday-vault-v1'},
 {id:'gifts',name:'Presents',category:'prizes',tag:'Candy Confetti',description:'Pick a present and unwrap cash, multipliers and a bigger board.',detail:'One click per present',editor:'./gifts.html',controls:'./gift-play.html',key:'faith-gift-pile-v1'},
 {id:'darts',name:'Darts',category:'prizes',tag:'Balloons & classic',description:'Faith takes the shot. Balloons pop, bonuses land and the total climbs.',detail:'One click per dart',editor:'./darts.html',controls:'./play.html',key:'birthday-darts-library-v1'},
 {id:'pinata',name:'Piñata Party',category:'prizes',tag:'Birthday Royalty',description:'Swing for a sweet surprise, with cash and bonuses inside the crown.',detail:'One click per swing',editor:'./pinata.html',controls:'./pinata-play.html',key:'faith-pinata-party-v1'},
 {id:'brokie',name:'Brokie Wheel',category:'wheels',tag:'A little birthday mischief',description:'Three spins, gift picks and a little Double Damage.',detail:'15 equal slices · 3 spins',editor:'./brokie.html',controls:'./brokie.html?live=1',key:'faith-birthday-brokie-v1'},
 {id:'birthday-scam',name:'Birthday Scam Wheel',category:'wheels',tag:'A little extra',description:'Cake, candles, confetti… and ten very expensive birthday catches.',detail:'10 birthday games',editor:'../birthday-scam-wheel/?panel=settings',controls:'../birthday-scam-wheel/?controls=1',key:'birthday-saved-versions-v1',legacy:'birthday-config-v1'},
 {id:'scam',name:'Scam Wheel',category:'wheels',tag:'The original collection',description:'Two ordinary spins. Then the wheel has other plans.',detail:'25 originals + 3 demo ideas',editor:'../scam-wheel/?panel=settings',controls:'../scam-wheel/browser.html',key:'faith-scam-wheel/saved-versions/v1',legacy:'faith-scam-wheel/native/v1'}
];
// Reading the launcher must never initialize a game, advance a round or alter pairing.
export function savedSummary(storage,game){
 try{
  const text=storage.getItem(game.key);
  if(!text){
   const legacy=game.legacy&&(storage.getItem(game.legacy)||(game.id==='scam'&&storage.getItem('faith-scam-wheel/native/v1:/scam-wheel/scam.html')));
   return legacy?{count:1,name:'My saved settings'}:{count:0};
  }
  const data=JSON.parse(text),items=game.id==='brokie'?data.wheels?.map(w=>w.config):game.legacy?data.versions:data.widgets;
  if(!Array.isArray(items)||!items.length||items.some(w=>!w||typeof w.id!=='string'||typeof w.name!=='string'))return {unavailable:true};
  const selected=items.find(w=>w.id===(data.stream?.activeId??data.selected))??items[0];
  return {count:items.length,name:selected.name,id:game.legacy?undefined:selected.id};
 }catch{return {unavailable:true};}
}
export function gameLinks(game,summary){
 const editor=new URL(game.editor,'https://launcher.test/birthday-darts/');
 if(summary.id)editor.searchParams.set('id',summary.id);
 // Controls resume their own active saved version/round; the homepage does not select it.
 return {editor:game.editor.split('?')[0]+editor.search,controls:game.controls};
}
export function legacyDartsLink(href){
 const url=new URL(href);
 if(!url.searchParams.has('id')&&!new URLSearchParams(url.hash.slice(1)).has('demo')&&!new URLSearchParams(url.hash.slice(1)).has('game'))return null;
 return new URL('./darts.html'+url.search+url.hash,url).href;
}
