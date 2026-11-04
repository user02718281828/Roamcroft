import {defineConfig} from 'vite';
import tailwindcss from '@tailwindcss/postcss';
import {resolve} from 'node:path';
import {cp,mkdir} from 'node:fs/promises';
const root=resolve(import.meta.dirname),output=resolve(root,'dist/crazygames');
export default defineConfig({root:resolve(root,'portal/crazygames'),base:'./',publicDir:false,
 resolve:{alias:[{find:'@/lib/game/storage',replacement:resolve(root,'portal/crazygames/storage.ts')},{find:'@/lib/game/save',replacement:resolve(root,'portal/crazygames/storage.ts')},{find:'@/lib/game/pwa',replacement:resolve(root,'portal/crazygames/pwa.tsx')},{find:/^\.\/PwaControls$/,replacement:resolve(root,'portal/crazygames/pwa.tsx')},{find:'@',replacement:root}]},
 css:{postcss:{plugins:[tailwindcss()]}},build:{outDir:output,emptyOutDir:true},
 plugins:[{name:'portal-relative-assets',transform(code,id){if(!/\.[jt]sx?$/.test(id)||id.includes('node_modules'))return;return code.replace(/(["'`])\/(art|textures|brand)\//g,'$1./$2/');},async closeBundle(){
  await mkdir(output,{recursive:true});for(const directory of ['art','textures'])await cp(resolve(root,'public',directory),resolve(output,directory),{recursive:true});
 }}]});
