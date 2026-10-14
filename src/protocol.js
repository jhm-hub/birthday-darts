export function randomKey(){return [...crypto.getRandomValues(new Uint8Array(32))].map(n=>n.toString(16).padStart(2,'0')).join('');}
export const validKey=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const keyBytes=key=>{if(!validKey(key))throw Error('Invalid room key.');return Uint8Array.from(key.match(/../g),n=>parseInt(n,16));};
export async function roomId(key){const digest=await crypto.subtle.digest('SHA-256',keyBytes(key));return 'darts-'+[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');}
export async function proof(key,challenge){const imported=await crypto.subtle.importKey('raw',keyBytes(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);return [...new Uint8Array(await crypto.subtle.sign('HMAC',imported,new TextEncoder().encode(challenge)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
export async function verifyProof(key,challenge,signature){if(!validKey(signature))return false;const imported=await crypto.subtle.importKey('raw',keyBytes(key),{name:'HMAC',hash:'SHA-256'},false,['verify']);return crypto.subtle.verify('HMAC',imported,keyBytes(signature),new TextEncoder().encode(challenge));}
