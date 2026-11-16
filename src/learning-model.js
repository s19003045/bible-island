import { themeById } from './content.js';
import { learningIslands, readingModes } from './learning-data.js';

export const LEARNING_KEY = 'bible-island:learning-modes:v1';
const bucket = () => ({ observed: [], inspected: [], completed: [], note: '' });
export const freshLearning = () => ({ mode: 'general', islands: {} });
export function learningTasks(island, mode) {
  if (!Object.hasOwn(learningIslands,island) || !Object.hasOwn(readingModes,mode)) return [];
  return mode === 'general' ? themeById.get(island).stops.map(stop => ({ ...stop, stop: stop.id })) : learningIslands[island][mode];
}
export const learningRecord = (data, island, mode) => data?.islands?.[island]?.[mode] || bucket();
export function activeLearning(data, island, mode, cursor) {
  const tasks = learningTasks(island, mode), record = learningRecord(data, island, mode);
  const task = tasks.find(t => t.id === cursor) || tasks.find(t => !record.completed.includes(t.id)) || tasks.at(-1);
  return { tasks, task, record, index: tasks.indexOf(task), done: tasks.filter(t => record.completed.includes(t.id)).length };
}
export function learningEvent(data, island, mode, event) {
  const tasks = learningTasks(island, mode), record = learningRecord(data, island, mode);
  const task = tasks.find(t => t.id === event.id);
  const result = (next = record, feedback = null) => ({ data: next === record ? data : { ...data, islands: { ...data.islands, [island]: { ...data.islands[island], [mode]: next } } }, feedback });
  if (!tasks.length) return result();
  const add = (key, id) => ({ ...record, [key]: [...new Set([...record[key], id])] });
  if (event.type === 'observe' && themeById.get(island).stops.some(s => s.id === event.id)) return result(add('observed', event.id));
  if (event.type === 'note' && mode === 'study') return result({ ...record, note: String(event.text || '').slice(0, 2000) });
  if (!task) return result();
  if (event.type === 'inspect' && mode === 'study') return result(add('inspected', task.id));
  if (event.type === 'read' && mode === 'general') {
    if (!record.observed.includes(task.stop)) return result(record, { kind: 'blocked', text: '先前往場景，看完這一幕再繼續。' });
    return result(add('completed', task.id), { kind: 'correct', text: '這一幕已記下，帶著問題繼續閱讀。' });
  }
  if (event.type !== 'answer' || mode === 'general') return result();
  if (record.completed.includes(task.id)) return result();
  const ready = mode === 'child' ? record.observed.includes(task.stop) : record.inspected.includes(task.id);
  if (!ready) return result(record, { kind: 'blocked', text: mode === 'child' ? '先按「前往觀察」，看看場景再回答。' : '先打開對讀資料，查看這項主張的依據與限制。' });
  const correct = event.choice === (mode === 'child' ? task.correct : task.kind);
  return correct ? result(add('completed', task.id), { kind: 'correct', text: mode === 'child' ? task.explanation : `${task.basis} ${task.limit}` })
    : result(record, { kind: 'retry', text: mode === 'child' ? `再觀察一次：${task.hint}` : `再想想這項主張的依據。${task.limit}` });
}
export function readLearning(storage) {
  const clean = freshLearning();
  try {
    const saved = JSON.parse(storage?.getItem(LEARNING_KEY) || '{}');
    if (Object.hasOwn(readingModes,saved?.mode)) clean.mode = saved.mode;
    for (const island of Object.keys(learningIslands)) for (const mode of Object.keys(readingModes)) {
      const source = saved?.islands?.[island]?.[mode]; if (!source) continue;
      const ids = learningTasks(island, mode).map(t => t.id), stops = themeById.get(island).stops.map(s => s.id);
      const valid = (key, allowed) => Array.isArray(source[key]) ? [...new Set(source[key].filter(id => allowed.includes(id)))] : [];
      clean.islands[island] ||= {};
      clean.islands[island][mode] = { observed: valid('observed', stops), inspected: valid('inspected', ids), completed: valid('completed', ids), note: typeof source.note === 'string' ? source.note.slice(0, 2000) : '' };
    }
  } catch { /* Storage is optional, as with existing exploration progress. */ }
  return clean;
}
export function writeLearning(storage, data) {
  try { storage.setItem(LEARNING_KEY, JSON.stringify(data)); return true; } catch { return false; }
}

export function personForMode(person, island, mode) {
  if (!person || mode !== 'child' || !learningIslands[island]) return person;
  const task = learningIslands[island].child.find(t => t.actor === person.id);
  if (!task) return person;
  const stop = themeById.get(island).stops.find(s => s.id === task.stop);
  return { ...person, greeting: task.greeting || `一起看看「${stop.name}」吧。先找物件，再說說你發現了什麼。`, topics: [{
    id: `observe-${task.id}`, question: `觀察${stop.name}時，我該注意什麼？`, answer: task.hint,
    reference: stop.reference, passage: stop.reference, stop: stop.id,
    followup: { question: '可以再給我一個提示嗎？', answer: task.followup || `${stop.child} 看過之後，回到觀察任務試著回答。` },
  }] };
}
