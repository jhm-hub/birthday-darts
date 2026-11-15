import {createWheelEditor} from './wheel-editor.js';
import {createCentreEditor} from './centre-png.js';
export const createDoubleEditor=form=>createWheelEditor(form,{centre:createCentreEditor(form)});
