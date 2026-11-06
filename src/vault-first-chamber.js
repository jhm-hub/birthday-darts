// A saved opt-in marker keeps shots already in progress on their original art
// and sound clock. This presentation never changes prizes or chamber duration.
export const VAULT_FIRST_CHAMBER_STYLE='treasure-link-v1';
export const VAULT_FIRST_CASH_LAND_MS=240;
export const linkedFirstChamber=shot=>shot?.index===0&&shot?.openingStyle===VAULT_FIRST_CHAMBER_STYLE;
export function firstChamberReadout(round,readout,time){
 const shot=round?.flight;
 if(!linkedFirstChamber(shot)||time>=shot.revealAt+VAULT_FIRST_CASH_LAND_MS)return readout;
 return {...readout,total:(BigInt(round.cashCents)*BigInt(round.multiplier)).toString()};
}
