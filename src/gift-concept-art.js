import {giftSVG} from './gift-art.js';

export const ACTIVE_GIFT_CONCEPT='candy';

export const GIFT_CONCEPTS=[
 {id:'satin',letter:'A',name:'Satin Party',tag:'Saved alternative',description:'Soft pastel paper, a lower folded bow and a crisp lid. A quieter wrapper lets the satin ribbon do the work.'},
 {id:'velvet',letter:'B',name:'Royal Velvet',tag:'Saved alternative',description:'Plum, emerald and rose velvet, fine gold edging and a jewel clasp. More luxurious, with a compact silhouette.'},
 {id:'candy',letter:'C',name:'Candy Confetti',tag:'Current game style',description:'Candy-colored paper, playful sprinkles and a big cream bow. The boldest party look, still built from clean pixel clusters.'}
];
const royal=[
 ['#825299','#603878','#3b244e','#c794c9','#dab976','#fff0c0','#956842'],
 ['#408b7e','#2a645c','#1c423f','#8cc4a5','#dab976','#fff0c0','#956842'],
 ['#b26180','#88435f','#582b4b','#e6a4b5','#dab976','#fff0c0','#956842'],
 ['#606ea9','#444f86','#2c325e','#a2aedf','#dab976','#fff0c0','#956842'],
 ['#a67c57','#7c5945','#503c3a','#d9b082','#dab976','#fff0c0','#956842']
];
const candy=[
 ['#f6a1cd','#d976b0','#914f87','#ffdaed','#fff0b2','#fffbe2','#cda874'],
 ['#9de2d6','#60bdae','#377d86','#ddfff0','#fff0b2','#fffbe2','#cda874'],
 ['#baaff3','#9483d1','#615691','#eee0ff','#fff0b2','#fffbe2','#cda874'],
 ['#f3c693','#da9f7c','#a5666c','#fff0c5','#fff0b2','#fffbe2','#cda874'],
 ['#9cd2ed','#6aa9cf','#486d9d','#d7f5ff','#fff0b2','#fffbe2','#cda874']
];

// All three directions remain available for review. The shared game renderer
// uses ACTIVE_GIFT_CONCEPT; previewing a different concept never changes it.
export function activeGiftSVG(index=0){return giftConceptSVG(ACTIVE_GIFT_CONCEPT,index);}

export function giftConceptSVG(concept,index=0){
 const opts={};
 if(concept==='satin'){
  opts.pattern='<path d="M12 40h2v2h-2ZM30 49h2v2h-2ZM12 52h2v2h-2Z" fill="#fff3dc" opacity=".65"/>';
  opts.bow=`<path d="M27 24H19V22H11V20H7V12H11V10H19V12H23V16H29V14H33V10H39V8H47V10H51V18H47V20H39V22H35V26H27Z" fill="#342233"/>
  <path d="M27 21H19V19H11V17H9V13H13V12H17V14H21V18H27ZM33 20V16H35V12H41V10H47V12H49V16H45V18H39V20Z" fill="#efd09b"/>
  <path d="M11 13H17V15H21V17H17V16H13V15H11ZM37 13H41V11H47V13H43V15H39V17H35V15H37Z" fill="#fff0cb"/>
  <path d="M13 16H17V18H23V20H27V22H19V20H13ZM37 18H43V16H47V14H49V17H45V19H39V21H35V20H37Z" fill="#b98a65"/>
  <path d="M27 23H31V27H27V31H23V29H21V27H25V25H27ZM33 23H37V25H39V29H35V27H33Z" fill="#d7af7e"/>
  <path d="M27 19H35V25H27Z" fill="#b98a65"/><path d="M28 20H34V23H28Z" fill="#efd09b"/><path d="M29 20H33V21H29Z" fill="#fff0cb"/>`;
  // Same gold ribbon throughout, while keeping all five approved paper colors.
  const paper=[['#bc99dc','#a783c8','#654b88','#ebd2f3'],['#a7dcc2','#80bba9','#4f8d87','#d8f0d5'],['#eea0bc','#c7769d','#864f78','#ffd6e3'],['#a6c3e5','#7f9cc6','#485e8e','#d9e6ff'],['#edc88f','#cfa16e','#8a6557','#ffe8b8']][index%5];
  opts.colors=[...paper,'#efd09b','#fff0cb','#b98a65'];
 }else if(concept==='velvet'){
  opts.colors=royal[index%5];
  opts.pattern='<path d="M12 42h2v2h2v2h-2v2h-2v-2h-2v-2h2ZM30 48h2v2h2v2h-2v2h-2v-2h-2v-2h2Z" fill="#dcb875" opacity=".7"/>';
  opts.trim='<path d="M8 37h1v19h25v1H8ZM40 34h1v17l6-3v1l-7 4Z" fill="#dab976"/>';
  opts.bow=`<path d="M27 24H17V22H11V14H15V12H21V14H27V18H33V14H37V10H45V12H49V18H45V20H39V24H35V27H27Z" fill="#342233"/>
  <path d="M26 22H18V20H13V15H17V14H21V16H25V19H28ZM34 21V17H38V13H43V12H46V14H47V17H43V18H39V21Z" fill="#dab976"/>
  <path d="M16 15H20V17H24V19H20V18H16ZM39 14H43V13H45V15H41V17H37V19H35V17H39Z" fill="#fff0c0"/>
  <path d="M18 18H22V20H28V22H20V20H18ZM39 18H43V16H46V18H43V20H37V22H35V20H39Z" fill="#956842"/>
  <path d="M27 23H31V28H27V30H24V27H27ZM34 23H37V29H35V27H33Z" fill="#dab976"/>
  <path d="M27 17H35V19H37V25H35V27H27V25H25V19H27Z" fill="#4c303e"/>
  <path d="M28 18H34V20H36V24H34V26H28V24H26V20H28Z" fill="#eac985"/>
  <path d="M29 20H33V21H34V23H33V24H29V23H28V21H29Z" fill="#ce79b4"/><path d="M29 20H32V21H29Z" fill="#ffe3ef"/>`;
 }else if(concept==='candy'){
  opts.colors=candy[index%5];
  opts.pattern='<path d="M11 38h2v4h-2ZM30 49h3v2h-3Z" fill="#ffeaa8"/><path d="M30 39h2v3h-2ZM11 50h3v2h-3Z" fill="#fff3fb"/><path d="M16 46h2v3h-2ZM31 55h2v2h-2Z" fill="#8b70bb"/>';
  opts.bow=`<path d="M27 24H19V22H9V20H5V10H9V6H17V8H23V12H27V16H33V12H37V6H41V4H49V8H53V16H49V20H41V22H35V26H27Z" fill="#342233"/>
  <path d="M27 22H19V20H11V18H7V11H11V8H17V10H21V14H25V18H29ZM33 22V16H37V12H39V8H43V6H47V10H51V15H47V18H41V20H37V22Z" fill="#fff0b2"/>
  <path d="M10 11H14V10H17V12H21V15H17V13H13V14H10ZM40 11H43V8H46V11H48V13H44V16H39V18H37V15H40Z" fill="#fffbe2"/>
  <path d="M13 16H17V18H23V20H27V22H19V20H13ZM41 17H45V15H49V17H45V19H39V21H35V20H39V19H41Z" fill="#cda874"/>
  <path d="M27 23H31V28H27V32H23V29H21V27H25V25H27ZM33 23H37V27H41V31H37V29H33Z" fill="#fff0b2"/>
  <path d="M27 18H35V25H27Z" fill="#cda874"/><path d="M28 19H34V23H28Z" fill="#fff0b2"/><path d="M29 19H32V21H29Z" fill="#fffbe2"/>`;
 }
 return giftSVG(index,opts);
}
