import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { themes } from '../src/content.js';
import { historicalScenes } from '../src/historical-data.js';
import { createHistoricalScene } from '../src/historical-scenes.js';

// Scene construction does not require WebGL. A no-op canvas supplies locally generated texture inputs.
const context = new Proxy({}, { get: () => () => {}, set: () => true });
globalThis.document = { createElement: () => ({ width: 256, height: 256, getContext: () => context }) };

test('five previews cover every authored stop and declare sources and uncertainty', () => {
  assert.deepEqual(Object.keys(historicalScenes).sort(), ['exodus','herod','jerusalem','solomon','tabernacle']);
  for (const [id,config] of Object.entries(historicalScenes)) {
    assert.deepEqual(Object.keys(config.stops).sort(), themes.find(t=>t.id===id).stops.map(s=>s.id).sort());
    assert.ok(config.limits.length > 60);
    assert.ok(config.sources.every(s=>new URL(s.url).protocol==='https:'));
    for (const view of [config.overview,config.human.offset,[0,config.plan,0]]) assert.ok(Math.hypot(...view)<config.extent*2);
  }
});

test('all five generated scenes have finite geometry, positive instance scales and valid cutaways', () => {
  const transform = new THREE.Matrix4(), point = new THREE.Vector3(), rotation = new THREE.Quaternion(), scale = new THREE.Vector3();
  for (const id of Object.keys(historicalScenes)) {
    const built = createHistoricalScene(id,null); let instances=0,triangles=0;
    assert.ok(built.roof.children.length > 0, `${id}: removable roof`);
    built.scene.updateMatrixWorld(true);
    built.scene.traverse(o => {
      if (!o.isMesh) return;
      const a=o.geometry.attributes.position;
      for(const n of a.array) assert.ok(Number.isFinite(n),`${id}: finite vertices`);
      if(o.isInstancedMesh) {
        instances+=o.count;
        for(let i=0;i<o.count;i++) {
          o.getMatrixAt(i,transform); transform.decompose(point,rotation,scale);
          assert.ok([...point,...scale,...rotation].every(Number.isFinite),`${id}: finite transform`);
          assert.ok(scale.x>0&&scale.y>0&&scale.z>0,`${id}: positive geometry scale on ${o.name} instance ${i}, p=${point.toArray()} s=${scale.toArray()}`);
        }
      }
      triangles+=(o.geometry.index?.count||a.count)/3*(o.count||1);
    });
    assert.ok(instances>1000,`${id}: contextual detail present`);
    assert.ok(triangles<1800000,`${id}: bounded geometry budget (${Math.round(triangles)})`);
    built.setTime(true); assert.ok(built.scene.background.isColor); built.setTime(false);
    built.roof.visible=false; assert.equal(built.roof.visible,false);
    built.dispose();
  }
});
