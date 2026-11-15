import {createWheelEditor} from './wheel-editor.js';
export const createBonusEditor=(form,options={})=>createWheelEditor(form,{bonus:true,...options});
