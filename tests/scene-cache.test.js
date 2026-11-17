import test from 'node:test';
import assert from 'node:assert/strict';
import {createSceneCache} from '../src/scene-cache.js';
test('chapter revisits reuse recent scenes and release the least recently used skeleton population',()=>{
 const released=[],cache=createSceneCache(3),make=id=>()=>({id,dispose(){released.push(id);}}),a=cache.get('a',make('a'));
 cache.get('b',make('b'));cache.get('c',make('c'));assert.equal(cache.get('a',()=>{throw new Error('recreated');}),a);
 cache.get('d',make('d'));assert.deepEqual(released,['b']);assert.equal(cache.size,3);cache.dispose();assert.deepEqual(released,['b','c','a','d']);assert.equal(cache.size,0);cache.dispose();assert.equal(released.length,4);
});
test('a failed scene construction retains the usable cached scene and does not touch external progress',()=>{
 const cache=createSceneCache(1),progress={reading:['first-stop']};let released=0;const old=cache.get('old',()=>({dispose(){released++;}}));
 assert.throws(()=>cache.get('bad',()=>{throw new Error('load');}));assert.equal(cache.size,1);assert.equal(cache.get('old',()=>null),old);assert.equal(released,0);assert.deepEqual(progress,{reading:['first-stop']});cache.dispose();
});
