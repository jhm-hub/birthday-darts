// Cosmetic randomness is derived from the saved round, independently of prize
// selection. Every display and reload sees the same five approved wrappers.
function random(seed){
 let h=2166136261;for(const c of seed)h=Math.imul(h^c.charCodeAt(0),16777619);
 return ()=>{h+=0x6D2B79F5;let t=Math.imul(h^h>>>15,1|h);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};
}
function shuffle(a,rng){for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const cache=new WeakMap();
export function giftColorIndex(round,row,col){
 if(!round?.colorSeed)return (row*3+col)%5;
 let colors=cache.get(round);
 if(!colors){
  colors=new Map();const rng=random(round.colorSeed),side=round.preset.side;
  const fill=cells=>{const palette=shuffle([0,1,2,3,4],rng),bag=shuffle(cells.map((_,i)=>palette[i%5]),rng);cells.forEach((cell,i)=>colors.set(cell,bag[i]));};
  fill(Array.from({length:side*side},(_,i)=>Math.floor(i/side)+':'+i%side));
  // Build outer rings in advance. Adding a row/column never recolors old gifts.
  for(let n=side;n<round.preset.maxSide;n++){
   const cells=[];for(let r=0;r<=n;r++)for(let c=0;c<=n;c++)if(r===n||c===n)cells.push(r+':'+c);fill(cells);
  }
  cache.set(round,colors);
 }
 return colors.get(row+':'+col)??(row*3+col)%5;
}
