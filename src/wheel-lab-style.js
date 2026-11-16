import {presetAppearance} from './double-appearance.js';
import {validateLab} from './wheel-lab-game.js';

export const labDiscs=(kind,tier=0)=>kind==='stack'?[[0,210,276],[1,144,202],[2,78,136]]:kind==='crowns'?[[0,193,276],[1,78,181]]:[[kind==='climb'?tier:0,78,276]];
export function labLabelMetrics(inner,outer,count,label,hasBase=false){
 const radius=(inner+outer)/2-4,width=outer-inner-18,arc=2*radius*Math.sin(Math.PI/count);
 return {radius,width,size:Math.min(36,width/(label.length*.7),arc*(hasBase ? 0.42 : 0.62))};
}
// Applying a theme is explicit; existing saved colours and game rules are preserved on load.
export function faithLabTheme(source){
 const c=validateLab(source),a=presetAppearance('landaire',2,2,c.font),gold=['#FFC86B','#FFE9AD'];
 return validateLab({...c,rim:a.colors.rim,pointer:a.colors.pointer,text:a.colors.labelA,special:gold[0],wheels:c.wheels.map((w,i)=>({...w,colors:i===2||c.kind==='crowns'&&i===1?gold:i===1?a.innerColors:a.outerColors}))});
}
