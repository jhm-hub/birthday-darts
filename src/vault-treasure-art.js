import {vaultFinalePiece} from './vault-finale-art.js';

// Whole-pixel shapes, shaded in the existing gold / rose / mint palette.
const leaf='<path d="M0 1H-4V-1H-8V-4H-12V-8H-15V-13H-17V-20H-11V-18H-7V-15H-4V-11H-1V-6H1V0Z" fill="#523047"/><path d="M-1 -1H-4V-3H-8V-6H-11V-9H-13V-14H-15V-18H-12V-16H-8V-13H-6V-9H-3V-5H-1Z" fill="#b87937"/><path d="M-3 -3H-6V-6H-9V-10H-12V-15H-14V-18H-12V-16H-8V-13H-6V-9H-3Z" fill="#f7cb70"/><path d="M-12 -16H-10V-13H-8V-10H-6V-7H-4V-5H-6V-8H-8V-11H-10V-14H-12Z" fill="#fff2bf"/>';
const jewel='<path d="M5 0H13V3H17V6H20V12H17V15H13V18H6V15H3V12H0V6H3V3H5Z" fill="#553255"/><path d="M6 2H12V4H16V7H18V11H15V14H12V16H7V13H4V11H2V7H5V4H6Z" fill="#8658a0"/><path d="M6 3H12V5H15V7H16V10H12V14H8V12H5V10H3V7H6Z" fill="#e99fd9"/><path d="M6 3H12V5H14V7H10V10H7V7H4V6H6Z" fill="#ffe0f3"/><path d="M10 9H14V11H11V14H8V12H10Z" fill="#be6fb4"/><path d="M7 4H10V6H7Z" fill="#fff8db"/>';
const mint=jewel.replaceAll('#8658a0','#367e91').replaceAll('#e99fd9','#6fd9c9').replaceAll('#ffe0f3','#ccffea').replaceAll('#be6fb4','#46a5ad');
export function vaultTreasureSpriteIndex(index,level){return level===1?(index%4===0?2:0):[1,4,2,3][index%4];}
export function vaultTreasureSprite(index,level){return vaultFinalePiece(vaultTreasureSpriteIndex(index,level));}
export function vaultTreasureDecor(){
 const leaves=[[78,260],[66,241],[57,214],[56,190],[62,169],[75,150],[95,136]];
 const gems=[[70,188],[86,145],[132,111],[210,91],[288,111],[334,145],[350,188]];
 return '<svg viewBox="0 0 420 460" shape-rendering="crispEdges" aria-hidden="true">'+
  '<g class="treasure-laurel-stem" fill="none" stroke="#5c3546" stroke-width="4"><path d="M93 274H78V260H66V241H57V214H56V190H62V169H75V150H95V136"/><path d="M327 274H342V260H354V241H363V214H364V190H358V169H345V150H325V136"/></g>'+
  '<g class="treasure-laurel-stem" fill="none" stroke="#f6cb72" stroke-width="2"><path d="M93 274H78V260H66V241H57V214H56V190H62V169H75V150H95V136"/><path d="M327 274H342V260H354V241H363V214H364V190H358V169H345V150H325V136"/></g>'+
  leaves.map(([x,y],i)=>[-1,1].map(side=>'<g class="treasure-laurel-leaf" data-step="'+i+'" data-x="'+(side===-1?x:420-x)+'" data-y="'+y+'" data-side="'+(side===-1?1:-1)+'" transform="translate('+(side===-1?x:420-x)+' '+y+') scale('+(side===-1?1.25:-1.25)+' 1.25)">'+leaf+'</g>').join('')).join('')+
  '<g class="treasure-jewel-arc" fill="none" stroke="#f3ca87" stroke-width="2"><path d="M70 188V165H86V145H108V125H132V111H174V97H210H246V111H288V125H312V145H334V165H350V188"/></g>'+
  gems.map(([x,y],i)=>'<g class="treasure-coronet-gem" data-step="'+i+'" data-x="'+x+'" data-y="'+y+'"><g transform="translate(-10 -9)">'+(i%2?mint:jewel)+'</g></g>').join('')+
  '<g class="treasure-coronet-star" transform="translate(198 59) scale(2)">'+vaultFinalePiece(2).replace(/^<svg[^>]*>|<\/svg>$/g,'')+'</g></svg>';
}
