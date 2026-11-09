import {renderTokenRunoutSound,renderTokenFinaleSound,renderTokenHandoffSound} from './vault-tokens-audio.js';
self.onmessage=({data})=>{
 try{const samples=data.sound==='spin'?renderTokenRunoutSound(data.payload,data.rate):data.sound==='finale'?renderTokenFinaleSound(data.payload,data.rate):renderTokenHandoffSound(data.rate);self.postMessage({...data,samples},[samples.buffer]);}
 catch{self.postMessage({ticket:data.ticket,error:true});}
};
