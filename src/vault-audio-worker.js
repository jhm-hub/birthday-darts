import {renderVaultSound} from './vault-sound-design.js';

// Generate the same PCM off the rendering thread. Only sound names and public
// presentation options cross this local worker boundary, never game settings.
self.onmessage=({data})=>{
 const {key,sound,options,sampleRate}=data;
 try{
  const samples=renderVaultSound(sound,options,sampleRate);
  self.postMessage({key,samples},[samples.buffer]);
 }catch{self.postMessage({key,error:true});}
};
