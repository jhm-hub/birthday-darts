// A received timestamp is a sample, not a new animation start. UI refreshes
// can pass the same snapshot many times; they must not rewind its animation.
export function createVaultClock({monotonic=()=>performance.now(),wall=()=>Date.now()}={}){
 let offset=null,target=0,lastLocal=monotonic(),lastServer=-Infinity;
 function now(){
  const local=Math.max(lastLocal,monotonic()),elapsed=local-lastLocal;lastLocal=local;
  if(offset===null)return wall();
  // Small network-delay corrections are slewed at at most 10% of real time.
  // Even delayed/out-of-order heartbeats cannot replay a visual frame.
  offset+=Math.max(-elapsed*.1,Math.min(elapsed*.1,target-offset));
  return local+offset;
 }
 return {now,receive(serverNow){
  if(!Number.isFinite(serverNow)||serverNow<=lastServer)return;
  now();lastServer=serverNow;target=serverNow-lastLocal;
  if(offset===null)offset=target;
 }};
}
