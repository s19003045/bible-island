import { icon } from './icons.js';
import { themeById } from './content.js';
import { historicalScenes } from './historical-data.js';
import { scriptureReferences, sourceMarkup } from './scripture-ui.js';
import { readingModes, learningIslands, evidenceKinds } from './learning-data.js';
import { activeLearning } from './learning-model.js';

export const escapeLearning = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const learningKey = state => `${state.selected}:${state.mode}`;
export const currentLearning = state => activeLearning(state.learning, state.selected, state.mode, state.learningCursor?.[learningKey(state)]);
export function modeStatus(mode) {
  const m = readingModes[mode];
  return `<div class="learning-mode-status">${icon(m.icon, 14)}<strong>${m.name}</strong><span>${m.title}</span></div>`;
}
const voiceControls = () => `<div class="learning-voice"><button data-read-learning>${icon('volume', 14)}朗讀這段</button><button id="stop-learning-speech" hidden>停止朗讀</button><span id="learning-speech-status" role="status"></span></div>`;

export function learningPanel(state, theme) {
  const mode = readingModes[state.mode], config = learningIslands[theme.id];
  if (state.actor) return '';
  if (!config) return `<section class="learning-panel learning-basic"><span class="learning-eyebrow">${mode.name}</span><h3>${mode.title}</h3><p>本島可切換文字導讀。完整觀察任務、故事流程與對讀工作台，已在八座詳細島嶼開放。</p><button data-learning-island="tabernacle" class="learning-primary">到摩西會幕體驗 ${icon('arrow', 15)}</button></section>`;
  const { task, tasks, record, done, index } = currentLearning(state);
  const stop = theme.stops.find(s => s.id === task.stop), complete = record.completed.includes(task.id);
  const feedback = state.learningFeedback?.key === learningKey(state) && state.learningFeedback.id === task.id ? state.learningFeedback : null;
  const heading = state.mode === 'child' ? '觀察任務' : state.mode === 'study' ? '對讀工作台' : '故事導覽';
  const nav = `<div class="learning-step-list" role="group" aria-label="${heading}步驟">${tasks.map((t, i) => `<button data-learning-step="${t.id}" aria-label="${heading} ${i + 1}：${theme.stops.find(s => s.id === t.stop).name}${record.completed.includes(t.id) ? '，已完成' : ''}" ${t.id === task.id ? 'aria-current="step"' : ''}><span>${record.completed.includes(t.id) ? icon('check', 12) : i + 1}</span></button>`).join('')}<small>${done} / ${tasks.length} 已完成</small></div>`;
  let body;
  if (state.mode === 'child') {
    const observed = record.observed.includes(task.stop);
    body = `<h4>${escapeLearning(task.question)}</h4><p class="learning-instruction">${observed ? '已帶你走近場景，現在可以回答。需要時，請人物給你提示。' : '先走近物件看看，再試著回答。不計時，也不扣分。'}</p><div class="learning-actions"><button class="learning-primary" data-learning-go="${task.stop}">${icon('eye', 15)}${observed ? '再看一次' : '前往觀察'}</button><button data-learning-person="${task.actor}">${icon('chat', 15)}請人物提示</button></div><fieldset class="learning-options" ${!observed || complete ? 'disabled' : ''}><legend>你發現了什麼？</legend>${task.options.map((option, i) => `<button data-learning-answer="${i}" ${complete && i === task.correct ? 'class="chosen-correct"' : ''}>${escapeLearning(option)}</button>`).join('')}</fieldset>${complete ? `<div class="learning-success" role="status"><strong>${icon('check', 15)}你找到了</strong><p>${escapeLearning(task.explanation)}</p></div>` : feedback ? feedbackMarkup(feedback) : ''}${complete && done < tasks.length ? '<button class="learning-primary learning-next" data-learning-next>繼續下一個任務 →</button>' : ''}${done === tasks.length ? '<p class="learning-finished">三個觀察都完成了！和同行的人說說：哪一件物品幫你更懂這段故事？</p>' : ''}`;
  } else if (state.mode === 'general') {
    const observed = record.observed.includes(task.stop);
    body = `<p class="learning-opening">${escapeLearning(config.opening)}</p><h4>第 ${index + 1} 幕 · ${stop.name}</h4><button class="learning-primary" data-learning-go="${task.stop}">${icon('compass', 15)}${observed ? '再看這一幕' : '看這一幕'}</button>${observed ? `<p class="learning-story">${escapeLearning(stop.summary)}</p><div class="learning-reflection"><strong>帶著一個問題閱讀</strong><p>${escapeLearning(stop.question)}</p></div>${scriptureReferences(stop.reference)}${!complete ? `<button class="learning-primary learning-next" data-learning-read>${index === tasks.length - 1 ? '讀完這段，完成導覽' : '讀完這段，前往下一幕'} ${icon('arrow', 15)}</button>` : '<p class="learning-finished">這一幕已讀過，可以重讀或選擇其他一幕。</p>'}` : '<p class="learning-instruction">鏡頭會帶你走近這一幕，接著顯示導讀與經文。</p>'}${done === tasks.length ? `<div class="learning-success"><strong>這段導覽已完成</strong><p>${escapeLearning(config.closing)}</p></div>` : ''}`;
  } else {
    const inspected = record.inspected.includes(task.id);
    body = `<h4>如何判讀這項主張？</h4><blockquote>${escapeLearning(task.claim)}</blockquote><div class="learning-actions"><button class="learning-primary" data-learning-source>${icon('book', 15)}${inspected ? '重新對讀資料' : '打開對讀資料'}</button><button data-learning-go="${task.stop}">${icon('eye', 15)}看場景</button></div><p class="learning-instruction">${inspected ? '已打開資料。請依這項主張的依據分類；開啟資料不代表結論已被證實。' : '先核對資料與限制，再判斷依據的性質。'}</p><fieldset class="learning-options study-options" ${!inspected || complete ? 'disabled' : ''}><legend>這項主張應如何標示？</legend>${Object.entries(evidenceKinds).map(([kind, label]) => `<button data-learning-answer="${kind}" ${complete && kind === task.kind ? 'class="chosen-correct"' : ''}>${label}</button>`).join('')}</fieldset>${complete ? `<div class="learning-success"><strong>${task.kind==='reconstruction'?'資料不足，不能當作已確定史實':evidenceKinds[task.kind]+' · 已記下判讀'}</strong><p>${escapeLearning(task.limit)}</p></div>` : feedback ? feedbackMarkup(feedback) : ''}<div class="learning-study-tools"><button data-learning-view="plan">${icon('layers', 14)}俯視與方位</button><button data-learning-view="human">${icon('footprints', 14)}人物尺度</button><button data-learning-compare>${icon('columns', 14)}跨場景比較</button></div><label class="learning-note-label" for="learning-note">我的對讀札記</label><textarea id="learning-note" rows="3" maxlength="2000" placeholder="哪個細節有依據？哪一點仍需保留？">${escapeLearning(record.note)}</textarea><small id="learning-note-status">只保存在目前瀏覽器，不會上傳。</small>${complete && done < tasks.length ? '<button class="learning-primary learning-next" data-learning-next>對讀下一項 →</button>' : ''}${done === tasks.length ? '<p class="learning-finished">三項判讀已完成；可繼續對照經文，或補充自己的觀察。</p>' : ''}`;
  }
  return `<section class="learning-panel learning-${state.mode}" aria-label="${heading}"><div class="learning-panel-head"><span class="learning-eyebrow">${heading}</span><span>${index + 1} / ${tasks.length}</span></div><h3 id="learning-heading" tabindex="-1">${mode.title}</h3><p class="learning-description">${mode.description}</p>${nav}${body}${voiceControls()}</section>`;
}
function feedbackMarkup(feedback) { return `<p class="learning-feedback ${feedback.kind}" role="status">${escapeLearning(feedback.text)}</p>`; }

export function learningSourceModal(state) {
  const { task } = currentLearning(state), scene = historicalScenes[state.selected];
  return `<h2 id="modal-title">對讀資料<span>${themeById.get(state.selected).name} · ${themeById.get(state.selected).stops.find(s => s.id === task.stop).name}</span></h2><blockquote class="study-claim">${escapeLearning(task.claim)}</blockquote><div class="source-note"><strong>可核對的依據</strong><p>${escapeLearning(task.basis)}</p></div><div class="source-note"><strong>推論的界線</strong><p>${escapeLearning(task.limit)}</p></div><h3>尺度與方位</h3><p>${scene.scale}</p><ul class="study-facts">${scene.facts.map(f => `<li>${escapeLearning(f)}</li>`).join('')}</ul><p class="modal-small">建築以公尺建模；涉及肘長的換算採 1 肘 = 0.45 m，屬本版建模約定。成人以 1.70 m 作參照，不代表當時所有人的身高。</p><h3>相關經文 · YouVersion CSBT</h3>${scriptureReferences(task.reference)}<h3>來源與研究脈絡</h3>${scene.sources.map(sourceMarkup).join('')}<p class="modal-small">讀完後關閉視窗，回到工作台記下你的判讀。</p>`;
}
export function learningComparison(state) {
  const ids = [state.selected, learningIslands[state.selected].compare];
  return `<h2 id="modal-title">把場景放在一起讀<span>相似的物件，也要分清時代與依據</span></h2><div class="learning-comparison">${ids.map(id => { const theme = themeById.get(id), scene = historicalScenes[id]; return `<section><h3>${theme.name}</h3><p class="comparison-period">${theme.period}</p><dl><dt>尺度參照</dt><dd>${scene.scale}</dd><dt>觀察重點</dt><dd>${scene.facts.map(f => `<p>${escapeLearning(f)}</p>`).join('')}</dd><dt>復原界線</dt><dd>${escapeLearning(scene.limits)}</dd></dl><h4>回到經文</h4>${scriptureReferences(theme.book)}</section>`; }).join('')}</div>`;
}

export function learningReadText(state) {
  const theme = themeById.get(state.selected), config = learningIslands[state.selected];
  if (!config) return '';
  const { task, record } = currentLearning(state), stop = theme.stops.find(s => s.id === task.stop);
  if (state.mode === 'child') return `${task.question}。${record.completed.includes(task.id) ? task.explanation : task.hint}`;
  if (state.mode === 'study') return `${task.claim}。${record.inspected.includes(task.id) ? `${task.basis}。${task.limit}` : '請先打開對讀資料，查核依據與限制。'}`;
  return record.observed.includes(task.stop) ? `${stop.name}。${stop.summary}。${stop.question}` : config.opening;
}
