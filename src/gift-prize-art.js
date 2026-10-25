// Small shaded emblems on a 20x20 pixel grid, using the Candy Confetti palette.
export function giftPrizeEmblem(kind){
 let art;
 if(kind==='cash')art='<path d="M6 1H14V3H17V6H19V14H17V17H14V19H6V17H3V14H1V6H3V3H6Z" fill="#6d4752"/><path d="M6 2H14V4H16V6H18V13H16V16H13V18H6V16H4V13H2V6H4V4H6Z" fill="#e9b56f"/><path d="M6 3H13V5H16V7H17V12H15V15H12V16H6V14H4V7H6Z" fill="#ffe3a5"/><path d="M6 4H12V5H7V7H5V11H4V7H6Z" fill="#fff6d0"/><path d="M10 5H12V7H14V9H11V10H14V14H11V16H9V14H6V12H10V11H7V7H10Z" fill="#b7795c"/><path d="M9 7H12V8H9ZM9 12H12V13H9Z" fill="#fff0bd"/>';
 else if(kind==='multiply')art='<path d="M7 0H13V3H17V7H20V13H17V17H13V20H7V17H3V13H0V7H3V3H7Z" fill="#785183"/><path d="M7 2H13V5H16V8H18V12H15V16H12V18H8V15H4V12H2V8H5V4H7Z" fill="#c293e0"/><path d="M7 3H12V5H8V7H5V11H3V8H5V5H7Z" fill="#eee0ff"/><path d="M6 6H8V8H10V10H12V8H14V6H16V9H14V11H12V13H14V15H11V13H9V15H6V13H8V11H6Z" fill="#fff2d4"/>';
 else{
  const accent={extra:'#bcebd4',row:'#bfe5ff',column:'#ffbfdc'}[kind]??'#ffe3a5';
  art='<path d="M2 1H18V3H20V18H18V20H2V18H0V3H2Z" fill="#4d344d"/>';
  for(let row=0;row<3;row++)for(let col=0;col<3;col++){
   const added=kind==='row'?row===2:kind==='column'?col===2:row===2||col===2,x=2+col*6,y=2+row*6;
   art+=`<path d="M${x} ${y}h4v4h-4Z" fill="${added?accent:'#80687d'}"/><path d="M${x} ${y}h4v1h-3v2h-1Z" fill="${added?'#fff6dc':'#b39bb3'}"/>`;
  }
 }
 // Crisp lower facets give every emblem the same upper-left lighting.
 if(kind==='cash')art+='<path d="M16 12H18V14H16V16H14V17H12V16H14V14H16Z" fill="#ba805d"/><path d="M5 5H7V6H5V8H4V6H5Z" fill="#fff8df"/>';
 else if(kind==='multiply')art+='<path d="M16 12H18V14H16V16H14V18H11V17H13V15H15V13H16Z" fill="#9867b6"/><path d="M8 3H12V4H8V5H6V4H8Z" fill="#fff1ff"/>';
 return `<svg viewBox="0 0 20 20" aria-hidden="true" shape-rendering="crispEdges">${art}</svg>`;
}
