import assert from 'node:assert/strict';
import { themes, themeById, eras, evidenceLabels } from '../src/content.js';

assert.equal(themes.length, 24, 'The first release has 24 authored themes.');
assert.equal(new Set(themes.map(t => t.id)).size, themes.length, 'Theme IDs must be unique.');
assert.equal(new Set(themes.map(t => t.number)).size, themes.length, 'Display numbers must be unique.');
for (const theme of themes) {
  assert(eras.some(e => e.id === theme.era), `Unknown era: ${theme.id}`);
  assert(theme.stops.length >= 3, `A theme needs at least 3 learning stops: ${theme.id}`);
  assert.equal(new Set(theme.stops.map(s => s.id)).size, theme.stops.length, `Duplicate stop: ${theme.id}`);
  assert(theme.reference && theme.context && theme.book && theme.intro, `Missing context: ${theme.id}`);
  for (const stop of theme.stops) {
    assert(stop.reference && stop.summary && stop.child && stop.study, `Incomplete learning stop: ${theme.id}/${stop.id}`);
    assert(evidenceLabels[stop.evidence], `Unknown evidence level: ${theme.id}/${stop.id}`);
    assert(stop.position.length === 3 && stop.position.every(Number.isFinite), `Invalid hotspot position: ${theme.id}/${stop.id}`);
  }
  for (const edge of theme.connections) {
    assert(themeById.has(edge.id), `Broken relationship: ${theme.id} → ${edge.id}`);
    assert(edge.id !== theme.id, `Self relationship: ${theme.id}`);
  }
}
console.log(`Content checked: ${themes.length} themes, ${themes.reduce((n,t) => n+t.stops.length, 0)} stops, all relationships valid.`);
