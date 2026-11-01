// Four separate beats: mechanism, cash, bonus, then the deposit. Keep the
// saved finish/reveal clocks authoritative for rounds already in progress.
export const VAULT_REVEAL_MS=1080,VAULT_UNLOCK_MS=2800;
export const VAULT_BONUS_DELAY_MS=600;
export const VAULT_COLLECT_START_MS=VAULT_UNLOCK_MS-760;
export const vaultCollectAt=shot=>Number.isFinite(shot.finishAt)?shot.finishAt-760:shot.startAt+VAULT_COLLECT_START_MS;
export const vaultBonusAt=shot=>Math.min(shot.revealAt+VAULT_BONUS_DELAY_MS,Number.isFinite(shot.finishAt)?shot.finishAt-960:Infinity);
