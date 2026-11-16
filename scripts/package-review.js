import { build } from 'esbuild';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {blenderModels} from '../src/blender-manifest.js';

// A self-contained local review artifact: voices and original local Blender GLBs embedded.
const output = resolve(process.argv[2] || '.qa/five-islands-review.html');
const result = await build({ entryPoints: ['src/main.js'], bundle: true, format: 'iife', minify: true, write: false, outfile: 'review.js', legalComments: 'inline', target: 'es2022',
  plugins:[{name:'inline-review-assets',setup(builder){
    builder.onLoad({filter:/blender-manifest\.js$/},async()=>{
      const models=structuredClone(blenderModels);
      for(const asset of Object.values(models))asset.src=`data:model/gltf-binary;base64,${(await readFile(resolve('public',asset.src))).toString('base64')}`;
      return {contents:`export const blenderModels=${JSON.stringify(models)};`,loader:'js'};
    });
    builder.onLoad({filter:/voice-manifest\.json$/},async({path})=>{
    const manifest=JSON.parse(await readFile(path,'utf8'));
    const inlined=new Map();
    async function inline(src){if(!inlined.has(src))inlined.set(src,`data:audio/mpeg;base64,${(await readFile(resolve('public',src))).toString('base64')}`);return inlined.get(src);}
    for(const entry of Object.values(manifest)){entry.src=await inline(entry.src);for(const cue of Object.values(entry.clips))if(cue.src)cue.src=await inline(cue.src);}
    return {contents:JSON.stringify(manifest),loader:'json'};
  });}}],
});
const js = result.outputFiles.find(f=>f.path.endsWith('.js')).text.replace(/<\/script/gi,'<\\/script');
const css = result.outputFiles.find(f=>f.path.endsWith('.css')).text;
const threeLicense = (await readFile('node_modules/three/LICENSE','utf8')).replace(/-->/g,'-- >');
const html = `<!doctype html><html lang="zh-Hant"><!-- Three.js license:
${threeLicense}
--><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>讀聖經順起來 — 離線場景試閱</title><style>${css}</style></head><body><div id="app"></div><script>if(!location.hash)location.hash='island=tabernacle';</script><script>${js}</script></body></html>`;
await mkdir(dirname(output), { recursive: true });
await writeFile(output, html);
console.log(`Offline review saved: ${output} (${Math.round(Buffer.byteLength(html)/1024)} KiB)`);
