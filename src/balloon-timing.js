// Shared by the server, animation and sound, so every display sees one beat.
export const BALLOON_HIT_HOLD_MS=320;
export const BALLOON_POP_FADE_MS=240;
export const BALLOON_BURST_MS=1350;
export const BALLOON_RESULT_MS=1750;
export const balloonPopAt=shot=>shot.popAt??shot.landAt;
