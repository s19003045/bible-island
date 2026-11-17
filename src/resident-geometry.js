// Keep the actual exported clothes and props at every distance. Distant geometry
// only removes redundant triangles; vertex colours, skin weights and material
// boundaries are retained. The library is bundled locally, never fetched at runtime.
const prepared=new WeakMap();
let simplifier;
export function prepareResidentGeometry(gltf) {
  if(prepared.has(gltf.scene))return prepared.get(gltf.scene);
  const promise=(async()=>{
    simplifier??=import('./vendor/meshopt-simplifier.js').then(async({MeshoptSimplifier})=>{await MeshoptSimplifier.ready;return MeshoptSimplifier;});
    const simplify=await simplifier,geometries=new Map();
    gltf.scene.traverse(mesh=>{
      if(!mesh.isMesh||geometries.has(mesh.geometry))return;
      const source=mesh.geometry,{position}=source.attributes,index=source.index;
      if(!index||index.count<600||!simplify.supported)return;
      // Lock material edges. A small relative error also protects cloth folds,
      // head coverings and carried objects instead of replacing their shapes.
      const {skinIndex,skinWeight}=source.attributes,locked=new Uint8Array(position.count),dominant=new Int16Array(position.count);
      if(skinIndex&&skinWeight)for(let i=0;i<position.count;i++){
        let strongest=0;for(let j=1;j<4;j++)if(skinWeight.getComponent(i,j)>skinWeight.getComponent(i,strongest))strongest=j;
        dominant[i]=skinIndex.getComponent(i,strongest);
        if(skinWeight.getComponent(i,strongest)<.999||position.getY(i)<.30)locked[i]=1;
      }
      for(let i=0;i<index.count;i+=3)for(let j=0;j<3;j++){
        const a=index.getX(i+j),b=index.getX(i+(j+1)%3);if(dominant[a]!==dominant[b])locked[a]=locked[b]=1;
      }
      const [indices,error]=simplify.simplifyWithAttributes(index.array,position.array,3,new Float32Array(0),0,[],locked,Math.max(300,Math.floor(index.count*.25/3)*3),.003,['LockBorder']);
      if(indices.length>=index.count)return;
      const distant=source.clone();
      // Share immutable vertex buffers with the original rather than copying
      // an entire mesh for every resident. Only the index buffer differs.
      for(const [name,attribute] of Object.entries(source.attributes))distant.setAttribute(name,attribute);
      distant.setIndex(new index.constructor(indices,1));
      distant.userData.residentLODError=error;geometries.set(source,distant);
    });
    return geometries;
  })().catch(error=>{prepared.delete(gltf.scene);throw error;});
  prepared.set(gltf.scene,promise);return promise;
}

export async function disposeResidentGeometry(gltf) {
  const promise=prepared.get(gltf.scene);prepared.delete(gltf.scene);
  if(promise)for(const geometry of (await promise).values())geometry.dispose();
}
