// A fixed pixel-art body with continuously articulated shoulder and elbow.
// Cubic curves share their velocity at each key, including release/recovery.
const keys=[
 [-420,138,-76],[-310,150,-86],[-175,174,-76],[-65,70,-30],
 [0,-4,-7],[110,8,24],[280,35,62],[500,110,-20],
 [760,142,-72],[980,138,-76]
];
const radians=d=>d*Math.PI/180;
function curve(time,column){
 if(time<=keys[0][0])return keys[0][column];
 if(time>=keys.at(-1)[0])return keys.at(-1)[column];
 const i=keys.findIndex((k,j)=>j<keys.length-1&&time>=k[0]&&time<keys[j+1][0]);
 const a=keys[i],b=keys[i+1],span=b[0]-a[0],u=(time-a[0])/span;
 const tangent=j=>j===0||j===keys.length-1?0:(keys[j+1][column]-keys[j-1][column])/(keys[j+1][0]-keys[j-1][0]);
 return (2*u**3-3*u*u+1)*a[column]+(u**3-2*u*u+u)*span*tangent(i)+(-2*u**3+3*u*u)*b[column]+(u**3-u*u)*span*tangent(i+1);
}
export function throwMotion(shot,time,motion=true){
 const age=shot&&time>=shot.startAt?time-shot.releaseAt:-Infinity;
 const quiet=!motion,posed=quiet?(age>=0&&age<260?0:-Infinity):age;
 return {upper:curve(posed,1),forearm:curve(posed,2),open:age>=0&&age<430,
  dart:age<0||age>=860,phase:age<-420?'ready':age<0?'wind-up':age<110?'release':age<430?'follow-through':age<980?'recovery':'ready'};
}
export function rigJoints(rig,pose){
 const shoulder={x:rig.shoulder[0],y:rig.shoulder[1]},upper=radians(pose.upper),forearm=radians(pose.forearm);
 const elbow={x:shoulder.x+Math.cos(upper)*rig.upperLength,y:shoulder.y+Math.sin(upper)*rig.upperLength};
 const wrist={x:elbow.x+Math.cos(forearm)*rig.forearmLength,y:elbow.y+Math.sin(forearm)*rig.forearmLength};
 return {shoulder,elbow,wrist};
}
function boneTransform(piece,point,length,thickness){
 const dx=piece.end[0]-piece.pivot[0],dy=piece.end[1]-piece.pivot[1],angle=Math.atan2(dy,dx),scale=length/Math.hypot(dx,dy);
 const px=point[0]-piece.pivot[0],py=point[1]-piece.pivot[1];
 return {x:(px*Math.cos(angle)+py*Math.sin(angle))*scale,y:(-px*Math.sin(angle)+py*Math.cos(angle))*thickness};
}
export function heldDartPoint(rig,pose){
 const {elbow}=rigJoints(rig,pose),p=boneTransform(rig.closed,rig.grip,rig.forearmLength,rig.forearmThickness),a=radians(pose.forearm);
 return {x:elbow.x+p.x*Math.cos(a)-p.y*Math.sin(a),y:elbow.y+p.x*Math.sin(a)+p.y*Math.cos(a)};
}
export function rigReleasePoint(rig,balloons){
 const p=heldDartPoint(rig,throwMotion({startAt:-750,releaseAt:0},0));
 return {x:37+p.x+14,y:(balloons?50:8)+p.y};
}
export function createThrowRig(container,image,rig){
 const canvas=document.createElement('canvas');canvas.width=240;canvas.height=310;canvas.setAttribute('aria-hidden','true');
 const ctx=canvas.getContext('2d');container.replaceChildren(canvas);
 Object.assign(container.style,{left:'0px',width:'240px',height:'310px',backgroundImage:'none'});
 canvas.style.width='240px';canvas.style.height='310px';canvas.style.imageRendering='pixelated';
 function bone(piece,joint,angle,length,thickness){
  const dx=piece.end[0]-piece.pivot[0],dy=piece.end[1]-piece.pivot[1];
  ctx.save();ctx.translate(joint.x,joint.y);ctx.rotate(radians(angle));ctx.scale(length/Math.hypot(dx,dy),thickness);ctx.rotate(-Math.atan2(dy,dx));
  ctx.drawImage(image,...piece.crop,piece.crop[0]-piece.pivot[0],piece.crop[1]-piece.pivot[1],piece.crop[2],piece.crop[3]);ctx.restore();
 }
 function join(point,radius){
  // Overlapping texture caps otherwise leave a dark ring inside the elbow.
  // A tiny shaded pixel patch joins the skin without softening its silhouette.
  const cx=Math.round(point.x),cy=Math.round(point.y);
  for(let y=-Math.ceil(radius);y<=radius;y++)for(let x=-Math.ceil(radius);x<=radius;x++)if(x*x+y*y<radius*radius){
   ctx.fillStyle=y>radius*.55?'#f49c6e':y<-radius*.5?'#ffc39a':'#ffb487';ctx.fillRect(cx+x,cy+y,1,1);
  }
 }
 return {draw(shot,time,motion=true){
  const pose=throwMotion(shot,time,motion),joints=rigJoints(rig,pose);ctx.clearRect(0,0,240,310);ctx.imageSmoothingEnabled=false;
  ctx.drawImage(image,...rig.body.crop,...rig.body.destination);
  bone(rig.upper,joints.shoulder,pose.upper,rig.upperLength,rig.upperThickness);
  bone(pose.open?rig.open:rig.closed,joints.elbow,pose.forearm,rig.forearmLength,rig.forearmThickness);
  join(joints.shoulder,6.5);join(joints.elbow,4.5);
  if(pose.dart){
   const p=heldDartPoint(rig,pose),x=Math.round(p.x),y=Math.round(p.y);
   ctx.fillStyle='#281923';ctx.fillRect(x-11,y-2,23,4);ctx.fillStyle='#e7dae2';ctx.fillRect(x-4,y,18,1);
   ctx.fillStyle='#c73976';ctx.fillRect(x-13,y-3,7,7);ctx.fillStyle='#fa79b0';ctx.fillRect(x-12,y-2,5,2);ctx.fillRect(x-10,y+1,5,2);
  }
  container.dataset.phase=pose.phase;container.dataset.animation='continuous';
 }};
}
