// Display dimensions use the fixed 450px wheel, inside the 540 × 660 OBS source.
export const DEFAULT_BONUS_DIAMETER=150;
export const BONUS_REVEAL_MS=1800;
export function readBonusDiameter(value=DEFAULT_BONUS_DIAMETER){
 if(!Number.isInteger(value)||value<120||value>234)throw Error('Choose a bonus center size from 120 to 234 pixels.');
 return value;
}
export function bonusReveal(round,now){
 const flight=round?.bonusFlight;if(!flight)return null;
 // Derive the opening from the recorded landing, including older saved rounds.
 const at=(round.mirrorFlight??round.flight).landAt,age=now-at;
 return {key:round.id+':'+flight.startAt,at,age,active:age>=0&&age<Math.min(BONUS_REVEAL_MS,flight.startAt-at)};
}
