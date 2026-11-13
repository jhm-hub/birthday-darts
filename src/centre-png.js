import {SHARED_API,readSharedConnection} from './shared-settings-connection.js';
import {prepareCentrePng,uploadCentrePng} from './centre-png-upload.js';
// OBS coordinates are deliberately fixed while this layout is enabled, across
// line landings, bonus reveals, saved versions and all six wheel games.
export function readCentrePng(raw){
 if(raw===undefined)return {enabled:false,diameter:120};
 if(!raw||typeof raw.enabled!=='boolean'||!Number.isInteger(raw.diameter)||raw.diameter<60||raw.diameter>150)throw Error('Choose a centre PNG diameter from 60 to 150 pixels.');
 if(raw.assetId!==undefined&&!/^[a-f0-9]{64}$/.test(raw.assetId))throw Error('Upload a valid centre PNG.');
 return {enabled:raw.enabled,diameter:raw.diameter,...(raw.assetId?{assetId:raw.assetId}:{})};
}
export function wheelGeometry(config,bonus=false){
 const png=readCentrePng(config.centrePng);
 if(png.enabled)return {png,cutout:png.diameter/1.5,outer:[218,274],inner:bonus?[160,211]:[png.diameter/1.5+10,190],bonus:[png.diameter/1.5+10,153],innerRim:214,bonusRim:156,innerPointer:bonus?519:498,bonusPointer:461};
 return {png,cutout:0,outer:bonus?[214,274]:[192,274],inner:bonus?[123,190]:[48,157],bonus:[30,105],innerRim:bonus?209:186,bonusRim:116,innerPointer:bonus?498:466,bonusPointer:412};
}
let maskId=0;
export function reserveSvgCentre(svg,geometry){
 if(!geometry.png.enabled)return;
 const ns='http://www.w3.org/2000/svg',node=(tag,attrs)=>{const el=document.createElementNS(ns,tag);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));return el;};
 const id='wheel-centre-mask-'+(++maskId),defs=node('defs',{}),mask=node('mask',{id,maskUnits:'userSpaceOnUse',x:0,y:0,width:600,height:600});
 mask.append(node('rect',{width:600,height:600,fill:'white'}),node('circle',{cx:300,cy:300,r:geometry.cutout,fill:'black'}));defs.append(mask);
 const content=node('g',{'mask':`url(#${id})`,'data-centre-cutout':geometry.cutout});content.append(...svg.childNodes);svg.append(defs,content);
 content.append(node('circle',{cx:300,cy:300,r:geometry.cutout+2,fill:'none',stroke:'var(--ring-light)','stroke-width':2}));
}
export const centreImageURL=id=>SHARED_API+'/api/wheel-images/image/'+id+'.png';
export function setCentreLayout(stage,config){
 const png=readCentrePng(config.centrePng);stage.dataset.centrePng=String(png.enabled);stage.style.setProperty('--centre-png-size',png.diameter+'px');
 const img=stage.querySelector('.dw-centre-image');
 if(img&&img.dataset.assetId!==(png.assetId??'')){
  img.hidden=true;img.dataset.assetId=png.assetId??'';
  if(png.assetId){const id=png.assetId;img.onload=()=>{if(img.dataset.assetId===id)img.hidden=false;};img.onerror=()=>{img.hidden=true;};img.src=centreImageURL(id);}else{img.onload=null;img.onerror=null;img.removeAttribute('src');}
 }
 stage.dataset.centreImage=String(!!png.assetId);
}
export function createCentreEditor(form){
 const fieldset=document.createElement('fieldset');fieldset.className='dw-line-settings centre-png-settings';
 fieldset.innerHTML=`<legend>Static centre PNG</legend><label class="dw-toggle"><input type="checkbox" id="centre-png">Show centre PNG space</label><label class="field">Upload centre PNG<input id="centre-png-file" type="file" accept="image/png,.png"></label><p class="hint">Upload once, then save changes. Your PNG stays upright and centred, appears in OBS, and hides with the wheel. Transparent padding is trimmed and the artwork is fitted into the circle without cutting it off. PNG up to 10 MB.</p><div class="centre-png-upload-preview"><img id="centre-png-thumbnail" alt="Uploaded centre PNG" referrerpolicy="no-referrer" hidden><button type="button" id="centre-png-remove" hidden>Remove PNG</button></div><p class="hint" id="centre-png-upload-status" role="status"></p><label class="field">PNG diameter (pixels)<input id="centre-png-size" type="number" min="60" max="150" step="1" value="120" required></label><label class="dw-toggle"><input type="checkbox" id="centre-png-guide">Show alignment guide in this preview</label><p class="hint" id="centre-png-position"></p><p class="hint">The guide never appears in OBS. Save changes to update the next viewer; a current spin keeps its existing image.</p>`;
 form.querySelector('#font-family').closest('label').before(fieldset);
 const $=q=>fieldset.querySelector(q),enabled=$('#centre-png'),diameter=$('#centre-png-size'),guide=$('#centre-png-guide'),position=$('#centre-png-position'),preview=form.ownerDocument.querySelector('#preview'),file=$('#centre-png-file'),remove=$('#centre-png-remove'),thumbnail=$('#centre-png-thumbnail'),status=$('#centre-png-upload-status');
 let assetId,uploading=false;
 function refresh(){
  position.textContent=assetId?'Your uploaded PNG is part of the game. Use only the existing 540 × 660 OBS Browser Source; remove any separate copy of this PNG from OBS to avoid doubling it.':enabled.checked?'You can also keep a separate OBS image over this space. Centre it at X 270, Y 275 within the 540 × 660 source; its visibility stays separate until you upload it here.':'Upload a PNG to turn on the centred layout automatically, or enable the space for a separate OBS image.';
  if(preview)preview.dataset.centreGuide=String(guide.checked);guide.disabled=!enabled.checked;
  remove.hidden=!assetId;remove.disabled=uploading;file.disabled=uploading;
  if(thumbnail.dataset.assetId!==(assetId??'')){
   thumbnail.dataset.assetId=assetId??'';thumbnail.hidden=!assetId;
   if(assetId){thumbnail.src=centreImageURL(assetId);thumbnail.onerror=()=>{thumbnail.hidden=true;status.textContent='The saved PNG could not load. Refresh the page or upload it again.';};}else thumbnail.removeAttribute('src');
  }
 }
 function changed(){refresh();form.dispatchEvent(new Event('input',{bubbles:true}));}
 fieldset.addEventListener('input',event=>{if(event.target===file){event.stopPropagation();return;}refresh();if(event.target===guide)event.stopPropagation();});
 file.addEventListener('change',async()=>{
  const selected=file.files?.[0];if(!selected)return;
  uploading=true;status.textContent='Preparing and uploading PNG…';changed();
  try{
   const connection=readSharedConnection();if(!connection)throw Error('Open the private editing link to upload a PNG.');
   const blob=await prepareCentrePng(selected),next=await uploadCentrePng(blob,{connection});assetId=next;enabled.checked=true;status.textContent='PNG uploaded. Save changes to use it on stream.';
  }catch(error){status.textContent=error.message;}finally{uploading=false;file.value='';changed();}
 });
 remove.addEventListener('click',()=>{if(uploading)return;assetId=undefined;status.textContent='PNG removed from this setup. Save changes to update the next viewer.';changed();});
 return {set(config){const png=readCentrePng(config.centrePng);enabled.checked=png.enabled;diameter.value=png.diameter;assetId=png.assetId;status.textContent=assetId?'PNG saved with this game.':'';refresh();},read(){if(uploading)throw Error('Wait for the PNG upload to finish, then save.');return readCentrePng({enabled:enabled.checked,diameter:Number(diameter.value),...(assetId?{assetId}:{})});}};
}
