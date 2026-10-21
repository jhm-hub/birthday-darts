// Match generated facial features to the original sprite at decode time.
// Skin that remains skin keeps its original per-pixel shading. Where an old
// eye or mouth closes, fill from nearby reference skin instead of importing
// the generated atlas's different skin palette.
const skin=(p,i)=>p[i]>170&&p[i+1]>80&&p[i+2]>35&&p[i]>p[i+1]*1.12&&p[i+1]>p[i+2]*1.1;
export function matchFaceSkin(reference,source,width,height,preserve=[]){
 const result=new Uint8ClampedArray(source);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4;
  if(preserve.some(r=>x>=r.x&&x<r.x+r.width&&y>=r.y&&y<r.y+r.height)||!skin(source,i))continue;
  let best=skin(reference,i)?i:-1,score=Infinity;
  if(best<0)for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){
   const xx=x+dx,yy=y+dy;if(xx<0||xx>=width||yy<0||yy>=height)continue;
   const j=(yy*width+xx)*4;if(!skin(reference,j))continue;
   const distance=dx*dx+dy*dy;if(distance<score){score=distance;best=j;}
  }
  if(best>=0)for(let c=0;c<3;c++)result[i+c]=reference[best+c];
 }
 return result;
}
