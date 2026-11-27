import {RESULT_VALUES} from './community-engine.js';
const W = 1000, H = 650, TAU = Math.PI * 2;
const C = {ink:'#190f27', deep:'#120c1d', panel:'#241634', plum:'#51366c', violet:'#aa7fea', lilac:'#d9c1ff', pink:'#f3adc9', gold:'#edcd8c', cream:'#fff4df', muted:'#b6a4c7', mint:'#b9e5d7'};
const clamp = (v, a=0, b=1) => Math.max(a, Math.min(b, Number(v) || 0));
const ease = t => 1 - Math.pow(1-clamp(t), 3);
const short = (s, n=10) => String(s || 'Guest').length > n ? String(s).slice(0,n-1)+'…' : String(s || 'Guest');
function text(ctx,s,x,y,size=20,color=C.cream,weight=800,align='center') {ctx.fillStyle=color;ctx.font=`${weight} ${size}px Nunito, sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(String(s),x,y);}
function box(ctx,x,y,w,h,r=16,fill=C.panel,stroke=null) {ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.4;ctx.stroke();}}
function circle(ctx,x,y,r,fill,stroke=null,line=1){ctx.beginPath();ctx.arc(x,y,Math.max(0,r),0,TAU);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke();}}
function line(ctx,x1,y1,x2,y2,color,width=1){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function crown(ctx,x,y,s=20,color=C.gold){ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.moveTo(-s*.6,-s*.25);ctx.lineTo(-s*.32,s*.38);ctx.lineTo(s*.32,s*.38);ctx.lineTo(s*.6,-s*.25);ctx.lineTo(s*.23,-s*.02);ctx.lineTo(0,-s*.55);ctx.lineTo(-s*.23,-s*.02);ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1;ctx.stroke();ctx.restore();}
function gem(ctx,x,y,r=15){ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.moveTo(0,r);ctx.lineTo(-r,-r*.38);ctx.lineTo(-r*.58,-r);ctx.lineTo(r*.58,-r);ctx.lineTo(r,-r*.38);ctx.closePath();ctx.fillStyle=C.pink;ctx.fill();line(ctx,-r,-r*.38,r,-r*.38,'#fff0f4',1.5);line(ctx,-r*.5,-r*.38,0,r,'#ffe3ee',1);line(ctx,r*.5,-r*.38,0,r,'#ab6c9b',1);ctx.restore();}
function allEntries(round,players){if(round?.entries?.length)return round.entries;return (players||[]).flatMap((p,pi)=>Array.from({length:Math.max(0,Math.min(10,Number(p.count)||0))},(_,index)=>({id:`preview-${pi}-${index}`,name:p.name,color:p.color||['rose','lilac','gold'][pi%3],index:index+1,amount:null,stages:null})));}
function base(ctx,time,reduced){ctx.clearRect(0,0,W,H);const g=ctx.createRadialGradient(500,270,30,500,300,540);g.addColorStop(0,'#372045');g.addColorStop(.6,'#20142f');g.addColorStop(1,C.deep);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.strokeStyle='rgba(207,174,235,.055)';ctx.lineWidth=1;for(let x=40;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=10;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}for(let i=0;i<25;i++){const x=35+(i*193)%930,y=25+(i*137)%590;const a=reduced?.34:.27+.1*Math.sin(time*.6+i);ctx.globalAlpha=a;circle(ctx,x,y,i%4===0?2:1,C.gold);}ctx.globalAlpha=1;}
function lockChip(ctx,x,y,title,value,active,width=170){box(ctx,x-width/2,y-30,width,60,16,active?'#4c3454':'#251a33',active?'#b99a78':'#4d3c5b');circle(ctx,x-width/2+24,y,7,active?C.gold:'#6a587d');text(ctx,title,x+4,y-11,11,active?C.gold:C.muted,900);text(ctx,value,x+4,y+12,24,active?C.cream:C.muted,900);}
function orbit(ctx,{progress:p,round,entries,reducedMotion,time}){
 const active=!!round, done=active&&p>=.9, amount=round?.sharedAmount??round?.entries?.[0]?.amount;
 const stages=round?.sharedStages||round?.entries?.[0]?.stages||[10,0,0];
 const centerX=500,centerY=300,r=190,n=RESULT_VALUES.length,step=TAU/n;
 const slot=Math.max(0,RESULT_VALUES.indexOf(amount??30));
 const target=TAU*5-Math.PI/2-(slot+.5)*step;
 const rotation=active?(reducedMotion?(p>=.87?target:0):target*ease(p/.88)):(reducedMotion?0:time*.024);
 ctx.save();ctx.setLineDash([3,9]);circle(ctx,centerX,centerY,248,null,'#664b7b');ctx.setLineDash([]);ctx.restore();
 circle(ctx,centerX,centerY,r+10,'#161021','#9a7caa',3);circle(ctx,centerX,centerY,r+5,null,C.gold,1);
 ctx.save();ctx.translate(centerX,centerY);ctx.rotate(rotation);
 for(let i=0;i<n;i++){const a=i*step,b=(i+1)*step;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,a,b);ctx.closePath();ctx.fillStyle=i%2?'#ad88cb':'#6f4d8d';ctx.fill();ctx.strokeStyle='rgba(255,240,255,.25)';ctx.lineWidth=1;ctx.stroke();ctx.save();ctx.rotate((i+.5)*step);text(ctx,RESULT_VALUES[i],r-30,0,21,i%2?'#271437':C.cream,900);ctx.restore();}
 ctx.restore();circle(ctx,centerX,centerY,145,C.deep,'#e2bd82',2);circle(ctx,centerX,centerY,137,'#2b183b','#68447d',2);
 const glow=ctx.createRadialGradient(centerX,centerY,5,centerX,centerY,124);glow.addColorStop(0,'#60405d');glow.addColorStop(1,'#291835');circle(ctx,centerX,centerY,126,glow);
 crown(ctx,centerX,centerY-67,34);text(ctx,done?'THE ROOM LOCKS':active?'ORBIT LOCK':'FAITH’S',centerX,centerY-23,16,C.gold,900);
 if(!active){text(ctx,'ORBIT',centerX,centerY+17,37,C.cream,900);text(ctx,'Your room. One reveal.',centerX,centerY+58,14,C.lilac,700);}
 else {let v=p<.32?'?':p<.62?stages[0]:p<.88?stages[0]+stages[1]:amount;text(ctx,typeof v==='number'?`$${v}`:v,centerX,centerY+22,64,C.cream,900);text(ctx,p<.32?'Setting the base':p<.62?'First lock sealed':p<.88?'Second lock sealed':'Final amount',centerX,centerY+77,14,C.lilac,700);}
 gem(ctx,centerX,centerY-r+2,22);
 const count=entries.length;entries.forEach((entry,i)=>{const theta=-Math.PI/2+i/Math.max(count,1)*TAU+(active&&!reducedMotion?Math.min(p,.9)*TAU*.8:0);const x=centerX+Math.cos(theta)*365,y=centerY+Math.sin(theta)*230;const size=count>24?15:21;const color=[C.lilac,C.pink,C.gold,C.mint][i%4];circle(ctx,x,y,size,C.deep,color,2);if(count<=24)crown(ctx,x,y,size*.72,color);if(count<=24){const label=short(entry.name,count>14?6:10);const ly=y<centerY?y-size-16:y+size+16;box(ctx,x-45,ly-11,90,23,9,'#24182f');text(ctx,label,x,ly,count>14?11:12,color,800);}else text(ctx,String(i+1),x,y,11,color,900);});
 lockChip(ctx,300,615,'BASE',active&&p>=.32?`$${stages[0]}`:'?',active&&p>=.32,175);
 lockChip(ctx,500,615,'SECOND LOCK',active&&p>=.62?`+$${stages[1]}`:'?',active&&p>=.62,175);
 lockChip(ctx,700,615,'FINAL LOCK',active&&p>=.88?`+$${stages[2]}`:'?',active&&p>=.88,175);
}
const BUCKETS=[[0,14],[15,29],[30,44],[45,59],[60,74],[75,90]];
function bucketFor(amount){return Math.max(0,BUCKETS.findIndex(([low,high])=>Number(amount)>=low&&Number(amount)<=high));}
function drop(ctx,{progress:p,round,entries,reducedMotion,time}){
 const active=!!round,done=active&&p>=.91;
 const trayY=526,trayW=142,gap=12,startX=44;
 const counts=BUCKETS.map((_,b)=>entries.filter(e=>active&&bucketFor(e.amount)===b).length);
 const settled=BUCKETS.map(()=>0);
 for(let row=0;row<8;row++){const cols=row%2?10:11;for(let col=0;col<cols;col++){const x=92+col*81+(row%2?40.5:0),y=152+row*43;circle(ctx,x,y,4.5,'#e2c3e9');circle(ctx,x,y,8,null,'rgba(210,171,230,.11)');}}
 for(let b=0;b<6;b++){const x=startX+b*(trayW+gap);box(ctx,x,trayY,trayW,89,13,'#2e203c',b===5?'#9f7d46':'#6a4f7b');line(ctx,x+10,trayY+3,x+trayW-10,trayY+3,C.gold,3);text(ctx,`$${BUCKETS[b][0]}–${BUCKETS[b][1]}`,x+trayW/2,trayY+104,18,C.gold,900);}
 entries.forEach((entry,i)=>{
  const b=active?bucketFor(entry.amount):i%6,index=active?entries.slice(0,i).filter(e=>bucketFor(e.amount)===b).length:Math.floor(i/6),count=active?counts[b]:Math.ceil(entries.length/6);
  const cols=Math.min(8,Math.max(1,Math.ceil(Math.sqrt(count*1.8)))),rows=Math.ceil(count/cols),cellW=(trayW-16)/cols,cellH=65/Math.max(rows,1),radius=Math.max(4,Math.min(19,cellW*.4,cellH*.42));
  const endX=startX+b*(trayW+gap)+8+cellW*(index%cols+.5),endY=trayY+12+cellH*(Math.floor(index/cols)+.5);
  const start=entries.length===1?500:80+(i%12)*(840/Math.min(11,Math.max(1,entries.length-1)));
  const offset=entries.length>1?i/(entries.length-1)*.09:0;
  const t=clamp((p-.11-offset)/.69);let x,y;
  if(!active){x=start;y=85+Math.floor(i/12)*22;}
  else if(reducedMotion){x=t<1?start:endX;y=t<1?90+Math.floor(i/12)*22:endY;}
  else {const fall=clamp(t/.85);x=start+(endX-start)*ease(fall)+Math.sin(t*Math.PI*12+i*.9)*Math.sin(Math.PI*fall)*24;y=90+(endY-90)*t;if(t>=1){x=endX;y=endY;}else if(t>.87)y-=Math.abs(Math.sin((t-.87)/.13*Math.PI*2))*8;}
  if(t>=1&&active)settled[b]++;
  const color=[C.lilac,C.pink,C.gold,C.mint][i%4],moving=!active||t<1,rr=moving?(entries.length>24?13:19):radius;
  circle(ctx,x,y,rr,'#2d1a3d',color,1.6);if(!moving&&rr>10)text(ctx,entry.amount,x,y,Math.min(16,rr*.9),C.cream,900);else crown(ctx,x,y,rr*.9,color);
  if(moving&&entries.length<=24){const label=short(entry.name,8);box(ctx,x-37,y-rr-23,74,19,7,'#21162d');text(ctx,label,x,y-rr-13,10,color,900);}
 });
 if(active){text(ctx,done?'Every crown has a result.':p<.13?'Crowns ready at the gate':p<.55?'Down through the crown field':'The final crowns are settling',500,69,21,C.cream,900);}
 else text(ctx,'Ready at the gate',500,61,20,C.cream,900);
}
function vault(ctx,{progress:p,round,entries,reducedMotion,time}){
 const active=!!round,done=active&&p>=.91,n=entries.length;
 const cols=n<=3?Math.max(n,1):n<=8?4:n<=15?5:n<=24?6:10,rows=Math.max(1,Math.ceil(n/cols));
 const gap=n>24?10:16,cw=Math.min(205,(870-gap*(cols-1))/cols),ch=Math.min(154,(390-gap*(rows-1))/rows),gridW=cw*cols+gap*(cols-1),gridH=ch*rows+gap*(rows-1),x0=(W-gridW)/2,y0=193+(390-gridH)/2;
 const wave=p<.34?0:p<.64?1:2;
 const hubY=100;line(ctx,90,hubY,910,hubY,'#59416d',2);
 if(active&&!reducedMotion&&!done){const wp=(p*3)%1;const grad=ctx.createLinearGradient(90,0,910,0);grad.addColorStop(0,'rgba(227,184,238,0)');grad.addColorStop(clamp(wp,0.001,.999),'#edcd8c');grad.addColorStop(1,'rgba(227,184,238,0)');line(ctx,90,hubY,910,hubY,grad,4);}
 circle(ctx,500,hubY,39,C.deep,C.gold,2);crown(ctx,500,hubY,31);text(ctx,active?(done?'OPEN':`PULSE ${wave+1} / 3`):'VAULT CIRCUIT',500,hubY+64,17,C.gold,900);
 entries.forEach((entry,i)=>{const col=i%cols,row=Math.floor(i/cols),x=x0+col*(cw+gap),y=y0+row*(ch+gap),finish=.76+(n>1?i/(n-1)*.14:0),opened=active&&p>=finish;const color=opened?C.gold:[C.lilac,C.pink,C.mint][i%3];
  if(row===0){line(ctx,x+cw/2,hubY+1,x+cw/2,y-8,'#4f395f',1);circle(ctx,x+cw/2,y-8,3,opened?C.gold:'#70587c');}
  box(ctx,x,y,cw,ch,Math.min(17,cw*.14),opened?'#443346':'#271a36',opened?'#d6ad71':'#76548e');
  box(ctx,x+6,y+6,cw-12,ch-12,Math.min(13,cw*.1),null,opened?'#7d6358':'#473153');
  const nameSize=n>24?10:n>15?12:14;
  text(ctx,short(entry.name,n>24?7:12),x+cw/2,y+ch*.17,nameSize,color,900);
  if(opened){text(ctx,`$${entry.amount}`,x+cw/2,y+ch*.56,Math.min(43,cw*.34,ch*.37),C.cream,900);text(ctx,`ENTRY ${Number(entry.index)||1}`,x+cw/2,y+ch*.84,n>24?8:10,C.gold,900);}
  else {const rad=Math.min(26,ch*.18,cw*.18),cy=y+ch*.57;circle(ctx,x+cw/2,cy,rad,'#392446','#8b659e',2);const rot=active&&!reducedMotion?(p*TAU*2+i*.27):0;for(let a=0;a<3;a++){const angle=rot+a*TAU/3;line(ctx,x+cw/2,cy,x+cw/2+Math.cos(angle)*rad*.74,cy+Math.sin(angle)*rad*.74,color,Math.max(2,rad*.12));}circle(ctx,x+cw/2,cy,rad*.25,color);for(let j=0;j<3;j++){const lit=active&&p>=[.3,.6,.75][j];circle(ctx,x+cw/2+(j-1)*Math.min(16,cw*.15),y+ch*.84,n>24?2.5:4,lit?C.gold:'#59416e');}}
 });
 text(ctx,done?'All seals open. Your room’s results are ready.':active?(p<.34?'First pulse · wake the circuit':p<.64?'Second pulse · turn the locks':'Final pulse · open every seal'):'Every entry gets a vault. All open in one round.',500,616,17,C.muted,800);
}

const ROULETTE_COLORS=['rose','lilac','gold'];
const ROULETTE_BASES=[5,10,15,20,25,30,35,40];
const colorInk={rose:C.pink,lilac:C.lilac,gold:C.gold};
function roulette(ctx,{progress:p,round,entries,reducedMotion,time}){
 const active=!!round,done=active&&p>=.9,index=round?.rouletteIndex??0;
 const sharedBase=round?.sharedBase??ROULETTE_BASES[Math.floor(index/3)];
 const sharedColor=round?.sharedColor??ROULETTE_COLORS[index%3];
 const cx=310,cy=305,r=211,step=TAU/24;
 // Both the rotor and the counter-rotating bead settle on the same indexed
 // pocket at twelve o'clock. Outcome data comes only from the round engine.
 const target=TAU*4-Math.PI/2-(index+.5)*step;
 const rotation=active?(reducedMotion?(p>=.87?target:0):target*ease(p/.87)):(reducedMotion?0:time*.018);
 const outer=ctx.createRadialGradient(cx,cy,r-4,cx,cy,r+35);outer.addColorStop(0,'#a78a60');outer.addColorStop(.25,'#e4c991');outer.addColorStop(.45,'#62476a');outer.addColorStop(.75,'#2c1b3e');outer.addColorStop(1,'#9c7caa');
 circle(ctx,cx,cy,r+35,outer,'#d6b986',2);circle(ctx,cx,cy,r+24,null,'#6f527e',2);circle(ctx,cx,cy,r+15,null,'#1a1025',8);
 ctx.save();ctx.translate(cx,cy);ctx.rotate(rotation);
 for(let i=0;i<24;i++){
  const a=i*step,b=(i+1)*step,color=colorInk[ROULETTE_COLORS[i%3]];
  ctx.beginPath();ctx.arc(0,0,r,a,b);ctx.arc(0,0,145,b,a,true);ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='#493245';ctx.lineWidth=2;ctx.stroke();
  ctx.save();ctx.rotate((i+.5)*step);text(ctx,ROULETTE_BASES[Math.floor(i/3)],179,0,19,'#2b1533',900);ctx.restore();
 }
 ctx.restore();circle(ctx,cx,cy,145,C.deep,C.gold,2);
 const velvet=ctx.createRadialGradient(cx-25,cy-30,3,cx,cy,137);velvet.addColorStop(0,'#603d5e');velvet.addColorStop(.7,'#36213e');velvet.addColorStop(1,'#23152f');circle(ctx,cx,cy,135,velvet,'#76517f',1);
 crown(ctx,cx,cy-68,33);
 text(ctx,done?'THE ROOM’S BASE':'VELVET',cx,cy-23,17,C.gold,900);
 text(ctx,done?`$${sharedBase}`:'ROULETTE',cx,cy+20,done?59:31,C.cream,900);
 text(ctx,done?`${sharedColor.toUpperCase()} ×2`:active?'Follow the bead':'Choose a colour. Join the room.',cx,cy+76,done?18:13,done?colorInk[sharedColor]:C.lilac,900);
 let beadAngle=-Math.PI/2,beadRadius=r+18;
 if(active){
  beadAngle=reducedMotion?-Math.PI/2:-Math.PI/2+TAU-TAU*9*ease(p/.87);
  beadRadius=reducedMotion?(p>=.87?179:r+18):(r+18)+(179-r-18)*ease((p-.71)/.16);
  if(!reducedMotion&&p>.87&&p<.93)beadRadius+=Math.sin((p-.87)/.06*Math.PI*2)*(1-(p-.87)/.06)*5;
 }
 const bx=cx+Math.cos(beadAngle)*beadRadius,by=cy+Math.sin(beadAngle)*beadRadius;
 circle(ctx,bx+1,by+3,10,'rgba(0,0,0,.35)');circle(ctx,bx,by,8.5,'#fff3db','#c8a86d',1);circle(ctx,bx-2,by-3,2.5,'#fff');
 text(ctx,active?(done?'One landing. Three colour results.':p<.3?'The room is in. The bead is rolling.':p<.72?'A little suspense. Stay with the bead.':'Slowing into the final pocket.'):'24 pockets · 3 colours · one shared spin',cx,584,16,C.muted,800);
 for(let c=0;c<3;c++){
  const key=ROULETTE_COLORS[c],color=colorInk[key],lane=entries.filter(e=>e.color===key),x=603,y=66+c*181,w=348,h=165,matched=done&&sharedColor===key;
  box(ctx,x,y,w,h,17,matched?'#4a3149':'#271a35',matched?color:'#5a406d');
  circle(ctx,x+24,y+25,6,color);text(ctx,key.toUpperCase(),x+42,y+25,14,color,900,'left');
  text(ctx,`${lane.length} entr${lane.length===1?'y':'ies'}`,x+w-18,y+25,12,C.muted,800,'right');
  text(ctx,done?`$${sharedBase*(matched?2:1)}`:'—',x+23,y+62,34,C.cream,900,'left');
  text(ctx,done?(matched?'MATCHING COLOUR ×2':'BASE AMOUNT'):'MATCHING COLOUR ×2',x+w-18,y+61,10,matched?color:C.muted,900,'right');
  const people=new Map();for(const e of lane){const item=people.get(e.name)||{name:e.name,count:0};item.count++;people.set(e.name,item);}
  const names=[...people.values()],visible=names.slice(0,9),cols=names.length>4?3:2,gap=6,cw=(w-36-gap*(cols-1))/cols;
  visible.forEach((person,j)=>{const tx=x+18+(j%cols)*(cw+gap),ty=y+87+Math.floor(j/cols)*21;box(ctx,tx,ty,cw,18,6,'#1b1226');circle(ctx,tx+7,ty+9,2.3,color);text(ctx,`${short(person.name,cols===3?8:13)} ×${person.count}`,tx+15,ty+9,cols===3?9:10,C.cream,800,'left');});
  if(names.length>9)text(ctx,`+ ${names.length-9} more people · full list below`,x+18,y+153,9,C.muted,800,'left');
  if(!lane.length)text(ctx,'No entries on this colour yet',x+18,y+111,12,C.muted,700,'left');
 }
}

/** Render a deterministic view of an already-created round. No outcomes are drawn here. */
export function renderCommunity(canvas,{game='orbit',progress=0,round=null,players=[],reducedMotion=false,time=0}={}){
 if(!canvas?.getContext)return;const ctx=canvas.getContext('2d');if(!ctx)return;
 const cssWidth=Math.max(1,canvas.clientWidth||W),dpr=Math.min(2,globalThis.devicePixelRatio||1),width=Math.round(cssWidth*dpr),height=Math.round(width*H/W);
 if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
 ctx.setTransform(width/W,0,0,height/H,0,0);ctx.imageSmoothingEnabled=true;
 const entries=allEntries(round,players).slice(0,50),options={game,progress:clamp(progress),round,entries,reducedMotion,time:Number(time)||0};
 base(ctx,options.time,reducedMotion);
 // Keep the HTML arena status clear at every canvas width. Preserve circles
 // by fitting the complete composition uniformly below the responsive inset.
 const headerInset=clamp(42000/cssWidth,65,130),scale=(H-headerInset)/(H-40);
 ctx.save();ctx.translate(W*(1-scale)/2,headerInset-40*scale);ctx.scale(scale,scale);
 ({orbit,drop,vault,roulette}[game]||orbit)(ctx,options);ctx.restore();
}
