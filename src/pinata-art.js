// Birthday Royalty: the selected concept is used unchanged, with transparent
// SVG windows for rope, fringe/tassels and the existing animated break halves.
// Keep the versioned source PNG intact so the approved art is recoverable.
import {damageArt} from './pinata-damage.js';
export function crownPinata(id){
 const source='./assets/pinata/birthday-royalty-v4.png';
 const split='M70 30V76H66V88H73V101H68V115H74V128H69V143H72V184';
 return `<svg viewBox="0 0 140 184" shape-rendering="crispEdges" aria-hidden="true"><defs>
 <image id="${id}-royalty" href="${source}" x="-8" y="15" width="156" height="156"/>
 <mask id="${id}-paper-silhouette" maskUnits="userSpaceOnUse" x="-8" y="15" width="156" height="156" style="mask-type:alpha"><use href="#${id}-royalty"/></mask>
 <clipPath id="${id}-rope-window"><path d="M-8 15H148V30H-8Z"/></clipPath>
 <clipPath id="${id}-fringe-window"><path d="M-8 30H148V145H-8Z"/></clipPath>
 <clipPath id="${id}-tassel-window"><path d="M-8 145H148V184H-8Z"/></clipPath>
 <clipPath id="${id}-left"><path d="M-12 0H70V76H66V88H73V101H68V115H74V128H69V143H72V190H-12Z"/></clipPath>
 <clipPath id="${id}-right"><path d="M70 0H152V190H72V143H69V128H74V115H68V101H73V88H66V76H70Z"/></clipPath>
 <g id="${id}-body"><use href="#${id}-royalty" clip-path="url(#${id}-fringe-window)"/><g class="pina-tassels"><use href="#${id}-royalty" clip-path="url(#${id}-tassel-window)"/></g><g mask="url(#${id}-paper-silhouette)">${damageArt()}</g></g>
 </defs>
 <g class="pina-rope"><path d="M68 0h4v17h-4z" fill="#67412d"/><path d="M69 0h2v17h-2z" fill="#edc681"/><path d="M68 3h3v1h-3zM68 8h3v1h-3zM68 13h3v1h-3z" fill="#fff0b2"/><use href="#${id}-royalty" clip-path="url(#${id}-rope-window)"/></g>
 <g class="pina-paper"><g class="pina-half left"><use href="#${id}-body" clip-path="url(#${id}-left)"/></g><g class="pina-half right"><use href="#${id}-body" clip-path="url(#${id}-right)"/></g>
 <path class="pina-seam" d="${split}" fill="none" stroke="#fff2c9" stroke-width="2.5"/>
 <path class="pina-gleam" d="M31 103v4h-4v2h4v4h2v-4h4v-2h-4v-4zM76 105v3h-3v2h3v3h2v-3h3v-2h-3v-3z" fill="#fff7da"/>
 </g></svg>`;
}

// Companion art shares the approved crown's paper texture, gold trim and gems.
export const pinataBat=()=>`<svg viewBox="0 0 2172 724" aria-hidden="true"><image href="./assets/pinata/royalty-bat-v5.png" width="2172" height="724"/></svg>`;
export const littleCrown=()=>`<svg viewBox="60 152 1140 1090" aria-hidden="true"><image href="./assets/pinata/birthday-royalty-v4.png" width="1254" height="1254"/></svg>`;

// Separate transparent windows keep each sprite's silhouette intact; the candy
// wrapper is deliberately wider than the heart, star and mint sweet.
const candyWindows=['35 105 645 490','685 110 520 485','70 625 540 535','680 640 530 530'];
export const candySprite=index=>`<svg viewBox="${candyWindows[index%4]}" aria-hidden="true"><image href="./assets/pinata/royalty-candy-v5.png" width="1254" height="1254"/></svg>`;
export const bonusArt=()=>`<div class="pina-bonus-orbit">${Array.from({length:4},()=>`<i>${sparkleSprite()}</i>`).join('')}</div><div class="pina-bonus-gem">${candySprite(1)}</div><div class="pina-bonus-encore">${candySprite(3)}<span>${pinataBat()}</span></div>`;
export const sparkleSprite=()=>`<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true"><path d="M10 0h4v6h4v4h6v4h-6v4h-4v6h-4v-6H6v-4H0v-4h6V6h4z" fill="#713e57"/><path d="M11 2h2v6h3v3h6v2h-6v3h-3v6h-2v-6H8v-3H2v-2h6V8h3z" fill="#e4ab54"/><path d="M11 2h2v8h-3v3H2v-2h6V8h3z" fill="#fff3c4"/><path d="M11 9h3v5h-5v-3h2z" fill="#fffbe4"/><path d="M14 14h3v2h-3v5h-2v-7z" fill="#b47849"/></svg>`;
export const impactSprite=()=>`<svg viewBox="0 0 64 64" shape-rendering="crispEdges" aria-hidden="true"><path d="M29 1h5v17h8v-8h6v13h15v7H46v8h9v6H40v18h-7V45h-9v11h-6V40H2v-7h17v-9H9v-6h16V5h4z" fill="#ad6190"/><path d="M30 6h3v16h10v-7h2v11h13v3H42v11h9v2H37v15h-3V41H22v9h-2V37H7v-3h16V22H15v-2h14V9h1z" fill="#efbf6e"/><path d="M30 7h3v19h10v4H33v11h-4V30H13v-3h16V14h1z" fill="#fff2bb"/><path d="M27 25h9v10h-10v-8h1z" fill="#fff9e9"/><path d="M17 3h3v4h-3zM53 16h3v3h-3zM51 49h3v3h-3zM8 47h3v3H8z" fill="#d8b7fa"/></svg>`;
export function swingTrail(){
 const ribbon=(width,offset=0)=>{
  const edge=side=>Array.from({length:49},(_,i)=>{const t=i/48,x=58+12*t+130*t*t,y=8+173*t-65*t*t,dx=12+260*t,dy=173-130*t,n=Math.hypot(dx,dy),w=(offset+side*width*(.4+.6*t));return [Math.round((x-dy/n*w)/2)*2,Math.round((y+dx/n*w)/2)*2].join(',');});
  return edge(1).concat(edge(-1).reverse()).join(' ');
 };
 return `<svg viewBox="0 0 220 170" shape-rendering="crispEdges" aria-hidden="true"><polygon points="${ribbon(5)}" fill="#d879a2" opacity=".55"/><polygon points="${ribbon(2.5,-1)}" fill="#edc77c"/><polygon points="${ribbon(.8,-2)}" fill="#fff3ce"/><path d="M47 26h2v2h-2zM76 87h3v3h-3zM132 118h2v2h-2z" fill="#b4e8d9"/></svg>`;
}
