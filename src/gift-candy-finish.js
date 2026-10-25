// Small, deliberate color clusters: the approved candy hues stay unchanged.
// All detail uses the same 56 x 64 drawing grid and light from the upper left.
export function candyPaperFinish([light,base,shade,shine]){
 return {
  bodyDetail:`
   <path d="M8 36H10V51H8ZM10 36H17V37H10Z" fill="${shine}"/>
   <path d="M33 36H36V56H33ZM10 55H33V57H10Z" fill="${base}"/>
   <path d="M34 49H36V59H32V58H34Z" fill="${shade}"/>
   <path d="M8 53H10V55H13V56H16V57H9V55H8Z" fill="${base}"/>
   <path d="M10 54H12V55H15V56H12V55H10Z" fill="${shine}"/>
   <path d="M30 54H33V51H34V56H30Z" fill="${shade}"/>
   <path d="M40 31L48 27V29L40 33Z" fill="${light}"/>
   <path d="M40 48L48 44V50L40 54Z" fill="${shade}"/>
   <path d="M40 33L42 32V43L40 44Z" fill="${light}"/>
   <path d="M46 30L48 29V43L46 44Z" fill="${shade}"/>`,
  lidDetail:`
   <path d="M6 25L16 20H50L48 21H18L10 25Z" fill="${light}"/>
   <path d="M4 26H18V27H4ZM30 26H36L48 20H50L38 26V27H30Z" fill="${base}"/>
   <path d="M3 29H5V32H3ZM5 29H18V30H5ZM30 29H35V30H30Z" fill="${shine}"/>
   <path d="M2 33H36V34H2ZM35 29H36V33H35Z" fill="${base}"/>
   <path d="M4 34H35V35H4Z" fill="${shade}"/>
   <path d="M40 28L50 23V24L40 29Z" fill="${light}"/>
   <path d="M38 32L52 25V27L38 34Z" fill="${shade}"/>`,
  bandDetail:`
   <path class="parcel-band" d="M20 36H21V55H20ZM23 56H26V57H23Z" fill="#fffbe2"/>
   <path class="parcel-band" d="M25 36H26V55H25ZM22 57H28V59H22Z" fill="#b58a63"/>
   <path class="parcel-band" d="M26 36H28V38H26Z" fill="#9f745c"/>`,
  insideDetail:`
   <g class="parcel-inside">
    <path d="M8 28L18 23H24L18 26H30L35 24H44L36 28H26L22 30H14Z" fill="#cda7cb"/>
    <path d="M10 27L18 23H22L17 26H13L16 28H11Z" fill="#f2dbef"/>
    <path d="M26 28L34 24H41L35 27H31L28 29Z" fill="#e8d4f3"/>
    <path d="M18 28H26L22 30H16ZM32 27H36L34 28H30Z" fill="#987297"/>
   </g>`
 };
}

export function candyTiedBow(){return `
 <path d="M28 25H22V23H16V21H10V19H6V12H8V9H14V8H18V10H22V13H26V17H29V20H33V24H28Z" fill="#342233"/>
 <path d="M32 24V18H35V14H39V10H43V7H49V9H52V15H50V18H46V20H40V23H36V25Z" fill="#342233"/>
 <path d="M27 23H23V21H17V19H11V17H8V12H10V10H15V10H17V12H21V15H25V19H29V22Z" fill="#fff0b2"/>
 <path d="M34 22V19H37V15H41V11H45V9H48V11H50V14H48V17H44V19H39V21H37V23Z" fill="#fff0b2"/>
 <path d="M9 12H11V11H16V12H19V14H15V13H11V15H9ZM41 12H44V10H47V11H48V13H45V14H42V16H39V15H41Z" fill="#fffbe2"/>
 <path d="M10 15H13V14H17V16H20V18H24V20H27V23H23V21H17V19H11V17H10ZM38 18H41V16H44V14H48V13H50V15H48V17H44V19H39V21H36V21H36V20H38Z" fill="#cda874"/>
 <path d="M12 15H16V16H19V18H22V19H18V18H15V17H12ZM42 16H45V14H48V15H47V17H43V18H40V19H38V18H42Z" fill="#9f745c"/>
 <path d="M13 15H16V16H19V17H16V16H13ZM43 15H46V14H48V15H45V16H43Z" fill="#775344"/>
 <path d="M26 23H31V28H28V32H23V30H21V27H25V25H26ZM33 23H37V26H41V31H37V29H33Z" fill="#9f745c"/>
 <path d="M27 24H30V27H27V30H24V28H23V27H26ZM34 24H36V27H39V29H37V28H34Z" fill="#cda874"/>
 <path d="M27 24H29V26H26V28H24V27H26ZM34 24H36V27H38V28H36V27H34Z" fill="#fff0b2"/>
 <path d="M27 19H34V20H36V25H34V27H27V25H26V21H27Z" fill="#775344"/>
 <path d="M28 20H33V21H35V24H33V26H28V24H27V22H28Z" fill="#cda874"/>
 <path d="M28 21H33V22H34V24H28Z" fill="#fff0b2"/>
 <path d="M28 21H32V22H28ZM28 22H29V23H28Z" fill="#fffbe2"/>
 `;}
