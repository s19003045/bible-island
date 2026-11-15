import { build } from 'esbuild';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

// A self-contained local review artifact: no CDN, server, API key or downloaded 3D assets.
const output = resolve(process.argv[2] || '.qa/five-islands-review.html');
const result = await build({ entryPoints: ['src/main.js'], bundle: true, format: 'iife', minify: true, write: false, outfile: 'review.js', legalComments: 'inline', target: 'es2022',
  plugins:[{name:'inline-review-voices',setup(builder){builder.onLoad({filter:/voice-manifest\.json$/},async({path})=>{
    const manifest=JSON.parse(await readFile(path,'utf8'));
    for(const entry of Object.values(manifest))entry.src=`data:audio/mpeg;base64,${(await readFile(resolve('public',entry.src))).toString('base64')}`;
    return {contents:JSON.stringify(manifest),loader:'json'};
  });}}],
});
const js = result.outputFiles.find(f=>f.path.endsWith('.js')).text.replace(/<\/script/gi,'<\\/script');
const css = result.outputFiles.find(f=>f.path.endsWith('.css')).text;
const threeLicense = (await readFile('node_modules/three/LICENSE','utf8')).replace(/-->/g,'-- >');
const html = `<!doctype html><html lang="zh-Hant"><!-- Three.js license:
${threeLicense}
--><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>讀聖經順起來 — 五座場景試閱</title><style>${css}</style></head><body><div id="app"></div><script>if(!location.hash)location.hash='island=tabernacle';</script><script>${js}</script></body></html>`;
await mkdir(dirname(output), { recursive: true });
await writeFile(output, html);
console.log(`Offline review saved: ${output} (${Math.round(Buffer.byteLength(html)/1024)} KiB)`);
