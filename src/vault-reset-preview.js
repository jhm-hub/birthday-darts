import {sampleVaultTreasureHandoff} from './vault-treasure-handoff.js';
import {DEFAULT_VAULT,advanceVault,startVaultRound,VAULT_CLEAR_MS} from './vault-game.js';
import {sampleVaultHandoff} from './vault-finish-motion.js';

// Sample-only timeline: held win, normal exit, an empty stream, then a fresh
// viewer. No saved settings, game messages or live control actions are involved.
export function sampleVaultReset(level=2,time=10000){
 const outgoing=sampleVaultHandoff(level,time);advanceVault(outgoing,outgoing.flight.finishAt);
 const clearAt=outgoing.hideAt+VAULT_CLEAR_MS,nextAt=clearAt+450;
 const next=startVaultRound(DEFAULT_VAULT,'Next viewer',nextAt,()=>100);
 const startAt=outgoing.completedAt+1400;
 return {outgoing,next,startAt,clearAt,nextAt,duration:next.readyAt+400-startAt};
}
export function vaultResetSampleRound(sample,time){return time<sample.clearAt?sample.outgoing:time<sample.nextAt?null:sample.next;}

export function sampleVaultTreasureReset(style=1,time=10000){
 const outgoing=sampleVaultTreasureHandoff(style,time);advanceVault(outgoing,outgoing.flight.finishAt);
 const clearAt=outgoing.hideAt+VAULT_CLEAR_MS,nextAt=clearAt+450;
 const next=startVaultRound(DEFAULT_VAULT,'Next viewer',nextAt,()=>100),startAt=outgoing.completedAt+1200;
 return {outgoing,next,startAt,clearAt,nextAt,duration:next.readyAt+400-startAt};
}

// Focused reset study: the old total leaves, the stream clears, then the new
// viewer enters. The gap is a sample click, never an automatic real round.
export function sampleVaultReturn(time=10000){
 const sample=sampleVaultTreasureReset(2,time);sample.startAt=sample.outgoing.hideAt-240;
 sample.duration=sample.next.readyAt+400-sample.startAt;return sample;
}
