import {SHARED_API} from './shared-settings-connection.js';
export const MAX_PNG_FILE=10*1024*1024;
export function checkPngFile(bytes){
 if(bytes.length>MAX_PNG_FILE)throw Error('Choose a PNG smaller than 10 MB.');
 if(bytes.length<45||[137,80,78,71,13,10,26,10].some((v,i)=>bytes[i]!==v))throw Error('Choose a PNG image.');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(String.fromCharCode(...bytes.subarray(12,16))!=='IHDR'||view.getUint32(8)!==13)throw Error('This PNG could not be read.');
 const width=view.getUint32(16),height=view.getUint32(20);
 if(!width||!height||width>8192||height>8192||width*height>16777216)throw Error('Choose a PNG with at most 16 million pixels and no side longer than 8192 pixels.');
 let offset=8,end=false,data=false;
 while(offset+12<=bytes.length){const n=view.getUint32(offset),type=String.fromCharCode(...bytes.subarray(offset+4,offset+8));if(n>bytes.length-offset-12)throw Error('This PNG is incomplete.');if(type==='acTL')throw Error('Choose a still PNG, not an animated PNG.');if(type==='IDAT')data=true;offset+=n+12;if(type==='IEND'){end=n===0&&offset===bytes.length;break;}}
 if(!end||!data)throw Error('This PNG is incomplete.');return {width,height};
}
// Use visible pixels to centre the artwork, including transparent PNGs with
// uneven padding. Fit their furthest corner inside the safe circular opening.
export function visiblePngBounds(pixels,width,height){
 let left=width,top=height,right=-1,bottom=-1;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 if(right<0)throw Error('This PNG is completely transparent. Choose one with visible artwork.');
 const cx=(left+right+1)/2,cy=(top+bottom+1)/2;let radius=0;
 for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++)if(pixels[(y*width+x)*4+3])radius=Math.max(radius,Math.hypot(Math.abs(x+.5-cx)+.5,Math.abs(y+.5-cy)+.5));
 return {left,top,width:right-left+1,height:bottom-top+1,cx,cy,radius};
}
export async function prepareCentrePng(file){
 if(!file||file.size>MAX_PNG_FILE)throw Error('Choose a PNG smaller than 10 MB.');
 checkPngFile(new Uint8Array(await file.arrayBuffer()));
 let bitmap;try{bitmap=await createImageBitmap(file);}catch{throw Error('This PNG could not be opened. Try exporting it again.');}
 try{
  const work=document.createElement('canvas'),factor=Math.min(1,600/Math.max(bitmap.width,bitmap.height));work.width=Math.max(1,Math.round(bitmap.width*factor));work.height=Math.max(1,Math.round(bitmap.height*factor));
  const ctx=work.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0,work.width,work.height);
  const bounds=visiblePngBounds(ctx.getImageData(0,0,work.width,work.height).data,work.width,work.height),out=document.createElement('canvas');out.width=out.height=300;
  const draw=out.getContext('2d'),scale=148/bounds.radius;draw.imageSmoothingQuality='high';draw.drawImage(work,150-bounds.cx*scale,150-bounds.cy*scale,work.width*scale,work.height*scale);
  return await new Promise((resolve,reject)=>out.toBlob(blob=>blob?resolve(blob):reject(Error('This PNG could not be prepared. Please retry.')),'image/png'));
 }finally{bitmap.close();}
}
export async function uploadCentrePng(blob,{connection,fetcher=fetch,api=SHARED_API}){
 if(!connection)throw Error('Open the private editing link to upload a PNG.');
 const response=await fetcher(api+'/api/wheel-images/upload/'+connection.workspace,{method:'POST',headers:{Authorization:'Bearer '+connection.key,'Content-Type':'image/png'},body:blob,referrerPolicy:'no-referrer',signal:AbortSignal.timeout(30000)});
 let data;try{data=await response.json();}catch{throw Error('The PNG upload service did not reply. Please retry.');}
 if(!response.ok)throw Error(data.error||'The PNG could not be uploaded. Please retry.');
 if(!/^[a-f0-9]{64}$/.test(data.assetId??''))throw Error('The uploaded PNG could not be read. Please retry.');
 return data.assetId;
}
