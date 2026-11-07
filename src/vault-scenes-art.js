// Native pixel geometry: integer facets, stepped silhouettes and four-tone
// materials. The approved Crown Vault sprite remains the outer frame.
const rect=(x,y,w,h,fill)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
const path=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const group=(x,y,body,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})">${body}</g>`;
const ink='#301a35',gold='#d79343',light='#ffe7a1',edge='#7c4051';
export const ROOM_PALETTES=[
 ['#36223c','#513147','#744053','#c87181','#f8b0bd'],['#342943','#4a4059','#726076','#63afaa','#c4f4d7'],
 ['#30203d','#503153','#734467','#cb5998','#ffc2e1'],['#3b243d','#5b3452','#865070','#dc81b1','#ffe2e8'],
 ['#382642','#584052','#80604d','#bb8d5a','#ffe9ac'],['#35253e','#55374f','#794b66','#c56a9d','#ffc0df'],
 ['#24343f','#3b5257','#587372','#67b7aa','#baffdf'],['#2b2748','#434168','#675b84','#9c89d0','#e7d2ff']
];
export const star=path('M5 0H7V4H11V6H7V10H5V6H1V4H5Z','#fff2c2');
export function coin(){return path('M3 0H11V2H14V8H11V10H3V8H0V2H3Z',ink)+path('M3 1H11V3H13V7H11V9H3V7H1V3H3Z',gold)+path('M3 1H10V2H12V4H10V6H3V5H1V3H3Z',light)+rect(4,2,5,2,'#fff8d1')+rect(4,5,6,2,'#edb950')+rect(11,4,1,3,'#ab693c');}
function pile(x,y,n=3){return group(x,y,Array.from({length:n},(_,i)=>group((i%2)*2,-i*4,coin())).join(''));}
function gem(c='#f185c4',shine='#ffe3ed'){return path('M4 0H12L16 4V8L8 15L0 8V4Z',ink)+path('M4 1H11L15 5L8 13L1 7V5Z',c)+path('M4 1H11L9 5H5L2 5Z',shine)+path('M5 5H9L8 13Z','#fff0ee')+path('M9 5H14L8 13Z','#8d4e98');}
function gift(c='#e783b7'){
 return path('M1 8H22V27H1Z',ink)+rect(3,10,17,15,c)+rect(17,10,3,15,'#9a4c81')+rect(4,12,2,10,'#ffcde6')+rect(10,10,4,15,gold)+rect(10,10,2,14,light)+path('M0 6H23V12H0Z',ink)+rect(2,7,19,3,'#ffd1e4')+rect(9,7,5,4,light)+path('M10 7H4V5H2V1H7V3H10V5H13V2H16V0H20V4H18V6H14V8Z',ink)+path('M10 6H5V4H4V2H6V4H9V5H12V4H14V2H17V1H18V3H16V5H13V6Z',light)+rect(10,5,4,3,gold);
}
function crown(){return path('M2 6L7 10L10 3L16 9L22 0L28 9L34 3L37 10L42 6L37 25H7Z',ink)+path('M5 8L10 13L12 7L17 13L22 5L27 13L32 7L34 13L39 8L35 22H9Z',gold)+path('M6 9L10 14L12 9L17 15L22 7L27 15L32 9L34 14L38 10L36 15H8Z',light)+rect(9,20,26,3,light)+group(17,13,gem(),.6)+rect(10,25,24,2,'#8b4b57');}
function sconce(x,y,c){return group(x,y,path('M3 0H9V3H12V8H9V13H3V8H0V3H3Z',edge)+path('M4 1H8V4H11V7H8V11H4V7H1V4H4Z',gold)+rect(4,3,4,5,c)+rect(5,2,2,3,'#fff6cf')+rect(4,13,4,10,edge)+rect(3,14,5,2,light)+rect(2,22,8,3,gold));}
function roomBackground(index){
 const p=ROOM_PALETTES[index%8];
 const bricks=Array.from({length:5},(_,row)=>Array.from({length:5},(_,col)=>rect(col*30-(row%2?15:0),row*15+1,28,13,row%2?p[0]:p[1])).join('')).join('');
 const floor=Array.from({length:5},(_,r)=>Array.from({length:6},(_,c)=>path(`M${c*30-30+r*3} ${83+r*10}h27l5 8h-31Z`,(c+r)%2?p[1]:p[2])).join('')).join('');
 const curtains=path('M0 0H32V8H29V20H25V33H20V47H13V52H0Z',p[3])+path('M0 0H8V43H12V35H16V19H19V0Z',p[2])+path('M12 0H17V20H14V35H9V41H6V43H2V45H14V41H18V30H22V16H24V0Z',p[4])+path('M0 47H16V51H0Z',gold)+rect(1,48,13,1,light)+path('M128 0H96V8H99V20H103V33H108V47H115V52H128Z',p[3])+path('M119 0H124V44H116V37H112V22H108V0Z',p[2])+path('M104 0H108V20H112V33H115V41H124V46H114V42H110V32H106V17H103Z',p[4])+rect(112,47,16,4,gold)+rect(113,48,14,1,light);
 return rect(0,0,128,128,p[0])+bricks+rect(25,16,78,63,ink)+rect(28,18,72,59,p[2])+rect(31,21,66,54,p[0])+path('M31 21H96V23H33V74H31Z',p[1])+path('M28 78H100L128 94V128H0V94Z',p[1])+floor+path('M48 78H80L102 128H26Z',p[3])+path('M48 78H50L30 128H26ZM78 78H80L102 128H98Z',gold)+curtains+sconce(20,37,p[4])+sconce(97,37,p[4])+rect(27,76,74,3,gold)+rect(30,77,68,1,light);
}
function roomDecor(index){
 const c=ROOM_PALETTES[index%8][3];
 let art=pile(8,93,4)+pile(18,100,3)+pile(102,96,3)+group(109,103,coin());
 if(index%3===1)art+=group(9,66,gift(c),1.1)+group(93,69,gift('#8f90ca'),1.05);
 else if(index%3===2)art+=rect(6,83,28,4,edge)+rect(7,82,26,2,light)+group(9,66,gem(c),1.2)+group(94,71,gem('#8bdbc9'),1.2);
 else art+=pile(16,80,5)+pile(95,83,5)+pile(107,87,3)+path('M6 107H22L26 115H2Z',gold)+path('M6 107H21L23 110H5Z',light);
 if(index===4||index>=5)art+=group(43,27,crown());
 else art+=group(57,34,gem(c));
 return art;
}
function chest(index){
 const p=ROOM_PALETTES[index%8],giftBox=index%3===1;
 const body=path('M35 77H94V101H89V104H40V101H35Z',ink)+rect(38,78,53,22,giftBox?p[3]:'#784557')+rect(40,79,3,20,giftBox?p[4]:'#b86770')+rect(86,79,4,21,giftBox?p[2]:'#4e2b44')+rect(38,97,53,4,gold)+rect(40,97,49,1,light)+rect(43,79,6,20,gold)+rect(44,80,2,17,light)+rect(79,79,6,20,gold)+rect(80,80,2,17,light)+rect(59,80,12,11,ink)+rect(61,80,8,8,gold)+rect(62,81,5,3,light)+rect(64,84,2,4,ink)+rect(40,103,10,3,edge)+rect(80,103,10,3,edge);
 const loot='<g class="room-chest-loot">'+pile(45,80,3)+pile(66,79,4)+pile(79,81,2)+(index%3===2?group(55,60,gem(p[3]),1.5):'')+'</g>';
 const lid=giftBox?path('M33 65H96V81H33Z',ink)+rect(35,67,59,11,p[3])+rect(36,67,57,3,p[4])+rect(58,66,13,14,gold)+rect(60,67,4,11,light):path('M35 65H40V59H48V56H81V59H89V65H94V81H35Z',ink)+path('M38 66H43V61H50V59H79V62H86V67H91V78H38Z','#9e5865')+path('M43 63H50V60H78V63H85V67H43Z','#d79088')+rect(39,76,51,3,gold)+rect(40,76,49,1,light)+path('M44 61H50V76H44ZM79 62H85V76H79Z',gold)+path('M45 62H47V75H45ZM80 63H82V75H80Z',light)+rect(59,67,12,9,edge)+group(60,66,gem(p[3]),.6);
 const bow=giftBox?path('M61 67H48V63H43V55H50V58H56V62H61V64H66V59H72V55H80V61H76V65H69V68Z',ink)+path('M60 65H50V62H46V57H49V60H55V63H61V65H65V62H69V59H73V57H77V60H73V63H68V66Z',light)+rect(61,63,7,5,gold):'';
 return '<g class="room-chest">'+rect(32,105,66,3,'#26162e')+loot+body+'<g class="room-chest-lid">'+lid+bow+'</g></g>';
}
function hiddenDoor(){
 return '<g class="room-secret">'+path('M41 28H87V33H92V82H36V33H41Z',edge)+path('M43 30H85V35H89V80H39V35H43Z',gold)+path('M45 33H83V37H86V78H42V37H45Z',light)+path('M46 35H82V38H84V77H44V38H46Z','#281b3d')+rect(49,40,30,34,'#513368')+rect(52,43,24,29,'#836496')+rect(56,47,16,24,'#c4b2ce')+rect(61,50,6,20,'#fff1ca')+path('M44 76H84V80H88V84H40V80H44Z',gold)+rect(42,79,44,2,light)+'<g class="secret-wall">'+rect(40,28,48,50,'#4a2d4b')+rect(42,30,44,2,'#805270')+rect(42,46,44,2,'#805270')+rect(42,63,44,2,'#805270')+rect(62,31,2,15,'#805270')+rect(50,48,2,15,'#805270')+rect(73,48,2,15,'#805270')+rect(63,65,2,12,'#805270')+path('M60 48H68V50H70V56H67V62H61V56H58V50H60Z',gold)+rect(62,51,4,7,ink)+'</g><g class="secret-key" transform="translate(57 48)">'+key()+'</g></g>';
}
function entryPortal(){
 const leaf=side=>'<g class="story-entry-'+side+'">'+rect(side==='left'?46:64,39,18,39,'#674164')+rect(side==='left'?47:65,40,15,36,'#be79ab')+rect(side==='left'?49:67,43,11,29,'#8c578d')+rect(side==='left'?49:67,43,11,2,'#f6bde0')+group(side==='left'?50:68,51,gem('#e6b4d9'),.6)+'</g>';
 return '<g class="story-entry-portal" shape-rendering="crispEdges">'+rect(0,0,128,128,'#32213c')+path('M40 24H88V30H94V84H34V30H40Z',ink)+path('M41 26H87V32H91V81H37V32H41Z',gold)+path('M44 29H84V35H88V78H40V35H44Z',light)+path('M46 35H82V39H84V77H44V39H46Z','#27182e')+leaf('left')+leaf('right')+path('M37 80H91V84H95V88H33V84H37Z',gold)+rect(36,83,56,2,light)+group(52,8,crown(),.55)+'</g>';
}
export function key(){return path('M3 0H11V2H14V10H11V12H9V21H12V24H9V27H5V12H3V10H0V2H3Z',ink)+path('M4 2H10V4H12V8H10V10H8V22H11V23H8V25H6V10H4V8H2V4H4Z',gold)+path('M4 3H10V4H5V8H3V4H4ZM6 12H7V24H6Z',light)+rect(5,5,4,3,'#c2ffe2');}
function machine(){
 return '<g class="room-reel-machine">'+rect(24,105,83,4,ink)+path('M33 39H95V98H101V104H27V98H33Z',ink)+rect(36,42,56,57,gold)+rect(39,45,50,49,'#8e5763')+rect(40,45,48,3,light)+rect(40,91,48,3,edge)+rect(37,97,54,4,light)+rect(29,101,70,2,gold)+rect(36,49,3,43,light)+rect(89,49,3,43,'#a96540')+group(42,18,crown())+path('M41 53H87V82H41Z',ink)+rect(43,55,19,25,'#fff0ce')+rect(66,55,19,25,'#fff0ce')+rect(43,55,19,3,'#d4b5a3')+rect(66,55,19,3,'#d4b5a3')+rect(43,78,19,2,'#d4b5a3')+rect(66,78,19,2,'#d4b5a3')+'<svg x="43" y="55" width="19" height="25" viewBox="0 0 19 25" overflow="hidden"><g class="reel-sign" fill="#8f3977"><text x="9.5" y="19" text-anchor="middle" font-size="23" font-weight="600">×</text></g></svg><svg x="66" y="55" width="19" height="25" viewBox="0 0 19 25" overflow="hidden"><g class="reel-strip"></g></svg>'+rect(45,85,38,3,ink)+rect(46,85,9,2,'#f9b7dd')+rect(58,85,11,2,'#c4f9dc')+rect(72,85,10,2,light)+'<g class="reel-handle">'+rect(95,67,6,7,gold)+rect(99,46,4,27,ink)+rect(100,46,2,25,light)+path('M98 39H104V42H107V48H104V51H98V48H95V42H98Z',ink)+path('M99 41H103V43H105V47H103V49H99V47H97V43H99Z','#e17cb6')+rect(99,42,3,3,'#ffe3e9')+'</g>'+Array.from({length:6},(_,i)=>rect(39+i*10,41,3,3,'#fff3bc')).join('')+'</g>';
}
let serial=0;
export function sceneArtwork(){
 const id='vault-room-'+serial++,pic='./assets/vault/crown-v3-closed.png';
 return `<svg viewBox="0 0 420 460" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="${id}-hole"><circle cx="210" cy="213" r="106"/></clipPath><mask id="${id}-rim"><rect width="420" height="460" fill="white"/><circle cx="210" cy="213" r="106" fill="black"/></mask><clipPath id="${id}-left"><rect x="104" y="107" width="106" height="212"/></clipPath><clipPath id="${id}-right"><rect x="210" y="107" width="106" height="212"/></clipPath></defs>
 <g clip-path="url(#${id}-hole)"><svg x="104" y="107" width="212" height="212" viewBox="0 0 128 128" shape-rendering="crispEdges">
 ${ROOM_PALETTES.map((_,i)=>`<g class="story-room" data-room="${i}">${roomBackground(i)}${roomDecor(i)}${hiddenDoor()}${chest(i)}${machine()}<g class="room-shimmer">${group(33,59,star)}${group(89,76,star,.7)}${group(74,46,star,.55)}</g></g>`).join('')}
 </svg><g class="story-door-left"><g clip-path="url(#${id}-left)"><image href="${pic}" x="58" y="52" width="304" height="304"/></g></g><g class="story-door-right"><g clip-path="url(#${id}-right)"><image href="${pic}" x="58" y="52" width="304" height="304"/></g></g><svg x="104" y="107" width="212" height="212" viewBox="0 0 128 128">${entryPortal()}</svg></g>
 <image href="${pic}" x="58" y="52" width="304" height="304" mask="url(#${id}-rim)"/>
 <g class="story-waiting-door" transform="translate(327 248)" shape-rendering="crispEdges">${path('M4 0H26V4H30V38H0V4H4Z',ink)+path('M5 2H25V5H28V36H2V5H5Z',gold)+rect(5,6,20,27,'#49304f')+rect(8,8,14,23,'#9876ad')+rect(11,11,8,19,'#e3cbe4')+rect(14,13,2,15,light)+rect(2,35,26,2,light)}</g>
 <g class="story-sparkles" shape-rendering="crispEdges">${Array.from({length:8},()=>'<g opacity="0">'+star+'</g>').join('')}</g>
 </svg>`;
}
export const storyCoin=()=>'<svg viewBox="0 0 14 10" shape-rendering="crispEdges" aria-hidden="true">'+coin()+'</svg>';
