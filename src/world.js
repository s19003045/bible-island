import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { themes, themeById } from './content.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createHistoricalScene } from './historical-scenes.js';
import { historicalScenes } from './historical-data.js';
import { peopleByIsland } from './people-data.js';

const TOP = 0.62;
const C = { sand: '#d4bd93', stone: '#ddcfac', white: '#f1e6cb', dark: '#706451', wood: '#80634b',
  gold: '#d4a54b', copper: '#a96943', red: '#a44d45', blue: '#596c89', purple: '#79627b', green: '#7e9370', leaf: '#5f7a5c' };
const geometries = {
  box: new THREE.BoxGeometry(1, 1, 1), cylinder: new THREE.CylinderGeometry(.5, .5, 1, 12),
  cone: new THREE.ConeGeometry(.5, 1, 6), sphere: new THREE.IcosahedronGeometry(.5, 1),
  roof: new THREE.ConeGeometry(.71, 1, 4).rotateY(Math.PI / 4),
  bowl: new THREE.LatheGeometry([[0,-.5],[.12,-.48],[.3,-.3],[.5,.3],[.5,.5],[.44,.5],[.42,.32],[.25,-.22],[.1,-.35],[0,-.35]].map(([x,y]) => new THREE.Vector2(x,y)), 16),
};

function random(seed) {
  let n = seed;
  return () => { n = Math.imul(n ^ n >>> 15, 1 | n); n ^= n + Math.imul(n ^ n >>> 7, 61 | n); return ((n ^ n >>> 14) >>> 0) / 4294967296; };
}

// Shared primitive geometries, per-instance color and transform: each island takes a few draw calls.
function kit(parent) {
  const batches = new Map();
  function part(kind, x, y, z, w, h, d, color, rotation = 0) {
    if (!batches.has(kind)) batches.set(kind, []);
    batches.get(kind).push({ x, y: y + TOP, z, w, h, d, color, rotation });
  }
  const box = (x, y, z, w, h, d, c, r = 0) => part('box', x, y, z, w, h, d, c, r);
  const cyl = (x, y, z, r, h, c) => part('cylinder', x, y, z, r * 2, h, r * 2, c);
  const ball = (x, y, z, s, c) => part('sphere', x, y, z, s, s, s, c);
  function tree(x, z, s = 1, palm = false) {
    cyl(x, .5 * s, z, .07 * s, s, C.wood);
    if (palm) {
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        box(x + Math.cos(a) * .27 * s, s, z + Math.sin(a) * .27 * s, .8 * s, .05, .18 * s, C.leaf, -a);
      }
    } else {
      ball(x, .95 * s, z, .72 * s, C.leaf); ball(x + .18 * s, .8 * s, z, .5 * s, C.green);
    }
  }
  function person(x, z, color = C.white, s = 1, yaw = 0) {
    cyl(x, .19 * s, z, .09 * s, .33 * s, color);
    ball(x, .43 * s, z, .17 * s, '#c39874');
    box(x, .51 * s, z, .17 * s, .06 * s, .17 * s, color, yaw);
  }
  function house(x, z, w = 1, h = .85, d = 1, color = C.stone) {
    box(x, h / 2, z, w, h, d, color);
    box(x, h + .04, z, w + .13, .11, d + .13, C.white);
    box(x, .2, z + d / 2 + .009, .2, .4, .025, C.wood);
    box(x - w * .28, h * .65, z + d / 2 + .013, .17, .19, .03, C.dark);
    for (let i = 0; i < 5; i++) box(x + w / 2 + .1, i * .13, z - d * .3 + i * .16, .28, .12, .2, C.stone);
  }
  function tent(x, z, s = 1, color = C.white) {
    box(x, .05, z, 1.1 * s, .1, .8 * s, C.sand);
    part('roof', x, .45 * s, z, 1.15 * s, .8 * s, .85 * s, color);
    cyl(x, .42 * s, z + .4 * s, .025, .8 * s, C.wood);
  }
  function altar(x, z, s = 1) {
    box(x, .28 * s, z, .65 * s, .55 * s, .65 * s, C.copper);
    box(x, .57 * s, z, .53 * s, .025, .53 * s, C.dark);
    for (const dx of [-.28, .28]) for (const dz of [-.28, .28]) box(x + dx * s, .62 * s, z + dz * s, .075, .15, .075, C.copper);
    box(x, .59 * s, z, .4 * s, .035, .08, C.wood, .4);
  }
  function ark(x, z, s = 1) {
    box(x, .34 * s, z, .57 * s, .36 * s, .32 * s, C.gold);
    box(x, .54 * s, z, .63 * s, .07, .38 * s, '#f0ce71');
    box(x, .27 * s, z + .22 * s, 1.05 * s, .045, .045, C.gold);
    box(x, .27 * s, z - .22 * s, 1.05 * s, .045, .045, C.gold);
    for (const dx of [-.2, .2]) { ball(x + dx * s, .66 * s, z, .13 * s, C.gold); box(x + dx * s, .68 * s, z, .22 * s, .045, .2 * s, C.gold, dx > 0 ? -.5 : .5); }
  }
  function well(x, z) {
    cyl(x, .2, z, .4, .4, C.stone); cyl(x, .42, z, .33, .04, '#4c6968');
    box(x - .42, .62, z, .07, 1.2, .07, C.wood); box(x + .42, .62, z, .07, 1.2, .07, C.wood);
    box(x, 1.2, z, .95, .08, .12, C.wood); box(x, .91, z, .025, .52, .025, C.wood);
  }
  function column(x, z, h = 1.2) {
    cyl(x, h / 2, z, .1, h, C.white); box(x, .05, z, .3, .1, .3, C.stone); box(x, h, z, .3, .12, .3, C.stone);
  }
  function field(x, z, s = 1) {
    box(x, .035, z, s, .06, s, '#8d7752');
    for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) {
      const a = x - s * .4 + i * s * .2, b = z - s * .35 + j * s * .22;
      box(a, .2, b, .025, .3, .025, '#bc9d4e'); ball(a, .32, b, .09, '#dfc582');
    }
  }
  function scroll(x, z, y = .5) {
    box(x, y, z, .38, .025, .3, C.white); cyl(x - .19, y + .03, z, .035, .3, C.wood); cyl(x + .19, y + .03, z, .035, .3, C.wood);
  }
  function table(x, z, s = 1) {
    box(x, .48, z, .85 * s, .09, .45 * s, C.wood);
    for (const dx of [-.32, .32]) for (const dz of [-.14, .14]) box(x + dx * s, .22, z + dz * s, .06, .45, .06, C.wood);
    scroll(x, z, .55);
  }
  function finish(themeId) {
    const material = new THREE.MeshStandardMaterial({ roughness: .91, metalness: .02 });
    const dummy = new THREE.Object3D();
    for (const [kind, parts] of batches) {
      const mesh = new THREE.InstancedMesh(geometries[kind], material, parts.length);
      parts.forEach((p, i) => {
        dummy.position.set(p.x, p.y, p.z); dummy.scale.set(p.w, p.h, p.d); dummy.rotation.set(0, p.rotation, 0); dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix); mesh.setColorAt(i, new THREE.Color(p.color));
      });
      mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.themeId = themeId;
      mesh.computeBoundingSphere(); parent.add(mesh);
    }
  }
  return { part, box, cyl, ball, tree, person, house, tent, altar, ark, well, column, field, table, scroll, finish };
}

function makeIsland(theme, scene) {
  const root = new THREE.Group();
  root.position.set(theme.position[0], 0, theme.position[1]); scene.add(root);
  const rng = random(theme.number * 7957 + 7), r = theme.radius;
  const shape = new THREE.Shape();
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2, s = r * (.92 + rng() * .1);
    const x = Math.cos(a) * s, y = Math.sin(a) * s;
    if (!i) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: .67, bevelEnabled: true, bevelSegments: 1, bevelThickness: .16, bevelSize: .16, steps: 1 });
  geo.rotateX(-Math.PI / 2); geo.translate(0, -.17, 0);
  const land = new THREE.Mesh(geo, [new THREE.MeshStandardMaterial({ color: '#d9caa7', roughness: 1 }), new THREE.MeshStandardMaterial({ color: '#a68d69', roughness: 1 })]);
  land.userData.themeId = theme.id; land.receiveShadow = true; land.castShadow = true; root.add(land);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * .89, r * .83, .18, 12), new THREE.MeshStandardMaterial({ color: '#d2b183', flatShading: true }));
  rim.position.y = -.2; root.add(rim);
  const ground = kit(root);
  for (let i = 0; i < 15; i++) {
    const a = rng() * Math.PI * 2, d = r * (.78 + rng() * .12), x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (i % 3 === 0) ground.tree(x, z, .5 + rng() * .5, ['exodus', 'egypt', 'port', 'well'].includes(theme.model));
    else ground.ball(x, .03, z, .1 + rng() * .22, i % 2 ? '#b3a181' : '#8a9878');
  }
  ground.finish(theme.id);
  return root;
}

function makeBoat(scene, x, z, s = 1, themeId) {
  const group = new THREE.Group(); group.position.set(x, .15, z); scene.add(group);
  const k = kit(group);
  k.box(0, -.48, 0, .48 * s, .2 * s, 1.35 * s, C.wood);
  k.box(0, -.35, .1 * s, .37 * s, .12, .9 * s, C.sand);
  k.cyl(0, .2 * s, 0, .035 * s, 1.35 * s, C.wood);
  k.box(.22 * s, .42 * s, 0, .75 * s, .72 * s, .035, C.white);
  k.box(0, .05 * s, -.38 * s, .3 * s, .25 * s, .25 * s, C.wood);
  k.finish(themeId); return group;
}

function makeScene(theme, root, scene, boats) {
  const k = kit(root), roofGroup = new THREE.Group(); root.add(roofGroup); const roof = kit(roofGroup);
  const { box, cyl, ball, tree, person, house, tent, altar, ark, well, column, field, table } = k;
  const water = (x, z, w, d) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, .025, d), new THREE.MeshStandardMaterial({ color: '#559d9c', roughness: .35, transparent: true, opacity: .85 }));
    m.position.set(x, TOP + .045, z); m.userData.themeId = theme.id; root.add(m);
  };
  const wall = (x, z, w, h, d) => { box(x, h / 2, z, w, h, d, C.stone); for (let i = -.5; i < .5; i += .15) box(x + w * i, h + .08, z, .17, .2, d + .04, C.white); };
  if (theme.model === 'tabernacle') {
    // The model maintains the courtyard → holy place → most holy place sequence.
    box(-.5, .02, .2, 3.15, .04, 5.85, '#c9b186');
    for (const x of [-2.1, 1.1]) for (let z = -2.7; z < 3.2; z += .5) { cyl(x, .55, z, .035, 1.1, C.copper); box(x, .5, z, .035, .8, .48, C.white); }
    for (const z of [-2.7, 3.15]) for (let x = -2.1; x < 1.1; x += .4) {
      if (z > 3 && x > -1.2 && x < .2) continue;
      cyl(x, .55, z, .035, 1.1, C.copper); box(x + .2, .5, z, .4, .8, .035, C.white);
    }
    for (let i = 0; i < 4; i++) { cyl(-1.1 + i * .38, .6, 3.15, .035, 1.2, C.gold); box(-.95 + i * .38, .55, 3.15, .35, 1, .03, [C.red, C.blue, C.purple, C.red][i]); }
    altar(-.7, 2.05, 1.1);
    cyl(-.7, .3, .5, .12, .55, C.copper); k.part('bowl', -.7, .52, .5, .5, .22, .5, C.copper);
    box(-1.65, .65, -1.4, .1, 1.3, 2.75, C.gold); roof.box(.55, .65, -1.4, .1, 1.3, 2.75, C.gold);
    box(-.55, .65, -2.73, 2.25, 1.3, .08, C.gold);
    for (let z = -2.6; z < -.2; z += .3) { box(-1.72, .65, z, .03, 1.15, .035, C.wood); roof.box(.62, .65, z, .03, 1.15, .035, C.wood); }
    roof.box(-.55, 1.4, -1.4, 2.4, .14, 2.9, '#b58568');
    for (let i = 0; i < 7; i++) roof.box(-1.52 + i * .32, 1.49, -1.4, .18, .03, 2.9, '#c49a78');
    roof.box(-.55, .68, -1.1, 2.06, 1.25, .04, C.purple);
    roof.box(-.55, .7, -.03, 2.06, 1.25, .04, C.red);
    box(-.55, .045, -1.1, 2.06, .04, .04, C.purple);
    // Seven lamps; their small branches remain visible in cutaway mode.
    cyl(-1.25, .34, -.65, .045, .65, C.gold);
    for (let i = -3; i <= 3; i++) {
      const h = .45 + (3 - Math.abs(i)) * .055;
      box(-1.25 + i * .075, h - .06, -.65, .03, .23, .03, C.gold);
      box(-1.25 + i * .04, .3, -.65, Math.abs(i) * .08 + .03, .025, .03, C.gold);
      ball(-1.25 + i * .075, h + .08, -.65, .055, '#f6d987');
    }
    table(.05, -.55, .55); box(-.45, .3, -.92, .23, .5, .23, C.gold); ark(-.55, -2.05, .9);
    for (let i = 0; i < 8; i++) tent(2.05 + (i % 2) * .78, -2.1 + Math.floor(i / 2) * 1.25, .55, i % 2 ? '#ab8b70' : C.white);
    person(-.7, 1.2, C.white); person(-.3, 2.7, '#a77f58'); person(.55, 2.5, '#74857c');
  } else if (['temple', 'herod', 'rebuild'].includes(theme.model)) {
    const grand = theme.model === 'herod', rebuild = theme.model === 'rebuild';
    box(0, .08, -.3, grand ? 5.2 : 3.8, .16, grand ? 4.8 : 3.8, '#d7c6a3');
    for (let i = 0; i < 6; i++) box(0, .025 + i * .055, 2.38 - i * .13, 2 + i * .08, .06, .18, C.white);
    if (rebuild) {
      box(0, .21, -.7, 1.8, .22, 2.4, C.stone);
      for (let z = -1.7; z < .5; z += .4) box(-.95, .47, z, .17, .5, .3, C.stone);
      for (let i = 0; i < 5; i++) { box(-1.5, .18, -.8 + i * .3, .65, .3, .2, C.stone); box(1.45, .06 + i * .08, -.7, .12, .08, 2.2, C.wood); }
      for (const z of [-1.5, -.4]) { box(-1.4, 1, z, .07, 1.8, .07, C.wood); box(-1, 1, z, .07, 1.8, .07, C.wood); }
      box(-1.2, 1.5, -.95, .6, .08, 1.5, C.wood); altar(0, 1, .9);
    } else {
      box(-.95, 1, -.8, .15, 1.8, 2.65, C.stone); roof.box(.95, 1, -.8, .15, 1.8, 2.65, C.stone); box(0, 1, -2.06, 2, 1.8, .15, C.stone);
      roof.box(0, .78, -1.2, 1.8, 1.4, .04, C.purple); box(0, .2, -1.2, 1.8, .04, .04, C.purple);
      roof.box(0, 1.95, -.8, 2.3, .23, 2.95, grand ? C.white : C.gold);
      roof.box(0, 1.35, .6, 2.2, 2.55, .35, grand ? C.white : '#dfc18b'); roof.box(0, 1, .79, .65, 1.65, .035, C.wood);
      for (const x of [-.78, .78]) { cyl(x, 1, 1.25, .11, 1.8, C.copper); ball(x, 1.97, 1.25, .36, C.gold); }
      altar(0, 1.85, .7);
      if (!grand) {
        cyl(1.4, .4, .7, .28, .4, C.copper); k.part('bowl', 1.4, .68, .7, .9, .4, .9, C.copper); ark(0, -1.55, .7);
        for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; box(1.4 + Math.cos(a) * .38, .16, .7 + Math.sin(a) * .38, .13, .25, .17, C.copper, -a); }
      }
    }
    if (grand) {
      for (const x of [-2.3, 2.3]) { for (let z = -2.2; z <= 2; z += .42) column(x, z, .95); box(x, 1.1, -.1, .45, .16, 4.8, C.white); }
      for (let x = -2; x < 2.1; x += .45) column(x, -2.3, .95);
      box(0, 1.1, -2.3, 4.8, .16, .45, C.white);
    }
    for (let i = 0; i < 9; i++) person(-1.5 + i * .37, 1.1 + (i % 2) * .7, [C.white, C.red, '#6d8581'][i % 3]);
  } else if (theme.model === 'exodus') {
    house(1.2, -1.2, 1.4, .9, 1.2, '#c1a17a'); box(1.2, .6, -.58, .5, .8, .05, C.red);
    for (let i = 0; i < 12; i++) box(-1.5 + i % 3 * .23, .09 + Math.floor(i / 6) * .13, -1.3 + Math.floor(i / 3) % 2 * .3, .2, .12, .26, '#af7857');
    water(-1.3, 1.25, 1.3, 1.3); water(1.25, 1.25, 1.3, 1.3);
    box(0, .06, 1.25, 1.1, .1, 1.7, C.sand);
    for (let i = 0; i < 8; i++) person(-.2 + i % 2 * .35, 2.1 - Math.floor(i / 2) * .5, i % 2 ? C.white : C.blue);
    tent(-1.5, -.1, .7);
  } else if (theme.model === 'jordan') {
    water(0, 0, 1.1, 4.8); box(0, .08, 0, 1.15, .14, .9, C.sand); ark(-.7, 0, .6);
    for (let i = 0; i < 6; i++) person(-1.9 + i * .53, .3, C.white);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ball(1.6 + Math.cos(a) * .35, .15, 1.5 + Math.sin(a) * .35, .28, '#958d78'); }
    tent(1.7, -1, .7); tree(-1.7, -1.2, 1);
  } else if (['city', 'fort', 'twocities', 'wall', 'babylon'].includes(theme.model)) {
    box(0, .03, 0, .55, .06, 4.5, '#bdab8c');
    for (let i = 0; i < 7; i++) {
      const x = i % 2 ? -1.2 : 1.15, z = -1.7 + Math.floor(i / 2) * 1.05;
      house(x, z, .7 + i % 3 * .15, .65 + i % 2 * .35, .8);
    }
    if (theme.model === 'babylon') {
      water(0, 0, .6, 4.7); for (const x of [-1.2, 1.2]) box(x, 1.1, -1.6, .85, 2.2, .65, C.blue);
      box(0, 1.8, -1.6, 2.1, .5, .65, C.blue);
    } else {
      wall(-1.5, 2.05, 1.8, .9, .2); wall(1.5, 2.05, 1.8, .9, .2);
      for (const x of [-.55, .55]) { box(x, .7, 2.05, .38, 1.4, .5, C.stone); box(x, 1.45, 2.05, .5, .18, .6, C.white); }
      box(0, 1.3, 2.05, .75, .3, .45, C.stone);
    }
    if (theme.model === 'city') { k.part('cone', 2, .7, -1.3, 1.7, 1.2, 1.7, C.green); tree(2, -1.3, .8); }
    if (theme.model === 'wall') { for (let i = 0; i < 4; i++) box(-2 + i * .4, .15, .1, .3, .3, .35, C.stone); }
    if (theme.model === 'fort') { wall(0, -1.95, 3.5, 1.4, .3); ark(-1.1, .6, .7); }
    for (let i = 0; i < 5; i++) person((i % 2 - .5) * .4, -1.2 + i * .7, i % 2 ? C.red : C.white);
  } else if (['port', 'lake'].includes(theme.model)) {
    water(0, 1.3, 4.5, 1.1);
    for (let i = 0; i < 12; i++) box(-1.7 + i * .16, .1, 1.4, .14, .13, 1.2, C.wood);
    for (const x of [-1.8, .1]) for (const z of [.85, 1.9]) cyl(x, .12, z, .06, .7, C.wood);
    house(-1.25, -.5, 1, 1, 1.3); table(-1.4, .5, .6);
    if (theme.model === 'port') { for (let i = -1; i <= 2; i++) column(i * .55, -1.4, 1.2); box(.3, 1.3, -1.4, 2.2, .18, .5, C.stone); }
    else { house(1.2, -.7, 1.25, .9, 1); tree(1.8, .6, .9, true); }
    const boat = makeBoat(scene, theme.position[0] + 2.45, theme.position[1] + 3, 1.3, theme.id); boats.push(boat);
    for (let i = 0; i < 5; i++) person(-.5 + i * .4, .2, i % 2 ? C.white : C.blue);
  } else if (theme.model === 'mountain') {
    k.part('cone', 0, 1.4, -1, 3.2, 3.3, 3, '#a6947e'); k.part('cone', 1.3, .6, -.9, 1.9, 1.3, 1.8, '#c0ad8e');
    for (let i = 0; i < 5; i++) tent(-1.5 + i * .7, 1, .55, i % 2 ? C.white : '#ae8c6c');
    for (let i = 0; i < 10; i++) ball(-1 + i % 5 * .4, .06, 1.6 + Math.floor(i / 5) * .25, .08, C.white);
    well(-1.6, -.3);
  } else if (theme.model === 'farm') {
    field(-1.15, .7, 1.7); field(-1.15, -1.2, 1.3); house(1.1, -1, .9, .8, .9); tree(1.5, 1.2, 1.2);
    cyl(.8, .07, .5, .6, .13, C.sand); person(-.2, .8, C.red); person(.7, -.1);
    for (let i = 0; i < 4; i++) { ball(.7 + i % 2 * .35, .18, 1.35 + Math.floor(i / 2) * .35, .35, C.white); ball(.8 + i % 2 * .35, .25, 1.45 + Math.floor(i / 2) * .35, .14, C.dark); }
  } else if (theme.model === 'camp') {
    tent(-1.1, .7, 1.2); tent(1.05, -1, .9, '#b18a67'); well(1.2, 1.2); altar(-.9, -1.2, .6); tree(-1.6, -.6, 1.2);
    person(.2, .4, C.white); person(.55, .75, C.blue);
  } else if (theme.model === 'egypt') {
    for (let i = 0; i < 4; i++) { cyl(-1.2 + i % 2 * 1.1, .65, -.8 + Math.floor(i / 2) * 1.25, .42, 1.3, '#c1a16f'); k.part('cone', -1.2 + i % 2 * 1.1, 1.45, -.8 + Math.floor(i / 2) * 1.25, .9, .4, .9, C.sand); }
    house(1.2, -1, 1, .9, 1.2); water(1.5, 1.3, 1.1, 1); tree(1.7, .6, 1.3, true); table(.4, 1.2);
  } else if (theme.model === 'garden') {
    table(-1, .6, 1.1); for (const [x,z] of [[-1.5,-1],[.1,0],[1.6,1.4],[1.5,-1.2]]) tree(x,z,1.1);
    ball(.9, .42, -1.1, 1.2, '#b8ad94'); box(.85, .3, -.55, .4, .5, .1, C.dark); cyl(1.4, .28, -.45, .35, .5, '#b3a38a');
    person(-1.4, .9, C.white); person(-.4, .9, C.blue);
  } else if (['gathering', 'letters'].includes(theme.model)) {
    house(-1.2, -1.1, 1.3, .7, 1.1); house(1.2, -1, .9, .9, 1.2); table(0, .2, 1.3); table(-1, 1.2, .6);
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; person(Math.cos(a) * 1.15, .3 + Math.sin(a) * .8, [C.red, C.white, C.blue][i % 3]); }
    tree(1.8, 1.4, 1);
  } else if (theme.model === 'road') {
    box(0, .04, 0, .8, .07, 4.5, '#b7ae9b');
    for (const z of [-1.2, 1.2]) { column(-.7, z, 1.1); column(.7, z, 1.1); box(0, 1.3, z, 1.7, .35, .45, C.stone); }
    table(1.4, 0); house(-1.5, 0, .9, .9, 1); person(0, .2);
  } else {
    house(-1.1, .7, 1.25, 1, 1.1); house(1.1, -1, .9, .8, .9); well(1.1, 1); tree(-1.3, -1.3, 1.2); table(0, -.5, .7); person(0, .7);
    if (theme.model === 'village') { box(-1.1, .15, .3, .45, .25, .25, C.wood); ball(-1.1, .3, .3, .2, C.white); }
  }
  k.finish(theme.id); roof.finish(theme.id);
  return roofGroup;
}

export function createWorld(container, { onSelect, onStop, onActor, onReady, onError, icon }) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' }); }
  catch (error) { onError(error); return null; }
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#94b2a9'); scene.fog = new THREE.FogExp2('#94b2a9', .0027);
  const camera = new THREE.PerspectiveCamera(39, 1, .1, 1800);
  const historicalCache = new Map(); let activeHistorical = null, environment = null, nightMode = false, activeView = 'overview';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 800 ? 1.35 : 1.75));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.35;
  renderer.domElement.setAttribute('aria-label', '聖經主題群島 3D 場景，可拖曳旋轉、滾輪縮放；所有主題與探索點亦可由清單操作。');
  renderer.domElement.tabIndex = 0; container.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !reduced.matches; controls.dampingFactor = .065; controls.maxPolarAngle = Math.PI / 2.25;
  controls.minDistance = 4; controls.maxDistance = 220; controls.target.set(5, 0, 6);
  camera.position.set(51, 63, 82); controls.update();
  const ambient = new THREE.HemisphereLight('#fff3dc', '#557879', 2.6); scene.add(ambient);
  const sun = new THREE.DirectionalLight('#fff0cf', 4); sun.position.set(-18, 40, 24); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -45; sun.shadow.camera.right = 45; sun.shadow.camera.top = 45; sun.shadow.camera.bottom = -45;
  sun.shadow.camera.far = 140; sun.shadow.normalBias = .075; sun.shadow.bias = -.0002; scene.add(sun);
  const waterMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uDark: { value: 0 } },
    vertexShader: 'varying vec3 vWorld; void main(){ vec4 p=modelMatrix*vec4(position,1.); vWorld=p.xyz; gl_Position=projectionMatrix*viewMatrix*p; }',
    fragmentShader: `varying vec3 vWorld; uniform float uTime; uniform float uDark;
      void main(){vec2 p=vWorld.xz; float wave=sin(p.x*2.3+sin(p.y*1.7)+uTime*.35)*sin(p.y*3.1-uTime*.22);
      float broad=sin(p.x*.09+p.y*.07); vec3 base=mix(vec3(.18,.38,.38),vec3(.29,.52,.49),.5+.5*broad);
      base+=smoothstep(.94,1.,wave)*.045; base*=1.-uDark*.55; float far=clamp(length(p)*.002,0.,.22);
      gl_FragColor=vec4(mix(base,vec3(.58,.69,.65),far),1.); }`,
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), waterMaterial); water.rotation.x = -Math.PI / 2; water.position.y = -.13; scene.add(water);
  const roots = new Map(), roofs = new Map(), boats = [], markers = new Map();
  const labelsLayer = document.createElement('div'); labelsLayer.className = 'world-labels'; container.appendChild(labelsLayer);
  const labels = [];
  for (const t of themes) {
    const root = makeIsland(t, scene); roots.set(t.id, root); roofs.set(t.id, makeScene(t, root, scene, boats));
    const el = document.createElement('button'); el.className = `island-label ${t.number <= 8 ? 'core' : 'minor'}`;
    el.innerHTML = `<span class="label-number">${String(t.number).padStart(2, '0')}</span><span>${t.name}</span>`;
    el.setAttribute('aria-label', `探索${t.name}`); el.onclick = () => onSelect(t.id); labelsLayer.appendChild(el);
    labels.push({ el, id: t.id, pos: new THREE.Vector3(t.position[0], 1.6, t.position[1] + t.radius * .75) });
    const mg = new THREE.Group(); mg.visible = false; scene.add(mg); markers.set(t.id, mg);
  }
  // Tiny skerries and sailboats give the archipelago a human scale without competing with story islands.
  const decor = kit(scene), rand = random(577);
  for (let i = 0; i < 45; i++) {
    const x = -35 + rand() * 80, z = -27 + rand() * 70;
    if (themes.some(t => Math.hypot(x - t.position[0], z - t.position[1]) < t.radius + 2)) continue;
    decor.part('sphere', x, -.55, z, 1 + rand() * 1.6, .5 + rand(), 1 + rand(), '#b5ad91');
    if (i % 3 === 0) decor.tree(x, z, .45);
  }
  decor.finish(null);
  for (const [x,z,s] of [[-6,-18,.7],[14,16,.8],[-19,15,.6]]) boats.push(makeBoat(scene,x,z,s));

  const connectionGroup = new THREE.Group(); scene.add(connectionGroup);
  const selectedRing = new THREE.Mesh(new THREE.RingGeometry(1, 1.04, 80).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#f4d691', transparent: true, opacity: .8, depthWrite: false }));
  selectedRing.visible = false; scene.add(selectedRing);
  const hotspotLayer = document.createElement('div'); hotspotLayer.className = 'world-hotspots'; container.appendChild(hotspotLayer);
  let actorMarkers = [], conversationId = null, motionClock = 0;
  let hotspots = [], selected = null, selectedStop = null, cutaway = false, showLabels = true, showConnections = true, paused = reduced.matches;
  let visibleIds = new Set(themes.map(t => t.id)), fly = null, raf, elapsed = 0, last = 0, dirty = true, hidden = false;
  let frameSum = 0, frameCount = 0, lastAdapt = 0, pixelRatio = renderer.getPixelRatio();
  const v = new THREE.Vector3(), ray = new THREE.Raycaster(), pointer = new THREE.Vector2(); let down = null;
  function focus(target, offset, duration = 1050, preserveHeight = false, frame = true) {
    resize();
    const framedOffset = offset.clone().multiplyScalar(frame ? Math.max(1, .95 / camera.aspect) : 1);
    if (preserveHeight) framedOffset.y = offset.y;
    fly = { from: camera.position.clone(), to: target.clone().add(framedOffset), old: controls.target.clone(), target: target.clone(), start: performance.now(), duration: reduced.matches ? 0 : duration };
    dirty = true;
  }
  function clearConnections() {
    for (const obj of [...connectionGroup.children]) { obj.geometry.dispose(); obj.material.dispose(); connectionGroup.remove(obj); }
  }
  function select(id) {
    activeHistorical?.converse(null); conversationId=null;actorMarkers=[];
    selected = id ? themeById.get(id) : null; selectedStop = null;
    hotspotLayer.replaceChildren(); hotspots = []; clearConnections();
    for (const [id, roof] of roofs) roof.visible = !(cutaway && selected?.id === id);
    labels.forEach(l => l.el.classList.toggle('selected', l.id === id));
    activeHistorical = null; activeView = 'overview';
    if (historicalScenes[id]) {
      if (!environment) {
        const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
        environment = pmrem.fromScene(room, .04).texture; room.dispose(); pmrem.dispose();
      }
      if (!historicalCache.has(id)) historicalCache.set(id, createHistoricalScene(id, environment));
      activeHistorical = historicalCache.get(id); activeHistorical.roof.visible = !cutaway; activeHistorical.setTime(nightMode);
    }
    camera.fov = activeHistorical ? 48 : 39; camera.updateProjectionMatrix();
    controls.minDistance = activeHistorical ? 2 : 4; controls.maxDistance = activeHistorical ? activeHistorical.config.extent * 2 : 220;
    controls.maxPolarAngle = activeHistorical ? Math.PI / 2 - .018 : Math.PI / 2.25;
    renderer.toneMappingExposure = activeHistorical ? 1.02 : 1.35;
    renderer.shadowMap.needsUpdate = true;
    labelsLayer.hidden = !!activeHistorical;
    selectedRing.visible = !!selected && !activeHistorical;
    if (!selected) { focus(new THREE.Vector3(5, 0, 6), new THREE.Vector3(48, 63, 77)); return; }
    const [x,z] = selected.position;
    selectedRing.position.set(x, TOP + .02, z); selectedRing.scale.setScalar(selected.radius + .45);
    if (activeHistorical) {
      const c = activeHistorical.config;
      // Change scenes immediately, then animate only within the same metre-scale coordinate space.
      controls.target.fromArray(c.target); camera.position.copy(controls.target).add(new THREE.Vector3(...c.overview));
      focus(new THREE.Vector3(...c.target), new THREE.Vector3(...c.overview), 450);
    } else focus(new THREE.Vector3(x, .3, z), new THREE.Vector3(7.5, 10, 12));
    selected.stops.forEach((s, index) => {
      const el = document.createElement('button'); el.className = 'hotspot'; el.innerHTML = `<span>${index + 1}</span><b>${s.name}</b>`;
      el.setAttribute('aria-label', `探索${s.name}`); el.onclick = () => onStop(s.id); hotspotLayer.appendChild(el);
      hotspots.push({ el, id: s.id, pos: activeHistorical ? new THREE.Vector3(...activeHistorical.config.stops[s.id]) : new THREE.Vector3(x + s.position[0], TOP + s.position[1], z + s.position[2]) });
    });
    if (activeHistorical) {
      for(const actor of activeHistorical.people) {
        const el=document.createElement('button');el.className='person-marker';
        const person=peopleByIsland[id].find(p=>p.id===actor.id);
        el.innerHTML=`${icon('chat',16)}<span>${person.name}</span>`;el.setAttribute('aria-label',`與${person.name}交談`);
        el.onclick=()=>onActor?.(actor.id);hotspotLayer.appendChild(el);
        actorMarkers.push({el,id:actor.id,actor,pos:new THREE.Vector3()});
      }
      dirty = true; return;
    }
    for (const connection of selected.connections) {
      const other = themeById.get(connection.id); if (!other) continue;
      const start = new THREE.Vector3(x, .7, z), end = new THREE.Vector3(other.position[0], .7, other.position[1]);
      const mid = start.clone().lerp(end, .5); mid.y = 2.5;
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)), new THREE.LineDashedMaterial({ color: '#efd3a3', dashSize: .22, gapSize: .16, transparent: true, opacity: .7 }));
      line.computeLineDistances(); connectionGroup.add(line);
    }
    connectionGroup.visible = showConnections; dirty = true;
  }
  function focusStop(id) {
    if (!selected) return; const s = selected.stops.find(s => s.id === id); if (!s) return;
    activeHistorical?.converse(null);conversationId=null;
    selectedStop = id; activeView = 'stop'; if(activeHistorical) controls.maxPolarAngle = Math.PI/2-.018; const [x,z] = selected.position;
    hotspots.forEach(h => h.el.classList.toggle('active', h.id === id));
    if (activeHistorical) {
      focus(new THREE.Vector3(...activeHistorical.config.stops[id]), new THREE.Vector3(...activeHistorical.config.close), 800); return;
    }
    focus(new THREE.Vector3(x + s.position[0], .6 + s.position[1] * .35, z + s.position[2]), new THREE.Vector3(4.6, 5.4, 6.8), 800);
  }
  function project(item, width, height, isHotspot = false) {
    v.copy(item.pos).project(camera);
    const inView = v.z < 1 && v.z > -1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
    const distance = camera.position.distanceTo(item.pos);
    const allowed = (isHotspot && (!activeHistorical || showLabels)) || (!isHotspot && showLabels && visibleIds.has(item.id) && (themeById.get(item.id).number <= 8 || distance < 45 || !selected));
    item.el.hidden = !inView || !allowed || (isHotspot && distance > (activeHistorical ? activeHistorical.config.extent * 3 : 28) * Math.max(1, .95 / camera.aspect));
    if (!item.el.hidden) {
      item.el.style.transform = `translate(-50%, -50%) translate(${(v.x * .5 + .5) * width}px,${(-v.y * .5 + .5) * height}px)`;
      item.el.style.zIndex = String(item.id === selected?.id ? 2000 : Math.max(1, Math.round(1000 - distance)));
    }
  }
  function avoidLabelOverlap(items, activeId) {
    const placed = [];
    const ranked = [...items].sort((a,b) => {
      const priority = item => item.id === activeId ? 0 : (themeById.get(item.id)?.number || 0) <= 8 ? 1 : 2;
      return priority(a) - priority(b);
    });
    for (const item of ranked) {
      if (item.el.hidden) continue;
      const r = item.el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const overlap = placed.some(p => r.left < p.right + 3 && r.right > p.left - 3 && r.top < p.bottom + 3 && r.bottom > p.top - 3);
      if (overlap) item.el.hidden = true;
      else placed.push(r);
    }
  }
  function resize() {
    const width = container.clientWidth, height = container.clientHeight;
    if (!width || !height) return;
    const oldFactor = Math.max(1, .95 / camera.aspect), nextFactor = Math.max(1, .95 / (width / height));
    if (oldFactor !== nextFactor && !fly) {
      const off = camera.position.clone().sub(controls.target).multiplyScalar(nextFactor / oldFactor);
      if (activeHistorical && ['human','person'].includes(activeView)) off.y = camera.position.y - controls.target.y;
      camera.position.copy(controls.target).add(off);
    }
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); dirty = true;
  }
  const observer = new ResizeObserver(resize); observer.observe(container); resize();
  const onDown = e => { down = { x: e.clientX, y: e.clientY }; fly = null; };
  const onUp = e => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) { down = null; return; } down = null;
    const rect = renderer.domElement.getBoundingClientRect(); pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
    ray.setFromCamera(pointer, camera);
    if(activeHistorical) {
      // Use the rendered geometry itself; a wall in front of a person blocks the hit.
      activeHistorical.scene.updateMatrixWorld(true);
      const meshes=[];activeHistorical.scene.traverseVisible(o=>{if(o.isMesh)meshes.push(o);});
      const hit=ray.intersectObjects(meshes,false)[0];
      const actorId=hit?.object.userData.actorInstances?.[hit.instanceId];
      if(actorId)onActor?.(actorId);
      return;
    }
    const hit = ray.intersectObjects([...roots.values()], true).find(h => {
      const id = h.object.userData.themeId; return id && visibleIds.has(id) && h.object.visible && h.object.parent.visible;
    });
    if (hit) {
      const id = hit.object.userData.themeId;
      if (selected?.id !== id) onSelect(id);
      else {
        const nearest = selected.stops.map(s => ({ s, d: hit.point.distanceTo(new THREE.Vector3(selected.position[0] + s.position[0], hit.point.y, selected.position[1] + s.position[2])) })).sort((a,b) => a.d - b.d)[0];
        if (nearest.d < 1.2) onStop(nearest.s.id);
      }
    }
  };
  const onKey = e => {
    const angles = { ArrowLeft: .13, ArrowRight: -.13 }; if (!(e.key in angles)) return;
    e.preventDefault(); fly = null; const off = camera.position.clone().sub(controls.target).applyAxisAngle(new THREE.Vector3(0,1,0), angles[e.key]); camera.position.copy(controls.target).add(off); controls.update(); dirty = true;
  };
  renderer.domElement.addEventListener('pointerdown', onDown); renderer.domElement.addEventListener('pointerup', onUp); renderer.domElement.addEventListener('keydown', onKey);
  controls.addEventListener('change', () => dirty = true);
  const onVisibility = () => { hidden = document.hidden; last = performance.now(); dirty = true; };
  document.addEventListener('visibilitychange', onVisibility);
  function animate(now) {
    raf = requestAnimationFrame(animate); if (hidden) return;
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    if (!paused && !activeHistorical) { elapsed += dt; waterMaterial.uniforms.uTime.value = elapsed; dirty = true; boats.forEach((b,i) => { b.rotation.z = Math.sin(elapsed * .8 + i) * .025; b.rotation.x = Math.cos(elapsed * .6 + i) * .02; }); }
    if(activeHistorical && !paused) {
      motionClock+=dt;
      if(motionClock>=1/30) {activeHistorical.animate(motionClock,camera.position.toArray());motionClock=0;dirty=true;}
    }
    if (fly) {
      const t = fly.duration ? Math.min(1, (now - fly.start) / fly.duration) : 1, ease = 1 - (1 - t) ** 3;
      camera.position.lerpVectors(fly.from, fly.to, ease); controls.target.lerpVectors(fly.old, fly.target, ease); if (t === 1) fly = null; dirty = true;
    }
    controls.update();
    if(activeHistorical) { const floor=activeHistorical.groundHeight(camera.position.x,camera.position.z)+.3; if(camera.position.y<floor) {camera.position.y=floor;dirty=true;} }
    // Lower DPR only after sustained slow frames. No promise of a particular frame rate.
    if (dt > 0 && now > 6000) { frameSum += dt * 1000; frameCount++; }
    if (now - lastAdapt > 3500 && frameCount > 30) {
      if (frameSum / frameCount > 30 && pixelRatio > 1) { pixelRatio = Math.max(1, pixelRatio - .25); renderer.setPixelRatio(pixelRatio); resize(); }
      frameSum = 0; frameCount = 0; lastAdapt = now;
    }
    if (dirty) {
      renderer.render(activeHistorical?.scene || scene, camera);
      const w = container.clientWidth, h = container.clientHeight;
      if (!activeHistorical) labels.forEach(l => project(l, w, h)); hotspots.forEach(l => project(l, w, h, true));
      actorMarkers.forEach(l=>{const p=l.actor.state.position;l.pos.set(p[0],p[1]+2.15,p[2]);project(l,w,h,true);l.el.classList.toggle('active',l.id===conversationId);});
      avoidLabelOverlap(labels, selected?.id); avoidLabelOverlap([...actorMarkers,...hotspots], conversationId || selectedStop); dirty = false;
    }
  }
  raf = requestAnimationFrame(animate); onReady();
  return {
    select, focusStop,
    converse(id) {
      if(!activeHistorical)return;
      activeHistorical.converse(id);conversationId=id;
      const a=activeHistorical.people.find(a=>a.id===id);if(!a){dirty=true;return;}
      selectedStop=null;activeView='person';controls.maxPolarAngle=Math.PI*.6;
      const [x,y,z]=a.state.position;
      focus(new THREE.Vector3(x,y+1.1,z),activeHistorical.conversationOffset(a),850,true,false);
      hotspots.forEach(h=>h.el.classList.remove('active'));dirty=true;
    },
    sceneView(view) {
      if (!activeHistorical) return; const c = activeHistorical.config;
      activeView = view; controls.maxPolarAngle = view==='human' ? Math.PI*.6 : Math.PI/2-.018; selectedStop = null; hotspots.forEach(h => h.el.classList.remove('active'));
      if (view === 'human') focus(new THREE.Vector3(...c.human.target), new THREE.Vector3(...c.human.offset), 850, true);
      else if (view === 'plan') focus(new THREE.Vector3(...c.target), new THREE.Vector3(.1,c.plan,.1),850);
      else focus(new THREE.Vector3(...c.target), new THREE.Vector3(...c.overview),850);
    },
    home() { select(null); },
    setCutaway(value) { cutaway = value; if (activeHistorical) activeHistorical.roof.visible = !value; for (const [id, roof] of roofs) roof.visible = !(cutaway && selected?.id === id); renderer.shadowMap.needsUpdate = true; dirty = true; },
    setLabels(value) { showLabels = value; dirty = true; },
    setConnections(value) { showConnections = value; connectionGroup.visible = value; dirty = true; },
    setPaused(value) { paused = value; dirty = true; },
    setTime(night) {
      nightMode = night; activeHistorical?.setTime(night);
      ambient.intensity = night ? 1.35 : 2.6; sun.intensity = night ? 1.2 : 4;
      sun.color.set(night ? '#a3b9e2' : '#fff0cf'); scene.background.set(night ? '#3c5d64' : '#94b2a9'); scene.fog.color.copy(scene.background);
      waterMaterial.uniforms.uDark.value = night ? 1 : 0; renderer.shadowMap.needsUpdate = true; dirty = true;
    },
    setVisible(ids) { visibleIds = new Set(ids); for (const [id, root] of roots) root.visible = visibleIds.has(id); boats.forEach(b => { const id = b.children.find(c => c.userData.themeId)?.userData.themeId; b.visible = !id || visibleIds.has(id); }); dirty = true; },
    zoom(amount) { fly = null; const off = camera.position.clone().sub(controls.target); const distance = THREE.MathUtils.clamp(off.length() * amount, controls.minDistance, controls.maxDistance); camera.position.copy(controls.target).add(off.setLength(distance)); controls.update(); dirty = true; },
    topView() { if (activeHistorical) { activeView='plan'; controls.maxPolarAngle=Math.PI/2-.018; const c = activeHistorical.config; focus(new THREE.Vector3(...c.target),new THREE.Vector3(.1,c.plan,.1)); return; } const target = selected ? new THREE.Vector3(selected.position[0], .2, selected.position[1]) : new THREE.Vector3(3,0,5); focus(target, new THREE.Vector3(.1, selected ? 18 : 95, 4)); },
    getStats() { return { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, pixelRatio, selected: selected?.id, stop: selectedStop, historical: !!activeHistorical }; },
    dispose() { cancelAnimationFrame(raf); observer.disconnect(); controls.dispose(); document.removeEventListener('visibilitychange', onVisibility); historicalCache.forEach(s => s.dispose()); environment?.dispose(); renderer.dispose(); labelsLayer.remove(); hotspotLayer.remove(); renderer.domElement.remove(); },
  };
}
