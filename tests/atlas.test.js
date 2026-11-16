import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3,Raycaster,PerspectiveCamera} from 'three';
import {themes,themeById} from '../src/content.js';
import {atlasLayout,atlasRegions,atlasRoutes,atlasJourneys,atlasBounds,atlasFrame,visibleRoutes,coastRadius} from '../src/atlas-data.js';
import {createAtlasNetwork} from '../src/atlas-network.js';
import {createAtlasEnvironment,atlasSkyColor} from '../src/atlas-environment.js';
import {atlasPanel} from '../src/atlas-ui.js';

test('the reading atlas groups all 24 persistent themes without intersecting island coastlines',()=>{
 assert.deepEqual(Object.keys(atlasLayout).sort(),themes.map(t=>t.id).sort());
 assert.deepEqual(new Set(atlasRegions.map(r=>r.id)),new Set(themes.map(t=>t.era)));
 for(let i=0;i<themes.length;i++){
  const a=themes[i];assert.deepEqual(a.position,atlasLayout[a.id]);
  assert.ok(a.position[0]-a.radius>atlasBounds.x1&&a.position[0]+a.radius<atlasBounds.x2);
  assert.ok(a.position[1]-a.radius>atlasBounds.z1&&a.position[1]+a.radius<atlasBounds.z2);
  for(let j=i+1;j<themes.length;j++){const b=themes[j];assert.ok(Math.hypot(a.position[0]-b.position[0],a.position[1]-b.position[1])>a.radius+b.radius+2,`${a.id}/${b.id} coastlines`);}
  const radii=Array.from({length:64},(_,n)=>coastRadius(a.radius,n/64*Math.PI*2,a.number));assert.ok(Math.max(...radii)-Math.min(...radii)>a.radius*.1);
 }
});

test('curated main routes connect every island, while focused and filtered routes never expose a hidden endpoint',()=>{
 const main=visibleRoutes();assert.equal(main.length,23);const seen=new Set(['abraham']);
 for(let i=0;i<24;i++)for(const r of main)if(seen.has(r.from)||seen.has(r.to)){seen.add(r.from);seen.add(r.to);}
 assert.equal(seen.size,24);assert.equal(new Set(atlasRoutes.map(r=>r.id)).size,atlasRoutes.length);
 assert.ok(!main.some(r=>r.kind==='compare'));
 assert.ok(visibleRoutes({focus:'tabernacle'}).some(r=>r.id==='tabernacle:solomon'));
 const ids=new Set(['tabernacle','solomon','herod']);
 assert.deepEqual(visibleRoutes({journey:'temples',ids}).map(r=>r.id),['tabernacle:solomon']);
 for(const journey of atlasJourneys.slice(1)){
  const edges=visibleRoutes({journey:journey.id}),reached=new Set([journey.stops[0]]);
  for(let i=0;i<24;i++)for(const r of edges)if(reached.has(r.from)||reached.has(r.to)){reached.add(r.from);reached.add(r.to);}
  assert.deepEqual([...reached].sort(),[...journey.stops].sort(),journey.id);
 }
});

test('actual bridge and lane geometry avoids unrelated islands, and only visible connections can be picked',()=>{
 const n=createAtlasNetwork(themes);n.update();n.root.updateMatrixWorld(true);
 for(const record of n.records.values()){
  for(let i=0;i<=40;i++){
   const p=record.curve.getPoint(i/40);assert.ok(p.toArray().every(Number.isFinite));
   for(const t of themes)if(![record.route.from,record.route.to].includes(t.id))assert.ok(Math.hypot(p.x-t.position[0],p.z-t.position[1])>t.radius+.8,`${record.route.id}/${t.id}`);
  }
 }
 const record=n.records.get('david:solomon'),p=record.curve.getPoint(.5),ray=new Raycaster(new Vector3(p.x,20,p.z),new Vector3(0,-1,0));
 assert.equal(n.pick(ray),'david:solomon');n.update({enabled:false});assert.equal(n.pick(ray),null);
 n.update({ids:new Set(['david'])});assert.equal(n.pick(ray),null);
 n.update({journey:'temples'});assert.deepEqual([...n.records.values()].filter(r=>r.group.visible).map(r=>r.route.id),['tabernacle:solomon','solomon:second-temple','second-temple:herod']);
 n.dispose();
});

test('continuous sea extends past the camera far plane at every permitted atlas target and retains shallow-water depth',()=>{
 const environment=createAtlasEnvironment(themes),water=environment.water,u=water.material.uniforms;
 assert.ok(atlasBounds.waterSize/2>1800+atlasBounds.maxDistance+Math.max(...Object.values(atlasBounds).filter(n=>n<1000)));
 const texture=u.uShore.value.image,{width,height,data}=texture,[x0,z0,w,h]=u.uBounds.value.toArray();
 const sample=(x,z)=>data[(Math.round((z-z0)/h*(height-1))*width+Math.round((x-x0)/w*(width-1)))*4];
 const t=themeById.get('tabernacle');assert.ok(sample(...t.position)<10);assert.ok(sample(-2,-42)>240);
 const shore=sample(t.position[0]+t.radius+1,t.position[1]),deep=sample(t.position[0]+t.radius+5,t.position[1]);assert.ok(shore<deep);
 environment.update(17,true);assert.equal(u.uTime.value,17);assert.equal(u.uDark.value,1);assert.equal('#'+u.uHorizon.value.getHexString(),atlasSkyColor(true));
 environment.dispose();
});

test('route panels provide a keyboard path, comparison entry, mode context, and explicit symbolic geography',()=>{
 const state={mode:'study',atlasJourney:'temples',atlasRoute:'tabernacle:solomon',atlasCompact:false};
 const html=atlasPanel(state);assert.match(html,/id="atlas-travel"/);assert.match(html,/id="atlas-compare"/);assert.match(html,/對讀工作台/);assert.match(html,/不代表古代實際道路/);assert.match(html,/aria-pressed="true"/);
 const filtered=atlasPanel(state,{ids:new Set(['herod'])});assert.doesNotMatch(filtered,/id="atlas-travel"/);assert.doesNotMatch(filtered,/data-atlas-route=/);assert.match(filtered,/目前篩選沒有相連/);
 assert.match(atlasPanel({...state,mode:'child',atlasCompact:true}),/id="atlas-card-body" hidden/);assert.match(atlasPanel({...state,mode:'child'}),/觀察任務/);
});


test('each curated journey fits its real projected islands on phone, tablet and desktop',()=>{
 for(const aspect of [390/772,768/936,1823/1172])for(const j of atlasJourneys){
  const list=j.stops.length?j.stops.map(id=>themeById.get(id)):themes,frame=atlasFrame(list,aspect),camera=new PerspectiveCamera(39,aspect,.1,1800);
  camera.position.fromArray(frame.center).add(new Vector3(...frame.offset));camera.lookAt(new Vector3(...frame.center));camera.updateMatrixWorld();
  for(const t of list)for(let i=0;i<16;i++){const a=i/16*Math.PI*2,p=new Vector3(t.position[0]+Math.cos(a)*(t.radius+1),0,t.position[1]+Math.sin(a)*(t.radius+1)).project(camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1,`${j.id}/${t.id}/${aspect}`);}
 }
});
