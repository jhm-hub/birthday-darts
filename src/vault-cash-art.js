const coin=(x,y,gem=false)=>`<g transform="translate(${x} ${y})"><path d="M5 0H15V2H18V5H20V15H18V18H15V20H5V18H2V15H0V5H2V2H5Z" fill="#492c42"/><path d="M5 2H15V4H18V15H15V18H5V16H2V5H5Z" fill="#bc824e"/><path d="M5 2H15V4H18V7H15V5H5V15H2V5H5Z" fill="#fff2c5"/><path d="M6 5H14V7H16V13H14V15H6V13H4V7H6Z" fill="#f6d58d"/><path d="M6 7H8V13H6ZM8 5H14V7H8Z" fill="#fff5c9"/><path d="M14 7H16V13H14ZM6 15H14V17H6Z" fill="#d99b5b"/>${gem?'<path d="M8 7H12V9H14V11H12V14H8V11H6V9H8Z" fill="#8e5271"/><path d="M8 8H12V10H10V12H8Z" fill="#f3a8ce"/><path d="M8 8H10V10H8Z" fill="#ffe0e9"/>':'<path d="M9 7H12V9H10V12H8V10H9Z" fill="#b1744a"/>'}</g>`;
// Successively richer stacks, using the same gold ramp and plum outlines as
// the Crown and bonus sprites. The vault itself never changes size.
export function vaultCashGlyph(level=0){
 return `<svg viewBox="0 0 30 28" shape-rendering="crispEdges" aria-hidden="true">${level>1?coin(8,1):''}${level>0?coin(1,5):''}${coin(level?8:5,level?8:4,level===2)}${level===2?'<path d="M3 0H5V3H8V5H5V8H3V5H0V3H3Z" fill="#fff0bc"/>':''}</svg>`;
}
