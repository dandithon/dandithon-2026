import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const refs=new Set(['/assets/character-front.png','/assets/character-side.png']);
for(const name of ['figma','exploration','character']){
  const manifest=JSON.parse(await readFile(path.join(root,'src/assets',name+'.json'),'utf8'));
  for(const group of Object.values(manifest))for(const reference of Object.values(group))refs.add(reference);
}
for(const reference of refs){
  if(!reference.startsWith('/assets/')||reference.includes('..'))throw Error('Invalid asset reference: '+reference);
  const filename=path.join(root,'public',reference);
  if(!(await stat(filename)).size)throw Error('Empty asset: '+reference);
}
console.log(`${refs.size} local image references verified.`);
