// One square coordinate system for the display, targets and registered hand.
// Character artwork keeps its original scale; only its stage position changes.
export const DARTS_STAGE = Object.freeze({size:540,sceneTop:70,character:{x:28,y:52}});
export const CLASSIC_TARGET = Object.freeze({x:380,top:80,height:260});
export function classicPoint(shot,count){
 return {x:CLASSIC_TARGET.x,y:CLASSIC_TARGET.top+(shot.bandIndex+.5+shot.offset)*CLASSIC_TARGET.height/(2*count-1)};
}
// Offset clusters make a vertical bouquet, with room for labels and a drifting rim.
const bouquet=[[382,57,.91],[446,98,.90],[314,102,.87],[377,145,.97],[486,155,.86],[293,176,.86],[435,193,.96],[351,213,.92],[492,233,.86],[300,253,.85],[405,273,.94],[466,312,.88],[352,319,.83],[420,346,.79],[489,40,.73],[302,45,.73]];
export function balloonPoint(index,count,time=0,motion=true){
 const [x,y,scale]=bouquet[index];
 return {x:x+(motion?Math.sin(time/1300+index*1.9)*2:0),y:y+(motion?Math.sin(time/850+index*1.4)*3:0),scale};
}
export function stageFit(width,height,inset=0){
 const scale=Math.max(0,Math.min((width-inset*2)/DARTS_STAGE.size,(height-inset*2)/DARTS_STAGE.size));
 return {scale,left:(width-DARTS_STAGE.size*scale)/2,top:(height-DARTS_STAGE.size*scale)/2};
}
