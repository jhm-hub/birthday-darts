// Keep the original painted head and flowing locks when a body-only repaint
// introduces matte noise. Both atlases contain the same registered poses.
export function restoreAtlasHair(pixels,reference,width,height,{cellWidth,cellHeight,headEnd,hairEnd,hairRight,cutoff}){
 const hair=new Uint8Array(width*height);
 for(let y=0;y<height;y++){
  const row=y%cellHeight;
  if(row<headEnd||row>=hairEnd)continue;
  for(let x=0;x<width;x++){
   if(x%cellWidth>=hairRight)continue;
   const i=(y*width+x)*4,r=reference[i],g=reference[i+1],b=reference[i+2];
   // Copper locks have red/orange ink. The black corset and skirt must keep
   // the new contour; brown stockings lie below the hair's painted extent.
   if(reference[i+3]>=cutoff&&r>g*1.45&&r-g>25&&g-b>8)hair[y*width+x]=1;
  }
 }
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const row=y%cellHeight,i=(y*width+x)*4;
  let keep=row<headEnd;
  // Include the one-pixel outline and transparent edge beside a lock. A
  // color-only mask would leave sliced dark outlines and loose matte crumbs.
  if(!keep&&row<hairEnd&&x%cellWidth<hairRight)for(let dy=-1;dy<=1&&!keep;dy++)for(let dx=-1;dx<=1;dx++){
   const yy=y+dy,xx=x+dx;
   if(yy>=0&&yy<height&&xx>=0&&xx<width&&Math.floor(yy/cellHeight)===Math.floor(y/cellHeight)&&Math.floor(xx/cellWidth)===Math.floor(x/cellWidth)&&hair[yy*width+xx]){keep=true;break;}
  }
  if(keep){
   for(let c=0;c<4;c++)pixels[i+c]=reference[i+c];
   if(reference[i+3]<cutoff)pixels[i+3]=0;
  }
 }
 return pixels;
}
