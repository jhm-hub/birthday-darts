// Small, shaded sprites: the finale uses the same gold, rose, mint and plum
// palette as the Crown Vault. All silhouettes stay on whole source pixels.
const svg=body=>`<svg viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true">${body}</svg>`;
export function vaultFinalePiece(index){
 const pieces=[
  '<path d="M4 0H8V1H10V3H11V9H9V11H3V10H1V3H2V1H4Z" fill="#503149"/><path d="M4 1H8V2H10V8H8V10H4V9H2V3H4Z" fill="#b97839"/><path d="M4 1H8V2H9V7H8V9H4V8H3V3H4Z" fill="#f5c465"/><path d="M4 2H7V3H4V6H3V3H4ZM5 7H8V8H5Z" fill="#fff0b9"/><path d="M6 3H7V7H6Z" fill="#c98c42"/>',
  '<path d="M3 1H9V2H11V6H10V8H8V10H7V11H5V10H4V8H2V6H1V2H3Z" fill="#543459"/><path d="M3 2H9V3H10V5L6 10L2 5V3H3Z" fill="#b47bc2"/><path d="M3 2H9L7 5H2Z" fill="#ffe1f4"/><path d="M5 3H7L8 5L6 10L4 5Z" fill="#edb2e4"/><path d="M8 5H10L6 10Z" fill="#8755a6"/>',
  '<path d="M5 0H7V3H9V5H12V7H9V9H7V12H5V9H3V7H0V5H3V3H5Z" fill="#785064"/><path d="M5 1H7V4H8V5H11V7H8V8H7V11H5V8H4V7H1V5H4V4H5Z" fill="#ffd576"/><path d="M5 2H6V5H9V6H6V9H5V6H2V5H5Z" fill="#fff8d8"/>',
  '<path d="M1 2H4V4H8V2H11V9H10V11H2V9H1Z" fill="#56364b"/><path d="M2 3H3V5H5V2H7V5H9V3H10V8H2Z" fill="#eebc62"/><path d="M2 8H10V10H2Z" fill="#bd783c"/><path d="M3 8H9V9H3ZM5 3H6V6H5Z" fill="#fff1b3"/><path d="M5 7H7V9H5Z" fill="#e5a2d1"/>',
  '<path d="M3 1H8V2H10V8H8V11H3V9H1V3H3Z" fill="#405e65"/><path d="M3 2H8V3H9V7H7V10H3V8H2V3H3Z" fill="#77cabd"/><path d="M3 2H7V4H4V8H3Z" fill="#d9ffeb"/><path d="M7 5H9V7H7V9H5V8H7Z" fill="#459eae"/>'
 ];
 return svg(pieces[index%pieces.length]);
}
export function vaultFinaleRays(){
 return `<svg viewBox="0 0 240 160" shape-rendering="crispEdges" aria-hidden="true"><g fill="#fff0b5">${Array.from({length:12},(_,i)=>`<path transform="translate(120 80) rotate(${i*30})" d="M-2 -55H2V-43H4V-35H-4V-43H-2Z"/>`).join('')}</g><g fill="#e8b4e9"><path d="M15 70H20V75H25V80H20V85H15V80H10V75H15ZM220 70H225V75H230V80H225V85H220V80H215V75H220Z"/></g></svg>`;
}
