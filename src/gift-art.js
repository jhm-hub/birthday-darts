// Editable pixel clusters and the same plum outlines, satin highlights and
// stepped contours as the birthday props. Lid and ribbon have separate layers.
const palettes=[
 ['#bc99dc','#a783c8','#654b88','#ebd2f3','#f1c984','#fff0c7','#b77d54'],
 ['#a7dcc2','#80bba9','#4f8d87','#d8f0d5','#efa1bc','#ffe0de','#be7099'],
 ['#eea0bc','#c7769d','#864f78','#ffd6e3','#ffe0a0','#fff0cd','#b88959'],
 ['#a6c3e5','#7f9cc6','#485e8e','#d9e6ff','#c8afea','#f0defa','#8e6eae'],
 ['#edc88f','#cfa16e','#8a6557','#ffe8b8','#c47fa7','#f2bad3','#814666']
];
export function giftSVG(index=0){
 const [light,base,shade,shine,ribbon,ribbonLight,ribbonShade]=palettes[index%palettes.length];
 const stars=[[11,34],[29,30],[12,46],[29,44]].map(([x,y])=>`<path d="M${x} ${y}h2v2h2v2h-2v2h-2v-2H${x-2}v-2h2Z" fill="${shine}"/>`).join('');
 return `<svg viewBox="0 0 56 64" aria-hidden="true" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
 <ellipse cx="29" cy="60" rx="24" ry="3" fill="#160c23" opacity=".3"/>
 <g class="parcel-body"><path d="M4 22H40L52 28V56L40 62H4L2 58V26Z" fill="#342233"/>
 <path d="M6 26H38V58H6Z" fill="${base}"/><path d="M8 28H36V54H8Z" fill="${light}"/>
 <path d="M40 26L50 30V54L40 58Z" fill="${shade}"/><path d="M40 28H42V54H40Z" fill="${base}"/>
 <path d="M8 28H10V52H8ZM10 28H34V30H10Z" fill="${shine}"/>
 <path d="M6 54H38V58H6Z" fill="${shade}" opacity=".5"/>${stars}
 <path class="parcel-band" d="M20 26H28V58H20Z" fill="${ribbonShade}"/><path class="parcel-band" d="M20 26H26V56H20Z" fill="${ribbon}"/><path class="parcel-band" d="M22 28H24V56H22Z" fill="${ribbonLight}"/>
 <path class="parcel-inside" d="M6 26H38L48 30L38 36H6Z" fill="#211429"/>
 <path class="parcel-inside" d="M8 28H36L42 30L36 32H8Z" fill="${ribbonShade}"/>
 </g><g class="parcel-lid">
 <path d="M2 20L12 16H40L54 24V32L40 38H0V22Z" fill="#342233"/>
 <path d="M4 22L14 18H38L50 24L38 30H2V24Z" fill="${shine}"/>
 <path d="M2 30H38V34H2Z" fill="${light}"/><path d="M40 30L52 24V30L40 36Z" fill="${shade}"/>
 <path d="M4 24H34V26H4Z" fill="${light}"/><path d="M20 18H26V34H18V28Z" fill="${ribbon}"/><path d="M22 18H24V30H20V34H18V28Z" fill="${ribbonLight}"/>
 <g class="parcel-bow"><path d="M20 18H12V16H6V12H4V6H10V4H16V6H20V10H26V8H30V2H36V4H42V10H40V14H34V18H28V22H20Z" fill="#342233"/>
 <path d="M20 16H12V14H8V8H12V6H16V10H20V14H24V18Z" fill="${ribbon}"/>
 <path d="M8 8H12V10H16V12H20V14H14V12H10V10H8Z" fill="${ribbonLight}"/>
 <path d="M12 12H16V14H20V16H14V14H12Z" fill="${ribbonShade}"/>
 <path d="M26 16V10H30V6H34V4H38V6H40V10H36V12H32V16Z" fill="${ribbon}"/>
 <path d="M28 12H30V8H34V6H36V8H34V12H30V14H28Z" fill="${ribbonLight}"/>
 <path d="M32 14H36V12H38V10H40V12H36V16H32Z" fill="${ribbonShade}"/>
 <path d="M20 14H28V20H26V24H22V22H18V18H20Z" fill="${ribbon}"/><path d="M22 14H26V18H22Z" fill="${ribbonLight}"/>
 <path d="M18 20H22V30H18V28H16V24H18Z" fill="${ribbon}"/><path d="M26 20H30V28H28V26H26Z" fill="${ribbonShade}"/>
 </g></g></svg>`;
}
