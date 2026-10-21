// Decode both painted atlases before play. Drawing into one persistent canvas
// avoids a blank frame when CSS switches atlas URLs at the instant of release.
export async function loadCharacterArt(config){
 const sources=[...new Set([config.throwStudy,...config.frames.map(f=>f.image).filter(Boolean)])];
 return new Map(await Promise.all(sources.map(async source=>{
  const image=new Image();image.src=source;await image.decode();return [source,image];
 })));
}
export function createCharacterRenderer(container,config,images){
 const canvas=document.createElement('canvas');canvas.width=240;canvas.height=310;canvas.setAttribute('aria-hidden','true');
 const ctx=canvas.getContext('2d');container.replaceChildren(canvas);
 Object.assign(container.style,{left:'0px',width:'240px',height:'310px',backgroundImage:'none'});
 Object.assign(canvas.style,{width:'240px',height:'310px',imageRendering:'pixelated'});
 return {draw(index){
  const frame=config.frames[index],scale=298/(frame.height||config.frameHeight);
  ctx.clearRect(0,0,240,310);ctx.imageSmoothingEnabled=false;
  ctx.drawImage(images.get(frame.image||config.throwStudy),frame.x,frame.y,frame.width,frame.height||config.frameHeight,
   config.bodyAnchorX-(frame.anchor-frame.x)*scale,0,frame.width*scale,298);
  container.dataset.cel=index;container.dataset.animation='painted';
 }};
}
