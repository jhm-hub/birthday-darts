// OBS coordinates are deliberately fixed while this layout is enabled, across
// line landings, bonus reveals, saved versions and all six wheel games.
export function readCentrePng(raw){
 if(raw===undefined)return {enabled:false,diameter:120};
 if(!raw||typeof raw.enabled!=='boolean'||!Number.isInteger(raw.diameter)||raw.diameter<60||raw.diameter>150)throw Error('Choose a centre PNG diameter from 60 to 150 pixels.');
 return {enabled:raw.enabled,diameter:raw.diameter};
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
export function setCentreLayout(stage,config){
 const png=readCentrePng(config.centrePng);stage.dataset.centrePng=String(png.enabled);stage.style.setProperty('--centre-png-size',png.diameter+'px');
}
export function createCentreEditor(form){
 const fieldset=document.createElement('fieldset');fieldset.className='dw-line-settings centre-png-settings';
 fieldset.innerHTML='<legend>Static centre PNG</legend><label class="dw-toggle"><input type="checkbox" id="centre-png">Reserve space for my OBS PNG</label><label class="field">PNG diameter (pixels)<input id="centre-png-size" type="number" min="60" max="150" step="1" value="120" required></label><p class="hint">Keep your PNG as an OBS Image Source above the game. Fit its visible artwork inside this circle. Numbers and bonus reveals stay outside it.</p><label class="dw-toggle"><input type="checkbox" id="centre-png-guide">Show alignment guide in this preview</label><p class="hint" id="centre-png-position"></p><p class="hint">The guide never appears in OBS. The separate PNG keeps its own visibility: group it with the game to show or hide both together. Save changes to use this layout on stream.</p>';
 form.querySelector('#font-family').closest('label').before(fieldset);
 const enabled=fieldset.querySelector('#centre-png'),diameter=fieldset.querySelector('#centre-png-size'),guide=fieldset.querySelector('#centre-png-guide'),position=fieldset.querySelector('#centre-png-position'),preview=form.ownerDocument.querySelector('#preview');
 function refresh(){
  const size=Number(diameter.value);position.textContent=enabled.checked?`For a 540 × 660 Browser Source: centre at X 270, Y 275. A ${size} × ${size} PNG starts at X ${270-size/2}, Y ${275-size/2}, relative to the source. Group and scale both together; allow for any transparent padding in the PNG.`:'Enable this layout to keep the PNG aligned during line landings and bonus spins.';
  if(preview)preview.dataset.centreGuide=String(guide.checked);guide.disabled=!enabled.checked;
 }
 fieldset.addEventListener('input',event=>{refresh();if(event.target===guide)event.stopPropagation();});
 return {set(config){const png=readCentrePng(config.centrePng);enabled.checked=png.enabled;diameter.value=png.diameter;refresh();},read(){return readCentrePng({enabled:enabled.checked,diameter:Number(diameter.value)});}};
}
