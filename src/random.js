export const randomUUID=()=>crypto.randomUUID();
export function randomInt(max){
 if(!Number.isSafeInteger(max)||max<1||max>2**32)throw Error('Invalid random range.');
 const limit=2**32-(2**32%max),value=new Uint32Array(1);
 do{crypto.getRandomValues(value);}while(value[0]>=limit);
 return value[0]%max;
}
