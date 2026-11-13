import { wheelLayout } from "./model.js";
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
  host.replaceChildren();
  const svg = node("svg", { viewBox: "0 0 600 600", "aria-hidden": "true", class: "wheel-svg" });
  svg.append(node("circle", { cx: 300, cy: 300, r: 282, fill: "var(--rim)", class: "rim-shadow" }));
  const rotor = (values, inner2, outer2, name) => {
    const group = node("g", { "data-rotor": name });
    const labels = [];
    wheelLayout(values).forEach((slice, i) => {
      const a = slice.startTurn * 360, b = a + slice.sizeTurn * 360, middle = (a + b) / 2;
      const wedge = node("path", { d: path(inner2, outer2, a, b), fill: `var(--${name}-${i % 2 ? "b" : "a"})`, stroke: "var(--divider)", "stroke-width": 1.5, "data-slice": i });
      group.append(wedge);
      const radial = (inner2 + outer2) / 2;
      const [x, y] = point(radial, middle).split(" ");
      const size = Math.min(name === "outer" ? 34 : 30, (outer2 - inner2) * 0.65 / Math.max(1, String(values[i]).length * 0.7), 2 * radial * Math.sin(Math.PI / values.length) * 0.7);
      const text = node("text", { x, y, transform: `rotate(${middle} ${x} ${y})`, "font-size": size, class: "slice-label" });
      text.textContent = String(values[i]);
      group.append(text);
      labels.push(wedge);
    });
    svg.append(group);
    return { group, labels };
  };
  const outer = rotor(config.outer, 192, 274, "outer");
  svg.append(node("circle", { cx: 300, cy: 300, r: 186, fill: "var(--rim)", stroke: "var(--ring-light)", "stroke-width": 3 }));
  const inner = rotor(config.inner, 48, 157, "inner");
  svg.append(node("circle", { cx: 300, cy: 300, r: 160, fill: "none", stroke: "var(--ring-light)", "stroke-width": 4 }));
  const pointer = (x, scale) => {
    const g = node("g", { transform: `translate(${x} 300) scale(${scale})`, class: "gem-pointer" });
    g.append(node("path", { d: "M -21 0 L 5 -15 L 24 -10 L 24 10 L 5 15 Z", fill: "#f6e6ff", stroke: "var(--rim)", "stroke-width": 2.5 }));
    g.append(node("path", { d: "M -21 0 L 5 -15 L 10 0 Z", fill: "#e6c5ff" }));
    g.append(node("path", { d: "M -21 0 L 10 0 L 5 15 Z", fill: "#b16cd0" }));
    g.append(node("path", { d: "M 10 0 L 24 -10 L 24 10 L 5 15 Z", fill: "#873fa7" }));
    svg.append(g);
  };
  pointer(575, 1);
  pointer(466, 0.79);
  host.append(svg);
  return {
    draw(angles) {
      outer.group.setAttribute("transform", `rotate(${angles.outer} 300 300)`);
      inner.group.setAttribute("transform", `rotate(${angles.inner} 300 300)`);
    },
    highlight(oi, ii) {
      outer.labels.forEach((el, i) => el.classList.toggle("winner", i === oi));
      inner.labels.forEach((el, i) => el.classList.toggle("winner", i === ii));
    }
  };
}
export {
  renderWheel
};
