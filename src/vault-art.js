import {activeGiftSVG} from './gift-concept-art.js';
import {giftFinalCrown} from './gift-finale-art.js';
const art=s=>s.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
const gem=(x,y,color='#ee9ecb')=>`<g transform="translate(${x} ${y})"><path d="M3 0H9V2H12V8H9V11H3V8H0V2H3Z" fill="#54344f"/><path d="M3 1H8V3H11V7H8V10H4V8H1V3H3Z" fill="${color}"/><path d="M3 1H8V3H4V6H1V3H3Z" fill="#fff1dd"/><path d="M9 4H11V7H8V10H5V8H8V6H9Z" fill="#99618d"/></g>`;
const coin=(x,y)=>`<g transform="translate(${x} ${y})"><path d="M2 0H10V2H12V6H10V8H2V6H0V2H2Z" fill="#815444"/><path d="M2 0H10V1H11V5H9V6H2V5H1V1H2Z" fill="#e9b56f"/><path d="M3 1H9V2H10V4H3V5H2V2H3Z" fill="#ffe7a2"/><path d="M4 1H8V2H4ZM2 2H3V4H2Z" fill="#fff4ce"/><path d="M5 2H7V4H5Z" fill="#bf8258"/></g>`;
const oct='M52 26H108V30H120V38H128V50H132V94H128V106H120V114H108V118H52V114H40V106H32V94H28V50H32V38H40V30H52Z';
export function vaultSVG(){return `<svg viewBox="0 0 160 148" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" shape-rendering="crispEdges">
 <path d="M20 25H32V13H57V6H103V13H128V25H140V132H132V142H28V132H20Z" fill="#39253f"/>
 <path d="M23 27H35V16H59V9H101V16H125V27H137V129H128V138H31V129H23Z" fill="#896894"/>
 <path d="M23 27H35V16H59V9H101V13H61V20H39V32H27V124H23Z" fill="#e9bdd1"/>
 <path d="M129 32H137V129H128V138H31V133H124V125H129Z" fill="#58445f"/>
 <path d="M32 31H40V22H60V16H100V22H120V31H128V123H120V132H40V123H32Z" fill="#d7a06b"/>
 <path d="M34 33H42V24H62V18H98V24H118V33H126V121H118V130H42V121H34Z" fill="#ffe6a9"/>
 <path d="M39 34H45V28H64V22H96V28H115V34H122V119H115V125H45V119H39Z" fill="#a97760"/>
 <path d="${oct}" fill="#54384f"/>
 <g class="vault-interior"><path d="M54 30H106V35H118V43H125V54H128V90H123V102H115V110H105V114H55V110H45V102H37V90H32V54H37V43H44V35H54Z" fill="#2f203f"/>
 <path d="M56 34H104V38H115V46H122V57H125V89H120V98H112V106H103V110H57V106H48V98H40V89H35V57H40V46H47V38H56Z" fill="#483552"/>
 <path d="M59 40H101V44H111V51H117V91H110V101H51V92H44V51H50V44H59Z" fill="#604365"/>
 <path d="M60 44H101V45H61V99H60Z M46 53H117V54H46Z M46 89H117V90H46Z M75 45H76V99H75Z M91 45H92V99H91Z" fill="#956080" opacity=".45"/>
 <path d="M45 101H115V105H108V109H52V105H45Z" fill="#b57b66"/>
 ${Array.from({length:12},(_,i)=>coin(47+(i%6)*11,87-Math.floor(i/6)*6)).join('')}
 <g transform="translate(64 43) scale(.8)">${art(giftFinalCrown())}</g>
 </g>
 <g class="vault-door">
  <path d="${oct}" fill="#644249"/>
  <path d="M53 27H107V32H119V40H126V52H130V92H125V104H117V112H106V116H54V112H42V104H35V92H30V52H35V40H42V32H53Z" fill="#d49b5e"/>
  <path d="M53 27H107V30H55V35H44V43H37V55H33V90H30V52H35V40H42V32H53Z" fill="#fff1c1"/>
  <path d="M126 54H130V92H125V104H117V112H106V116H54V113H105V109H114V101H122V90H126Z" fill="#99634d"/>
  <path d="M57 35H103V39H113V46H120V56H123V88H120V98H113V105H103V109H57V105H47V98H40V88H37V56H40V46H47V39H57Z" fill="#f2cb84"/>
  <path d="M59 39H101V43H111V50H116V60H119V84H116V94H110V101H100V105H60V101H50V94H44V84H41V60H44V50H50V43H59Z" fill="var(--vault-metal,#96769e)"/>
  <path d="M59 39H101V42H60V46H52V52H48V62H45V83H41V60H44V50H50V43H59Z" fill="#ead2df"/>
  <path d="M115 61H119V84H116V94H110V101H100V105H60V102H99V98H107V91H112V83H115Z" fill="#5b426b"/>
  <path d="M59 45H101V47H61V49H54V55H51V62H49V83H47V60H51V52H59Z" fill="#c5a2c3"/>
  ${[0,45,90,135,180,225,270,315].map(a=>`<g transform="rotate(${a} 80 72)"><path d="M77 45H83V50H81V58H78V50H77Z" fill="#c59669"/><path d="M78 45H81V48H80V57H78Z" fill="#fff0b4"/></g>`).join('')}
  <g class="vault-wheel">${[0,60,120,180,240,300].map(a=>`<g transform="rotate(${a} 80 72)"><path d="M77 51H83V75H77Z" fill="#64444e"/><path d="M78 52H81V71H78Z" fill="#f8d494"/><path d="M78 52H79V68H78Z" fill="#fff3ce"/></g>`).join('')}
   <path d="M71 61H89V65H93V79H89V83H71V79H67V65H71Z" fill="#6e4853"/>
   <path d="M72 62H88V66H91V77H87V81H73V77H69V66H72Z" fill="#d69f62"/>
   <path d="M73 64H86V66H89V74H86V78H74V75H71V67H73Z" fill="#ffdf9b"/>
   <path d="M74 64H85V66H76V69H72V67H74Z" fill="#fff7d3"/>
   ${gem(74,66,'#f3a5cf')}
  </g>
  ${gem(74,42,'#b9e9d0')}${gem(74,92,'#d4b9f4')}
 </g>
 <g class="vault-bolts"><path d="M25 56H38V65H25ZM25 86H38V95H25Z" fill="#6d4854"/><path d="M26 57H37V62H26ZM26 87H37V92H26Z" fill="#dfb474"/><path d="M27 57H36V59H27ZM27 87H36V89H27Z" fill="#fff0bf"/></g>
 <path d="M26 130H134V137H130V143H30V137H26Z" fill="#644555"/><path d="M28 130H132V134H28Z" fill="#efc18e"/><path d="M32 135H128V139H32Z" fill="#b17d6d"/><path d="M34 139H126V141H34Z" fill="#e6b7a5"/>
 <g transform="translate(59 0) scale(1.05 .8)">${art(giftFinalCrown())}</g>
 ${gem(22,27,'#f7b6d4')}${gem(126,27,'#c9b7f4')}
 ${[0,1].map(side=>`<g transform="translate(${side?160:0} 0) scale(${side?-1:1} 1)"><path d="M26 20H36V16H47V19H39V22H32V27H28V34H24V27H26Z" fill="#fff0bd"/><path d="M24 105H27V113H31V117H39V120H31V117H26V113H24Z" fill="#edc192"/><path d="M27 39H29V47H27ZM27 99H29V103H27Z" fill="#ffd8a8"/></g>`).join('')}
 <g class="vault-gift vault-gift-left"><svg x="2" y="103" width="35" height="40" viewBox="0 0 56 64">${art(activeGiftSVG(0))}</svg></g>
 <g class="vault-gift vault-gift-right"><svg x="124" y="105" width="34" height="39" viewBox="0 0 56 64">${art(activeGiftSVG(1))}</svg></g>
 <g class="vault-spill">${[[42,132],[52,128],[62,134],[90,131],[104,133],[80,136],[113,130]].map(([x,y])=>coin(x,y)).join('')}</g>
 </svg>`;}
export function vaultLock(){return '<svg viewBox="0 0 20 22" aria-hidden="true" shape-rendering="crispEdges"><path d="M5 2H7V0H13V2H15V4H17V10H19V20H17V22H3V20H1V10H3V4H5Z" fill="#422c48"/><path d="M6 3H8V2H12V3H14V10H11V5H8V10H5V5H6Z" fill="#ffe4ab"/><path d="M3 11H17V19H15V20H5V19H3Z" fill="currentColor"/><path d="M4 11H16V13H5V17H4Z" fill="#fff4cb"/><path d="M8 14H12V17H11V19H9V17H8Z" fill="#644053"/></svg>';}
