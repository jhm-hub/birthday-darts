import {readArtworkPlacement,savedArtworkPlacement,artworkBox} from './centre-artwork.js';
import {SHARED_API,readSharedConnection} from './shared-settings-connection.js';
import {prepareCentrePng,uploadCentrePng} from './centre-png-upload.js';
// OBS coordinates are deliberately fixed while this layout is enabled, across
// line landings, bonus reveals, saved versions and all six wheel games.
export function readCentrePng(raw){
 if(raw===undefined)return {enabled:false,diameter:120};
 if(!raw||typeof raw.enabled!=='boolean'||!Number.isInteger(raw.diameter)||raw.diameter<60||raw.diameter>150)throw Error('Choose a centre PNG diameter from 60 to 150 pixels.');
 if(raw.assetId!==undefined&&!/^[a-f0-9]{64}$/.test(raw.assetId))throw Error('Upload a valid centre PNG.');
 if(raw.builtin!==undefined&&raw.builtin!=='money-multiplier')throw Error('Choose a valid saved centre image.');
 if(raw.bonusCover!==undefined&&typeof raw.bonusCover!=='boolean')throw Error('Choose on or off for the bonus PNG cover.');
 return {enabled:raw.enabled,diameter:raw.diameter,...savedArtworkPlacement(raw),...(raw.bonusCover===false?{bonusCover:false}:{}),...(raw.builtin?{builtin:raw.builtin}:{}),...(raw.assetId?{assetId:raw.assetId}:{})};
}
export function wheelGeometry(config,bonus=false){
 const png=readCentrePng(config.centrePng);
 if(png.enabled){const cover=bonus&&png.bonusCover!==false;return {png,cutout:cover?0:png.diameter/1.5,outer:[218,274],inner:bonus?[160,211]:[png.diameter/1.5+10,190],bonus:[cover?30:png.diameter/1.5+10,153],innerRim:214,bonusRim:156,innerPointer:bonus?519:498,bonusPointer:461};}
 return {png,cutout:0,outer:bonus?[214,274]:[192,274],inner:bonus?[123,190]:[48,157],bonus:[30,105],innerRim:bonus?209:186,bonusRim:116,innerPointer:bonus?498:466,bonusPointer:412};
}
let maskId=0;
export function reserveSvgCentre(svg,geometry){
 if(!geometry.png.enabled||!geometry.cutout)return;
 const ns='http://www.w3.org/2000/svg',node=(tag,attrs)=>{const el=document.createElementNS(ns,tag);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));return el;};
 const id='wheel-centre-mask-'+(++maskId),defs=node('defs',{}),mask=node('mask',{id,maskUnits:'userSpaceOnUse',x:0,y:0,width:600,height:600});
 mask.append(node('rect',{width:600,height:600,fill:'white'}),node('circle',{cx:300,cy:300,r:geometry.cutout,fill:'black'}));defs.append(mask);
 const content=node('g',{'mask':`url(#${id})`,'data-centre-cutout':geometry.cutout});content.append(...svg.childNodes);svg.append(defs,content);
 content.append(node('circle',{cx:300,cy:300,r:geometry.cutout+2,fill:'none',stroke:'var(--ring-light)','stroke-width':2}));
}
export const centreImageURL=id=>SHARED_API+'/api/wheel-images/image/'+id+'.png';
export const MONEY_MULTIPLIER_PNG='./demo-assets/money-multiplier-wheel.png';
export const savedCentreImage=png=>png.assetId?centreImageURL(png.assetId):png.builtin==='money-multiplier'?MONEY_MULTIPLIER_PNG:null;
export function setCentreLayout(stage,config,{imageSource}={}){
 const png=readCentrePng(config.centrePng),cover=!!config.bonus&&png.enabled&&png.bonusCover!==false;stage.dataset.bonusCover=String(cover);stage.dataset.centrePng=String(png.enabled);stage.style.setProperty('--centre-png-size',(cover?234:png.diameter)+'px');const box=artworkBox(cover?234:png.diameter,png);stage.style.setProperty('--centre-art-size',box.size+'px');stage.style.setProperty('--centre-art-x',box.x+'px');stage.style.setProperty('--centre-art-y',box.y+'px');
 const img=stage.querySelector('.dw-centre-image');
 // View-only overrides let the demo use local blob URLs without admitting
 // arbitrary image URLs into saved settings or OBS snapshots.
 const source=imageSource===undefined?savedCentreImage(png):imageSource;
 if(img&&img.dataset.imageSource!==(source??'')){
  img.hidden=true;img.dataset.imageSource=source??'';
  if(source){img.onload=()=>{if(img.dataset.imageSource===source)img.hidden=false;};img.onerror=()=>{if(img.dataset.imageSource===source)img.hidden=true;};img.src=source;}else{img.onload=null;img.onerror=null;img.removeAttribute('src');}
 }
 stage.dataset.centreImage=String(!!source);
}
export function createCentreEditor(form){
 const fieldset=document.createElement('fieldset');fieldset.className='dw-line-settings centre-png-settings';
 fieldset.innerHTML=`<legend>Centre PNG</legend><label class="dw-toggle"><input type="checkbox" id="centre-png">Show centre PNG space</label><label class="dw-toggle" id="centre-bonus-cover-label"><input type="checkbox" id="centre-bonus-cover" checked>Cover locked bonus wheel &amp; reveal on unlock</label><button type="button" id="centre-png-money">Use Faith’s Money Multiplier PNG</button><label class="field">Upload centre PNG<input id="centre-png-file" type="file" accept="image/png,.png"></label><p class="hint">Upload once, then save changes. Your PNG stays centred, appears in OBS, and hides with the wheel. The bonus cover shrinks and fades with a glow when the third wheel unlocks. Transparent edges and protruding details are preserved. Increase Artwork size to let coins or decorations overlap the wheel. PNG up to 10 MB.</p><div class="centre-png-upload-preview"><img id="centre-png-thumbnail" alt="Uploaded centre PNG" referrerpolicy="no-referrer" hidden><button type="button" id="centre-png-remove" hidden>Remove PNG</button></div><p class="hint" id="centre-png-upload-status" role="status"></p><label class="field">Center space (pixels)<input id="centre-png-size" type="number" min="60" max="150" step="1" value="120" required></label><label class="field">Artwork size (%)<input id="centre-png-scale" type="number" min="50" max="200" step="1" value="100" required></label><p class="hint">With bonus cover on, 100% fits the full locked bonus wheel. Increase it for transparent margins or protruding coins. With it off, 100% fits the center space and the PNG stays visible.</p><details><summary>Fine-tune artwork position</summary><div class="wheel-quick"><label class="field">PNG left / right (pixels)<input id="centre-png-x" type="number" min="-60" max="60" step="1" value="0" required></label><label class="field">PNG up / down (pixels)<input id="centre-png-y" type="number" min="-60" max="60" step="1" value="0" required></label></div><p class="hint">Use small nudges to center the main badge when details stick out more on one side. Negative moves left or up.</p><button type="button" id="centre-png-placement-reset">Reset artwork placement</button></details><label class="dw-toggle"><input type="checkbox" id="centre-png-guide">Show alignment guide in this preview</label><p class="hint" id="centre-png-position"></p><p class="hint">The guide never appears in OBS. Save changes to update the next viewer; a current spin keeps its existing image.</p>`;
 if(form.querySelector('#centre-artwork'))form.querySelector('#centre-artwork').append(fieldset);else form.querySelector('#font-family').closest('label').before(fieldset);
 const $=q=>fieldset.querySelector(q),enabled=$('#centre-png'),diameter=$('#centre-png-size'),scale=$('#centre-png-scale'),offsetX=$('#centre-png-x'),offsetY=$('#centre-png-y'),cover=$('#centre-bonus-cover'),guide=$('#centre-png-guide'),position=$('#centre-png-position'),preview=form.ownerDocument.querySelector('#preview'),file=$('#centre-png-file'),remove=$('#centre-png-remove'),thumbnail=$('#centre-png-thumbnail'),status=$('#centre-png-upload-status');
 let assetId,builtin,uploading=false,bonusGame=false;
 function refresh(){
  diameter.disabled=bonusGame&&cover.checked;
  position.textContent=assetId||builtin?'Your uploaded PNG is part of the game. Use only the existing 540 × 660 OBS Browser Source; remove any separate copy of this PNG from OBS to avoid doubling it.':enabled.checked?'You can also keep a separate OBS image over this space. Centre it at X 270, Y 275 within the 540 × 660 source; its visibility stays separate until you upload it here.':'Upload a PNG to turn on the centred layout automatically, or enable the space for a separate OBS image.';
  if(preview)preview.dataset.centreGuide=String(guide.checked);guide.disabled=!enabled.checked;
  remove.hidden=!assetId&&!builtin;remove.disabled=uploading;file.disabled=uploading;
  const image=savedCentreImage({assetId,builtin});
  if(thumbnail.dataset.assetId!==(image??'')){
   thumbnail.dataset.assetId=image??'';thumbnail.hidden=!image;
   if(image){thumbnail.src=image;thumbnail.onerror=()=>{thumbnail.hidden=true;status.textContent='The saved PNG could not load. Refresh the page or upload it again.';};}else thumbnail.removeAttribute('src');
  }
 }
 function changed(){refresh();form.dispatchEvent(new Event('input',{bubbles:true}));}
 fieldset.addEventListener('input',event=>{if(event.target===file){event.stopPropagation();return;}refresh();if(event.target===guide)event.stopPropagation();});
 file.addEventListener('change',async()=>{
  const selected=file.files?.[0];if(!selected)return;
  uploading=true;status.textContent='Preparing and uploading PNG…';changed();
  try{
   const connection=readSharedConnection();if(!connection)throw Error('Open the private editing link to upload a PNG.');
   const blob=await prepareCentrePng(selected),next=await uploadCentrePng(blob,{connection});assetId=next;builtin=undefined;enabled.checked=true;status.textContent='PNG uploaded. Save changes to use it on stream.';
  }catch(error){status.textContent=error.message;}finally{uploading=false;file.value='';changed();}
 });
 $('#centre-png-money').onclick=()=>{if(uploading)return;builtin='money-multiplier';assetId=undefined;enabled.checked=true;cover.checked=true;scale.value=106;offsetX.value=offsetY.value=0;status.textContent='Faith’s PNG selected. Save changes to use it on stream.';changed();};
 $('#centre-png-placement-reset').onclick=()=>{scale.value=100;offsetX.value=offsetY.value=0;changed();};
 remove.addEventListener('click',()=>{if(uploading)return;assetId=undefined;builtin=undefined;status.textContent='PNG removed from this setup. Save changes to update the next viewer.';changed();});
 return {set(config){bonusGame=!!config.bonus;const png=readCentrePng(config.centrePng);enabled.checked=png.enabled;cover.checked=png.bonusCover!==false;$('#centre-bonus-cover-label').hidden=!config.bonus;diameter.value=png.diameter;const p=readArtworkPlacement(png);scale.value=p.artworkScale;offsetX.value=p.artworkX;offsetY.value=p.artworkY;assetId=png.assetId;builtin=png.builtin;status.textContent=assetId||builtin?'PNG saved with this game.':'';refresh();},read(){if(uploading)throw Error('Wait for the PNG upload to finish, then save.');return readCentrePng({enabled:enabled.checked,bonusCover:cover.checked,diameter:Number(diameter.value),artworkScale:Number(scale.value),artworkX:offsetX.value.trim()===''?NaN:Number(offsetX.value),artworkY:offsetY.value.trim()===''?NaN:Number(offsetY.value),...(builtin?{builtin}:{}),...(assetId?{assetId}:{})});}};
}
