export function createLineControls(anchor,command){
 const panel=document.createElement('section');panel.className='wheel-line-controls';panel.setAttribute('aria-label','Private line calls');
 panel.innerHTML='<h3>Call a line</h3><p class="hint">After a spin, count the nearest two sections on a wheel. Its position stays put. Special slots still unlock their bonuses.</p><div class="line-call-buttons">'+['outer','inner','bonus'].map(side=>'<button type="button" data-call-line="'+side+'">'+(side==='bonus'?'Bonus wheel':side==='outer'?'Outer wheel':'Inner wheel')+'<small></small></button>').join('')+'</div><button type="button" data-undo-lines>Undo line calls</button><p class="hint" data-line-status aria-live="polite"></p>';
 anchor.after(panel);let state=null;
 for(const button of panel.querySelectorAll('[data-call-line]'))button.onclick=()=>command('line-call',{side:button.dataset.callLine,token:state?.token});
 panel.querySelector('[data-undo-lines]').onclick=()=>command('undo-lines',{token:state?.token});
 return {update(next,disabled=false){state=next;for(const button of panel.querySelectorAll('[data-call-line]')){const side=button.dataset.callLine,option=state?.options[side];button.hidden=side==='bonus'&&!option;button.disabled=disabled||!option||option.disabled;button.querySelector('small').textContent=option?option.label+(option.disabled?' · counted':''):'';}
 panel.querySelector('[data-undo-lines]').disabled=disabled||!state?.undo;
 panel.querySelector('[data-line-status]').textContent=state?.called?.length?'Line called: '+state.called.join(', ')+'. Undo restores this spin’s original result.':state?.available?'Choose a wheel to update this spin and its total.':'Available after the wheels and any bonuses stop.';
 }};
}
