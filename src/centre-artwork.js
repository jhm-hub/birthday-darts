// Artwork can extend over the rings while the reserved centre stays fixed.
export function readArtworkPlacement(raw={}){
 const artworkScale=raw.artworkScale===undefined?100:raw.artworkScale,artworkX=raw.artworkX===undefined?0:raw.artworkX,artworkY=raw.artworkY===undefined?0:raw.artworkY;
 if(!Number.isInteger(artworkScale)||artworkScale<50||artworkScale>200)throw Error('Choose artwork size from 50 to 200%.');
 if([artworkX,artworkY].some(n=>!Number.isInteger(n)||n< -60||n>60))throw Error('Choose PNG position from −60 to 60 pixels.');
 return {artworkScale,artworkX,artworkY};
}
export function savedArtworkPlacement(raw){return Object.fromEntries(Object.entries(readArtworkPlacement(raw)).filter(([key,value])=>value!==(key==='artworkScale'?100:0)));}
export function artworkBox(diameter,raw){
 const {artworkScale,artworkX,artworkY}=readArtworkPlacement(raw);return {size:diameter*artworkScale/100,x:artworkX,y:artworkY};
}
