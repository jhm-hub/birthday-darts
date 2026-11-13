import {wheelGeometry,reserveSvgCentre} from './centre-png.js';
import { wheelLayout } from "./double-wheel/model.js";
import {readBonusAppearance,mirroredSides} from './bonus-game.js';
const NS = "http://www.w3.org/2000/svg";
function node(name, attrs) {
  const el = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value)));
  return el;
}
function point(r, angle) {
  const a = angle * Math.PI / 180;
  return `${300 + r * Math.cos(a)} ${300 + r * Math.sin(a)}`;
}
function path(inner, outer, a, b) {
  const large = b - a > 180 ? 1 : 0;
  return `M ${point(outer, a)} A ${outer} ${outer} 0 ${large} 1 ${point(outer, b)} L ${point(inner, b)} A ${inner} ${inner} 0 ${large} 0 ${point(inner, a)} Z`;
}
function renderWheel(host, config) {
  const appearance=readBonusAppearance(config);
  const geometry=wheelGeometry(config,true);
  host.replaceChildren();
  const svg = node("svg", { viewBox: "0 0 600 600", "aria-hidden": "true", class: "wheel-svg" });
  svg.append(node("circle", { cx: 300, cy: 300, r: 282, fill: "var(--rim)", class: "rim-shadow" }));
  const rotor = (values, inner2, outer2, name) => {
    const group = node("g", { "data-rotor": name });
    const labels = [],mirrorLabels=[];
    wheelLayout(values).forEach((slice, i) => {
      const a = slice.startTurn * 360, b = a + slice.sizeTurn * 360, middle = (a + b) / 2;
      const wedge = node("path", { d: path(inner2, outer2, a, b), fill: appearance[name+'Colors'][i], stroke: "var(--divider)", "stroke-width": 1.5, "data-slice": i });
      group.append(wedge);
      const radial = (inner2 + outer2) / 2;
      const [x, y] = point(radial, middle).split(" ");
      const mirrorSlot=name==='inner'&&config.mirrorUnlock==='slot'&&config.mirrorSlots?.includes(i);
      const label=name==='inner'&&config.bonusSlots.includes(i)?'BONUS':mirrorSlot?'MIRROR':String(values[i]);
      const sizeFor=value=>Math.min(name === "outer" ? 34 : 30, (outer2 - inner2) * 0.9 / Math.max(1, String(value).length * 0.65), 2 * radial * Math.sin(Math.PI / values.length) * 0.7),size=sizeFor(label);
      const text = node("text", { x, y, transform: `rotate(${middle} ${x} ${y})`, "font-size": size, class: "slice-label",style:name==='bonus'?'fill:'+appearance.bonusTextColor:'' });
      text.textContent = label;if(mirrorSlot)mirrorLabels.push({text,value:String(values[i]),size,numericSize:sizeFor(values[i])});
      group.append(text);
      labels.push(wedge);
    });
    svg.append(group);
    return { group, labels,mirrorLabels };
  };
  const outer = rotor(config.outer, ...geometry.outer, "outer");
  svg.append(node("circle", { cx: 300, cy: 300, r: geometry.innerRim, fill: "var(--rim)", stroke: "var(--ring-light)", "stroke-width": 3 }));
  const inner = rotor(config.inner, ...geometry.inner, "inner");
  svg.append(node("circle", { cx: 300, cy: 300, r: geometry.inner[1]+3, fill: "none", stroke: "var(--ring-light)", "stroke-width": 4 }));
  svg.append(node("circle", {cx:300,cy:300,r:geometry.bonusRim,fill:"var(--rim)",stroke:"var(--ring-light)","stroke-width":3}));
  const bonus=rotor(config.bonus,...geometry.bonus,"bonus");
  svg.append(node("circle",{cx:300,cy:300,r:geometry.bonus[1]+3,fill:"none",stroke:"var(--ring-light)","stroke-width":3}));
  const pointer = (x, scale, direction=1) => {
    const g = node("g", { transform: `translate(${x} 300) scale(${scale*direction} ${scale})`, class: "gem-pointer" });
    g.append(node("path", { d: "M -21 0 L 5 -15 L 24 -10 L 24 10 L 5 15 Z", fill: "var(--pointer)", stroke: "var(--rim)", "stroke-width": 2.5 }));
    g.append(node("path", { d: "M -21 0 L 5 -15 L 10 0 Z", fill: "#FFFFFF", opacity:.25 }));
    g.append(node("path", { d: "M -21 0 L 10 0 L 5 15 Z", fill: "#000000", opacity:.15 }));
    g.append(node("path", { d: "M 10 0 L 24 -10 L 24 10 L 5 15 Z", fill: "#000000", opacity:.3 }));
    svg.append(g);return g;
  };
  pointer(575, 1);
  pointer(geometry.innerPointer, .7);
  const mirrored=mirroredSides(config),bonusPointer=pointer(geometry.bonusPointer,.55),mirrorPointers=[];
  if(mirrored.includes('outer'))mirrorPointers.push({node:pointer(25,1,-1),side:'outer'});
  if(mirrored.includes('inner'))mirrorPointers.push({node:pointer(600-geometry.innerPointer,.7,-1),side:'inner'});
  if(mirrored.includes('bonus'))mirrorPointers.push({node:pointer(600-geometry.bonusPointer,.55,-1),side:'bonus'});
  mirrorPointers.forEach(p=>p.node.classList.add('mirror-pointer'));
  const cover=node("g",{class:"bw-cover"});
  if(geometry.png.enabled){
   cover.append(node("circle",{cx:300,cy:300,r:geometry.bonusRim-1,fill:"var(--hub)",stroke:"var(--rim)","stroke-width":3}));
   const radial=(geometry.bonus[0]+geometry.bonus[1])/2;
   for(const [text,y] of [["BONUS",300-radial],["LOCKED",300+radial]]){const label=node("text",{x:300,y,"text-anchor":"middle","dominant-baseline":"central",fill:"var(--rim)","font-size":15,"font-weight":700});label.textContent=text;cover.append(label);}
  }else{
  cover.append(node("circle",{cx:300,cy:300,r:115,fill:"var(--hub)",stroke:"var(--rim)","stroke-width":5}));
  const lock=node("path",{d:"M285 284v-12a15 15 0 0 1 30 0v12 M279 284h42v32h-42Z",fill:"none",stroke:"var(--rim)","stroke-width":5,"stroke-linejoin":"round"});cover.append(lock);
  for(const [text,y,size] of [["BONUS",340,21],["LOCKED",361,12]]){const label=node("text",{x:300,y,"text-anchor":"middle",fill:"var(--rim)","font-size":size,"font-weight":700});label.textContent=text;cover.append(label);}
  }
  svg.append(cover);
  reserveSvgCentre(svg,geometry);
  host.append(svg);
  return {
    draw(angles,unlocked=false,mirrorActive=config.mirrorUnlock!=='slot') {
      cover.classList.toggle("is-open",unlocked);
      bonusPointer.style.opacity=unlocked?'1':'0';
      mirrorPointers.forEach(p=>p.node.style.opacity=mirrorActive&&(p.side!=='bonus'||unlocked)?'1':'0');
      inner.mirrorLabels.forEach(p=>{p.text.textContent=mirrorActive?p.value:'MIRROR';p.text.setAttribute('font-size',mirrorActive?p.numericSize:p.size);});
      bonus.group.setAttribute("transform",`rotate(${angles.bonus} 300 300)`);
      outer.group.setAttribute("transform", `rotate(${angles.outer} 300 300)`);
      inner.group.setAttribute("transform", `rotate(${angles.inner} 300 300)`);
    },
    highlight(oi, ii, bi) {
      const bonusIndices=Array.isArray(bi)?bi:bi===undefined?[]:[bi];
      const outerIndices=Array.isArray(oi)?oi:oi===undefined?[]:[oi],innerIndices=Array.isArray(ii)?ii:ii===undefined?[]:[ii];
      outer.labels.forEach((el, i) => el.classList.toggle("winner", outerIndices.includes(i)));
      bonus.labels.forEach((el,i)=>el.classList.toggle("winner",bonusIndices.includes(i)));
      inner.labels.forEach((el, i) => el.classList.toggle("winner", innerIndices.includes(i)));
    }
  };
}
export {
  renderWheel
};
