import './style.css';
import { themes, themeById, eras, sources, evidenceLabels, filterThemes, scriptureUrl } from './content.js';
import { readProgress, writeProgress, markStop, getTourStep } from './progress.js';
import { icon } from './icons.js';

let storage; try { storage = window.localStorage; } catch { storage = null; }
const state = { selected: null, stop: null, query: '', era: 'all', testament: 'all', mode: 'general',
  cutaway: false, labels: true, connections: true, paused: matchMedia('(prefers-reduced-motion: reduce)').matches,
  night: false, tour: false, visitedOnly: false, progress: readProgress(storage), worldReady: false };
let world = null, restoreFocus = null, toastTimer;
const $ = s => document.querySelector(s);
const number = n => String(n).padStart(2, '0');
const modes = { child: '親子探索', general: '一般閱讀', study: '深入研讀' };
const oldNew = t => t.testament === 'old' ? '舊約' : t.testament === 'new' ? '新約' : '時代背景';

$('#app').innerHTML = `
  <a class="skip-link" href="#theme-list">跳到主題清單</a>
  <header class="app-header">
    <a class="brand" href="#" aria-label="讀聖經順起來，回到群島全景"><span class="brand-mark">${icon('book', 29)}</span><span><strong>讀聖經順起來<span class="brand-dot">.</span></strong><small>BIBLE ISLAND <i>一段經文，一個世界</i></small></span></a>
    <nav class="header-nav" aria-label="主要導覽"><button class="nav-item active" id="explore-nav">${icon('compass', 17)}<span>群島探索</span></button><button class="nav-item" id="progress-nav">${icon('footprints', 17)}<span>我的足跡</span><b id="progress-count">0</b></button><button class="nav-item" id="about-nav">關於這趟旅程</button></nav>
    <div class="header-end"><label class="mode-picker">${icon('book', 17)}<select id="reading-mode" aria-label="閱讀模式"><option value="general">一般閱讀</option><option value="child">親子探索</option><option value="study">深入研讀</option></select></label><button class="icon-button help-button" id="help" aria-label="操作說明">?</button><button class="icon-button mobile-menu" id="menu" aria-label="開啟主題清單" aria-expanded="false">${icon('menu')}</button></div>
  </header>
  <main class="workspace">
    <aside class="atlas" id="atlas" aria-label="主題島清單">
      <div class="atlas-heading"><div class="eyebrow">THE BIBLICAL ATLAS <span>01 — 24</span></div><h1>探索聖經的世界<span>從一座島，讀懂一段經文。</span></h1>
      <div class="search-wrap">${icon('search', 17)}<input type="search" id="search" placeholder="搜尋主題、器物或經文" aria-label="搜尋主題、器物或經文" autocomplete="off"><kbd>/</kbd></div>
      <div class="testament-tabs" role="group" aria-label="聖經範圍"><button class="active" data-testament="all" aria-pressed="true">全部 <span>24</span></button><button data-testament="old" aria-pressed="false">舊約</button><button data-testament="new" aria-pressed="false">新約</button></div></div>
      <div class="list-caption"><span id="list-caption">主題群島</span><span id="result-count">24 座島嶼</span></div>
      <div class="theme-list" id="theme-list" tabindex="-1"></div>
      <div class="atlas-footer"><span class="tiny-sun">✦</span><p>讓經文裡的世界，<br>慢慢變得清晰。</p><button id="sources-button" aria-label="查看內容依據與來源">${icon('info', 16)}</button></div>
    </aside>
    <section class="map-layout" id="map-layout" aria-label="互動主題群島">
      <div id="stage"><div class="loading" id="loading"><span class="loading-book">${icon('book', 34)}</span><p>讓經文中的世界，慢慢浮現。</p><small>正在建立主題群島…</small></div></div>
      <div class="map-topbar"><div class="map-view-tabs"><button class="active" id="overview">${icon('compass', 16)}群島全景</button><button id="timeline-toggle" aria-pressed="false">${icon('clock', 16)}時代脈絡</button></div><span class="map-note">主題位置示意 · 非實際地圖</span></div>
      <div class="map-intro" id="map-intro"><div class="eyebrow"><span></span> WALK INTO THE WORD</div><h2>跨越時空，<br>走進經文<span>。</span></h2><p>從曠野的一座帳幕，<br>到地中海的一葉帆船。<br>讓聖經的故事，在眼前展開。</p><button class="text-button" id="start-exploring">從摩西會幕出發 ${icon('arrow', 19)}</button></div>
      <div class="selected-breadcrumb" id="breadcrumb" hidden><button id="back-overview">群島全景</button><span>/</span><strong></strong></div>
      <div class="world-tools" role="toolbar" aria-label="場景控制"><button id="time-button" aria-label="切換夜晚" title="切換夜晚">${icon('sun')}</button><span></span><button id="labels-button" aria-label="顯示島嶼名稱" aria-pressed="true" title="島嶼名稱">${icon('eye')}</button><button id="connections-button" aria-label="顯示主題連線" aria-pressed="true" title="主題連線">${icon('route')}</button><button id="pause-button" aria-label="暫停環境動畫" aria-pressed="${state.paused}" title="暫停動畫">${icon(state.paused ? 'play' : 'pause')}</button><span></span><button id="top-button" aria-label="切換鳥瞰視角" title="鳥瞰視角">${icon('layers')}</button></div>
      <div class="zoom-tools"><button id="zoom-in" aria-label="放大">${icon('plus')}</button><button id="zoom-out" aria-label="縮小">${icon('minus')}</button><span></span><button id="home-button" aria-label="回到群島全景">${icon('home', 18)}</button></div>
      <div class="compass-rose" aria-hidden="true"><span>N</span><svg viewBox="0 0 50 50"><path d="m25 5 6 20-6 20-6-20Z" fill="currentColor"/><path d="m5 25 20-6 20 6-20 6Z" fill="currentColor" opacity=".4"/></svg><small>EXPLORE</small></div>
      <div class="timeline" id="timeline" hidden><div><span class="eyebrow">FOLLOW THE STORY</span><p>沿著時代，找到故事的位置。</p></div><div class="era-buttons">${eras.map(e => `<button data-era="${e.id}" class="${e.id === 'all' ? 'active' : ''}" aria-pressed="${e.id === 'all'}"><i></i>${e.name}</button>`).join('')}</div></div>
      <div class="journey-card" id="journey-card"><span class="journey-art">${icon('archive', 25)}</span><div><span class="eyebrow">YOUR FIRST ISLAND</span><strong>從一座會幕，開始探索</strong><small>5 個探索點 · 出埃及記 25–40 章</small></div><button id="first-island" aria-label="探索摩西會幕">${icon('arrow', 21)}</button></div>
      <div class="map-footer"><span><i></i>${themes.length} 座主題島 <b>·</b> ${themes.reduce((n,t) => n + t.stops.length, 0)} 個探索點</span><span class="gesture-hint">拖曳旋轉 <b>·</b> 滾輪縮放 <b>·</b> 點選探索</span><button id="map-sources">經文與復原說明 ${icon('external', 12)}</button></div>
      <aside class="detail-panel" id="detail" aria-label="主題詳情" hidden></aside>
    </section>
  </main>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
  <dialog id="modal" class="modal" aria-labelledby="modal-title"><div class="modal-top"><span class="eyebrow">BIBLE ISLAND</span><button class="icon-button" id="modal-close" aria-label="關閉視窗">${icon('close')}</button></div><div id="modal-content"></div></dialog>
`;

function persist() { writeProgress(storage, state.progress); updateProgressCount(); }
function updateProgressCount() { $('#progress-count').textContent = state.progress.visited.length; }
function toast(text) { $('#toast').textContent = text; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3000); }
const mobileLayout = matchMedia('(max-width: 760px)');
function setAtlasOpen(open) { $('#atlas').classList.toggle('open', open); $('#menu').setAttribute('aria-expanded', open); $('#atlas').inert = mobileLayout.matches && !open; }
function closeAtlas() { setAtlasOpen(false); }
mobileLayout.addEventListener('change', () => { $('#atlas').inert = mobileLayout.matches && !$('#atlas').classList.contains('open'); });
closeAtlas();
function listThemes() {
  let list = filterThemes(state); if (state.visitedOnly) list = list.filter(t => state.progress.visited.includes(t.id) || state.progress.saved.includes(t.id));
  $('#result-count').textContent = `${list.length} 座島嶼`; $('#list-caption').textContent = state.visitedOnly ? '走過與收藏的島嶼' : state.query ? '搜尋結果' : state.era === 'all' ? '主題群島' : eras.find(e => e.id === state.era).name;
  $('#theme-list').innerHTML = list.length ? list.map(t => {
    const done = t.stops.filter(s => state.progress.stops.includes(`${t.id}/${s.id}`)).length;
    return `<button class="theme-row ${state.selected === t.id ? 'selected' : ''}" data-theme="${t.id}" aria-pressed="${state.selected === t.id}"><span class="theme-number">${number(t.number)}</span><span class="theme-row-copy"><strong>${t.name}</strong><small>${t.subtitle}</small></span><span class="theme-row-end">${done ? `<small>${done}/${t.stops.length}</small>` : `<i class="testament-dot ${t.testament}"></i>`}${icon('chevron', 13)}</span></button>`;
  }).join('') : `<div class="empty-state">${icon(state.visitedOnly ? 'footprints' : 'search', 30)}<strong>${state.visitedOnly ? '每段旅程，都從第一步開始。' : '還沒有找到這座島。'}</strong><p>${state.visitedOnly ? '探索一座島或收藏主題，就會在這裡留下足跡。' : '試試「會幕」「漁船」或「出埃及記」。'}</p><button id="reset-filters">${state.visitedOnly ? '開始探索' : '清除篩選'}</button></div>`;
  $('#reset-filters')?.addEventListener('click', resetFilters);
  world?.setVisible(list.map(t => t.id));
  return list;
}
function resetFilters() {
  state.query = ''; state.testament = 'all'; state.era = 'all'; state.visitedOnly = false; $('#search').value = '';
  updateFilters(); listThemes();
}
function updateFilters() {
  document.querySelectorAll('[data-testament]').forEach(b => { const active = b.dataset.testament === state.testament; b.classList.toggle('active', active); b.setAttribute('aria-pressed', active); });
  document.querySelectorAll('[data-era]').forEach(b => { const active = b.dataset.era === state.era; b.classList.toggle('active', active); b.setAttribute('aria-pressed', active); });
  $('#progress-nav').classList.toggle('active', state.visitedOnly); $('#explore-nav').classList.toggle('active', !state.visitedOnly);
}

function selectTheme(id, { updateHash = true } = {}) {
  const t = themeById.get(id); if (!t) return;
  if (!filterThemes(state).some(x => x.id === id) || state.visitedOnly) resetFilters();
  state.selected = id; state.stop = null; state.tour = false;
  state.progress.visited = [...new Set([...state.progress.visited, id])]; persist();
  $('#map-layout').classList.add('has-selection'); $('#map-intro').hidden = true; $('#journey-card').hidden = true;
  $('#breadcrumb').hidden = false; $('#breadcrumb strong').textContent = t.name;
  $('#detail').hidden = false; renderDetail(); listThemes(); closeAtlas();
  world?.select(id);
  if (updateHash) history.replaceState(null, '', `#island=${encodeURIComponent(id)}`);
  document.title = `${t.name} — 讀聖經順起來`;
}
function overview() {
  state.selected = null; state.stop = null; state.tour = false;
  $('#map-layout').classList.remove('has-selection'); $('#map-intro').hidden = false; $('#journey-card').hidden = false; $('#breadcrumb').hidden = true; $('#detail').hidden = true;
  resetFilters(); world?.home(); history.replaceState(null, '', location.pathname + location.search); document.title = '讀聖經順起來 — Bible Island';
}
function selectStop(id, { focus = true } = {}) {
  const t = themeById.get(state.selected), s = t?.stops.find(s => s.id === id); if (!s) return;
  state.stop = id; state.progress = markStop(state.progress, t.id, id); persist(); renderDetail(); listThemes();
  world?.focusStop(id);
  if (['tabernacle', 'solomon', 'herod'].includes(t.id) && ['lampstand', 'incense', 'ark', 'sanctuary', 'temple'].includes(id) && !state.cutaway) {
    state.cutaway = true; world?.setCutaway(true); updateCutawayButton();
  }
  if (focus) $('#stop-heading')?.focus({ preventScroll: true });
}
function updateCutawayButton() {
  const button = $('#cutaway-button'); if (!button) return; button.setAttribute('aria-pressed', state.cutaway); button.classList.toggle('active', state.cutaway);
  button.innerHTML = `${icon('layers', 16)}${state.cutaway ? '顯示完整屋頂' : '打開建築剖面'}`;
}
function renderDetail() {
  const t = themeById.get(state.selected); if (!t) return;
  const current = t.stops.find(s => s.id === state.stop), saved = state.progress.saved.includes(t.id);
  const done = t.stops.filter(s => state.progress.stops.includes(`${t.id}/${s.id}`)).length;
  const canCut = ['tabernacle', 'solomon', 'herod'].includes(t.id);
  const index = current ? t.stops.indexOf(current) : -1;
  $('#detail').innerHTML = `
    <div class="detail-sticky"><div class="detail-top"><span class="eyebrow">ISLAND ${number(t.number)} <i>/</i> ${oldNew(t)}</span><div><button class="icon-button ${saved ? 'saved' : ''}" id="save-theme" aria-label="${saved ? '取消收藏' : '收藏主題'}" aria-pressed="${saved}">${icon('bookmark', 18)}</button><button class="icon-button" id="close-detail" aria-label="返回群島全景">${icon('close', 20)}</button></div></div>
    <p class="detail-english">${t.english}</p><h2>${t.name}</h2><p class="detail-subtitle">${t.subtitle}</p><div class="detail-meta"><span>${icon('clock', 13)}${t.period}</span><span>${icon('compass', 13)}${t.stops.length} 個探索點</span></div></div>
    <div class="detail-scroll"><p class="detail-intro">${t.intro}</p><a class="scripture-link" href="${scriptureUrl(t.book)}" target="_blank" rel="noopener noreferrer">${icon('book', 17)}<span>${t.reference}<small>開啟經文，與場景一起閱讀</small></span>${icon('external', 14)}</a>
    <div class="detail-actions"><button class="primary-button" id="start-tour">${icon(state.tour ? 'compass' : 'play', 15)}${state.tour ? '重新開始導覽' : '跟著導覽走一趟'}<small>約 ${t.stops.length} 分鐘</small></button>${canCut ? '<button class="secondary-button" id="cutaway-button" aria-pressed="false"></button>' : ''}</div>
    ${current ? `<section class="stop-card" aria-labelledby="stop-heading"><div class="stop-card-top"><span>${state.tour ? '跟著導覽' : '正在探索'} ${number(index + 1)} / ${number(t.stops.length)}</span><button id="close-stop" aria-label="收合探索點">${icon('close', 15)}</button></div><h3 id="stop-heading" tabindex="-1">${icon(current.icon, 21)}${current.name}</h3><p class="stop-question">${current.question}</p><p>${state.mode === 'child' ? current.child : current.summary}</p>${state.mode === 'study' ? `<div class="study-note"><span>進一步觀察</span><p>${current.study}</p></div>` : ''}<a href="${scriptureUrl(current.reference)}" target="_blank" rel="noopener noreferrer" class="stop-reference">${icon('book', 14)}${current.reference}${icon('external', 12)}</a><button class="evidence-chip" id="stop-evidence">${icon('info', 12)}${evidenceLabels[current.evidence]}</button><div class="tour-navigation"><button id="previous-stop" ${index === 0 ? 'disabled' : ''}>上一站</button><span>${index + 1} / ${t.stops.length}</span><button id="next-stop">${index === t.stops.length - 1 ? '完成探索' : '下一站'}${icon(index === t.stops.length - 1 ? 'check' : 'arrow', 15)}</button></div></section>` : `<div class="guiding-question"><span>帶著一個問題出發</span><p>${t.question}</p></div>`}
    <div class="section-heading"><h3>這座島的探索點</h3><span>${done} / ${t.stops.length}</span></div><div class="stop-progress"><i style="width:${done / t.stops.length * 100}%"></i></div><div class="stop-list">${t.stops.map((s,i) => `<button data-stop="${s.id}" class="stop-row ${s.id === state.stop ? 'active' : ''}"><span>${state.progress.stops.includes(`${t.id}/${s.id}`) ? icon('check', 13) : number(i+1)}</span><strong>${s.name}<small>${s.reference}</small></strong>${icon('chevron', 14)}</button>`).join('')}</div>
    <div class="section-heading related-heading"><h3>從這裡，繼續閱讀</h3>${icon('route', 16)}</div><div class="related-list">${t.connections.map(c => { const other = themeById.get(c.id); return `<button class="related-row" data-related="${c.id}"><span class="related-number">${number(other.number)}</span><span><small>${c.type}</small><strong>${other.name}</strong></span>${icon('arrow', 16)}</button>`; }).join('')}</div>
    <button class="context-button" id="context-button">${icon('info', 15)}這個場景如何復原？${icon('chevron', 13)}</button><p class="detail-footnote">觀察場景 · 回到經文 · 連起故事</p></div>`;
  updateCutawayButton();
  $('#save-theme').onclick = () => { state.progress.saved = saved ? state.progress.saved.filter(id => id !== t.id) : [...state.progress.saved, t.id]; persist(); renderDetail(); toast(saved ? '已取消收藏' : `已收藏「${t.name}」`); };
  $('#close-detail').onclick = overview;
  $('#start-tour').onclick = () => { state.tour = true; selectStop(t.stops[0].id); };
  $('#cutaway-button')?.addEventListener('click', () => { state.cutaway = !state.cutaway; world?.setCutaway(state.cutaway); updateCutawayButton(); });
  document.querySelectorAll('[data-stop]').forEach(b => b.onclick = () => selectStop(b.dataset.stop));
  document.querySelectorAll('[data-related]').forEach(b => b.onclick = () => selectTheme(b.dataset.related));
  $('#context-button').onclick = () => openContext(t);
  if (current) {
    $('#close-stop').onclick = () => { state.stop = null; state.tour = false; renderDetail(); world?.select(t.id); };
    $('#previous-stop').onclick = () => selectStop(t.stops[getTourStep(t, index, -1)].id);
    $('#next-stop').onclick = () => {
      if (index < t.stops.length - 1) selectStop(t.stops[getTourStep(t, index, 1)].id);
      else { state.stop = null; state.tour = false; renderDetail(); world?.select(t.id); const remaining = t.stops.filter(s => !state.progress.stops.includes(`${t.id}/${s.id}`)).length; toast(remaining ? `已到最後一站，這座島還有 ${remaining} 個探索點可以閱讀。` : `已走完「${t.name}」的 ${t.stops.length} 個探索點，從相關主題繼續旅程。`); }
    };
    $('#stop-evidence').onclick = () => openContext(t, current);
    // Keep the current learning stop visible after changing reading modes or moving between steps.
    $('#detail .detail-scroll').scrollTop = 210;
  }
}

function openModal(content) {
  restoreFocus = document.activeElement; $('#modal-content').innerHTML = content;
  if (!$('#modal').open) $('#modal').showModal(); $('#modal-close').focus();
}
function closeModal() { $('#modal').close(); restoreFocus?.focus?.(); }
function openContext(t, stop) {
  openModal(`<h2 id="modal-title">${stop ? stop.name : t.name}<span>經文與復原說明</span></h2><p>${t.context}</p>${stop ? `<div class="source-note"><strong>${evidenceLabels[stop.evidence]} · ${stop.reference}</strong><p>${stop.study}</p></div>` : ''}<div class="evidence-legend">${Object.entries(evidenceLabels).map(([key,label]) => `<span class="evidence-${key}">${label}</span>`).join('')}</div><p class="modal-small">經文描述、考古參考、視覺復原與詮釋是不同層次的依據。模型用於協助閱讀，重要細節仍應對照經文與研究。</p><h3>延伸查閱</h3>${sources.map(s => `<a class="source-item" href="${s.url}" target="_blank" rel="noopener noreferrer"><strong>${s.title}${icon('external', 13)}</strong><p>${s.note}</p></a>`).join('')}`);
}
function showSources() { openContext(themeById.get(state.selected || 'tabernacle')); }
function showAbout() {
  openModal(`<h2 id="modal-title">一段經文，<br>一個可以走進的世界。</h2><p>「讀聖經順起來」是一座給兒童與成人的互動聖經群島。我們透過空間、器物與古代生活背景，幫助讀者跨越時空，重新回到經文。</p><div class="about-stats"><span><strong>24</strong>主題島嶼</span><span><strong>${themes.reduce((n,t) => n+t.stops.length, 0)}</strong>探索點</span><span><strong>3</strong>閱讀深度</span></div><h3>讓場景服務閱讀</h3><p>每座島都有經文入口、探索點與相關主題。閱讀模式可以隨時切換，親子提問、一般導讀與深入研讀共用同一個場景。</p><h3>理解模型的依據</h3><p>群島排列是主題示意，並非實際地理。建築、時間與生活物件的復原有不同確定程度，請使用「經文與復原說明」查看依據。</p><h3>你的足跡留在這裡</h3><p>探索與收藏只保存在目前瀏覽器，不需要帳號。清除瀏覽器資料後會重設，且不會跨裝置同步。本站未安裝使用者追蹤服務。</p><a class="source-item" href="https://github.com/s19003045/bible-island" target="_blank" rel="noopener noreferrer"><strong>查看 GitHub 專案 ${icon('external', 14)}</strong></a>`);
}
function showHelp() {
  openModal(`<h2 id="modal-title">準備好，出發吧。<span>讓我們一起走進經文</span></h2><ol class="help-steps"><li><span>01</span><div><strong>選一座主題島</strong><p>點地圖上的名稱或左側清單。也可以搜尋器物，例如「燈臺」。</p></div></li><li><span>02</span><div><strong>走近，看看細節</strong><p>拖曳旋轉、滾輪或雙指縮放。點數字探索點，鏡頭會帶你走近。建築可切換剖面。</p></div></li><li><span>03</span><div><strong>帶著問題回到經文</strong><p>使用導覽逐站探索，點經文連結閱讀全文，再從相關主題走向下一座島。</p></div></li></ol><div class="source-note"><strong>鍵盤也可以探索</strong><p>Tab 選擇控制項，Enter 啟動；按 / 搜尋、Esc 收合視窗或回到全景。在 3D 畫面聚焦時，左右方向鍵可旋轉。</p></div><p class="modal-small">不支援 3D 的裝置仍可透過清單閱讀全部主題。夜晚模式只改變場景光線，不代表某段事件發生的實際時間。</p>`);
}

$('#theme-list').onclick = e => { const b = e.target.closest('[data-theme]'); if (b) selectTheme(b.dataset.theme); };
$('#search').oninput = e => { state.query = e.target.value; listThemes(); };
document.querySelectorAll('[data-testament]').forEach(b => b.onclick = () => { state.testament = b.dataset.testament; updateFilters(); listThemes(); });
document.querySelectorAll('[data-era]').forEach(b => b.onclick = () => { state.era = b.dataset.era; updateFilters(); listThemes(); });
$('#reading-mode').onchange = e => { state.mode = e.target.value; renderDetail(); toast(`已切換為${modes[state.mode]}`); };
$('#overview').onclick = overview; $('#home-button').onclick = overview; $('#back-overview').onclick = overview;
$('.brand').onclick = e => { e.preventDefault(); overview(); };
$('#start-exploring').onclick = () => selectTheme('tabernacle'); $('#first-island').onclick = () => selectTheme('tabernacle');
$('#timeline-toggle').onclick = () => { const show = $('#timeline').hidden; $('#timeline').hidden = !show; $('#timeline-toggle').classList.toggle('active', show); $('#timeline-toggle').setAttribute('aria-pressed', show); $('#journey-card').classList.toggle('timeline-open', show); };
$('#time-button').onclick = () => { state.night = !state.night; world?.setTime(state.night); $('#time-button').innerHTML = icon(state.night ? 'moon' : 'sun'); $('#time-button').setAttribute('aria-label', state.night ? '切換白天' : '切換夜晚'); document.body.classList.toggle('night', state.night); };
for (const [button, key, method] of [['labels-button','labels','setLabels'],['connections-button','connections','setConnections'],['pause-button','paused','setPaused']]) {
  $(`#${button}`).onclick = () => { state[key] = !state[key]; world?.[method](state[key]); $(`#${button}`).setAttribute('aria-pressed', state[key]); if (key === 'paused') { $(`#${button}`).innerHTML = icon(state.paused ? 'play' : 'pause'); $(`#${button}`).setAttribute('aria-label', state.paused ? '播放環境動畫' : '暫停環境動畫'); } };
}
$('#top-button').onclick = () => world?.topView(); $('#zoom-in').onclick = () => world?.zoom(.8); $('#zoom-out').onclick = () => world?.zoom(1.25);
$('#progress-nav').onclick = () => { state.visitedOnly = !state.visitedOnly; state.query = ''; state.era = 'all'; state.testament = 'all'; $('#search').value = ''; updateFilters(); listThemes(); setAtlasOpen(true); };
$('#explore-nav').onclick = () => { resetFilters(); closeAtlas(); };
$('#menu').onclick = () => setAtlasOpen(!$('#atlas').classList.contains('open'));
$('#about-nav').onclick = showAbout; $('#help').onclick = showHelp; $('#sources-button').onclick = showSources; $('#map-sources').onclick = showSources;
$('#modal-close').onclick = closeModal; $('#modal').addEventListener('click', e => { if (e.target === $('#modal')) { const r = $('#modal').getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeModal(); } });
$('#modal').addEventListener('cancel', () => restoreFocus?.focus?.());
document.addEventListener('keydown', e => {
  const typing = /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName);
  if (e.key === '/' && !typing && !$('#modal').open) { e.preventDefault(); setAtlasOpen(true); $('#search').focus(); }
  if (e.key === 'Escape' && !$('#modal').open) { if ($('#atlas').classList.contains('open')) closeAtlas(); else if (state.stop) { state.stop = null; state.tour = false; renderDetail(); world?.select(state.selected); } else if (state.selected) overview(); }
});
window.addEventListener('hashchange', () => { const id = new URLSearchParams(location.hash.slice(1)).get('island'); if (themeById.has(id)) selectTheme(id, { updateHash: false }); else overview(); });

listThemes(); updateProgressCount();
const initialId = new URLSearchParams(location.hash.slice(1)).get('island');
if (themeById.has(initialId)) selectTheme(initialId, { updateHash: false });
function worldError() {
  $('#loading').innerHTML = `${icon('book', 32)}<p>這個裝置暫時無法開啟 3D 場景。</p><small>全部經文導覽仍可從主題清單閱讀。</small><button class="secondary-button" id="fallback-start">探索摩西會幕</button>`;
  $('#fallback-start').onclick = () => selectTheme('tabernacle'); $('#stage').classList.add('fallback');
}
// Content is available before WebGL loads, so a GPU/import failure never removes the reading experience.
import('./world.js').then(({ createWorld }) => {
  world = createWorld($('#stage'), {
    onSelect: selectTheme, onStop: selectStop, icon,
    onReady() { state.worldReady = true; $('#loading').classList.add('loaded'); setTimeout(() => $('#loading')?.remove(), 550); }, onError: worldError,
  });
  if (!world) return;
  listThemes();
  const id = new URLSearchParams(location.hash.slice(1)).get('island');
  if (themeById.has(id)) selectTheme(id, { updateHash: false }); else if (state.selected) world.select(state.selected);
}).catch(error => { console.error('3D scene could not start', error); worldError(); });
