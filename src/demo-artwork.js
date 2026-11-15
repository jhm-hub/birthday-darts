import {prepareCentrePng} from './centre-png-upload.js';

// Temporary artwork never enters game configuration, storage or a network
// upload. Object URLs are released when replaced, cleared or the page closes.
export function createDemoArtwork({prepare=prepareCentrePng,createURL=blob=>URL.createObjectURL(blob),revokeURL=url=>URL.revokeObjectURL(url)}={}){
 let current={kind:'saved',source:undefined,label:'Saved game artwork'},generation=0,disposed=false;
 function replace(next){const old=current.source;current=next;if(old)revokeURL(old);return {...current};}
 return {
  read:()=>({...current}),
  async choose(file,{kind='upload',label=file.name||'Your PNG'}={}){
   if(disposed)return null;const ticket=++generation,blob=await prepare(file);
   if(disposed||ticket!==generation)return null;
   return replace({kind,source:createURL(blob),label});
  },
  saved(){generation++;return replace({kind:'saved',source:undefined,label:'Saved game artwork'});},
  clear(){generation++;return replace({kind:'none',source:null,label:'No preview image'});},
  dispose(){disposed=true;generation++;replace({kind:'saved',source:undefined,label:''});},
 };
}
