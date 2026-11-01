// Private control UI only. Selection changes the saved setup on the permanent
// display, without navigating or replacing the connected browser source.
export function bindVersionPicker(root,session,{canSwitch=()=>true,onSwitch=()=>{},editor,idleNote='All saved versions and range buttons use this one permanent OBS source.'}={}){
 const label=document.createElement('label'),select=document.createElement('select'),note=document.createElement('p'),edit=document.createElement('a');
 label.textContent='Saved version';select.setAttribute('aria-label','Saved version');label.append(select);
 note.className='version-note';note.setAttribute('role','status');
 edit.textContent='Edit this version ↗';edit.className='version-edit';
 root.append(label,edit,note);
 let key='',snapshot=null,available=false,busy=false,versions=session.versions();
 function render(){
  const next=JSON.stringify(versions);
  if(key!==next){key=next;select.replaceChildren(...versions.map(w=>new Option(w.name,w.id)));}
  select.value=snapshot?.widget.id??session.id;
  select.disabled=!available||busy||!!snapshot?.round;
  edit.href=editor+'?id='+encodeURIComponent(select.value);
  note.textContent=snapshot?.round?'Finish this viewer before switching versions. Your OBS link stays the same.':idleNote;
 }
 select.onchange=async()=>{
  if(busy||!available||snapshot?.round){render();return;}
  if(!canSwitch()){render();note.textContent='Save your edited settings before switching versions.';return;}
  busy=true;const id=select.value;render();
  try{
   await session.selectVersion(id);
   const url=new URL(location.href);url.searchParams.set('id',session.id);history.replaceState(null,'',url);
   onSwitch();render();
  }catch(e){render();note.textContent=e.message;}finally{busy=false;select.disabled=!available||!!snapshot?.round;}
 };
 // Darts renders every animation frame. Read saved versions only when a new
 // snapshot arrives, not on every frame of the character animation.
 return {update(next,enabled){if(next!==snapshot)versions=session.versions();snapshot=next;available=enabled;render();}};
}
