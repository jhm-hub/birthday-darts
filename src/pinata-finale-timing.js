// One clock for the number, the confetti and the audio. Only Grand Royal waits
// for the jewels to gather; the two earlier tiers retain their original pace.
export const FINALE_REVEAL_MS=300,GRAND_REVEAL_MS=820,GRAND_ENCORE_MS=1380;
export const finaleRevealAt=tier=>tier===2?GRAND_REVEAL_MS:FINALE_REVEAL_MS;
