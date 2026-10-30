import {CHAMBER_SLOTS,VAULT_ART} from './vault-layout.js';
const closed='./assets/vault/crown-v3-closed.png',opened='./assets/vault/crown-v3-open.png';
let serial=0;
const picture=(href,extra='')=>`<image href="${href}" width="1254" height="1254" ${extra}/>`;
function compartment(index,prefix){
 const s=CHAMBER_SLOTS[index%5],key=`${prefix}-${index}`,paired=index%5===4;
 const door=`<g clip-path="url(#${key}-shape)">${picture(closed)}<path class="door-shade" d="${s.path}" fill="#2d1538" opacity="0"/><path class="door-sheen" d="M-130 0H-75L230 1254H175Z" fill="#fff5ce" opacity="0"/></g>`;
 const edge=`<path d="${s.path}" fill="#a3654b" stroke="#ffe6a2" stroke-width="6"/>`;
 const lockX=[310,941,310,941,624][index%5],lockY=[475,475,851,851,599][index%5];
 return `<g class="vault-chamber" data-chamber="${index}">
 <defs><clipPath id="${key}-shape"><path d="${s.path}"/></clipPath>${paired?`<clipPath id="${key}-left"><rect width="624" height="1254"/></clipPath><clipPath id="${key}-right"><rect x="624" width="630" height="1254"/></clipPath>`:''}</defs>
 <path class="chamber-loot" d="${s.path}" fill="#24132e" opacity="0"/>
 <path class="chamber-radiance" d="${s.path}" fill="#fff0b1" opacity="0"/>
 <g clip-path="url(#${key}-shape)">
  <g class="chamber-edge-left" opacity="0">${paired?`<g clip-path="url(#${key}-left)">${edge}</g>`:edge}</g>
  ${paired?`<g class="chamber-edge-right" opacity="0"><g clip-path="url(#${key}-right)">${edge}</g></g>`:''}
  <g class="chamber-leaf-left">${paired?`<g clip-path="url(#${key}-left)">${door}</g>`:door}</g>
  ${paired?`<g class="chamber-leaf-right"><g clip-path="url(#${key}-right)">${door}</g></g>`:''}
 </g>
 <path class="chamber-attention" d="${s.path}" fill="#27152e" opacity="0"/>
 <g class="chamber-lock-glint" transform="translate(${lockX} ${lockY})" opacity="0"><path d="M-8 -31H8V-13H23V-6H32V6H13V23H6V31H-6V13H-24V6H-31V-6H-13V-24H-8Z" fill="#fff4c4"/></g>
 <path class="chamber-focus" d="${s.path}" fill="none" stroke="#fff0b1" stroke-width="6" opacity="0"/>
 <path class="chamber-spark" d="M${s.cx} ${s.cy-31}V${s.cy-7}M${s.cx-12} ${s.cy-19}H${s.cx+12}" stroke="#fff7d8" stroke-width="6" opacity="0"/>
 <g class="chamber-dormant" clip-path="url(#${key}-shape)"><path d="${s.path}" fill="#38203c" opacity=".62"/></g>
 <g class="chamber-number" transform="translate(${s.numberX} ${s.numberY})"><path d="M-21 -24H21V-18H27V18H21V24H-21V18H-27V-18H-21Z" fill="#43263f" stroke="#f6ce8d" stroke-width="4"/><text y="14" text-anchor="middle" fill="#fff0ba" font-family="Fredoka,sans-serif" font-size="43" font-weight="600">${index+1}</text></g>
 <text class="chamber-bonus-mark" x="${s.labelX}" y="${s.labelY-49}" text-anchor="middle"></text>
 <text class="chamber-award" x="${s.labelX}" y="${s.labelY}" text-anchor="middle"></text>
 </g>`;
}
export function vaultSVG(){
 const prefix=`crown-vault-${serial++}`;
 return `<svg viewBox="0 0 ${VAULT_ART.source} ${VAULT_ART.source}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
 ${picture(opened,'class="vault-fixed-frame"')}
 ${Array.from({length:4},(_,bank)=>`<g class="vault-bank" data-bank="${bank}">${Array.from({length:5},(_,i)=>compartment(bank*5+i,prefix)).join('')}</g>`).join('')}
 <g class="vault-rim-sparkles" aria-hidden="true">${[[250,303],[991,303],[93,666],[1155,666],[625,221],[623,1140]].map(([x,y])=>`<g class="rim-glint" transform="translate(${x} ${y})"><path d="M-4 -23H4V-8H15V-4H23V4H8V15H4V23H-4V8H-15V4H-23V-4H-8V-15H-4Z" fill="#fff7d9"/><path d="M-3 -10H3V10H-3ZM-10 -3H10V3H-10Z" fill="#fff"/></g>`).join('')}</g>
 </svg>`;
}
export function crownVaultCrest(){
 const id=`crown-crest-${serial++}`;
 return `<svg viewBox="464 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><clipPath id="${id}"><path d="M472 76L487 54L509 61L531 85L538 55L558 59L590 88L597 69L589 55L587 40L599 24L608 19L610 7L625 0L640 10L642 24L655 29L661 47L648 65L648 73L664 89L691 59L712 57L720 78L735 59L757 59L778 78L770 100L748 120L731 177V194H522V176L503 121L481 102Z"/></clipPath></defs>${picture(opened,`clip-path="url(#${id})"`)}</svg>`;
}
export function vaultLock(done=false){return `<svg viewBox="0 0 20 22" aria-hidden="true" shape-rendering="crispEdges"><path d="M3 10H17V12H19V20H17V22H3V20H1V12H3Z" fill="#422c48"/>${done?'<path d="M4 10V4H6V2H12V4H14V7H11V5H7V10Z" fill="#422c48"/><path d="M5 10V5H7V3H11V5H13V7H12V5H7V10Z" fill="#ffe4ab"/>':'<path d="M3 10V4H5V2H7V0H13V2H15V4H17V10H13V5H8V10Z" fill="#422c48"/><path d="M5 10V5H6V3H8V2H12V3H14V10H11V5H8V10Z" fill="#ffe4ab"/>'}<path d="M3 11H17V19H15V20H5V19H3Z" fill="currentColor"/><path d="M4 11H16V13H5V17H4Z" fill="#fff4cb"/>${done?'<path d="M6 14H8V16H10V14H12V12H14V15H12V17H10V19H8V17H6Z" fill="#386958"/>':'<path d="M8 14H12V17H11V19H9V17H8Z" fill="#644053"/>'}</svg>`;}

export function vaultHaloSVG(){return `<svg viewBox="0 0 170 110" aria-hidden="true" shape-rendering="crispEdges"><g fill="#ffe0a0"><path d="M14 48H30V51H14ZM20 70H36V73H20ZM37 19H40V34H37ZM130 19H133V34H130ZM140 48H156V51H140ZM134 70H150V73H134Z"/><path d="M43 43H46V49H52V52H46V58H43V52H37V49H43ZM124 43H127V49H133V52H127V58H124V52H118V49H124Z"/></g><path d="M83 5H87V14H93V18H87V25H83V18H77V14H83Z" fill="#ffd2e8"/></svg>`;}
