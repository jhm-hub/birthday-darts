// Small, discrete pixel clusters match the approved character's shaded sprite.
const ink='#251b29';
const mix=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
const inside=(x,y)=>y>=1&&y<=46&&((x-21.5)/(19-Math.max(0,y-27)*.12))**2+((y-23)/22.5)**2<=1;
export function balloonLabelPalette(base){return {back:mix(base,ink,.17),edge:mix(base,'#ffe4ca',.24),ink:mix(base,ink,.72)};}
export function balloonPixelLayers(base){
 const colors=[ink,mix(base,ink,.65),mix(base,ink,.4),mix(base,ink,.17),base,mix(base,'#ffe4ca',.24),mix(base,'#fff0d4',.48),mix(base,'#fff5e5',.8)],paths=colors.map(()=>[]);
 for(let y=0;y<48;y++)for(let x=0;x<44;x++){
  if(!inside(x,y))continue;let shade=0;
  if(inside(x-1,y)&&inside(x+1,y)&&inside(x,y-1)&&inside(x,y+1)){
   const nx=(x-21.5)/19,ny=(y-23)/22.5,nz=Math.sqrt(Math.max(0,1-nx*nx-ny*ny)),light=-.43*nx-.55*ny+.7*nz,thresholds=[.12,.32,.52,.72,.9];
   shade=1+thresholds.filter(t=>light>t).length;
   if(thresholds.some(t=>Math.abs(light-t)<.022)&&(x+y)%2===0)shade=Math.min(6,shade+1);
   if(((x-12)**2/10+(y-11)**2/30)<1&&x<14)shade=7;
   if(x>30&&y>28&&inside(x-2,y)&&!inside(x+2,y))shade=3;
  }
  paths[shade].push(`M${x*2} ${y*2}h2v2h-2z`);
 }
 // A stepped knot, with the same dark outline and directional light.
 paths[0].push('M40 92h8v4h2v4h4v4H34v-4h4v-4h2z');
 paths[3].push('M42 94h4v4h2v4H38v-2h4z');paths[5].push('M42 96h2v4h-4v2h-2v-2h4z');
 return paths.map((segments,i)=>({fill:colors[i],d:segments.join('')}));
}
