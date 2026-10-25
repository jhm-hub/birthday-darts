// One committed clock for every preview/display. All motion finishes inside the
// existing 850 ms reveal / 2 second pick; reconnecting cannot restart the unwrap.
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const mix=(a,b,t)=>a+(b-a)*t;
export const CANDY_LID_POP_MS=520;
export function giftUnwrapMotion(flight,time,{opened=false,reduced=false}={}){
 const idle={bowFrame:0,bowY:0,bowOpacity:1,bandY:0,bandOpacity:1,lidX:0,lidY:0,lidTurn:0,lidOpacity:1,bodyX:1,bodyY:1,shake:0,inside:0,prizeY:0,prizeScale:1,prizeOpacity:1};
 if(!flight)return opened?{...idle,bowOpacity:0,bandOpacity:0,lidOpacity:0,inside:1}:idle;
 const age=time-flight.startAt,revealed=time>=flight.revealAt;
 if(age<0)return idle;
 // No wobbles, ribbons or flying lids for reduced motion: one quiet reveal.
 if(reduced)return revealed?{...idle,bowOpacity:0,bandOpacity:0,lidOpacity:0,inside:1}:idle;
 const bowFrame=age<100?0:age<180?1:age<260?2:age<340?3:age<420?4:5;
 const launch=age-CANDY_LID_POP_MS;
 const poses=[[0,0,2,0,1],[130,3,-15,-7,1],[220,6,-17,-12,.75],[320,9,-10,-16,0]];
 let lid=[0,0,0,1];
 if(launch>=0){
  let a=poses[0],b=poses[1];for(let i=1;i<poses.length;i++){b=poses[i];if(launch<=b[0])break;a=b;}
  const u=a===b?1:smooth((launch-a[0])/(b[0]-a[0]));lid=a.slice(1).map((v,i)=>mix(v,b[i+1],u));
 }else lid[1]=2*smooth((age-430)/90);
 const press=smooth((age-410)/100)*(1-smooth((age-520)/150));
 const rise=smooth((time-flight.revealAt)/160);
 return {...idle,bowFrame,bowY:Math.round(6*smooth((age-420)/180)),bowOpacity:1-smooth((age-500)/100),
  bandY:Math.round(8*smooth((age-260)/250)),bandOpacity:1-smooth((age-280)/240),
  lidX:Math.round(lid[0]),lidY:Math.round(lid[1]),lidTurn:lid[2],lidOpacity:lid[3],
  bodyX:1+.025*press,bodyY:1-.03*press,shake:age<180?Math.sin(age/25)*Math.sin(Math.PI*age/180)*1.3:0,
  inside:smooth((age-CANDY_LID_POP_MS)/90),prizeY:Math.round(6*(1-rise)),prizeScale:.94+.06*rise,prizeOpacity:revealed?.25+.75*rise:0};
}

export function applyGiftUnwrap(cell,motion){
 cell.dataset.bowFrame=motion.bowFrame;
 for(const [key,value,unit]of [
  ['bow-y',motion.bowY,'px'],['bow-opacity',motion.bowOpacity,''],['band-y',motion.bandY,'px'],['band-opacity',motion.bandOpacity,''],
  ['lid-x',motion.lidX,'px'],['lid-y',motion.lidY,'px'],['lid-turn',motion.lidTurn,'deg'],['lid-opacity',motion.lidOpacity,''],
  ['body-x',motion.bodyX,''],['body-y',motion.bodyY,''],['shake',motion.shake,'deg'],['open',motion.inside,''],
  ['prize-y',motion.prizeY,'px'],['prize-scale',motion.prizeScale,''],['prize-opacity',motion.prizeOpacity,'']
 ])cell.style.setProperty('--'+key,value+unit);
}
