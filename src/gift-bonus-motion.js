import {isGiftExpansion} from './gift-game.js';

// Sample the committed reveal clock, not DOM insertion time. Reconnecting displays
// join the same beat, and every landing finishes before the next pick unlocks.
export const BONUS_MOTION_MS=1000;
export const GIFT_ARRIVAL_MS=430;
export const giftArrivalCount=(kind,rows,cols)=>kind==='row'?cols:kind==='column'?rows:Math.max(rows,cols);
export const giftArrivalDelay=(rank,count)=>160+rank*Math.min(60,280/Math.max(1,count-1));
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const mix=(a,b,t)=>a+(b-a)*t;
export function giftBonusMotion(round,time,reduced=false){
 const shot=round?.flight??round?.opened.at(-1);
 if(!shot||shot.prize.kind==='cash')return null;
 const age=time-shot.revealAt;
 if(age<0||age>=BONUS_MOTION_MS)return null;
 const kind=shot.prize.kind,expansion=isGiftExpansion(kind);
 const rows=shot.prize.nextRows??shot.prize.nextSide,cols=shot.prize.nextCols??shot.prize.nextSide;
 return {kind,age,reduced,expansion,rows,cols,fromRows:rows-(kind!=='column'?1:0),fromCols:cols-(kind!=='row'?1:0),
  move:reduced?1:smooth(age/260),pop:reduced?0:Math.sin(Math.PI*clamp(age/360)),
  trace:reduced?0:.7*(1-smooth((age-600)/400)),color:({row:'#bfe5ff',column:'#ffbfdb',extra:'#c8efdb',multiply:'#ddb9f4'})[kind]};
}
export function giftCellMotion(row,col,rows,cols,bonus){
 const result={left:col*396/cols,top:row*314/rows,width:396/cols,height:314/rows,x:0,y:0,sx:1,sy:1,opacity:1,spark:0,radius:0,newCell:false};
 if(!bonus?.expansion||bonus.reduced)return result;
 const {fromRows,fromCols}=bonus,isNew=row>=fromRows||col>=fromCols;
 if(!isNew){
  for(const [key,old]of [['left',col*396/fromCols],['top',row*314/fromRows],['width',396/fromCols],['height',314/fromRows]])result[key]=mix(old,result[key],bonus.move);
  return result;
 }
 result.newCell=true;
 // Both edges grow together; their shared corner lands last, once.
 const rank=bonus.kind==='row'?col:bonus.kind==='column'?row:row>=fromRows&&col>=fromCols?Math.max(fromRows,fromCols):row>=fromRows?col:row;
 const count=giftArrivalCount(bonus.kind,rows,cols);
 const elapsed=bonus.age-giftArrivalDelay(rank,count),t=clamp(elapsed/GIFT_ARRIVAL_MS);
 if(elapsed<0){result.opacity=0;return result;}
 const poses=[[0,.7,.66,12],[.44,1.01,1.065,-4],[.72,1.035,.97,1],[1,1,1,0]];
 result.sx=poseCurve(poses,1,t);result.sy=poseCurve(poses,2,t);result.y=Math.round(poseCurve(poses,3,t));
 result.x=bonus.kind==='column'?Math.round(12*(1-smooth(t/.44))):0;
 result.opacity=smooth(t/.16);
 const sparkle=clamp((elapsed-150)/370);
 result.spark=elapsed>150&&elapsed<520?Math.sin(Math.PI*sparkle):0;
 result.radius=Math.round(Math.min(result.width,result.height)*(.12+.3*sparkle));
 return result;
}
export function giftBonusBands(bonus){
 if(!bonus?.expansion||bonus.reduced)return [];
 const bands=[];
 if(bonus.kind!=='column')bands.push({x:2,y:bonus.fromRows*314/bonus.rows+2,width:392,height:314/bonus.rows-4});
 if(bonus.kind!=='row')bands.push({x:bonus.fromCols*396/bonus.cols+2,y:2,width:396/bonus.cols-4,height:310});
 return bands;
}
export function pixelBandPath({x,y,width,height}){
 const r=4;return `M${x+r} ${y}H${x+width-r}V${y+r}H${x+width}V${y+height-r}H${x+width-r}V${y+height}H${x+r}V${y+height-r}H${x}V${y+r}H${x+r}Z`;
}

// Monotone cubic tangents carry momentum through a pose without overshooting
// its intended silhouette; turning points and the final rest have zero velocity.
function poseCurve(poses,key,t){
 if(t<=0)return poses[0][key];if(t>=1)return poses.at(-1)[key];
 let i=0;while(t>poses[i+1][0])i++;
 const slope=j=>(poses[j+1][key]-poses[j][key])/(poses[j+1][0]-poses[j][0]);
 const tangent=j=>{if(j===0||j===poses.length-1)return 0;const a=slope(j-1),b=slope(j);return a*b<=0?0:2*a*b/(a+b);};
 const a=poses[i],b=poses[i+1],dt=b[0]-a[0],u=(t-a[0])/dt,u2=u*u,u3=u2*u;
 return (2*u3-3*u2+1)*a[key]+(u3-2*u2+u)*dt*tangent(i)+(-2*u3+3*u2)*b[key]+(u3-u2)*dt*tangent(i+1);
}
