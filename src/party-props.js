// Two-pixel clusters, stepped contours and warm highlights echo Faith's sprite.
// Kept as editable SVG art so decorations stay sharp on a transparent source.
const ink='#392039';
function painter(svgNode,transform,kind){
 const group=svgNode('g',{transform,'data-party-prop':kind});
 return {group,
  path(d,fill){group.append(svgNode('path',{d,fill}));},
  rect(x,y,w,h,fill){group.append(svgNode('rect',{x,y,width:w,height:h,fill}));},
  pixels(fill,rects){for(const [x,y,w=2,h=2]of rects)this.rect(x,y,w,h,fill);}
 };
}
export function birthdayCake(svgNode){
 const p=painter(svgNode,'translate(208 326)','cake');
 // Gold pedestal, with a shaded lip and a little foot.
 p.path('M4 70H86V74H92V80H84V84H56V92H66V96H24V92H34V84H6V80H0V74H4Z',ink);
 p.path('M4 74H88V78H82V82H8V78H4Z','#ae6b4e');
 p.path('M6 72H84V74H88V76H80V78H10V76H6Z','#ffe8b0');
 p.path('M12 78H80V80H54V84H38V80H12Z','#e7ab69');
 p.path('M38 82H52V92H60V94H30V92H38Z','#c78557');
 p.pixels('#ffe8b0',[[38,84,4,8],[30,92,12,2],[14,74,56,2]]);
 // Rounded vanilla layers, raspberry filling and shaded right edge.
 p.path('M10 30H78V34H84V68H80V72H70V74H22V72H12V68H8V36H10Z',ink);
 p.path('M12 36H78V40H82V66H76V70H22V68H12Z','#d59b91');
 p.path('M14 36H72V40H76V66H68V70H24V68H14Z','#edb5a0');
 p.path('M16 36H64V42H68V66H60V68H26V66H16Z','#ffd8b6');
 p.pixels('#ffe8c8',[[18,42,12,10],[30,44,22,8],[18,56,42,8],[22,64,32,2]]);
 p.path('M12 52H20V54H68V52H80V58H72V60H22V58H12Z','#a83e74');
 p.path('M14 52H22V54H68V52H76V54H68V56H22V54H14Z','#f182aa');
 p.pixels('#ffb6c7',[[22,54,16,2],[46,54,8,2]]);
 // Lilac icing cap: light on the left, plum/lavender drips on the right.
 p.path('M22 24H68V26H78V30H84V38H80V46H76V48H72V42H64V48H60V50H56V42H44V46H38V42H28V48H24V50H20V44H14V40H8V32H12V28H22Z',ink);
 p.path('M22 26H68V28H76V32H82V36H78V44H74V38H62V46H58V38H42V42H40V38H26V46H22V40H16V36H10V32H16V30H22Z','#9d5ca6');
 p.path('M22 26H66V28H74V32H78V36H60V40H56V38H42V40H38V38H24V42H20V38H14V34H12V32H20V30H22Z','#e694ca');
 p.path('M24 26H62V28H72V30H76V32H68V34H24V32H16V30H24Z','#ffbee5');
 p.path('M26 28H60V30H66V32H28V30H20V28Z','#fff0f1');
 p.pixels('#efbbd9',[[22,38,2,6],[58,38,2,6],[74,38,2,4]]);
 // Piped cream along the base; each rosette has its own shadow and highlight.
 for(const [x,y]of [[14,64],[24,68],[36,70],[48,70],[60,70],[72,66]]){
  p.path(`M${x} ${y}h6v2h2v4h-2v2h-6v-2h-2v-4h2Z`,'#b97795');
  p.path(`M${x} ${y-2}h4v2h2v4h-8v-4h2Z`,'#ffe2d5');
  p.pixels('#fff4dc',[[x,y,2,2],[x-2,y+2,2,2]]);
 }
 // Tiny heart decorations and sugar sprinkles.
 for(const x of [26,46,64]){
  p.path(`M${x} 44h2v2h2v-2h2v4h-2v2h-2v-2h-2Z`,'#cf638f');
  p.rect(x,44,2,2,'#ffb0c5');
 }
 p.pixels('#bb7aa6',[[32,30,4,2],[60,32,2,2]]);
 p.pixels('#fff1ce',[[20,32,2,2],[52,30,4,2],[68,30,2,2]]);
 p.pixels('#79bda9',[[28,32,2,2],[62,28,4,2]]);
 // Sugared berries and a tiny gold star on the front of this celebration cake.
 for(const x of [18,70]){p.path(`M${x} 28h6v2h2v4h-2v2h-6v-2h-2v-4h2Z`,'#aa3b75');p.rect(x,28,4,4,'#f879ac');p.rect(x,28,2,2,'#ffd9e7');p.rect(x+2,26,2,2,'#77bd9e');}
 p.path('M44 58h2v3h3v2h-2v4h-2v-2h-2v-2h-2v-2h3Z','#b27345');p.path('M44 57h2v3h3v2h-3v3h-2v-3h-3v-2h3Z','#ffe8a6');
 p.pixels('#fff3d3',[[14,42,2,8],[18,60,2,4],[34,74,20,2]]);
 // Striped candles and individual animated amber/cream flames.
 for(const [x,base,shade]of [[24,'#f494b7','#b95f8d'],[44,'#b5a0ed','#8067ae'],[64,'#9cdbc6','#549d91']]){
  p.path(`M${x-2} 10h8v20h-8Z`,ink);p.rect(x,10,4,20,base);p.rect(x+2,12,2,18,shade);
  p.pixels('#fff0d4',[[x,14,2,2],[x+2,16,2,2],[x,22,2,2],[x+2,24,2,2]]);
  p.rect(x,8,2,4,ink);
  const flame=svgNode('g',{class:'candle-flame'});
  for(const [d,fill]of [[`M${x} -4h2v4h2v2h2v6h-2v2h-6V8h-2V2h2V0h2Z`,'#bc684f'],[`M${x} -2h2v4h2v6h-6V2h2Z`,'#ffc879'],[`M${x} 2h2v6h-2Z`,'#fff2ba']])flame.append(svgNode('path',{d,fill}));
  p.group.append(flame);
 }
 return p.group;
}
export function birthdayGifts(svgNode){
 const p=painter(svgNode,'translate(4 338)','presents');
 // Tall lavender parcel with a visible side plane and an overhanging lid.
 p.path('M2 28H40V30H50V76H44V80H4V76H0V30H2Z',ink);
 p.path('M4 34H38V76H6V74H4Z','#a783c8');
 p.rect(38,34,10,40,'#584078');p.rect(38,34,4,40,'#81619f');
 p.rect(6,36,28,36,'#c4a0e9');p.rect(6,36,4,34,'#d6b5eb');
 p.rect(10,38,22,2,'#cfa9e5');p.rect(8,70,28,4,'#9772b8');
 // Scattered little wrapping-paper stars.
 for(const [x,y]of [[12,46],[30,42],[12,64],[30,60]]){
  p.path(`M${x} ${y-2}h2v2h2v2h-2v2h-2v-2h-2v-2h2Z`,'#e9cfed');
 }
 p.pixels('#9270b3',[[32,52,2,2],[10,56,2,2],[44,42,2,4],[44,60,2,4]]);
 // Satin ribbon: gold edge, pale center and a fold shadow beneath the lid.
 p.rect(18,32,10,44,'#b77d54');p.rect(18,32,8,42,'#f1c984');p.rect(20,32,2,42,'#ffefbd');
 p.path('M0 26H40V28H50V36H40V38H0Z',ink);
 p.path('M2 28H38V30H48V34H40V36H2Z','#9270b3');
 p.rect(2,28,36,6,'#d6b5eb');p.rect(4,28,30,2,'#ebd2f3');
 p.rect(18,28,10,8,'#f1c984');p.rect(20,28,2,8,'#fff0c7');
 // Full looped bow, with dark inset folds rather than a flat silhouette.
 p.path('M18 22H10V20H4V16H2V8H8V6H14V8H18V12H24V10H28V6H34V8H40V14H38V18H32V22H26V28H18Z',ink);
 p.path('M18 20H10V18H6V10H12V10H16V14H20V20Z','#dfab6f');
 p.path('M8 10H12V12H16V16H18V18H12V16H8Z','#ffe6ac');
 p.path('M10 14H14V16H18V18H12V16H10Z','#ad7153');
 p.path('M24 20V14H28V10H32V8H36V10H38V14H34V18H28V20Z','#e8b777');
 p.path('M26 16H30V12H34V10H36V12H34V16H30V18H26Z','#ffedb8');
 p.path('M28 18H32V16H36V14H34V18H28Z','#b67b52');
 p.path('M18 18H26V24H24V30H20V28H16V24H18Z','#e9b779');
 p.rect(20,18,4,4,'#fff0c4');p.rect(24,20,2,4,'#ba7d55');
 p.path('M16 24H20V36H16V34H14V30H16Z','#e9b779');p.rect(16,26,2,6,'#ffe9b7');
 // A hanging heart tag and satin glints give the parcel its own finish.
 p.path('M32 31v10h-2v4', 'none');p.rect(32,32,1,11,'#ffeab8');
 p.path('M30 42h6v2h2v8h-2v2h-6v-2h-2v-8h2Z','#684165');p.rect(30,44,6,8,'#ffe4d9');p.path('M31 46h1v1h2v-1h1v3h-1v1h-2v-1h-1Z','#dc71a2');
 p.pixels('#fff6d2',[[6,30,8,1],[20,38,2,12],[26,18,2,2]]);
 // A mint parcel in front, turned slightly to reveal its darker right side.
 p.path('M38 52H68V54H78V80H70V84H38V82H34V54H38Z',ink);
 p.path('M38 56H68V80H64V82H38Z','#62aa98');
 p.rect(40,58,24,20,'#a9ebce');p.rect(40,58,4,18,'#cef0d1');
 p.rect(68,56,8,24,'#4f8d87');p.rect(68,56,2,24,'#70af9f');
 p.rect(40,78,24,2,'#69a996');
 p.pixels('#e7f1d5',[[44,64,2,2],[62,70,2,2],[44,76,2,2]]);
 p.rect(50,56,8,26,'#c77198');p.rect(50,56,6,26,'#f09db7');p.rect(52,56,2,24,'#ffd0da');
 p.path('M34 52H66V50H70V52H78V60H68V62H34Z',ink);
 p.path('M36 54H68V52H70V54H76V58H68V60H36Z','#78b3a2');
 p.rect(36,54,30,4,'#b5e2c9');p.rect(38,54,26,2,'#d8f0d5');
 p.rect(50,54,8,6,'#efa1bc');p.rect(52,54,2,4,'#ffe0de');
 p.path('M50 50H42V48H38V40H44V42H48V44H52V42H56V38H62V40H66V46H62V50H58V54H50Z',ink);
 p.path('M50 48H44V46H40V42H44V44H48V46H52V50H50Z','#efa1bc');
 p.rect(42,42,2,2,'#ffdadb');p.rect(46,46,4,2,'#be7099');
 p.path('M54 48V44H58V40H62V42H64V44H60V48Z','#e88dad');
 p.path('M56 44H58V42H62V44H60V46H56Z','#ffd0d6');
 p.rect(50,48,8,6,'#d57d9f');p.rect(52,48,4,4,'#ffbdcd');
 p.path('M58 52H62V62H60V60H58Z','#e997b3');p.rect(58,54,2,4,'#ffd0d6');
 return p.group;
}
