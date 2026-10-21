import {build} from 'esbuild';
import {cp,mkdir,rm,readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});await cp('public','dist',{recursive:true});
await build({entryPoints:['src/player.js','src/library.js','src/motion-preview.js','src/celebration-preview.js'],outdir:'dist',bundle:true,format:'esm',target:['chrome100','firefox102','safari16'],minify:true,legalComments:'linked'});
// Pages can cache unchanged script URLs across a refresh. Tie each entry URL
// to its actual bundle so the editor, OBS display and previews load together.
const versions=new Map();
for(const name of ['player','library','motion-preview','celebration-preview'])versions.set(name,createHash('sha256').update(await readFile('dist/'+name+'.js')).digest('hex').slice(0,12));
for(const file of await readdir('dist'))if(file.endsWith('.html')){
 const path='dist/'+file,html=await readFile(path,'utf8');
 await writeFile(path,html.replace(/src="\.\/(player|library|motion-preview|celebration-preview)\.js"/g,(_,name)=>'src="./'+name+'.js?v='+versions.get(name)+'"'));
}
console.log('Built browser game in dist/');
