export const SHARED_API=typeof location!=='undefined'&&['127.0.0.1','localhost'].includes(location.hostname)?location.origin+'/shared':'https://faith-shared-game-settings.filthynormie.chatgpt.site';
const CONNECTION_KEY='faith-shared-edit-link-v1';
export function readSharedConnection(storage=globalThis.localStorage,href=globalThis.location?.href){
 if(!storage||!href)return null;
 const page=new URL(href);
 if(page.pathname.includes('display.html')||page.pathname.endsWith('browser-wheel.html')||page.searchParams.get('view')==='stream'||page.searchParams.get('stream')==='1')return null;
 const params=new URL(href).hash.slice(1),fragment=new URLSearchParams(params);
 const workspace=fragment.get('shared'),key=fragment.get('edit');
 if(workspace||key){
  if(!/^[a-z0-9-]{16,64}$/.test(workspace??'')||!/^[A-Za-z0-9_-]{43}$/.test(key??''))throw Error('Open the complete private editing link.');
  const connection={workspace,key};storage.setItem(CONNECTION_KEY,JSON.stringify(connection));return connection;
 }
 try{const saved=JSON.parse(storage.getItem(CONNECTION_KEY));return /^[a-z0-9-]{16,64}$/.test(saved?.workspace??'')&&/^[A-Za-z0-9_-]{43}$/.test(saved?.key??'')?saved:null;}catch{return null;}
}
export function sharedStorageKey(key,connection){return connection?key+'::shared:'+connection.workspace:key;}
export function sharedURL(href,connection){const url=new URL(href);if(connection){const hash=new URLSearchParams(url.hash.slice(1));hash.set('shared',connection.workspace);hash.set('edit',connection.key);url.hash=hash.toString();}return url.href;}
