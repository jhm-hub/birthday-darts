import {clamp,ease} from './vault-token-game.js';

// One clock for the cabinet, token landings and their audio. The bankroll
// remains on its fixed plaque; these are presentation credits, never spins.
export const TOKEN_HANDOFF=Object.freeze({
 duration:2500, vaultOut:300, vaultGone:1080, cabinetIn:550, cabinetReady:1400,
 tokenStart:1050, tokenStagger:240, tokenTravel:600, lightAt:2020, lightEnd:2440,
});
export const tokenHandoffLandAt=index=>TOKEN_HANDOFF.tokenStart+index*TOKEN_HANDOFF.tokenStagger+TOKEN_HANDOFF.tokenTravel;
export function tokenHandoffPose(age,quiet=false){
 const t=TOKEN_HANDOFF;
 return {age,done:age>=t.duration,
  vault:1-ease((age-t.vaultOut)/(t.vaultGone-t.vaultOut)),
  cabinet:ease((age-t.cabinetIn)/(t.cabinetReady-t.cabinetIn)),
  cabinetY:quiet?0:12*(1-ease((age-t.cabinetIn)/(t.cabinetReady-t.cabinetIn))),
  labels:ease((age-850)/350),
  light:quiet?0:Math.sin(Math.PI*clamp((age-t.lightAt)/(t.lightEnd-t.lightAt))),
  lightProgress:clamp((age-t.lightAt)/(t.lightEnd-t.lightAt)),
  caption:age<t.lightAt?'MOVING YOUR EARNED TOKENS':'YOUR TOKENS ARE READY',
  captionOpacity:age<t.lightAt?1-ease((age-1850)/170):ease((age-t.lightAt)/200),
 };
}
export function tokenHandoffToken(index,age,quiet=false){
 const landAt=tokenHandoffLandAt(index),startAt=landAt-TOKEN_HANDOFF.tokenTravel;
 const u=ease((age-startAt)/TOKEN_HANDOFF.tokenTravel),v=1-u;
 const from={x:26.5+index*24,y:70.5},to={x:40.5+index*25,y:116.5};
 const landed=age>=landAt,started=age>=startAt;
 // The shallow arc keeps both physical credits inside the overlay. They
 // arrive in the tray, not the spin slot: Faith has not spent either one.
 const x=v**3*from.x+3*v*v*u*(from.x+55)+3*v*u*u*(to.x+38)+u**3*to.x;
 const y=v**3*from.y+3*v*v*u*(from.y-20)+3*v*u*u*(to.y-16)+u**3*to.y;
 return {landed,opacity:landed||quiet?0:1,x,y,
  tray:quiet?ease((age-landAt)/120):Number(landed),
  rotation:quiet||!started?0:Math.sin(u*Math.PI)*16,
  catchLight:quiet?0:Math.sin(Math.PI*clamp((age-landAt)/260)),
 };
}
