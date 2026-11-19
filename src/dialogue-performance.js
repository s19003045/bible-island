const gestures={hills:'landscape',courtyard:'surroundings',vessels:'measure',water:'vessel',market:'offer',greeting:'greet'};

// Text delivery and real voice playback are separate. Muted text may get a
// brief explanatory gesture, but never pretends that recorded audio is playing.
export function beginDialogueLine(actor,text,topic='greeting') {
  actor.state.dialogueCue={topic,gesture:gestures[topic]||'explain',elapsed:0,
    duration:Math.max(2,Math.min(7,Array.from(text||'').length*.065)),
    mode:'responding',voice:{recorded:false,reading:false},vocal:false};
}
export function setDialogueVoice(actor,channel,active) {
  if(!['recorded','reading'].includes(channel)||!actor.state.talking)return;
  const cue=actor.state.dialogueCue;if(!cue)return;
  const wasVocal=cue.vocal;cue.voice[channel]=!!active;cue.vocal=Object.values(cue.voice).some(Boolean);
  if(wasVocal&&!cue.vocal)cue.elapsed=Math.max(cue.elapsed,cue.duration);
  cue.mode=cue.vocal?'speaking':cue.elapsed<cue.duration?'responding':'listening';
}
export function advanceDialogue(actor,dt) {
  const cue=actor.state.dialogueCue;if(!cue||dt<=0)return;
  if(!actor.state.talking){delete actor.state.dialogueCue;return;}
  cue.elapsed+=dt;cue.mode=cue.vocal?'speaking':cue.elapsed<cue.duration?'responding':'listening';
}
