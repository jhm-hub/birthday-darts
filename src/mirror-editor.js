import {createBonusEditor} from './bonus-editor.js';
import {mirroredSides} from './bonus-game.js';
export function createMirrorEditor(form){
 const editor=createBonusEditor(form),mode=form.querySelector('#mirror-mode');
 const steps=()=>{const sides=mirroredSides({mirrorMode:mode.value});for(const side of ['outer','inner','bonus'])form.querySelector('#'+side+'-count').step=sides.includes(side)?'2':'1';};
 return {set(config){mode.value=config.mirrorMode;editor.set(config);steps();},input(event){editor.input(event);steps();},read(){return {...editor.read(),mirrorMode:mode.value};}};
}
