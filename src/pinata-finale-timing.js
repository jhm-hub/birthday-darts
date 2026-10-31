// One clock for the number, the confetti and the audio. Royal's quick golden
// flourish sits between Birthday's immediate pop and Grand's jewel gathering.
export const FINALE_REVEAL_MS=300,ROYAL_REVEAL_MS=480,GRAND_REVEAL_MS=820,GRAND_ENCORE_MS=1380;
export const finaleRevealAt=tier=>tier===2?GRAND_REVEAL_MS:tier===1?ROYAL_REVEAL_MS:FINALE_REVEAL_MS;
