import {GAMES,savedSummary} from './home-catalog.js';
import {readSharedConnection,sharedURL,sharedStorageKey} from './shared-settings-connection.js';
const $=s=>document.querySelector(s),frames=new Map(),states=new Map(),icons={gifts:'✦',vault:'♛',darts:'➶',pinata:'♧',brokie:'◉','birthday-scam':'✿',scam:'♠'};
let connection,game='gifts',view='play';
try{connection=readSharedConnection();if(!connection)throw Error('Open the complete private editing link to use Faith’s shared game desk.');}catch(e){$('#desk-error').hidden=false;$('#desk-error').textContent=e.message;$('#desk-save').textContent='Private link needed';$('#copy-desk').disabled=true;}
const setStatus=(state,message)=>{const el=$('#desk-save');el.dataset.state=state;el.textContent=message;};
function embed(frame,item,mode){
 const win=frame.contentWindow,doc=win.document;if(!doc.body)return false;
 const ready=item.id==='birthday-scam'?'.saved-versions select option':item.id==='scam'?(mode==='play'?'select[aria-label="Saved version"] option':'.settings-form input'):mode==='play'?(item.id==='gifts'||item.id==='vault'?'#live-display-url':'#display-url'):(item.id==='darts'?'#widget-name':item.id==='brokie'?'#wheel-name':'#game-name');
 if(['error','conflict'].includes(win.__faithSharedSettingsStatus?.state)){frame.dataset.loaded='true';if(game===item.id&&view===mode)setStatus(win.__faithSharedSettingsStatus.state,win.__faithSharedSettingsStatus.message);return false;}
 const control=doc.querySelector(ready);if(!control||win.__faithSharedSettingsStatus?.state!=='ready'||'value' in control&&!control.value)return false;
 doc.documentElement.classList.add('faith-desk-embedded');doc.documentElement.dataset.deskGame=item.id;doc.documentElement.dataset.deskView=mode;
 const style=doc.createElement('link');style.rel='stylesheet';style.href=new URL('./desk-embedded.css',location.href).href;style.onload=()=>{frame.dataset.loaded='true';};doc.head.append(style);
 const advanced=(selector,label)=>{const nodes=[...doc.querySelectorAll(selector)].filter(n=>!n.closest('.desk-advanced'));if(!nodes.length)return;const details=doc.createElement('details');details.className='desk-advanced';const summary=doc.createElement('summary');summary.textContent=label;details.append(summary);nodes[0].before(details);for(const node of nodes)details.append(node);};
 for(const d of doc.querySelectorAll('details'))d.open=false;
 if(item.id==='birthday-scam'){const sound=doc.querySelector('.header-tools button');if(sound){const box=doc.createElement('div');box.className='desk-sound-control';box.append(sound);doc.querySelector(mode==='play'?'.controls':'#settings')?.append(box);}}
 if(mode==='play'){
  advanced('#saved-version-controls,#live-versions','Saved setups');
  if(item.id==='birthday-scam'){for(const id of ['settings','stream']){const panel=doc.getElementById(id);panel.hidden=false;advanced('#'+id,id==='settings'?'Saved settings for the live wheel':'Stream setup & chat');}}
  advanced('#gift-mixer,#vault-mixer,.mixer','Sound & volume');
  if(item.id==='pinata')advanced('#game-ranges,#viewer-ranges','Ranges & viewer rules');
  if(item.id==='darts'){advanced('#viewer-ranges','Viewer rules');advanced('.stream-setup','Stream setup');}
  if(item.id==='scam'){const note=doc.querySelector('.control-room>header .notice');if(note){note.classList.add('desk-notice');doc.querySelector('.control-room>.play').before(note);}for(const s of doc.querySelectorAll('.control-room>section.panel')){if(s.querySelector('select[aria-label="Saved version"]')){s.classList.add('desk-wheel-settings');advanced('.desk-wheel-settings','Saved settings & demos');}else if(s.querySelector('h2')?.textContent==='Twitch commands'){s.classList.add('desk-chat');advanced('.desk-chat','Twitch commands');}}}
 }else{
  advanced('#viewer-ranges','Viewer rules');
  advanced('.setup-panel','Stream setup');
  if(item.id==='gifts')advanced('#gift-settings>details','More prize settings');
  if(item.id==='darts')advanced('#bonus-settings','Bonuses & custom settings');
  if(item.id==='vault')advanced('#vault-settings>details','More vault settings');
  if(item.id==='pinata')advanced('.celebration-settings','Celebration levels');
 }
 const frameKey=item.id+':'+mode;
 const show=(state,message)=>{states.set(frameKey,{state,message});if(game===item.id&&view===mode)setStatus(state,message);};
 const status=()=>{const s=win.__faithSharedSettingsStatus;if(s)show(s.state,s.state==='ready'?'Saved to your private link':s.state==='saving'?'Saving changes…':s.state==='loading'?'Loading shared settings…':s.message);};
 win.addEventListener('shared-settings-dirty',()=>show('dirty','Unsaved changes'));
 win.addEventListener('shared-settings-clean',status);
 win.addEventListener('shared-settings-status',status);status();
 doc.addEventListener('input',e=>{if(e.target.closest('form#gift-settings,form#vault-settings,form#pinata-settings,form#settings,.settings-form,#settings,.game-range-form,.viewer-range-form'))show('dirty','Unsaved changes');});
 doc.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a||a.getAttribute('href').startsWith('#'))return;const url=new URL(a.href);if(url.origin!==location.origin)return;for(const g of GAMES){for(const [v,key]of [['play','controls'],['settings','editor']]){const target=new URL(g[key],location.href);if(url.pathname===target.pathname&&url.searchParams.get('live')===target.searchParams.get('live')&&url.searchParams.get('controls')===target.searchParams.get('controls')&&url.searchParams.get('panel')===target.searchParams.get('panel')){e.preventDefault();select(g.id,v);return;}}}});
 return true;
}
function select(id,mode=view){
 if(!connection)return;const item=GAMES.find(g=>g.id===id);if(!item)return;game=id;view=mode;
 $('#desk-title').textContent=item.name;$('#desk-category').textContent=item.category==='wheels'?'FAITH’S WHEELS':'BIRTHDAY GAMES';
 $('#desk-note').textContent=mode==='settings'?'Edit, save, and reuse. Changes apply to the next viewer.':item.id==='gifts'?'Enter a viewer, choose a range, then open one present at a time.':'Enter a viewer and play. These controls stay off stream.';
 for(const b of $('#desk-games').children)b.setAttribute('aria-current',String(b.dataset.game===id));for(const v of ['play','settings'])$('#tab-'+v).setAttribute('aria-selected',String(mode===v));
 const key=id+':'+mode;for(const [k,f]of frames)f.hidden=k!==key;
 if(!frames.has(key)){const frame=document.createElement('iframe');frame.className='game-frame';frame.dataset.loaded='false';frame.title=item.name+' · '+(mode==='play'?'private controls':'settings');frame.allow='autoplay; clipboard-write';frame.referrerPolicy='no-referrer';const url=new URL(mode==='play'?item.controls:item.editor,location.href);if(mode==='settings'){const summary=savedSummary({getItem:k=>localStorage.getItem(sharedStorageKey(k,connection))??localStorage.getItem(k)},item);if(summary.id)url.searchParams.set('id',summary.id);}url.searchParams.set('desk','1');frame.src=sharedURL(url.href,connection);frame.onload=()=>{let tries=0;const timer=setInterval(()=>{if(embed(frame,item,mode)||++tries>450)clearInterval(timer);},100);};frames.set(key,frame);$('#desk-frames').append(frame);setStatus('loading','Loading '+item.name+'…');}else{const s=states.get(key);setStatus(s?.state??'loading',s?.message??'Loading shared settings…');}
}
for(const item of GAMES){const button=document.createElement('button');button.className='desk-game';button.dataset.game=item.id;const icon=document.createElement('span');icon.textContent=icons[item.id];icon.setAttribute('aria-hidden','true');button.append(icon,document.createTextNode(item.name));button.onclick=()=>select(item.id);$('#desk-games').append(button);}
$('#tab-play').onclick=()=>select(game,'play');$('#tab-settings').onclick=()=>select(game,'settings');
$('#copy-desk').onclick=async()=>{try{await navigator.clipboard.writeText(sharedURL(new URL('./desk.html',location.href).href,connection));$('#copy-desk').textContent='Copied';setTimeout(()=>$('#copy-desk').textContent='Copy private link',1800);}catch{setStatus('error','Copy the complete address from your browser.');}};
select(game);
