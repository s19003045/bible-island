import test from 'node:test';
import assert from 'node:assert/strict';
import {beginDialogueLine,setDialogueVoice,advanceDialogue} from '../src/dialogue-performance.js';

test('a silent response gestures briefly then listens, without asserting speech playback',()=>{
  const actor={state:{talking:true}};beginDialogueLine(actor,'留意山城的地勢。','hills');
  assert.equal(actor.state.dialogueCue.gesture,'landscape');assert.equal(actor.state.dialogueCue.vocal,false);
  advanceDialogue(actor,1);assert.equal(actor.state.dialogueCue.mode,'responding');
  const before=JSON.stringify(actor.state);advanceDialogue(actor,0);assert.equal(JSON.stringify(actor.state),before);
  advanceDialogue(actor,10);assert.equal(actor.state.dialogueCue.mode,'listening');
});
test('actual recorded and browser voices own their own playback state; stopping the last returns to listening',()=>{
  const actor={state:{talking:true}};beginDialogueLine(actor,'觀察器皿。','vessels');
  setDialogueVoice(actor,'recorded',true);advanceDialogue(actor,20);assert.equal(actor.state.dialogueCue.mode,'speaking');
  setDialogueVoice(actor,'reading',true);setDialogueVoice(actor,'recorded',false);assert.equal(actor.state.dialogueCue.vocal,true);
  setDialogueVoice(actor,'reading',false);assert.equal(actor.state.dialogueCue.mode,'listening');assert.equal(actor.state.dialogueCue.vocal,false);
  beginDialogueLine(actor,'另一個問題。','courtyard');assert.equal(actor.state.dialogueCue.elapsed,0);assert.equal(actor.state.dialogueCue.gesture,'surroundings');
  actor.state.talking=false;advanceDialogue(actor,.1);assert.equal(actor.state.dialogueCue,undefined);
});
