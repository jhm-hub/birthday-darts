// Birthday Royalty: the selected concept is used unchanged, with transparent
// SVG windows for rope, fringe/tassels and the existing animated break halves.
// Keep the versioned source PNG intact so the approved art is recoverable.
export function crownPinata(id){
 const source='./assets/pinata/birthday-royalty-v4.png';
 const split='M70 30V76H66V88H73V101H68V115H74V128H69V143H72V184';
 return `<svg viewBox="0 0 140 184" shape-rendering="crispEdges" aria-hidden="true"><defs>
 <image id="${id}-royalty" href="${source}" x="-8" y="15" width="156" height="156"/>
 <clipPath id="${id}-rope-window"><path d="M-8 15H148V30H-8Z"/></clipPath>
 <clipPath id="${id}-fringe-window"><path d="M-8 30H148V145H-8Z"/></clipPath>
 <clipPath id="${id}-tassel-window"><path d="M-8 145H148V184H-8Z"/></clipPath>
 <clipPath id="${id}-left"><path d="M-12 0H70V76H66V88H73V101H68V115H74V128H69V143H72V190H-12Z"/></clipPath>
 <clipPath id="${id}-right"><path d="M70 0H152V190H72V143H69V128H74V115H68V101H73V88H66V76H70Z"/></clipPath>
 <g id="${id}-body"><use href="#${id}-royalty" clip-path="url(#${id}-fringe-window)"/><g class="pina-tassels"><use href="#${id}-royalty" clip-path="url(#${id}-tassel-window)"/></g></g>
 </defs>
 <g class="pina-rope"><path d="M68 0h4v17h-4z" fill="#67412d"/><path d="M69 0h2v17h-2z" fill="#edc681"/><path d="M68 3h3v1h-3zM68 8h3v1h-3zM68 13h3v1h-3z" fill="#fff0b2"/><use href="#${id}-royalty" clip-path="url(#${id}-rope-window)"/></g>
 <g class="pina-paper"><g class="pina-half left"><use href="#${id}-body" clip-path="url(#${id}-left)"/></g><g class="pina-half right"><use href="#${id}-body" clip-path="url(#${id}-right)"/></g>
 <path class="pina-seam" d="${split}" fill="none" stroke="#fff2c9" stroke-width="2.5"/>
 <path class="pina-crack one" d="M27 81h5v8h7v7h-4v7h8v7" fill="none" stroke="#62304e" stroke-width="1.6"/>
 <path class="pina-crack two" d="M110 83h-6v10h-7v8h6v7h-9v5M45 131h9v7h8" fill="none" stroke="#62304e" stroke-width="1.6"/>
 <path class="pina-gleam" d="M31 103v4h-4v2h4v4h2v-4h4v-2h-4v-4zM76 105v3h-3v2h3v3h2v-3h3v-2h-3v-3z" fill="#fff7da"/>
 </g></svg>`;
}

export const pinataBat=()=>`<svg viewBox="0 0 158 48" shape-rendering="crispEdges" aria-hidden="true"><path d="M6 20H60V15H80V10H144V14H152V32H144V36H80V31H60V26H6Z" fill="#47283f"/><path d="M10 22H64V18H82V14H142V18H148V28H142V32H82V28H64V24H10Z" fill="#eea0c5"/><path d="M80 18h66v4H80z" fill="#f6b8d5"/><path d="M84 23h62v4H84z" fill="#d97aab"/><path d="M12 22H62V24H12ZM84 14H140V18H84Z" fill="#ffe7ef"/><path d="M82 28H142V32H82ZM94 18H100V28H94ZM122 18H128V28H122Z" fill="#b85f96"/><path d="M22 20H28V28H22ZM34 20H40V28H34ZM46 20H52V28H46Z" fill="#d9ba7b"/><path d="M108 16v4h-4v4h4v4h4v-4h4v-4h-4v-4z" fill="#5b3853"/><path d="M108 18h3v3h3v2h-3v3h-3v-3h-2v-2h2z" fill="#ffe7a4"/><path d="M64 30v8h6v5h8v-6h-5v-8" fill="none" stroke="#9de1cc" stroke-width="3"/></svg>`;
export const littleCrown=()=>`<svg viewBox="0 0 30 24" shape-rendering="crispEdges" aria-hidden="true"><path d="M2 4h4v4h4V2h4v4h4V2h4v6h4V4h3v17H2z" fill="#40243d"/><path d="M4 8h4v4h4V6h2v4h5V6h2v6h5V8h1v11H4z" fill="#f0bf70"/><path d="M4 16h23v3H4zM12 6h2v4h-2z" fill="#fff2c1"/><path d="M14 12h4v4h-4z" fill="#c6a1ed"/></svg>`;

const candyColors=[['#fff0ad','#eaba63','#9b614d'],['#ffe2ee','#ed8aba','#a34c7c'],['#e4fff0','#86d7c0','#4b927e'],['#f0e3ff','#b794e4','#77539d'],['#e3f7ff','#91cee8','#4a86a7']];
export function candySprite(index){
 const [light,mid,dark]=candyColors[index%5],type=index%4;
 const shapes=type===0?`<path d="M0 3h3v2h2V3h8v2h2V3h3v8h-3V9h-2v2H5V9H3v2H0z" fill="#513344"/><path d="M1 5h2v4H1zM15 5h2v4h-2zM5 4h8v6H5z" fill="${mid}"/><path d="M5 4h7v2H5zM1 5h1v2H1zM15 5h1v2h-1z" fill="${light}"/><path d="M11 6h2v4h-2zM6 9h5v1H6z" fill="${dark}"/>`:
 type===1?`<path d="M4 1h8v2h2v8h-2v2H4v-2H2V3h2z" fill="#513344"/><path d="M4 3h8v8H4z" fill="${mid}"/><path d="M4 3h7v2H6v2H4z" fill="${light}"/><path d="M10 7h2v4H6V9h4z" fill="${dark}"/><path d="M7 6h3v2H7z" fill="${light}"/>`:
 type===2?`<path d="M6 0h4v4h5v4h-3v5H4V8H1V4h5z" fill="#513344"/><path d="M7 2h2v4h4v1h-3v4H6V7H3V6h4z" fill="${mid}"/><path d="M7 2h2v4H7zM3 6h4v1H3z" fill="${light}"/><path d="M8 8h2v3H6V9h2z" fill="${dark}"/>`:
 `<path d="M3 1h4v2h2V1h4v2h2v6h-2v2h-2v2H7v-2H5V9H3V7H1V3h2z" fill="#513344"/><path d="M3 3h4v2h2V3h4v5h-2v2H9v1H7V9H5V7H3z" fill="${mid}"/><path d="M3 3h3v2H4v2H3z" fill="${light}"/><path d="M11 5h2v3h-2v2H9v1H7V9h2V7h2z" fill="${dark}"/>`;
 return `<svg viewBox="0 0 18 14" shape-rendering="crispEdges" aria-hidden="true">${shapes}</svg>`;
}
export const swingTrail=()=>`<svg viewBox="0 0 220 170" shape-rendering="crispEdges" aria-hidden="true"><path d="M48 8h12v18h8v18h13v17h15v16h19v12h23v9h23v8h25v7h20v7h-36v-6h-29v-8h-27V96H93V82H76V64H63V45H54V26h-6z" fill="#f1aad0" opacity=".8"/><path d="M61 6h5v19h8v18h12v16h15v15h19v13h21v7h24v6h22v4h-24v-3h-25v-7h-21V83H97V69H81V51H70V32h-9z" fill="#fff7e6"/></svg>`;
