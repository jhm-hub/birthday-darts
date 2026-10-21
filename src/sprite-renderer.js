import {characterFrameLayout} from './motion.js';

// Decode all painted atlases before play. Drawing into one persistent canvas
// avoids a blank frame when CSS switches atlas URLs at the instant of release.
export async function loadCharacterArt(config){
 const sources=[...new Set([config.throwStudy,...config.frames.map(f=>f.image).filter(Boolean)])];
 return new Map(await Promise.all(sources.map(async source=>{
  const image=new Image();image.src=source;await image.decode();return [source,image];
 })));
}
export function createCharacterRenderer(container,config,images){
 const canvas=document.createElement('canvas');canvas.width=config.canvasWidth||240;canvas.height=config.canvasHeight||310;canvas.setAttribute('aria-hidden','true');
 const ctx=canvas.getContext('2d');container.replaceChildren(canvas);
 Object.assign(container.style,{left:(config.canvasOffsetX||0)+'px',top:(config.canvasOffsetY||0)+'px',width:canvas.width+'px',height:canvas.height+'px',backgroundImage:'none'});
 Object.assign(canvas.style,{width:canvas.width+'px',height:canvas.height+'px',imageRendering:'pixelated'});
 return {draw(index,{heldDart=false}={}){
  const frame=config.frames[index],box=characterFrameLayout(config,index);
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;
  ctx.drawImage(images.get(frame.image||config.throwStudy),frame.x,frame.y,frame.width,frame.height||config.frameHeight,
   box.left,box.top,box.width,box.height);
  if(heldDart&&frame.hand){
   const x=Math.round(box.left+(frame.hand.x-frame.x)*box.scale),y=Math.round(box.top+(frame.hand.y-frame.y)*box.scale);
   ctx.save();ctx.translate(x,y);
   ctx.fillStyle='#231326';ctx.beginPath();ctx.moveTo(-20,-5);ctx.lineTo(-14,-5);ctx.lineTo(-9,-2);ctx.lineTo(13,-2);ctx.lineTo(18,0);ctx.lineTo(13,2);ctx.lineTo(-9,2);ctx.lineTo(-14,5);ctx.lineTo(-20,5);ctx.lineTo(-17,0);ctx.closePath();ctx.fill();
   ctx.fillStyle='#e7d6e5';ctx.fillRect(-12,-1,27,2);
   ctx.fillStyle='#ef4d91';ctx.beginPath();ctx.moveTo(-19,-4);ctx.lineTo(-15,-4);ctx.lineTo(-10,-1);ctx.lineTo(-18,-1);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(-19,4);ctx.lineTo(-15,4);ctx.lineTo(-10,1);ctx.lineTo(-18,1);ctx.closePath();ctx.fill();
   ctx.fillStyle='#ff99c2';ctx.fillRect(-18,-4,3,1);ctx.restore();
  }
  container.dataset.cel=index;container.dataset.animation='whole-body';container.dataset.heldDart=String(heldDart);
 }};
}
