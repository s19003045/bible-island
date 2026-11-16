import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {createServer} from 'vite';
import config from '../vite.config.js';

test('Vite serves a newly added and changed GLB after startup without reloading the scene',{timeout:10000},async()=>{
  const root=await mkdtemp(join(tmpdir(),'bible-model-watch-'));let server;
  try{
    await mkdir(join(root,'public/models'),{recursive:true});await writeFile(join(root,'index.html'),'<body>model fixture</body>');
    let observed,ready;const seen=()=>new Promise(resolve=>observed=resolve),events=[],watchEvents=[],watchReady=new Promise(resolve=>ready=resolve);
    server=await createServer({...config,root,configFile:false,logLevel:'silent',plugins:[...config.plugins,{name:'observe-model-watch',configureServer(s){s.watcher.once('ready',ready);s.watcher.on('all',(event,file)=>watchEvents.push([event,file]));},hotUpdate({file}){if(file.endsWith('/new-character.glb'))observed?.();}}],server:{...config.server,host:'127.0.0.1',port:0,strictPort:false,watch:{...config.server.watch,usePolling:true,interval:25}}});
    await server.listen();await watchReady;
    // Chokidar initially scans both root and publicDir; finish its binary poll
    // before testing a file added AFTER startup, not during that initial scan.
    await delay(350);
    const send=server.environments.client.hot.send.bind(server.environments.client.hot);server.environments.client.hot.send=(payload,...args)=>{events.push(payload);return send(payload,...args);};
    const url=`http://127.0.0.1:${server.httpServer.address().port}/models/new-character.glb`,path=join(root,'public/models/new-character.glb');
    for(const body of [Buffer.from('glTF-first-export'),Buffer.from('glTF-updated-export-with-more-data')]){
      const watch=seen();await writeFile(path,body);await Promise.race([watch,new Promise((_,reject)=>{const timer=setTimeout(()=>reject(new Error('model watcher did not observe '+body.toString()+': '+JSON.stringify({watchEvents,watched:server.watcher.getWatched(),options:server.watcher.options,root:server.config.root,cache:server.config.cacheDir}))),5000);timer.unref();})]);
      const response=await fetch(url);assert.deepEqual(Buffer.from(await response.arrayBuffer()),body,'serve binary model bytes, not the SPA HTML fallback');
    }
    assert.ok(events.every(e=>e.type!=='full-reload'&&e.type!=='update'),'GLB batches do not rebuild an active viewer');
  }finally{await server?.close();await rm(root,{recursive:true,force:true});}
});
