import test from 'node:test';
import assert from 'node:assert/strict';
import { themes, themeById, filterThemes, scriptureUrl } from '../src/content.js';
import { readProgress, writeProgress, markStop, getTourStep } from '../src/progress.js';

test('search finds objects inside islands as well as theme names and scripture references', () => {
  assert(filterThemes({ query: '燈臺' }).some(t => t.id === 'tabernacle'));
  assert(filterThemes({ query: '出埃及記' }).some(t => t.id === 'exodus'));
  assert.equal(filterThemes({ query: '不在清單內的物件' }).length, 0);
  assert.equal(filterThemes({ query: '   ' }).length, 24);
});
test('era, testament and query filters are combined', () => {
  const results = filterThemes({ era: 'jesus', testament: 'new', query: '聖殿' });
  assert(results.length > 0);
  assert(results.every(t => t.era === 'jesus' && t.testament === 'new'));
  assert.equal(filterThemes({ era: 'church', testament: 'old' }).length, 0);
});
test('all learning journeys can advance to the end and stop at either boundary', () => {
  for (const theme of themes) {
    assert.equal(getTourStep(theme, 0, -1), 0);
    let step = 0;
    for (let i = 0; i < theme.stops.length + 2; i++) step = getTourStep(theme, step, 1);
    assert.equal(step, theme.stops.length - 1);
  }
});
test('progress records actual stops once without changing the previous state', () => {
  const original = { visited: [], stops: [], saved: ['solomon'] };
  let progress = markStop(original, 'tabernacle', 'altar');
  progress = markStop(progress, 'tabernacle', 'altar');
  assert.deepEqual(original.stops, []);
  assert.deepEqual(progress.visited, ['tabernacle']);
  assert.deepEqual(progress.stops, ['tabernacle/altar']);
  assert.deepEqual(progress.saved, ['solomon']);
});
test('corrupt or unavailable browser storage never blocks reading', () => {
  for (const storage of [null, { getItem() { throw Error('blocked'); } }, { getItem() { return '{bad json'; } }]) {
    assert.deepEqual(readProgress(storage), { visited: [], stops: [], saved: [] });
  }
  assert.deepEqual(readProgress({ getItem() { return '{"visited":["paul",7],"stops":false,"saved":null}'; } }), { visited: ['paul'], stops: [], saved: [] });
  assert.equal(writeProgress(null, {}), false);
});
test('progress survives a round trip through storage', () => {
  let value; const storage = { getItem() { return value; }, setItem(key, v) { value = v; } };
  const progress = markStop({ visited: [], stops: [], saved: [] }, 'paul', 'ship');
  assert.equal(writeProgress(storage, progress), true);
  assert.deepEqual(readProgress(storage), progress);
});
test('scripture links preserve the requested book and select traditional Chinese', () => {
  const url = new URL(scriptureUrl(themeById.get('tabernacle').book));
  assert.equal(url.protocol, 'https:');
  assert.equal(url.searchParams.get('search'), 'Exodus 25-40');
  assert.equal(url.searchParams.get('version'), 'CUV');
});
test('every connection is navigable and every hotspot has a reading reference', () => {
  for (const theme of themes) {
    for (const c of theme.connections) assert(themeById.has(c.id));
    for (const stop of theme.stops) assert(stop.reference && stop.position.every(Number.isFinite));
  }
});
