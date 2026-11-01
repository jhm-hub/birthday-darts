// Small stepped silhouettes, shaded with the crown's gold, rose and mint.
// These are ornaments around the original crest, never a replacement for it.
export function royalCoin(){return `<svg viewBox="0 0 20 20" shape-rendering="crispEdges" aria-hidden="true"><path d="M6 0h8v2h4v4h2v8h-2v4h-4v2H6v-2H2v-4H0V6h2V2h4z" fill="#63314b"/><path d="M6 2h8v2h3v3h1v6h-1v3h-3v2H6v-2H3v-3H2V7h1V4h3z" fill="#d99848"/><path d="M6 2h8v2H6v2H4v8H2V7h1V4h3z" fill="#fff0b8"/><path d="M7 5h6v2h2v6h-2v2H7v-2H5V7h2z" fill="#f4c771"/><path d="M9 6h2v3h3v2h-3v3H9v-3H6V9h3z" fill="#fff2c3"/><path d="M14 7h1v6h-2v2H7v-1h5v-2h2z" fill="#b66b40"/><path d="M6 3h3v1H6zM3 6h1v3H3z" fill="#fffbe3"/></svg>`;}
export function royalJewel(i=0){const colors=i%3===0?['#f6d8ff','#bf89dc','#79519d']:i%3===1?['#dbfff0','#88d2b6','#428b82']:['#ffe2ef','#e89cbd','#ad5d8b'];return `<svg viewBox="0 0 20 24" shape-rendering="crispEdges" aria-hidden="true"><path d="M7 0h6v3h4v4h3v10h-3v4h-4v3H7v-3H3v-4H0V7h3V3h4z" fill="#613748"/><path d="M7 2h6v3h3v3h2v8h-2v3h-3v3H7v-3H4v-3H2V8h2V5h3z" fill="#e6b66f"/><path d="M8 4h4v3h3v3h1v5h-3v4h-1v1H8v-3H5v-3H4v-4h3V7h1z" fill="${colors[1]}"/><path d="M8 4h4v3H9v3H6v4H4v-4h3V7h1z" fill="${colors[0]}"/><path d="M12 7h3v3h1v5h-3v4h-1v1H8v-3h3v-3h2v-4h-1z" fill="${colors[2]}"/><path d="M8 9h4v5H8z" fill="${colors[0]}"/><path d="M8 5h2v2H8zM5 9h2v2H5z" fill="#fff9e5"/><path d="M8 2h4v1H8zM3 8h1v5H3z" fill="#fff0c3"/></svg>`;}

// A pointed, stepped gold leaf reads as a laurel even at overlay scale.
export function royalLeaf(){return `<svg viewBox="0 0 20 20" shape-rendering="crispEdges" aria-hidden="true"><path d="M2 0h6v2h5v2h3v3h2v5h-2v4h-3v2H9v2H7v-4H5v-3H3V8H1V3h1z" fill="#63314b"/><path d="M3 2h4v2h5v2h3v2h1v4h-2v3h-3v2H9v-3H6v-3H4V7H3z" fill="#d39142"/><path d="M3 2h4v2h5v2h3v2h1v2h-3V8H9V6H6V4H3z" fill="#fff1bd"/><path d="M4 5h3v2h4v2h3v3h-2v3H9v-3H6V9H4z" fill="#f3c568"/><path d="M5 4h2v3h2v3h2v4h2v2h-2v-2H9v-3H7V8H5z" fill="#fff4ce"/><path d="M14 10h2v2h-2v3h-3v2H9v-2h2v-3h3z" fill="#ae643d"/><path d="M8 16h2v3H8z" fill="#dfac5d"/></svg>`;}

// Tiny folded paper, curled ribbon, stars and wrapped candy share the crown's
// stepped highlights. Mirrored pairs vary their colors without looking uniform.
export function grandConfetti(i){
 const pair=Math.floor(i/2),[light,body,shade]=[
  ['#ffe6f2','#ff9ecb','#bf5d90'],['#e6fff3','#9ce7ce','#4f9d91'],
  ['#fff6c5','#ffd477','#ba7c49'],['#f5e5ff','#cea5f2','#8b61b3']
 ][(pair+Math.floor(pair/4))%4],kind=pair%6;
 const paths=kind===0||kind===4?
  `<path d="M3 1h9v3h4v6h-4v3H8v3h6v3H5v-3H2v-6h4V7h6V5H3z" fill="${shade}"/><path d="M3 1h9v3h4v4h-4v3H6v5h8v2H5v-3H3v-4h4V7h6V4H3z" fill="${body}"/><path d="M3 1h9v2H3zM7 8h5v2H7zM5 15h6v2H5z" fill="${light}"/>`:
  kind===2?`<path d="M8 1h4v4h3v3h4v4h-4v3h-3v4H8v-4H5v-3H1V8h4V5h3z" fill="${shade}"/><path d="M8 2h3v5h5v3h-5v6H8v-6H3V8h5z" fill="${body}"/><path d="M8 2h3v5H8zM3 8h5v2H3z" fill="${light}"/>`:
  kind===5?`<path d="M1 5h3v2h3V4h6v3h3V5h3v10h-3v-2h-3v3H7v-3H4v2H1z" fill="${shade}"/><path d="M2 7h3v5H2zM15 8h3v5h-3zM7 5h6v9H7z" fill="${body}"/><path d="M7 5h6v2H9v5H7zM2 7h3v2H2z" fill="${light}"/>`:
  `<path d="M3 2h14v13h-4v3H3z" fill="${shade}"/><path d="M3 2h14v11h-5v3H3z" fill="${body}"/><path d="M3 2h14v3H6v11H3z" fill="${light}"/><path d="M12 13h5l-5 3z" fill="${light}"/>`;
 return `<svg viewBox="0 0 20 20" shape-rendering="crispEdges" aria-hidden="true">${paths}</svg>`;
}
