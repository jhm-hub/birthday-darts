import {build} from 'esbuild';
import {cp,mkdir,rm,readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});await cp('public','dist',{recursive:true});
const entries=['player','library','motion-preview','celebration-preview','gift-editor','gift-player','gift-concepts','vault-editor','vault-player','vault-art-preview'];
await build({entryPoints:entries.map(name=>'src/'+name+'.js'),outdir:'dist',bundle:true,format:'esm',target:['chrome100','firefox102','safari16'],minify:true,legalComments:'linked'});
// Pages can cache unchanged script URLs across a refresh. Tie each entry URL
// to its actual bundle so the editor, OBS display and previews load together.
const versions=new Map();
for(const name of entries)versions.set(name,createHash('sha256').update(await readFile('dist/'+name+'.js')).digest('hex').slice(0,12));
const styles=new Map();
for(const file of await readdir('dist'))if(file.endsWith('.css'))styles.set(file,createHash('sha256').update(await readFile('dist/'+file)).digest('hex').slice(0,12));
for(const file of await readdir('dist'))if(file.endsWith('.html')){
 const path='dist/'+file,html=await readFile(path,'utf8');
 await writeFile(path,html.replace(/src="\.\/(player|library|motion-preview|celebration-preview|gift-editor|gift-player|gift-concepts|vault-editor|vault-player|vault-art-preview)\.js"/g,(_,name)=>'src="./'+name+'.js?v='+versions.get(name)+'"')
  .replace(/href="\.\/([\w-]+\.css)(?:\?[^"\s]*)?"/g,(full,file)=>styles.has(file)?'href="./'+file+'?v='+styles.get(file)+'"':full));
}
// The editor's iframe is an HTML document with its own cache entry. Version it
// after rewriting its scripts/styles so a fresh editor cannot embed old code.
const previewVersion=createHash('sha256').update(await readFile('dist/preview.html')).digest('hex').slice(0,12);
await writeFile('dist/index.html',(await readFile('dist/index.html','utf8')).replace('src="./preview.html"','src="./preview.html?v='+previewVersion+'"'));
console.log('Built browser game in dist/');
