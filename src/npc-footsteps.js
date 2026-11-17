// Each NPC owns a contact history. Sounds follow actual swing-to-support
// transitions, not a group beat, random clock, or a queue of missed footfalls.
export function createNPCFootsteps(play){
 let history=new WeakMap();
 return {
  reset(){history=new WeakMap();},
  update(actors,listener,{enabled=true,limit=4,distance=12}={}){
   let played=0;
   const ordered=actors.map(actor=>({actor,d:Math.hypot(...actor.state.position.map((v,i)=>v-listener[i]))})).sort((a,b)=>a.d-b.d);
   for(const {actor,d}of ordered){
    const sample=actor.visualFootsteps;if(!sample)continue;
    const old=history.get(actor),arc=actor.state.walkDistance??0;
    const next={left:sample.left,right:sample.right,arc:old?.arc??arc};history.set(actor,next);
    const landing=old&&((old.left==='swing'&&sample.left!=='swing')||(old.right==='swing'&&sample.right!=='swing'));
    if(!enabled||d>distance||actor.state.visible===false||actor.state.talking||actor.state.socialTalking||!['Walk','StartWalk','StopWalk'].includes(sample.clip)||sample.speed<.1){next.arc=arc;continue;}
    if(!landing||arc-next.arc<.10*(actor.scale||1))continue;
    next.arc=arc;
    if(played<limit){play(actor.state.position,actor,{gain:Math.max(.12,.32*(1-d/distance))});played++;}
   }
   return played;
  },
 };
}
