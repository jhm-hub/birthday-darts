import {activeGiftSVG} from './gift-concept-art.js';
import {giftFinalCrown,giftFinalBow} from './gift-finale-art.js';
import {CHAMBER_SLOTS,chamberTheme} from './vault-motion.js';
const art=s=>s.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
const sprite=(s,x,y,w,h,view='0 0 40 32')=>`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${view}" overflow="visible">${art(s)}</svg>`;
const gem=(x,y,color='#d9b5f4')=>`<g transform="translate(${x} ${y})"><path d="M4 0H10V2H13V6H11V9H9V11H5V9H3V7H1V2H4Z" fill="#43314e"/><path d="M4 1H10V3H12V5H10V8H8V10H6V8H4V6H2V3H4Z" fill="${color}"/><path d="M4 1H9V3H6V6H3V4H2V3H4Z" fill="#fff3e8"/><path d="M9 3H11V5H9V8H8V9H7V6H8Z" fill="#8a639a"/><path d="M5 3H7V5H5Z" fill="#f6e4ff"/></g>`;
const coin=(x,y)=>`<g transform="translate(${x} ${y})"><path d="M2 0H10V1H12V5H10V7H2V5H0V1H2Z" fill="#6b4547"/><path d="M2 1H10V2H11V4H9V5H2V4H1V2H2Z" fill="#e8b26c"/><path d="M3 1H9V2H10V3H3V4H2V2H3Z" fill="#ffe7a4"/><path d="M4 1H8V2H4ZM1 3H2V4H1Z" fill="#fff6ce"/><path d="M5 2H7V3H5Z" fill="#bd8056"/><path d="M3 5H4V6H3ZM7 5H8V6H7Z" fill="#c88d60"/></g>`;
const ingot=(x,y)=>`<g transform="translate(${x} ${y})"><path d="M3 0H18L21 5V8H0V5Z" fill="#78504b"/><path d="M4 1H17L19 4H2Z" fill="#ffe4a2"/><path d="M2 4H19V7H2Z" fill="#d8a165"/><path d="M3 4H18V5H3Z" fill="#fff1bd"/><path d="M17 5H19V7H17Z" fill="#aa7258"/></g>`;
const cake=(x,y)=>`<g transform="translate(${x} ${y})"><path d="M2 17H26V22H2ZM6 8H22V19H6ZM8 3H10V10H8ZM17 2H19V10H17Z" fill="#573749"/><path d="M4 18H24V21H4Z" fill="#cd96b8"/><path d="M6 11H22V18H6Z" fill="#c56b9d"/><path d="M7 12H21V14H7Z" fill="#f5b7d8"/><path d="M7 15H21V16H7Z" fill="#fff1c5"/><path d="M5 9H23V12H21V14H19V12H16V13H13V11H10V14H8V12H5Z" fill="#ffe6e7"/><path d="M7 8H21V10H7Z" fill="#fff5df"/><path d="M8 5H10V9H8ZM17 4H19V9H17Z" fill="#abeee0"/><path d="M8 1H10V4H8ZM17 0H19V3H17Z" fill="#e9aa68"/><path d="M9 1H10V3H9ZM18 0H19V2H18Z" fill="#fff4b9"/><path d="M6 19H22V20H6Z" fill="#ffecc3"/><path d="M12 9H14V10H12ZM19 10H21V11H19Z" fill="#f291bf"/></g>`;
function treasure(index,w,h){
 const type=index%5,cycle=Math.floor(index/5),mid=w/2;
 const floor=`<path d="M0 ${h-6}H${w}V${h}H0Z" fill="#75515d"/><path d="M1 ${h-6}H${w-1}V${h-5}H1Z" fill="#ba8a82"/><path d="M2 ${h-2}H${w-3}V${h-1}H2Z" fill="#392c42"/>`;
 let loot='';
 if(type===0)loot=ingot(mid-25,h-14)+ingot(mid-13,h-20)+ingot(mid-3,h-14)+coin(mid-22,h-9)+coin(mid+11,h-9)+coin(mid+10,h-14);
 if(type===1)loot=sprite(activeGiftSVG(cycle%5),mid-25,h-24,23,25,'0 0 56 64')+sprite(activeGiftSVG((cycle+1)%5),mid-4,h-26,24,27,'0 0 56 64');
 if(type===2)loot=`<path d="M9 ${h-8}H${w-9}V${h-4}H9Z" fill="#c28da8"/><path d="M10 ${h-9}H${w-10}V${h-7}H10Z" fill="#f3cebd"/>`+gem(mid-19,h-21,'#b6eddb')+gem(mid+2,h-19,'#e6b5f1')+coin(mid-3,h-9);
 if(type===3)loot=cake(mid-15,h-24)+sprite(activeGiftSVG(2),mid+11,h-20,17,20,'0 0 56 64');
 if(type===4)loot=`<path d="M${mid-20} ${h-8}H${mid+20}V${h-3}H${mid-20}Z" fill="#ac698b"/><path d="M${mid-18} ${h-9}H${mid+18}V${h-7}H${mid-18}Z" fill="#efb2d0"/>`+sprite(giftFinalCrown(),mid-14,h-27,28,23)+ingot(mid-49,h-11)+coin(mid-34,h-9)+ingot(mid+30,h-11)+coin(mid+19,h-8);
 return floor+`<g class="chamber-loot">${loot}</g>`;
}
function wheel(cx,cy){return `<g class="chamber-wheel">${[0,60,120].map(a=>`<g transform="rotate(${a} ${cx} ${cy})"><path d="M${cx-1} ${cy-9}H${cx+2}V${cy+9}H${cx-1}Z" fill="#6b4650"/><path d="M${cx} ${cy-8}H${cx+1}V${cy+8}H${cx}Z" fill="#fff0bc"/></g>`).join('')}<path d="M${cx-4} ${cy-5}H${cx+4}V${cy-3}H${cx+6}V${cy+3}H${cx+4}V${cy+5}H${cx-4}V${cy+3}H${cx-6}V${cy-3}H${cx-4}Z" fill="#8f5e60"/><path d="M${cx-3} ${cy-4}H${cx+3}V${cy-2}H${cx+4}V${cy+2}H${cx+2}V${cy+3}H${cx-3}V${cy+1}H${cx-4}V${cy-2}H${cx-3}Z" fill="#ffdfa2"/><path d="M${cx-2} ${cy-2}H${cx+2}V${cy+2}H${cx-2}Z" fill="#f2b3d2"/><path d="M${cx-2} ${cy-2}H${cx}V${cy-1}H${cx-2}Z" fill="#fff4d6"/></g>`;}
function doorArt(index,w,h){
 const theme=chamberTheme(index),type=index%5,cx=w/2,cy=h/2;
 let emblem=type===0?wheel(cx,cy):type===1?sprite(giftFinalBow(),cx-12,cy-10,24,19):type===2?gem(cx-7,cy-6,theme.light):type===3?cake(cx-11,cy-9):sprite(giftFinalCrown(),cx-14,cy-11,28,22);
 if(type===3)emblem=`<g transform="translate(${cx} ${cy}) scale(.7) translate(${-cx} ${-cy})">${emblem}</g>`;
 return `<path d="M2 0H${w-2}V2H${w}V${h-2}H${w-2}V${h}H2V${h-2}H0V2H2Z" fill="#614258"/>
 <path d="M2 1H${w-2}V2H${w-1}V${h-2}H${w-3}V${h-1}H2V${h-3}H1V2H2Z" fill="${theme.metal}"/>
 <path d="M2 1H${w-3}V3H4V${h-3}H2Z" fill="${theme.light}"/>
 <path d="M${w-3} 3H${w-1}V${h-2}H${w-3}V${h-1}H3V${h-3}H${w-3}Z" fill="${theme.shade}"/>
 <path d="M5 4H${w-5}V${h-4}H5Z" fill="${theme.shade}"/>
 <path d="M6 5H${w-6}V${h-5}H6Z" fill="${theme.metal}"/>
 <path d="M7 6H${w-8}V7H8V${h-7}H7Z" fill="${theme.light}" opacity=".65"/>
 <path d="M10 9H16V10H10ZM${w-17} ${h-10}H${w-11}V${h-9}H${w-17}Z" fill="${theme.light}" opacity=".4"/>
 ${type===2?Array.from({length:4},(_,i)=>`<path d="M6 ${8+i*4}H${w-6}" stroke="${theme.shade}" stroke-width="1"/>`).join(''):''}
 ${[5,w-7].map(x=>`<path d="M${x} 4H${x+2}V6H${x}ZM${x} ${h-6}H${x+2}V${h-4}H${x}Z" fill="#ffe8b9"/>`).join('')}
 ${type===1||type===4?`<path d="M${Math.floor(cx)-1} 2H${Math.floor(cx)+1}V${h-2}H${Math.floor(cx)-1}Z" fill="#694654"/>`:''}${emblem}`;
}
function compartment(index){
 const s=CHAMBER_SLOTS[index%5],w=s.w-6,h=s.h-6,theme=chamberTheme(index),surface=doorArt(index,w,h),half=w/2;
 const paired=['split','double'].includes(theme.motion);
 return `<g class="vault-chamber" data-chamber="${index}" transform="translate(${s.x} ${s.y})">
 <path d="M2 0H${s.w-2}V2H${s.w}V${s.h-2}H${s.w-2}V${s.h}H2V${s.h-2}H0V2H2Z" fill="#37263e"/>
 <path d="M2 1H${s.w-2}V3H${s.w-1}V${s.h-2}H${s.w-3}V${s.h-1}H2Z" fill="#b88069"/>
 <path d="M3 2H${s.w-3}V3H4V${s.h-4}H2V4H3Z" fill="#fff0bb"/>
 <svg x="3" y="3" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" overflow="hidden">
 <path d="M0 0H${w}V${h}H0Z" fill="#241b32"/><path d="M3 3H${w-3}V${h-5}H3Z" fill="#49334d"/>
 <path d="M5 5H${w-5}V${h-6}H5Z" fill="#64425e"/><path d="M7 6H${w-7}V${h-7}H7Z" fill="#77506d"/>
 <path d="M0 0H${w}V2H2V${h}H0Z" fill="#1d162b"/>
 <path d="M${w-4} 4H${w-3}V${h-7}H${w-4}ZM4 ${h-7}H${w-4}V${h-6}H4Z" fill="#bd8b85"/>
 <path d="M8 10H${w-8}V11H8ZM8 16H${w-8}V17H8Z" fill="#8a5c73" opacity=".4"/>
 <g class="chamber-radiance" opacity="0"><path d="M6 4H${w-6}V${h-4}H6Z" fill="${theme.light}" opacity=".18"/><path d="M12 7H${w-12}V${h-5}H12Z" fill="${theme.light}" opacity=".3"/></g>
 ${treasure(index,w,h)}
 <g class="chamber-leaf-left">${paired?`<svg width="${half}" height="${h}" viewBox="0 0 ${half} ${h}" overflow="hidden">${surface}</svg>`:surface}</g>
 ${paired?`<g class="chamber-leaf-right"><svg x="${half}" width="${half}" height="${h}" viewBox="${half} 0 ${half} ${h}" overflow="hidden">${surface}</svg></g>`:''}
 <g class="chamber-bolt"><path d="M0 5H5V8H0ZM0 ${h-8}H5V${h-5}H0Z" fill="#92645c"/><path d="M0 5H4V6H0ZM0 ${h-8}H4V${h-7}H0Z" fill="#fff1b7"/></g>
 </svg>
 <path class="chamber-focus" d="M4 -1H${s.w-4}M${s.w+1} 4V${s.h-4}M${s.w-4} ${s.h+1}H4M-1 ${s.h-4}V4" fill="none" stroke="${theme.light}" stroke-width="1" opacity="0"/>
 <path class="chamber-spark" d="M${s.w-6} -3V3M${s.w-9} 0H${s.w-3}" stroke="#fff8d5" stroke-width="1" opacity="0"/>
 <g class="chamber-number"><path d="M-3 -3H7V6H-3Z" fill="#44304a"/><path d="M-2 -2H6V-1H-2Z" fill="#ffe4b4"/><text x="2" y="4" text-anchor="middle" fill="#fff0bb" font-family="Fredoka, sans-serif" font-size="6.5" font-weight="600">${index+1}</text></g>
 <text class="chamber-bonus-mark" x="${s.w-7}" y="10" text-anchor="end"></text>
 <text class="chamber-award" x="${s.w/2}" y="${s.h-2}" text-anchor="middle"></text>
 <g class="chamber-dormant"><path d="M3 3H${s.w-3}V${s.h-3}H3Z" fill="#63465f"/><path d="M6 6H${s.w-6}V${s.h-6}H6Z" fill="#75576d"/><path d="M${s.w/2-2} ${s.h/2-4}H${s.w/2+2}V${s.h/2-2}H${s.w/2+4}V${s.h/2+2}H${s.w/2+2}V${s.h/2+4}H${s.w/2-2}V${s.h/2+2}H${s.w/2-4}V${s.h/2-2}H${s.w/2-2}Z" fill="#b58b9a"/></g>
 </g>`;
}
export function vaultSVG(){return `<svg viewBox="0 0 180 142" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" shape-rendering="crispEdges">
 <path d="M15 21H29V13H60V8H120V13H151V21H165V132H170V140H10V132H15Z" fill="#36253e"/>
 <path d="M17 22H31V15H62V10H118V15H149V22H163V134H167V138H13V134H17Z" fill="#a76f78"/>
 <path d="M18 22H31V15H62V10H118V12H64V18H34V25H20V134H18Z" fill="#f3c4c4"/>
 <path d="M159 25H163V134H167V138H13V135H159Z" fill="#5e415d"/>
 <path d="M19 25H161V134H19Z" fill="#80566a"/>
 <path d="M20 24H160V27H20ZM20 61H160V65H20ZM20 99H160V103H20Z" fill="#c39076"/>
 <path d="M21 24H159V25H21ZM21 61H159V62H21ZM21 99H159V100H21Z" fill="#ffe6b1"/>
 <path d="M87 26H93V101H87Z" fill="#b37b69"/><path d="M88 27H89V100H88Z" fill="#ffe6ae"/><path d="M92 27H93V100H92Z" fill="#674354"/>
 ${Array.from({length:4},(_,bank)=>`<g class="vault-bank" data-bank="${bank}">${Array.from({length:5},(_,i)=>compartment(bank*5+i)).join('')}</g>`).join('')}
 ${[false,true].map(right=>`<g${right?' transform="translate(180 0) scale(-1 1)"':''}>
 <path d="M12 28H19V129H12Z" fill="#78505d"/><path d="M13 29H17V128H13Z" fill="#e0ac7d"/><path d="M13 29H14V127H13Z" fill="#ffe8bb"/>
 <path d="M10 25H21V31H10ZM10 124H21V131H10Z" fill="#a57468"/><path d="M10 25H21V27H10ZM10 124H21V126H10Z" fill="#ffdfa6"/>
 <path d="M15 38H17V46H15ZM15 58H17V64H15ZM15 84H17V91H15ZM15 110H17V117H15Z" fill="#a37469"/>
 <path d="M20 19H29V16H38V14H46V16H40V19H32V22H23V25H20Z" fill="#ffe7ae"/><path d="M23 19H27V20H23ZM32 16H36V17H32Z" fill="#fff5cf"/>
 ${gem(9,68,'#e7c3e8')}
 </g>`).join('')}
 <path d="M14 134H166V137H162V141H18V137H14Z" fill="#7f545f"/><path d="M17 134H163V136H17Z" fill="#ffe5b0"/><path d="M20 138H160V139H20Z" fill="#ca9683"/>
 <path d="M58 16H122V20H58Z" fill="#c59172"/><path d="M61 16H119V17H61Z" fill="#fff2bd"/>
 ${sprite(giftFinalCrown(),72,0,36,27)}
 ${gem(55,9,'#bbe9db')}${gem(113,9,'#f4c1de')}
 ${sprite(activeGiftSVG(0),0,119,21,24,'0 0 56 64')}${sprite(activeGiftSVG(1),160,120,20,23,'0 0 56 64')}
 </svg>`;}
export function vaultLock(done=false){return `<svg viewBox="0 0 20 22" aria-hidden="true" shape-rendering="crispEdges"><path d="M3 10H17V12H19V20H17V22H3V20H1V12H3Z" fill="#422c48"/>${done?'<path d="M4 10V4H6V2H12V4H14V7H11V5H7V10Z" fill="#422c48"/><path d="M5 10V5H7V3H11V5H13V7H12V5H7V10Z" fill="#ffe4ab"/>':'<path d="M3 10V4H5V2H7V0H13V2H15V4H17V10H13V5H8V10Z" fill="#422c48"/><path d="M5 10V5H6V3H8V2H12V3H14V10H11V5H8V10Z" fill="#ffe4ab"/>'}<path d="M3 11H17V19H15V20H5V19H3Z" fill="currentColor"/><path d="M4 11H16V13H5V17H4Z" fill="#fff4cb"/>${done?'<path d="M6 14H8V16H10V14H12V12H14V15H12V17H10V19H8V17H6Z" fill="#386958"/>':'<path d="M8 14H12V17H11V19H9V17H8Z" fill="#644053"/>'}</svg>`;}
