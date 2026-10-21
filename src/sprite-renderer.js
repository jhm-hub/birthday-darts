import {characterFrameLayout} from './motion.js';
import {matchFaceSkin} from './face-palette.js';
import {restoreAtlasHair} from './atlas-hair.js';

// Decode all painted atlases before play. Drawing into one persistent canvas
// avoids a blank frame when CSS switches atlas URLs at the instant of release.
export async function loadCharacterArt(config){
 const allFrames=[...config.frames,...(config.celebrations||[]).flatMap(c=>c.frames)];
 const sources=[...new Set([config.throwStudy,...allFrames.map(f=>f.image),config.expressions?.image,...Object.values(config.alphaMasks||{}).map(m=>m.image)].filter(Boolean))];
 const images=new Map(await Promise.all(sources.map(async source=>{
  const image=new Image();image.src=source;await image.decode();return [source,image];
 })));
 for(const [source,cutoff] of Object.entries(config.alphaCutoffs||{})){
  const image=images.get(source),canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
  const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);const pixels=c.getImageData(0,0,canvas.width,canvas.height);
  // Alpha test on newly painted cels removes the generator's faint matte
  // fringe when composited over a stream. Keep the source file untouched.
  for(let i=3;i<pixels.data.length;i+=4)if(pixels.data[i]<cutoff)pixels.data[i]=0;
  c.putImageData(pixels,0,0);images.set(source,canvas);
 }
 // Local contour repaints retain their original pose. Constrain their matte
 // to that pose's clean silhouette so generator haze cannot add body volume.
 for(const [source,mask] of Object.entries(config.alphaMasks||{})){
  const image=images.get(source),reference=images.get(mask.image),canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
  const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(reference,0,0);const silhouette=c.getImageData(0,0,canvas.width,canvas.height).data;
  c.clearRect(0,0,canvas.width,canvas.height);c.drawImage(image,0,0);const pixels=c.getImageData(0,0,canvas.width,canvas.height);
  for(let i=3;i<pixels.data.length;i+=4){
   const row=Math.floor(i/4/canvas.width)%mask.cellHeight;
   const band=mask.bands?.find(b=>row>=b.start&&row<b.end);
   if(silhouette[i]<mask.cutoff||(band&&pixels.data[i]<band.cutoff))pixels.data[i]=0;
  }
  if(mask.preserveHair)restoreAtlasHair(pixels.data,silhouette,canvas.width,canvas.height,{...mask.preserveHair,cellHeight:mask.cellHeight,cutoff:mask.cutoff});
  c.putImageData(pixels,0,0);images.set(source,canvas);
 }
 const face=config.expressions;
 if(face?.preserveSkin){
  const {x,y,width,height}=face.target,base=document.createElement('canvas');base.width=width;base.height=height;
  const ctx=base.getContext('2d',{willReadFrequently:true});ctx.drawImage(images.get(config.frames[0].image||config.throwStudy),x,y,width,height,0,0,width,height);
  const reference=ctx.getImageData(0,0,width,height).data;
  for(let i=0;i<face.frames.length;i++){
   const source=face.frames[i],canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
   const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(images.get(face.image),source.x,source.y,source.width,source.height,0,0,width,height);
   const pixels=c.getImageData(0,0,width,height);pixels.data.set(matchFaceSkin(reference,pixels.data,width,height,face.preserveInk));c.putImageData(pixels,0,0);images.set('expression:'+i,canvas);
  }
 }
 return images;
}
export function createCharacterRenderer(container,config,images){
 const canvas=document.createElement('canvas');canvas.width=config.canvasWidth||240;canvas.height=config.canvasHeight||310;canvas.setAttribute('aria-hidden','true');
 const ctx=canvas.getContext('2d');container.replaceChildren(canvas);
 const mix=document.createElement('canvas');mix.width=config.expressions?.target.width||1;mix.height=config.expressions?.target.height||1;
 const mixCtx=mix.getContext('2d');
 Object.assign(container.style,{left:(config.canvasOffsetX||0)+'px',top:(config.canvasOffsetY||0)+'px',width:canvas.width+'px',height:canvas.height+'px',backgroundImage:'none'});
 Object.assign(canvas.style,{width:canvas.width+'px',height:canvas.height+'px',imageRendering:'pixelated'});
 return {draw(index,{heldDart=false,expression=null,expressionStrength=1,blink=0,celebration='',celebrationCel=0}={}){
  const variant=config.celebrations?.find(c=>c.id===celebration),frames=variant?.frames||config.frames;
  const frameIndex=variant?celebrationCel:index,frame=frames[frameIndex],box=characterFrameLayout(config,frameIndex,frames);
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;
  ctx.drawImage(images.get(frame.image||config.throwStudy),frame.x,frame.y,frame.width,frame.height||config.frameHeight,
   box.left,box.top,box.width,box.height);
  const face=config.expressions;
  if(!variant&&index===0&&face&&Number.isInteger(expression)&&face.frames[expression]){
   const source=face.frames[expression],target=face.target;
   // Draw only the face interior in the original cel's coordinate system.
   // The body, hair silhouette, head outline, scale and foot anchor are the
   // exact same pixels as the ready pose throughout every win reaction.
   ctx.save();ctx.translate(box.left-frame.x*box.scale,box.top-frame.y*box.scale);ctx.scale(box.scale,box.scale);
   ctx.beginPath();for(const region of face.regions||[face.clip]){for(let i=0;i<region.length;i++)ctx[i?'lineTo':'moveTo'](...region[i]);ctx.closePath();}ctx.clip();ctx.globalCompositeOperation='source-atop';ctx.globalAlpha=expressionStrength;
   if(face.preserveSkin){
    let painted=images.get('expression:'+expression);
    if(blink>0&&images.has('expression:'+(expression+1))){
     mixCtx.clearRect(0,0,mix.width,mix.height);mixCtx.globalCompositeOperation='source-over';mixCtx.globalAlpha=1-blink;mixCtx.drawImage(painted,0,0);
     mixCtx.globalCompositeOperation='lighter';mixCtx.globalAlpha=blink;mixCtx.drawImage(images.get('expression:'+(expression+1)),0,0);painted=mix;
    }
    ctx.drawImage(painted,target.x,target.y,target.width,target.height);
   }else ctx.drawImage(images.get(face.image),source.x,source.y,source.width,source.height,target.x,target.y,target.width,target.height);
   ctx.restore();
  }
  if(heldDart&&frame.hand){
   const x=Math.round(box.left+(frame.hand.x-frame.x)*box.scale),y=Math.round(box.top+(frame.hand.y-frame.y)*box.scale);
   ctx.save();ctx.translate(x,y);
   ctx.fillStyle='#231326';ctx.beginPath();ctx.moveTo(-20,-5);ctx.lineTo(-14,-5);ctx.lineTo(-9,-2);ctx.lineTo(13,-2);ctx.lineTo(18,0);ctx.lineTo(13,2);ctx.lineTo(-9,2);ctx.lineTo(-14,5);ctx.lineTo(-20,5);ctx.lineTo(-17,0);ctx.closePath();ctx.fill();
   ctx.fillStyle='#e7d6e5';ctx.fillRect(-12,-1,27,2);
   ctx.fillStyle='#ef4d91';ctx.beginPath();ctx.moveTo(-19,-4);ctx.lineTo(-15,-4);ctx.lineTo(-10,-1);ctx.lineTo(-18,-1);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(-19,4);ctx.lineTo(-15,4);ctx.lineTo(-10,1);ctx.lineTo(-18,1);ctx.closePath();ctx.fill();
   ctx.fillStyle='#ff99c2';ctx.fillRect(-18,-4,3,1);ctx.restore();
  }
  container.dataset.cel=index;container.dataset.animation='whole-body';container.dataset.heldDart=String(heldDart);container.dataset.expression=expression??'';
  container.dataset.celebration=variant?.id||'';container.dataset.celebrationCel=variant?celebrationCel:'';
 }};
}
