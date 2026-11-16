import test from 'node:test';
import assert from 'node:assert/strict';
import { themeById } from '../src/content.js';
import { peopleByIsland } from '../src/people-data.js';
import { historicalScenes } from '../src/historical-data.js';
import { scriptureLinks } from '../src/scripture.js';
import { readingModes, learningIslands, evidenceKinds } from '../src/learning-data.js';
import { LEARNING_KEY, freshLearning, learningEvent, learningRecord, readLearning, writeLearning, learningTasks, activeLearning, personForMode } from '../src/learning-model.js';
import { learningPanel, learningReadText, learningSourceModal, learningComparison } from '../src/learning-ui.js';
import { peopleMarkup } from '../src/people-ui.js';
import { walkMarkup } from '../src/walk-ui.js';
import { freshMission } from '../src/walk-data.js';
import { createReadingSpeech } from '../src/reading-speech.js';

test('all five priority islands have three sourced observations, three inquiries and valid characters', () => {
  assert.deepEqual(Object.keys(learningIslands).sort(), Object.keys(historicalScenes).sort());
  for (const [id, definition] of Object.entries(learningIslands)) {
    const theme = themeById.get(id), stops = theme.stops.map(s => s.id);
    assert.equal(definition.child.length, 3); assert.equal(definition.study.length, 3);
    assert.ok(learningIslands[definition.compare]);
    for (const task of definition.child) {
      assert.ok(stops.includes(task.stop)); assert.ok(peopleByIsland[id].some(p => p.id === task.actor));
      assert.equal(task.options.length, 3); assert.ok(task.options[task.correct]);
      assert.ok(task.hint && task.explanation);
    }
    for (const inquiry of definition.study) {
      assert.ok(stops.includes(inquiry.stop)); assert.ok(Object.hasOwn(evidenceKinds, inquiry.kind));
      assert.ok(scriptureLinks(inquiry.reference).every(link => link.url.endsWith('.CSBT')));
      assert.ok(inquiry.basis && inquiry.limit);
    }
  }
});

test('child tasks require observing, keep wrong answers retryable, and complete once with explanatory feedback', () => {
  for (const [island, config] of Object.entries(learningIslands)) {
    let data = freshLearning();
    for (const task of config.child) {
      let result = learningEvent(data, island, 'child', { type: 'answer', id: task.id, choice: task.correct });
      assert.equal(result.feedback.kind, 'blocked'); assert.deepEqual(result.data, data);
      data = learningEvent(data, island, 'child', { type: 'observe', id: task.stop }).data;
      result = learningEvent(data, island, 'child', { type: 'answer', id: task.id, choice: (task.correct + 1) % 3 });
      assert.equal(result.feedback.kind, 'retry'); assert.equal(learningRecord(result.data, island, 'child').completed.includes(task.id), false);
      result = learningEvent(result.data, island, 'child', { type: 'answer', id: task.id, choice: task.correct });
      assert.equal(result.feedback.kind, 'correct'); assert.equal(result.feedback.text, task.explanation);
      data = learningEvent(result.data, island, 'child', { type: 'answer', id: task.id, choice: task.correct }).data;
    }
    assert.equal(learningRecord(data, island, 'child').completed.length, 3);
    assert.equal(learningRecord(data, island, 'study').completed.length, 0);
    assert.equal(learningRecord(data, island, 'general').completed.length, 0);
  }
});

test('general stories require an explicit read after scene observation and advance through the complete route', () => {
  for (const island of Object.keys(learningIslands)) {
    let data = freshLearning();
    for (const task of learningTasks(island, 'general')) {
      assert.equal(activeLearning(data, island, 'general').task.id, task.id);
      assert.equal(learningEvent(data, island, 'general', { type: 'read', id: task.id }).feedback.kind, 'blocked');
      data = learningEvent(data, island, 'general', { type: 'observe', id: task.stop }).data;
      assert.equal(learningRecord(data, island, 'general').completed.includes(task.id), false);
      data = learningEvent(data, island, 'general', { type: 'read', id: task.id }).data;
    }
    assert.equal(activeLearning(data, island, 'general').done, themeById.get(island).stops.length);
  }
});

test('study separates viewing sources from reaching a supported conclusion, preserving notes and other modes', () => {
  let data = freshLearning(); const island = 'tabernacle', task = learningIslands[island].study[0];
  assert.equal(learningEvent(data, island, 'study', { type: 'answer', id: task.id, choice: task.kind }).feedback.kind, 'blocked');
  data = learningEvent(data, island, 'study', { type: 'inspect', id: task.id }).data;
  assert.deepEqual(learningRecord(data, island, 'study').completed, []);
  assert.equal(learningEvent(data, island, 'study', { type: 'answer', id: task.id, choice: 'research' }).feedback.kind, 'retry');
  data = learningEvent(data, island, 'study', { type: 'answer', id: task.id, choice: task.kind }).data;
  const original = data;
  data = learningEvent(data, island, 'study', { type: 'note', text: '肘長換算應與經文肘數分開。' }).data;
  assert.equal(learningRecord(original, island, 'study').note, '');
  assert.equal(learningRecord(data, island, 'study').note, '肘長換算應與經文肘數分開。');
  assert.deepEqual(learningRecord(data, 'solomon', 'study').completed, []);
  assert.deepEqual(learningRecord(data, island, 'child').completed, []);
});

test('mode preference and independent progress survive storage, while corrupt or unavailable storage stays usable', () => {
  let value; const storage = { getItem(key) { assert.equal(key, LEARNING_KEY); return value; }, setItem(key, text) { assert.equal(key, LEARNING_KEY); value = text; } };
  let data = { ...freshLearning(), mode: 'child' };
  data = learningEvent(data, 'tabernacle', 'child', { type: 'observe', id: 'basin' }).data;
  data = learningEvent(data, 'tabernacle', 'child', { type: 'answer', id: 'basin', choice: 0 }).data;
  assert.equal(writeLearning(storage, data), true); assert.deepEqual(readLearning(storage), data);
  for (const bad of [null, { getItem() { throw Error('blocked'); } }, { getItem() { return 'bad json'; } }, { getItem() { return 'null'; } }]) assert.deepEqual(readLearning(bad), freshLearning());
  value = JSON.stringify({ mode: '__proto__', islands: { tabernacle: { child: { observed: ['basin', 'wrong'], completed: ['basin', 'wrong', 'basin'], note: 17 } } } });
  const recovered = readLearning(storage); assert.equal(recovered.mode, 'general');
  assert.deepEqual(learningRecord(recovered, 'tabernacle', 'child').completed, ['basin']);
  assert.deepEqual(learningRecord(recovered, 'tabernacle', 'child').observed, ['basin']);
  assert.equal(writeLearning(null, data), false);
});

test('every child character has a distinct observation dialogue; general and study keep the sourced original dialogue', () => {
  for (const [island, people] of Object.entries(peopleByIsland)) for (const person of people) {
    const child = personForMode(person, island, 'child');
    assert.notEqual(child.greeting, person.greeting); assert.equal(child.topics.length, 1);
    assert.ok(scriptureLinks(child.topics[0].passage).length > 0);
    assert.ok(child.topics[0].followup.answer);
    assert.equal(personForMode(person, island, 'general'), person);
    assert.equal(personForMode(person, island, 'study'), person);
    const study = peopleMarkup({ selected: island, actor: person.id, mode: 'study', dialogue: [person.topics[0]] });
    assert.ok(study.includes('研讀旁註 · 非角色發言'));
    assert.ok(study.includes('data-study-stop'));
  }
});

test('mode panels provide different actions immediately, preserve safe notes and expose CSBT sources', () => {
  for (const selected of Object.keys(learningIslands)) {
    const theme = themeById.get(selected), base = { selected, learning: freshLearning(), learningCursor: {}, actor: null };
    const child = learningPanel({ ...base, mode: 'child' }, theme);
    const general = learningPanel({ ...base, mode: 'general' }, theme);
    const study = learningPanel({ ...base, mode: 'study' }, theme);
    assert.match(child, /前往觀察/); assert.match(child, /請人物提示/); assert.match(child, /<fieldset[^>]+disabled/);
    assert.match(general, /看這一幕/); assert.doesNotMatch(general, /data-learning-answer/);
    assert.match(study, /打開對讀資料/); assert.match(study, /跨場景比較/); assert.match(study, /learning-note/);
    const source = learningSourceModal({ ...base, mode: 'study' });
    assert.match(source, /推論的界線/); assert.match(source, /bible\/312\//);
    assert.ok(learningComparison({ ...base, mode: 'study' }).includes(themeById.get(learningIslands[selected].compare).name));
  }
  const selected = 'tabernacle';
  const data = learningEvent(freshLearning(), selected, 'study', { type: 'note', text: '</textarea><script>alert(1)</script>' }).data;
  const markup = learningPanel({ selected, mode: 'study', learning: data }, themeById.get(selected));
  assert.ok(markup.includes('&lt;script&gt;')); assert.ok(!markup.includes('<script>'));
  assert.match(learningPanel({ selected: 'paul', mode: 'child' }, themeById.get('paul')), /已在六座詳細島嶼開放/);
});

test('spoken guidance follows the current mode and never exposes a hidden task answer as a different recorded line', () => {
  const base = { selected: 'tabernacle', learning: freshLearning() };
  const child = learningReadText({ ...base, mode: 'child' }), general = learningReadText({ ...base, mode: 'general' }), study = learningReadText({ ...base, mode: 'study' });
  assert.notEqual(child, general); assert.notEqual(study, child); assert.match(study, /先打開對讀資料/);
  assert.ok(child.includes(learningIslands.tabernacle.child[0].hint));
  const data = learningEvent(base.learning, base.selected, 'study', { type: 'inspect', id: 'altar' }).data;
  assert.ok(learningReadText({ ...base, mode: 'study', learning: data }).includes(learningIslands.tabernacle.study[0].limit));
});

test('free walking in child and study modes gives a return path instead of an incompatible legacy mission', () => {
  for (const mode of ['child', 'study']) {
    const markup = walkMarkup({ mode, mission: freshMission(), soundEnabled: false });
    assert.match(markup, /id="walk-learning-return"/); assert.doesNotMatch(markup, /id="walk-guide"/);
    assert.ok(markup.includes(readingModes[mode].name));
  }
  assert.match(walkMarkup({ mode: 'general', mission: freshMission() }), /id="walk-guide"/);
});

test('optional speech selects Chinese, cancels previous speech, ignores stale callbacks and reports unavailable voices', () => {
  const events = [], spoken = []; let cancelled = 0;
  const host = { speechSynthesis: { getVoices: () => [{ lang: 'en-US' }, { lang: 'zh-TW' }], speak: cue => spoken.push(cue), cancel: () => cancelled++ }, SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } } };
  const speech = createReadingSpeech(event => events.push(event), host);
  assert.equal(speech.read('先觀察洗濯盆。'), true); assert.equal(spoken[0].lang, 'zh-TW');
  speech.read('再看燈臺。'); assert.equal(cancelled, 1); assert.equal(spoken[1].text, '再看燈臺。');
  spoken[0].onend(); assert.equal(events.at(-1).status, 'speaking');
  speech.stop(); assert.equal(cancelled, 2); spoken[1].onstart(); assert.equal(events.at(-1).status, 'idle');
  const unavailable = createReadingSpeech(event => events.push(event), {});
  assert.equal(unavailable.read('文字'), false); assert.equal(events.at(-1).status, 'unavailable');
  host.speechSynthesis.getVoices = () => [{ lang: 'en-US' }];
  assert.equal(createReadingSpeech(event => events.push(event), host).read('中文'), false);
});
