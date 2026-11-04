// Layered pixel sprite: gilt edges, rose enamel, velvet interior and a hinged
// crown lid. Groups move on the saved opening clock; no per-frame SVG rebuild.
const coin=(x,y)=>`<g transform="translate(${x} ${y})"><path d="M2 0H12V2H15V6H12V8H2V6H0V2H2Z" fill="#663e49"/><path d="M2 1H12V2H14V5H12V7H2V5H1V2H2Z" fill="#e7a84f"/><path d="M3 1H11V2H13V3H2V2H3Z" fill="#fff2bd"/><path d="M4 3H10V5H4Z" fill="#fbd887"/><path d="M3 6H12V7H3Z" fill="#b87942"/></g>`;
const jewel=(x,y,color='#ef8bbb')=>`<g transform="translate(${x} ${y})"><path d="M4 0H8V2H10V8H8V10H4V8H2V2H4Z" fill="#5a314c"/><path d="M4 1H8V3H9V7H7V9H4V7H3V3H4Z" fill="${color}"/><path d="M4 2H7V4H5V7H3V3H4Z" fill="#fff0d3"/><path d="M7 5H9V7H7V9H5V7H7Z" fill="#a25184"/></g>`;
export function vaultOpeningChest(){return `<svg viewBox="0 0 112 112" shape-rendering="crispEdges" aria-hidden="true">
<path d="M16 100H93V103H87V106H21V104H16Z" fill="#32203e" opacity=".35"/>
<path d="M14 55H88L102 66V91L88 103H14L8 97V64Z" fill="#382337"/>
<path d="M16 58H87L98 67V89L86 99H17L12 95V65Z" fill="#b87b4c"/>
<path d="M17 59H85L95 67L85 77H17L14 68Z" fill="#60334f"/>
<path d="M21 61H83L90 67L83 73H21L18 68Z" fill="#2f213a"/>
<g class="opening-chest-treasure">${[[23,63],[39,61],[57,62],[72,62],[31,57],[48,55],[65,57],[39,52],[56,51]].map(([x,y])=>coin(x,y)).join('')}${jewel(57,54,'#b9e6ef')}</g>
<path d="M15 72H88V98H15Z" fill="#9c526d"/><path d="M18 75H85V94H18Z" fill="#dc8bad"/>
<path d="M20 76H84V80H23V92H20Z" fill="#f6c1d4"/><path d="M23 90H83V94H20V92H23Z" fill="#b75b88"/>
<path d="M88 73L98 66V89L88 98Z" fill="#a66a72"/><path d="M90 77L95 73V88L90 93Z" fill="#c88b95"/>
<path d="M15 70H89V75H15ZM15 94H88V100H15Z" fill="#edbc70"/>
<path d="M16 70H88V72H16ZM17 95H87V97H17Z" fill="#fff0b5"/>
<path d="M15 75H20V94H15ZM83 75H89V94H83Z" fill="#d7a05d"/>
<path d="M16 75H18V93H16ZM84 75H86V94H84Z" fill="#ffdf9c"/>
<path d="M47 73H59V96H47Z" fill="#9e623e"/><path d="M49 73H57V96H49Z" fill="#f2c57c"/><path d="M49 74H51V94H49Z" fill="#fff4bd"/>
<path d="M88 70L99 62V68L88 76ZM88 94L98 86V90L88 100Z" fill="#e1aa62"/>
<path d="M89 72L98 65V67L89 74Z" fill="#ffe9a4"/>
<path d="M18 100H27V105H17V102H18ZM76 100H88V103H86V105H77Z" fill="#653d3d"/><path d="M19 100H26V102H19ZM78 100H87V102H78Z" fill="#e4b16e"/>
${jewel(27,78)}${jewel(68,78)}
<path d="M22 82H25V84H22ZM40 82H43V84H40ZM63 82H66V84H63ZM80 82H82V84H80Z" fill="#ffedb5"/>
<g class="opening-chest-hinges" fill="#b9814c"><path d="M23 55H27V66H23ZM77 55H81V66H77Z"/><path d="M24 44H26V60H24ZM78 44H80V60H78Z" fill="#ffe3a3"/></g>
<g class="opening-chest-lid">
<path d="M12 51V44H18V38H26V35H81V38H89V44H95L102 51V64L90 73H14L7 66V54Z" fill="#382337"/>
<path d="M14 51V45H20V40H28V38H80V41H87V46H93V53L88 68H16L10 63V55Z" fill="#d69e62"/>
<path d="M20 50V45H28V42H79V45H85V50L82 61H24Z" fill="#eab4c3"/>
<path d="M25 45H78V48H29V55H23V51H25Z" fill="#ffe1de"/>
<path d="M26 55H81V62H24Z" fill="#c77b9c"/>
<path d="M14 54H90V68H14Z" fill="#c68b50"/><path d="M16 56H88V64H16Z" fill="#f7d18b"/><path d="M16 56H88V59H16Z" fill="#fff1be"/><path d="M16 65H88V68H16Z" fill="#aa7045"/>
<path d="M89 54L100 50V62L89 70Z" fill="#af784e"/><path d="M91 55L98 52V55L91 59Z" fill="#efd390"/>
<path d="M21 45H26V54H21ZM80 44H85V54H80Z" fill="#e6b46b"/><path d="M22 45H24V53H22ZM81 45H83V53H81Z" fill="#fff1b5"/>
<path d="M46 38H60V56H46Z" fill="#9b6545"/><path d="M48 39H58V56H48Z" fill="#f3cf86"/><path d="M49 40H51V55H49Z" fill="#fff4c1"/>
<path d="M31 35L28 19L38 25L43 14L54 24L65 14L70 25L80 19L76 35V40H32Z" fill="#513043"/>
<path d="M33 34L31 24L39 29L44 19L54 29L64 19L69 29L77 24L74 34V37H34Z" fill="#e4ab62"/>
<path d="M34 33L33 28L40 32L44 24L54 33L64 24L68 32L74 28L73 34H35Z" fill="#ffeab0"/>
<path d="M34 36H74V40H34Z" fill="#a56948"/><path d="M35 36H73V38H35Z" fill="#ffe6a6"/>
${jewel(49,28)}<path d="M28 17H32V21H28ZM42 12H46V16H42ZM63 12H67V16H63ZM78 17H82V21H78Z" fill="#f9df99"/>
<path d="M20 58H25V60H20ZM31 58H36V60H31ZM72 58H77V60H72ZM81 58H85V60H81Z" fill="#b7784b"/>
</g>
<g class="opening-chest-lock"><path d="M47 64H59V78H47Z" fill="#583344"/><path d="M48 65H58V77H48Z" fill="#e2ab66"/><path d="M49 66H56V68H49V75H48V66Z" fill="#fff2bd"/><path d="M52 68H55V71H54V74H51V71H52Z" fill="#59384b"/></g>
</svg>`;}
