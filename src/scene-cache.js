// A chapter can contain dozens of independent skeletons. Keep a few recent
// scenes, while reading progress remains in the separate application store.
export function createSceneCache(limit=3){
 const entries=new Map();
 return {
  get size(){return entries.size;},
  get(key,create){
   if(entries.has(key)){const value=entries.get(key);entries.delete(key);entries.set(key,value);return value;}
   const value=create();entries.set(key,value);
   while(entries.size>limit){const [oldest,scene]=entries.entries().next().value;entries.delete(oldest);scene.dispose();}
   return value;
  },
  dispose(){for(const scene of entries.values())scene.dispose();entries.clear();},
 };
}
