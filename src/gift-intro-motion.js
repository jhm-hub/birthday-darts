const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export const GIFT_INTRO_MS=620,GIFT_INTRO_POP_MS=280,GIFT_INTRO_LAND=.45;
export const giftIntroWaveCount=(rows,cols)=>rows+cols-1;
export const giftIntroDelay=(rank,count)=>rank*Math.min(58,260/Math.max(1,count-1));

// The committed round clock drives every display. It never restarts on a new
// snapshot, an ordinary pick, a bonus expansion or a finale preview.
export function giftIntroMotion(round,time,reduced=false){
 if(!round||round.completedAt!=null||reduced)return null;
 const age=time-round.startedAt;
 if(!Number.isFinite(age)||age<0||age>=GIFT_INTRO_MS)return null;
 return {age,rows:round.preset.side,cols:round.preset.side,
  selected:round.flight?.cell??round.opened[0]?.cell??null};
}

export function giftIntroCell(row,col,intro){
 const still={scale:1,y:0,opacity:1,spark:0,radius:0};
 // The chosen gift is already unwrapping. Never shrink, hide or move its bow.
 if(!intro||intro.selected===row+':'+col||row>=intro.rows||col>=intro.cols)return still;
 const elapsed=intro.age-giftIntroDelay(row+col,giftIntroWaveCount(intro.rows,intro.cols));
 const t=clamp(elapsed/GIFT_INTRO_POP_MS),rise=smooth(t/GIFT_INTRO_LAND);
 const settle=smooth((t-GIFT_INTRO_LAND)/(.75-GIFT_INTRO_LAND)),rest=smooth((t-.75)/.25);
 const scale=t<GIFT_INTRO_LAND?.78+.255*rise:t<.75?1.035-.043*settle:.992+.008*rest;
 const y=t<GIFT_INTRO_LAND?6-8*rise:t<.75?-2+2*settle:0;
 const sparkle=clamp((elapsed-90)/190);
 return {scale,y:Math.round(y),opacity:elapsed<0?0:smooth(t/.24),
  spark:elapsed>90&&elapsed<280?.65*Math.sin(Math.PI*sparkle)**2:0,
  radius:.18+.16*sparkle};
}

// A single clockwise chase of tiny shaded marquee lights, inside the board.
export const GIFT_INTRO_LIGHTS=[
 ...Array.from({length:8},(_,i)=>[24+i*48,2]),
 ...Array.from({length:4},(_,i)=>[390,48+i*72]),
 ...Array.from({length:8},(_,i)=>[360-i*48,308]),
 ...Array.from({length:4},(_,i)=>[2,264-i*72])
];
export function giftIntroLight(index,intro){
 if(!intro)return 0;
 const age=intro.age-index*12;
 return smooth(age/45)*(1-smooth((age-75)/180));
}
