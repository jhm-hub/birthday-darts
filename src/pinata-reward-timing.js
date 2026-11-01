// Shared by the reward score and its presentation. Times in seconds are
// offsets from the reward cue; the visual clock measures ms after impact.
export const REWARD_SOUND_AFTER_MS=160;
export const CASH_RESOLVE_SECONDS=.105, MULTIPLIER_LIFT_SECONDS=.17;
export const MULTIPLIER_RESOLVE_SECONDS=.49, EXTRA_REPEAT_SECONDS=.14, ENCORE_CATCH_SECONDS=.66;
export const rewardBeat=seconds=>REWARD_SOUND_AFTER_MS+seconds*1000;
