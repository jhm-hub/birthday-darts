import {createWheelEditor} from './wheel-editor.js';
import {createCentreEditor} from './centre-png.js';
export const createBonusEditor=(form,options={})=>createWheelEditor(form,{bonus:true,...options,centre:createCentreEditor(form)});
