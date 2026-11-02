// Four separate beats: mechanism, cash, bonus, then the deposit. Keep the
// saved finish/reveal clocks authoritative for rounds already in progress.
export const VAULT_REVEAL_MS=1080,VAULT_UNLOCK_MS=2800;
export const VAULT_BONUS_DELAY_MS=600;
export const VAULT_LATE_BOOST_MS=480;
// Only newly created late boosts opt into this pause. Existing saved shots
// retain their original clocks, including during a reconnect.
export const vaultBonusBuildMs=shot=>shot?.bonus?.kind==='multiply'&&shot.bonusBuildMs===VAULT_LATE_BOOST_MS?VAULT_LATE_BOOST_MS:0;
export const VAULT_COLLECT_START_MS=VAULT_UNLOCK_MS-760;
export const vaultCollectAt=shot=>Number.isFinite(shot.finishAt)?shot.finishAt-760:shot.startAt+VAULT_COLLECT_START_MS;
export const vaultBonusAt=shot=>Math.min(shot.revealAt+VAULT_BONUS_DELAY_MS+vaultBonusBuildMs(shot),Number.isFinite(shot.finishAt)?shot.finishAt-960:Infinity);
export const vaultBonusBuildAt=shot=>vaultBonusAt(shot)-vaultBonusBuildMs(shot);
