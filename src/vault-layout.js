// Registered against the two approved Crown Vault sprites (1254 × 1254).
// The open sprite is the stationary frame; only the closed door cutouts move.
export const VAULT_ART={x:58,y:52,size:304,source:1254};
export const CHAMBER_SLOTS=[
 {x:192,y:250,w:410,h:390,cx:413,cy:469,labelX:412,labelY:608,numberX:176,numberY:495,pivotX:207,pivotY:483,side:-1,
  path:'M594 254V489L447 639H214Q192 638 192 613Q215 345 558 255Q582 250 594 254Z'},
 {x:650,y:250,w:394,h:390,cx:839,cy:469,labelX:839,labelY:608,numberX:1070,numberY:495,pivotX:1036,pivotY:483,side:1,
  path:'M655 254Q671 250 697 255Q1024 341 1044 613Q1044 638 1022 639H802L655 490Z'},
 {x:192,y:697,w:410,h:354,cx:426,cy:858,labelX:457,labelY:966,numberX:176,numberY:866,pivotX:207,pivotY:849,side:-1,
  path:'M213 697H445L595 846V1031Q595 1052 574 1048Q240 1018 195 730Q191 703 213 697Z'},
 {x:650,y:697,w:394,h:354,cx:824,cy:858,labelX:791,labelY:966,numberX:1070,numberY:866,pivotX:1036,pivotY:849,side:1,
  path:'M802 697H1022Q1048 701 1043 730Q999 1019 675 1048Q655 1051 655 1030V846Z'},
 {x:477,y:522,w:295,h:294,cx:624,cy:667,labelX:624,labelY:775,numberX:624,numberY:525,pivotX:478,pivotY:668,side:0,
  path:'M624 522L771 668L624 815L477 668Z'}
];
export function chamberDoorTransforms(index,open){
 const s=CHAMBER_SLOTS[index%5],p=Math.max(0,Math.min(1,open)),width=Math.cos(p*Math.PI*.485);
 const hinge=(x,side)=>`translate(${x} ${s.pivotY}) matrix(${width} ${side*p*.022} 0 1 0 0) translate(${-x} ${-s.pivotY})`;
 const left=hinge(s.pivotX,s.side===1?-1:1),right=s.side===0?hinge(771,-1):null,thickness=Math.sin(p*Math.PI*.485)*13;
 return {left,right,leftEdge:`translate(${s.side===1?-thickness:thickness} 0) ${left}`,rightEdge:right?`translate(${-thickness} 0) ${right}`:null};
}
