// Visibility belongs to the stream display, independently of viewer scoring.
export function createStreamVisibility(anchor,change){
 const panel=document.createElement('div');panel.className='wheel-stream-visibility';
 panel.innerHTML='<span role="status"></span><button type="button">Hide wheel</button>';
 anchor.after(panel);const button=panel.querySelector('button'),status=panel.querySelector('span');let visible=true;
 button.onclick=()=>change(!visible);
 return {update(value,{disabled=false}={}){visible=value;button.disabled=disabled;button.textContent=visible?'Hide wheel':'Show wheel';status.textContent=visible?'OBS · wheel shown':'OBS · wheel hidden';}};
}
