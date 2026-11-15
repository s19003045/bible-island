import * as THREE from 'three';
import {atlasRoutes,routeGeometry,visibleRoutes} from './atlas-data.js';
export function createAtlasNetwork(themes){
  const byId=new Map(themes.map(t=>[t.id,t])),root=new THREE.Group(),records=new Map(),pickables=[];
  root.name='atlas-reading-bridges';
  for(const route of atlasRoutes){
    const g=new THREE.Group(),shape=routeGeometry(route,byId),curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(...shape.start),new THREE.Vector3(...shape.middle),new THREE.Vector3(...shape.end));root.add(g);
    const stone=new THREE.MeshStandardMaterial({color:'#aa9774',roughness:.95}),rail=new THREE.MeshStandardMaterial({color:'#746b53',roughness:.8});
    const lineMat=new THREE.LineDashedMaterial({color:route.kind==='compare'?'#a88a53':'#c1cdb8',dashSize:route.kind==='compare'?.12:.4,gapSize:.25,transparent:true,opacity:.8});
    if(['bridge','time'].includes(route.kind)){
      const positions=[],indices=[],segments=32,width=route.kind==='time'?.33:.38;
      for(let i=0;i<=segments;i++){
        const t=i/segments,p=curve.getPoint(t),tangent=curve.getTangent(t),normal=new THREE.Vector3(-tangent.z,0,tangent.x).normalize();
        for(const side of [-1,1]){const v=p.clone().addScaledVector(normal,side*width);positions.push(v.x,v.y,v.z);}
        if(i<segments){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}
      }
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();stone.side=THREE.DoubleSide;
      const deck=new THREE.Mesh(geo,stone);deck.castShadow=deck.receiveShadow=true;g.add(deck);
      for(const side of [-1,1]){
        const points=[];for(let i=0;i<=24;i++){const t=i/24,p=curve.getPoint(t),d=curve.getTangent(t);p.addScaledVector(new THREE.Vector3(-d.z,0,d.x).normalize(),side*width);p.y+=.27;points.push(p);}
        const guard=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),32,.035,4,false),rail);g.add(guard);
      }
      const count=Math.max(3,Math.floor(curve.getLength()/1.5)),piers=new THREE.InstancedMesh(new THREE.BoxGeometry(.13,1,.13),rail,count*2),dummy=new THREE.Object3D();
      for(let i=0;i<count;i++)for(const side of [-1,1]){const p=curve.getPoint((i+.5)/count),d=curve.getTangent((i+.5)/count);p.addScaledVector(new THREE.Vector3(-d.z,0,d.x).normalize(),side*width);const h=p.y+.65;dummy.position.set(p.x,(p.y-.65)/2+.12,p.z);dummy.scale.set(1,h+.24,1);dummy.updateMatrix();piers.setMatrixAt(i*2+(side>0?1:0),dummy.matrix);}g.add(piers);
      if(route.kind==='time')for(const t of [.18,.82]){const p=curve.getPoint(t),plaque=new THREE.Mesh(new THREE.BoxGeometry(.16,.58,.68),stone);plaque.position.copy(p).add(new THREE.Vector3(0,.47,0));plaque.rotation.y=Math.atan2(curve.getTangent(t).x,curve.getTangent(t).z);g.add(plaque);}
    }else{
      const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(64)),lineMat);line.computeLineDistances();g.add(line);
    }
    const hit=new THREE.Mesh(new THREE.TubeGeometry(curve,32,.55,4,false),new THREE.MeshBasicMaterial({visible:false}));hit.userData.routeId=route.id;g.add(hit);pickables.push(hit);
    records.set(route.id,{route,group:g,curve,stone,rail,lineMat,hit});
  }
  return {root,pickables,records,
    update({journey='all',focus=null,ids=null,enabled=true,routeId=null}={}){
      const visible=new Set(visibleRoutes({journey,focus,ids}).map(r=>r.id));
      for(const r of records.values()){
        r.group.visible=enabled&&(visible.has(r.route.id)||r.route.id===routeId&&(!ids||ids.has(r.route.from)&&ids.has(r.route.to)));
        const active=r.route.id===routeId||focus&&(r.route.from===focus||r.route.to===focus);
        r.stone.color.set(active?'#d5b578':'#aa9774');r.rail.color.set(active?'#a68751':'#746b53');r.lineMat.color.set(active?'#e3c68c':r.route.kind==='compare'?'#b5a179':'#c1cdb8');r.lineMat.opacity=active?1:journey==='all'?.58:.85;
      }
    },
    pick(ray){return ray.intersectObjects(pickables,false).find(h=>h.object.parent.visible)?.object.userData.routeId||null;},
    curve(id){return records.get(id)?.curve;},
    dispose(){root.traverse(o=>{o.geometry?.dispose();});for(const r of records.values()){r.stone.dispose();r.rail.dispose();r.lineMat.dispose();r.hit.material.dispose();}},
  };
}
