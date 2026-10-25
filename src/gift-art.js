// One consistent 2:1 depth direction for the lid, box and ribbon. The two-pixel
// overhang and darker seam separate the lid without making it look detached.
const palettes=[
 ['#bc99dc','#a783c8','#654b88','#ebd2f3','#f1c984','#fff0c7','#b77d54'],
 ['#a7dcc2','#80bba9','#4f8d87','#d8f0d5','#efa1bc','#ffe0de','#be7099'],
 ['#eea0bc','#c7769d','#864f78','#ffd6e3','#ffe0a0','#fff0cd','#b88959'],
 ['#a6c3e5','#7f9cc6','#485e8e','#d9e6ff','#c8afea','#f0defa','#8e6eae'],
 ['#edc88f','#cfa16e','#8a6557','#ffe8b8','#c47fa7','#f2bad3','#814666']
];
export function giftSVG(index=0){
 const [light,base,shade,shine,ribbon,ribbonLight,ribbonShade]=palettes[index%palettes.length];
 const stars=[[12,39],[31,45],[12,51]].map(([x,y])=>`<path d="M${x} ${y-2}h1v2h2v1h-2v2h-1v-2h-2v-1h2Z" fill="${shine}"/>`).join('');
 return `<svg viewBox="0 0 56 64" aria-hidden="true" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
 <path d="M6 60H46V58H52V62H46V64H6V62H2V60Z" fill="#160c23" opacity=".25"/>
 <g class="parcel-body"><path d="M4 28L18 21H52V54L38 61H4Z" fill="#342233"/>
 <path d="M6 30H36V59H6Z" fill="${base}"/><path d="M8 32H36V56H8Z" fill="${light}"/>
 <path d="M38 30L50 24V53L38 59Z" fill="${shade}"/>
 <path d="M40 31L48 27V50L40 54Z" fill="${base}"/>
 <path d="M6 36H8V55H6ZM8 57H34V59H8Z" fill="${shine}" opacity=".7"/>
 <path d="M6 32H36V36H6Z" fill="${shade}"/>${stars}
 <path class="parcel-band" d="M20 30H28V59H20Z" fill="${ribbonShade}"/><path class="parcel-band" d="M20 32H26V57H20Z" fill="${ribbon}"/><path class="parcel-band" d="M21 36H23V55H21Z" fill="${ribbonLight}"/>
 <path class="parcel-inside" d="M6 29L18 23H48L36 29Z" fill="${shade}"/>
 <path class="parcel-inside" d="M10 28L18 24H44L36 28Z" fill="#211429"/>
 <path class="parcel-inside" d="M6 29H36V31H6Z" fill="${shine}"/>
 </g><g class="parcel-lid">
 <path d="M0 26L16 18H54V28L38 36H0Z" fill="#342233"/>
 <path d="M4 26L16 20H50L38 26Z" fill="${shine}"/>
 <path d="M2 28H36V34H2Z" fill="${light}"/><path d="M2 32H36V34H2Z" fill="${base}"/>
 <path d="M38 28L52 21V27L38 34Z" fill="${shade}"/><path d="M40 28L50 23V25L40 30Z" fill="${base}"/>
 <path d="M4 28H18V30H4ZM30 28H36V30H30Z" fill="${shine}"/>
 <path d="M20 26L32 20H40L28 26V34H20Z" fill="${ribbon}"/>
 <path d="M21 26L33 20H35L23 26V32H21Z" fill="${ribbonLight}"/>
 <path d="M26 28H28V34H20V32H26Z" fill="${ribbonShade}"/>
 <g class="parcel-bow">
 <path d="M28 23H20V21H14V19H10V13H12V9H20V11H24V15H28V17H32V13H34V9H38V7H44V9H48V15H46V19H40V21H36V25H28Z" fill="#342233"/>
 <path d="M26 21H20V19H14V17H12V13H14V11H18V13H22V17H26Z" fill="${ribbon}"/>
 <path d="M14 11H18V13H22V15H20V14H16V13H14ZM14 13H16V17H14Z" fill="${ribbonLight}"/>
 <path d="M16 13H18V15H22V17H24V19H22V18H18V16H16Z" fill="${ribbonShade}"/>
 <path d="M16 17H20V19H26V21H20V19H16Z" fill="${ribbonShade}"/>
 <path d="M34 19V15H36V11H40V9H44V11H46V15H44V17H40V19Z" fill="${ribbon}"/>
 <path d="M36 15V13H38V11H42V10H44V12H40V14H38V17H36Z" fill="${ribbonLight}"/>
 <path d="M40 13H44V14H42V16H38V17H36V16H38V15H40Z" fill="${ribbonShade}"/>
 <path d="M38 17H42V15H44V13H46V15H44V17H40V19H36V18H38Z" fill="${ribbonShade}"/>
 <path d="M27 23H31V27H29V29H25V27H23V25H27Z" fill="${ribbonShade}"/>
 <path d="M32 23H35L39 26V30H37V28H33Z" fill="${ribbon}"/>
 <path d="M28 19H34V21H36V23H34V25H28V23H26V21H28Z" fill="${ribbonShade}"/>
 <path d="M28 20H33V23H28Z" fill="${ribbon}"/><path d="M29 20H32V21H29Z" fill="${ribbonLight}"/>
 </g></g></svg>`;
}
