import test from 'node:test';
import assert from 'node:assert/strict';
import {createInspectionRuntime} from '../src/inspection-runtime.js';

test('reopening multiple artifact views reuses the expensive context and cleans each view once',()=>{
  let creates=0,disposes=0,oneClosed=0,twoClosed=0;
  const pool=createInspectionRuntime(generation=>({generation,dispose(){disposes++;},renderer:++creates}));
  const first=pool.acquire(()=>oneClosed++);first.release();first.release();
  const second=pool.acquire(()=>twoClosed++);assert.equal(second.resource,first.resource);assert.equal(creates,1);assert.equal(oneClosed,1);assert.equal(disposes,0);
  pool.dispose();pool.dispose();second.release();assert.equal(twoClosed,1);assert.equal(disposes,1);
  const third=pool.acquire();assert.equal(creates,2);assert.equal(third.generation,2);pool.dispose();assert.equal(disposes,2);
});

test('replacing an active view cleans the old scene without disposing resources used by its replacement',()=>{
  const closed=[];let disposed=0;const pool=createInspectionRuntime(()=>({dispose(){disposed++;}}));
  const first=pool.acquire(()=>closed.push('one')),second=pool.acquire(()=>closed.push('two'));
  assert.deepEqual(closed,['one']);assert.equal(disposed,0);first.release();assert.deepEqual(closed,['one']);
  pool.dispose();second.release();assert.deepEqual(closed,['one','two']);assert.equal(disposed,1);
});

test('a failed renderer creation does not retain a broken instance and a later opening can recover',()=>{
  let count=0;const pool=createInspectionRuntime(()=>{if(!count++)throw new Error('context unavailable');return {dispose(){}};});
  assert.throws(()=>pool.acquire(),/context unavailable/);const next=pool.acquire();assert.ok(next.resource);pool.dispose();
});
