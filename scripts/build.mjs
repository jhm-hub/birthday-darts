import {build} from 'esbuild';
import {cp,mkdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});await cp('public','dist',{recursive:true});
await build({entryPoints:['src/player.js','src/library.js'],outdir:'dist',bundle:true,format:'esm',target:['chrome100','firefox102','safari16'],minify:true,legalComments:'linked'});
console.log('Built browser game in dist/');
