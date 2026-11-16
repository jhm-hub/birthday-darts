import {writeFileSync} from 'node:fs';
import {defaultDouble} from '../src/double-game.js';
import {defaultBonus} from '../src/bonus-game.js';
import {defaultMirror} from '../src/mirror-game.js';
import {applyStarter} from '../src/wheel-starters.js';
import {exactSpin,convolve,describe} from '../test/helpers/wheel-odds.mjs';
const results={};
for(const [family,make] of Object.entries({double:defaultDouble,bonus:defaultBonus,mirror:defaultMirror}))for(const operation of ['add','multiply'])for(const tier of ['regular','high']){
 const config=applyStarter(make(operation),tier),{pmf,terminals}=exactSpin(config);let total=pmf;for(let i=1;i<config.spins;i++)total=convolve(total,pmf);
 const result={values:{outer:config.outer,inner:config.inner,...(config.bonus?{bonus:config.bonus,bonusSlots:config.bonusSlots}:{}),...(config.mirrorSlots?{mirrorSlots:config.mirrorSlots,mirrorMode:config.mirrorMode}:{}),spins:config.spins,lineLandings:config.lineLandings},terminals,spin:describe(pmf),threeSpins:describe(total)};
 results[family+'-'+operation+':'+tier]=result;console.log(JSON.stringify({game:family+'-'+operation,tier,...result.threeSpins}));
}
if(process.argv.includes('--write'))writeFileSync(new URL('../src/wheel-starter-odds.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
