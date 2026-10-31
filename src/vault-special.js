import {chamberPoint,ease} from './vault-motion.js';
import {vaultChamberLinks,VAULT_WING_LEAD_MS} from './vault-chamber-handoff.js';
import {VAULT_ART} from './vault-layout.js';

export const VAULT_SPECIALS=[
 {key:'rose',name:'ROSE JEWEL',asset:'./assets/vault/bonus-rose-v17.png',light:'#ffd2e8'},
 {key:'candy',name:'CANDY TREASURY',asset:'./assets/vault/bonus-candy-v17.png',light:'#c3ffe8'},
 {key:'moon',name:'MOONLIT CROWN',asset:'./assets/vault/bonus-moon-v17.png',light:'#dfd3ff'}
];
export const VAULT_SPECIAL_ARRIVE_MS=360;
export const VAULT_SPECIAL_POINT={x:VAULT_ART.x+443/887*VAULT_ART.size,y:VAULT_ART.y+465/887*VAULT_ART.size};
// A saved round id selects the first skin. Rotation uses no prize RNG and
// survives reconnects without adding anything to the saved game schema.
export function vaultSpecialTheme(round,index){
 if(!round||index<round.preset.chambers)return null;
 let seed=0;for(const char of round.id)seed=(seed*31+char.charCodeAt(0))>>>0;
 const theme=(seed%3+index-round.preset.chambers)%3;
 return {...VAULT_SPECIALS[theme],theme,index};
}
export function vaultRewardPoint(round,index){return vaultSpecialTheme(round,index)?{...VAULT_SPECIAL_POINT}:chamberPoint(index);}
export function vaultSpecialScene(round,time,quiet=false){
 const shots=round?[...round.opened,...(round.flight?[round.flight]:[])].filter(s=>s.startAt<=time):[];
 const event=shots.at(-1),link=vaultChamberLinks(round,time).filter(l=>time>=l.from.finishAt-VAULT_WING_LEAD_MS).at(-1);
 const index=Math.max(event?.index??0,link?.index??0),current=vaultSpecialTheme(round,index);
 if(!current)return {current:null,previous:null,blend:1,shot:null,previousShot:null};
 const previousShot=shots.find(s=>s.index===index-1),at=previousShot?.finishAt;
 const blend=at===undefined?1:quiet?Number(time>=at):ease((time-at+VAULT_WING_LEAD_MS)/VAULT_SPECIAL_ARRIVE_MS);
 return {current,previous:vaultSpecialTheme(round,index-1),blend,shot:shots.find(s=>s.index===index)??null,previousShot};
}

// Both leaves are cropped from the unchanged closed artwork. The frame and
// open interior never move; clipped hinges cannot protrude into the border.
export function vaultSpecialDoors(open){
 const angle=Math.max(0,Math.min(1,open))*Math.PI*.485,scale=Math.cos(angle),skew=Math.sin(angle)*.05;
 return {left:`translate(133 465) matrix(${scale} ${skew} 0 1 0 0) translate(-133 -465)`,right:`translate(753 465) matrix(${scale} ${-skew} 0 1 0 0) translate(-753 -465)`};
}
export function vaultSpecialSVG(prefix){
 return VAULT_SPECIALS.map((theme,i)=>{
  const key=`${prefix}-special-${i}`,pic=()=>`<image href="${theme.asset}" width="1774" height="887"/>`,shape='<ellipse cx="443" cy="465" rx="310" ry="274"/>';
  return `<g class="vault-special" data-theme="${i}" opacity="0" display="none"><svg width="1254" height="1254" viewBox="0 0 887 887" overflow="hidden">
   <defs><clipPath id="${key}-aperture">${shape}</clipPath><clipPath id="${key}-left"><rect width="443" height="887"/></clipPath><clipPath id="${key}-right"><rect x="443" width="444" height="887"/></clipPath></defs>
   ${pic()}<g clip-path="url(#${key}-aperture)"><g transform="translate(-887 0)">${pic()}</g>
    ${['left','right'].map(side=>`<g class="special-leaf-${side}"><g clip-path="url(#${key}-${side})"><g clip-path="url(#${key}-aperture)">${pic()}<rect class="special-shade" width="887" height="887" fill="#281831" opacity="0"/></g></g></g>`).join('')}
   </g>
   <ellipse class="special-focus" cx="443" cy="465" rx="311" ry="275" fill="none" stroke="${theme.light}" stroke-width="5" opacity="0"/>
   <g class="special-lock" transform="translate(443 465)" opacity="0"><path d="M-5 -25H5V-8H16V-4H25V5H8V16H4V25H-5V8H-16V4H-25V-5H-8V-16H-5Z" fill="#fff8d8"/></g>
  </svg></g>`;
 }).join('');
}
