import './style.css';
import {exodusSegmentById} from './exodus-exploration.js';
import {narrativeChapters,chapterById,stateChapter,setNarrativeChapter,chapterForPerson,stateNarrativePhase,setNarrativePhase} from './narrative-chapters.js';
import {atlasPanel,atlasJourneyOptions} from './atlas-ui.js';
import {atlasRouteById} from './atlas-data.js';
import { themes, themeById, eras, sources, evidenceLabels, filterThemes } from './content.js';
import { readProgress, writeProgress, markStop, getTourStep } from './progress.js';
import { icon } from './icons.js';
import { scriptureReading, scriptureReferences, sourceMarkup } from './scripture-ui.js';
import { historicalScenes } from './historical-data.js';
import {blenderModels} from './blender-manifest.js';
import { personById } from './people-data.js';
import { peopleMarkup } from './people-ui.js';
import {walkEntry,walkMarkup} from './walk-ui.js';
import {freshMission,missionEvent,missionStage,missionSteps,readMission,writeMission} from './walk-data.js';
import {explorationFor} from './exploration-data.js';
import {readExploration,observeObject,writeExploration} from './exploration-progress.js';
import {createSceneAudio} from './scene-audio.js';
import { readingModes, learningIslands } from './learning-data.js';
import { readLearning, writeLearning, learningEvent, learningTasks, personForMode } from './learning-model.js';
import { learningPanel, modeStatus, currentLearning, learningKey, learningReadText, learningSourceModal, learningComparison } from './learning-ui.js';
import { createReadingSpeech } from './reading-speech.js';

let storage; try { storage = window.localStorage; } catch { storage = null; }
const state = { selected: null, stop: null, query: '', era: 'all', testament: 'all', mode: 'general',
  cutaway: false, labels: true, connections: true, paused: matchMedia('(prefers-reduced-motion: reduce)').matches,
  night: false, tour: false, visitedOnly: false, progress: readProgress(storage), worldReady: false };
state.learning=readLearning(storage);state.mode=state.learning.mode;state.learningCursor={};state.learningFeedback=null;
state.exodusSegment=exodusSegmentById.has(new URLSearchParams(location.hash.slice(1)).get('chapter'))?new URLSearchParams(location.hash.slice(1)).get('chapter'):'bricks';
state.actor=null;state.dialogue=[];state.walking=false;state.soundEnabled=false;
state.explorationSeen=readExploration(storage);
state.atlasJourney='all';state.atlasRoute=null;state.atlasCompact=true;
state.mission=readMission(storage);
let world = null, restoreFocus = null, toastTimer,modalCleanup=null,feedbackTimer;
let soundPreferences={};try{soundPreferences=JSON.parse(storage?.getItem('bible-island:audio:v1')||'{}')||{};}catch{}
const sceneAudio=createSceneAudio(updateSoundState,soundPreferences);
state.audioVolumes=sceneAudio.volumes;
const readingSpeech=createReadingSpeech(updateReadingSpeech);
const $ = s => document.querySelector(s);
const number = n => String(n).padStart(2, '0');
const modes = Object.fromEntries(Object.entries(readingModes).map(([id, mode])=>[id,mode.name]));
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
      <div class="map-topbar"><button id="scene-menu" class="scene-menu" aria-label="開啟主題清單" aria-expanded="false" hidden>${icon('menu',16)} 主題清單</button><div class="map-view-tabs"><button class="active" id="overview">${icon('compass', 16)}群島全景</button><button id="timeline-toggle" aria-pressed="false">${icon('clock', 16)}時代脈絡</button></div><span class="map-note">主題位置示意 · 非實際地圖</span></div><label class="atlas-journey-picker" id="atlas-journey-picker">${icon('route',15)}<span>閱讀路線</span><select id="atlas-journey" aria-label="選擇群島閱讀路線">${atlasJourneyOptions}</select></label><div id="atlas-travel-status" class="atlas-travel-status" role="status" hidden></div>
      <div class="map-intro" id="map-intro"><div class="eyebrow"><span></span> WALK INTO THE WORD</div><h2>跨越時空，<br>走進經文<span>。</span></h2><p>從曠野的一座帳幕，<br>到地中海的一葉帆船。<br>讓聖經的故事，在眼前展開。</p><button class="text-button" id="start-exploring">從摩西會幕出發 ${icon('arrow', 19)}</button></div>
      <div id="scene-caption" class="scene-caption" hidden></div><div id="scene-views" class="scene-views" role="group" aria-label="歷史場景視角" hidden><button data-view="overview" aria-pressed="true">場景全景</button><button data-view="human" aria-pressed="false">人物尺度</button><button data-view="plan" aria-pressed="false">俯視配置</button></div><div class="selected-breadcrumb" id="breadcrumb" hidden><button id="back-overview">群島全景</button><span>/</span><strong></strong></div>
      <div class="world-tools" role="toolbar" aria-label="場景控制"><button id="time-button" aria-label="切換夜晚" title="切換夜晚">${icon('sun')}</button><span></span><button id="labels-button" aria-label="顯示島嶼名稱" aria-pressed="true" title="島嶼名稱">${icon('eye')}</button><button id="connections-button" aria-label="顯示主題連線" aria-pressed="true" title="主題連線">${icon('route')}</button><button id="pause-button" aria-label="${state.paused ? '播放人物與環境動畫' : '暫停人物與環境動畫'}" aria-pressed="${state.paused}" title="暫停動畫">${icon(state.paused ? 'play' : 'pause')}</button><span></span><button id="top-button" aria-label="切換鳥瞰視角" title="鳥瞰視角">${icon('layers')}</button></div>
      <div class="zoom-tools"><button id="zoom-in" aria-label="放大">${icon('plus')}</button><button id="zoom-out" aria-label="縮小">${icon('minus')}</button><span></span><button id="home-button" aria-label="回到群島全景">${icon('home', 18)}</button></div>
      <div class="compass-rose" aria-hidden="true"><span>N</span><svg viewBox="0 0 50 50"><path d="m25 5 6 20-6 20-6-20Z" fill="currentColor"/><path d="m5 25 20-6 20 6-20 6Z" fill="currentColor" opacity=".4"/></svg><small>EXPLORE</small></div>
      <div class="timeline" id="timeline" hidden><div><span class="eyebrow">FOLLOW THE STORY</span><p>沿著時代，找到故事的位置。</p></div><div class="era-buttons">${eras.map(e => `<button data-era="${e.id}" class="${e.id === 'all' ? 'active' : ''}" aria-pressed="${e.id === 'all'}"><i></i>${e.name}</button>`).join('')}</div></div>
      <div class="journey-card atlas-route-card" id="journey-card"><span class="journey-art">${icon('archive', 25)}</span><div><span class="eyebrow">YOUR FIRST ISLAND</span><strong>從一座會幕，開始探索</strong><small>5 個探索點 · 出埃及記 25–40 章</small></div><button id="first-island" aria-label="探索摩西會幕">${icon('arrow', 21)}</button></div>
      <div class="map-footer"><span><i></i>${themes.length} 座主題島 <b>·</b> ${themes.reduce((n,t) => n + t.stops.length, 0)} 個探索點</span><span class="gesture-hint">拖曳旋轉 <b>·</b> 滾輪縮放 <b>·</b> 點選探索</span><button id="map-sources">經文與復原說明 ${icon('external', 12)}</button></div>
      <div id="walk-interface" hidden></div><aside class="detail-panel" id="detail" aria-label="主題詳情" hidden></aside>
    </section>
  </main>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
  <dialog id="modal" class="modal" aria-labelledby="modal-title"><div class="modal-top"><span class="eyebrow">BIBLE ISLAND</span><button class="icon-button" id="modal-close" aria-label="關閉視窗">${icon('close')}</button></div><div id="modal-content"></div></dialog>
`;

function persist() { writeProgress(storage, state.progress); updateProgressCount(); }
function updateProgressCount() { $('#progress-count').textContent = state.progress.visited.length; }
function toast(text) { $('#toast').textContent = text; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3000); }
const mobileLayout = matchMedia('(max-width: 760px)');
function setAtlasOpen(open) { $('#scene-menu')?.setAttribute('aria-expanded',open); $('#atlas').classList.toggle('open', open); $('#menu').setAttribute('aria-expanded', open); $('#atlas').inert = (mobileLayout.matches || !!historicalScenes[state.selected]) && !open;if(state.walking)world?.blockWalk(open||!!state.actor||!!$('#modal').open); }
function closeAtlas() { setAtlasOpen(false); }
mobileLayout.addEventListener('change', () => { $('#atlas').inert = (mobileLayout.matches || !!historicalScenes[state.selected]) && !$('#atlas').classList.contains('open'); });
closeAtlas();
function listThemes() {
  let list = filterThemes(state); if (state.visitedOnly) list = list.filter(t => state.progress.visited.includes(t.id) || state.progress.saved.includes(t.id));
  $('#result-count').textContent = `${list.length} 座島嶼`; $('#list-caption').textContent = state.visitedOnly ? '走過與收藏的島嶼' : state.query ? '搜尋結果' : state.era === 'all' ? '主題群島' : eras.find(e => e.id === state.era).name;
  $('#theme-list').innerHTML = list.length ? list.map(t => {
    const done = t.stops.filter(s => state.progress.stops.includes(`${t.id}/${s.id}`)).length;
    return `<button class="theme-row ${state.selected === t.id ? 'selected' : ''}" data-theme="${t.id}" aria-pressed="${state.selected === t.id}"><span class="theme-number">${number(t.number)}</span><span class="theme-row-copy"><strong>${t.name}</strong><small>${t.subtitle}</small></span><span class="theme-row-end">${historicalScenes[t.id] ? '<span class="preview-tag">新版</span>' : ''}${done ? `<small>${done}/${t.stops.length}</small>` : `<i class="testament-dot ${t.testament}"></i>`}${icon('chevron', 13)}</span></button>`;
  }).join('') : `<div class="empty-state">${icon(state.visitedOnly ? 'footprints' : 'search', 30)}<strong>${state.visitedOnly ? '每段旅程，都從第一步開始。' : '還沒有找到這座島。'}</strong><p>${state.visitedOnly ? '探索一座島或收藏主題，就會在這裡留下足跡。' : '試試「會幕」「漁船」或「出埃及記」。'}</p><button id="reset-filters">${state.visitedOnly ? '開始探索' : '清除篩選'}</button></div>`;
  $('#reset-filters')?.addEventListener('click', resetFilters);
  world?.setVisible(list.map(t => t.id));
  if(!state.selected){const route=atlasRouteById.get(state.atlasRoute),ids=new Set(list.map(t=>t.id));if(route&&(!ids.has(route.from)||!ids.has(route.to))){state.atlasRoute=null;world?.setAtlasRoute(null);}renderAtlasPanel();}
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

function selectTheme(id, { updateHash = true,chapter=null,phase=null } = {}) {
  setNarrativeChapter(state,id,chapter);
  if(id==='david'&&stateChapter(state,id)==='ark')setNarrativePhase(state,id,['cart','pause','carry','tent'].includes(phase)?phase:'cart');
  const t = themeById.get(id); if (!t) return;
  if($('#modal').open)closeModal();
  if (!filterThemes(state).some(x => x.id === id) || state.visitedOnly) resetFilters();
  if(state.walking)exitWalk(false);endConversation(false);state.selected = id; state.stop = null; state.tour = false;if(narrativeChapters[id])syncChapterLearningCursor();
  const sceneInfo = historicalScenes[id];
  document.body.classList.toggle('historical-view', !!sceneInfo);
  $('#scene-caption').hidden = !sceneInfo; $('#scene-views').hidden = !sceneInfo; $('#scene-menu').hidden = !sceneInfo;
  $('.map-note').textContent = sceneInfo ? '詳細場景 · 復原預覽' : '主題位置示意 · 非實際地圖';
  if (sceneInfo) $('#scene-caption').innerHTML = `<span>HISTORICAL SCENE / ${number(t.number)}</span><strong>${sceneInfo.edition}</strong><small>${sceneInfo.category}</small>`;
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed', b.dataset.view==='overview'));
  $('#labels-button').setAttribute('aria-label', sceneInfo ? '顯示探索點名稱' : '顯示島嶼名稱');
  $('#connections-button').hidden = !!sceneInfo; $('#pause-button').hidden = false;
  $('#labels-button').title = sceneInfo ? '探索點名稱' : '島嶼名稱';
  $('.compass-rose').hidden = !!sceneInfo;
  state.progress.visited = [...new Set([...state.progress.visited, id])]; persist();
  $('#map-layout').classList.add('has-selection'); $('#map-intro').hidden = true; $('#journey-card').hidden = true;
  $('#breadcrumb').hidden = false; $('#breadcrumb strong').textContent = t.name;
  $('#detail').hidden = false; renderDetail(); listThemes(); closeAtlas();
  $('#atlas-travel-status').hidden=true;selectCurrentScene(id);
  if (updateHash) history.replaceState(null, '', islandHash(id));
  document.title = `${t.name} — 讀聖經順起來`;
}
function overview() {
  if(state.walking)exitWalk(false);endConversation(false);state.selected = null; state.stop = null; state.tour = false;
  document.body.classList.remove('historical-view'); $('#scene-caption').hidden = true; $('#scene-views').hidden = true; $('#scene-menu').hidden = true;
  $('#connections-button').hidden = false; $('#pause-button').hidden = false;
  $('#labels-button').setAttribute('aria-label','顯示島嶼名稱'); $('#labels-button').title='島嶼名稱'; $('.compass-rose').hidden = false; $('.map-note').textContent = '主題位置示意 · 非實際地圖';
  $('#map-layout').classList.remove('has-selection'); $('#map-intro').hidden = false; $('#journey-card').hidden = false; $('#breadcrumb').hidden = true; $('#detail').hidden = true;
  resetFilters();$('#atlas-travel-status').hidden=true;state.atlasRoute=null;renderAtlasPanel();world?.home(); history.replaceState(null, '', location.pathname + location.search); document.title = '讀聖經順起來 — Bible Island';
}
function syncChapterLearningCursor(){const chapter=stateChapter(state);if(!chapter)return;const task=learningTasks(state.selected,state.mode).find(t=>t.id===chapter||t.stop===chapter);if(task)state.learningCursor[learningKey(state)]=task.id;}
function currentExploration(){return explorationFor(state.selected,stateChapter(state),stateNarrativePhase(state));}
function islandHash(id){const chapter=stateChapter(state,id),phase=stateNarrativePhase(state,id);return `#island=${encodeURIComponent(id)}${chapter?`&chapter=${chapter}`:''}${phase?`&phase=${phase}`:''}`;}
function selectCurrentScene(id=state.selected){world?.select(id,stateChapter(state,id),stateNarrativePhase(state,id));}
function setCurrentAudioScene(){sceneAudio.setScene(state.selected,stateChapter(state),stateNarrativePhase(state));}
function bindNarrativeChapters(){document.querySelectorAll('[data-exodus-segment],[data-narrative-segment]').forEach(b=>b.onclick=()=>changeNarrativeChapter(b.dataset.exodusSegment||b.dataset.narrativeSegment));document.querySelectorAll('[data-narrative-phase]').forEach(b=>b.onclick=()=>changeNarrativePhase(b.dataset.narrativePhase));}
function changeNarrativePhase(phase){
 if(phase===stateNarrativePhase(state)||!setNarrativePhase(state,state.selected,phase))return;
 if($('#modal').open)closeModal();if(state.walking)exitWalk(false);else endConversation(false);
 state.stop=null;state.tour=false;selectCurrentScene();setCurrentAudioScene();renderDetail();
 document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view==='overview'));
 history.replaceState(null,'',islandHash(state.selected));toast('已切換敘事時刻；沿路行走與交談已結束。');
}
function changeNarrativeChapter(segment,{resume=true,announce=true}={}){
  if(!chapterById(state.selected,segment)||segment===stateChapter(state))return;
  const walking=state.walking,sound=sceneAudio.enabled;if(walking)exitWalk(false);else endConversation(false);
  setNarrativeChapter(state,state.selected,segment);syncChapterLearningCursor();state.stop=null;state.tour=false;selectCurrentScene();setCurrentAudioScene();renderDetail();
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view==='overview'));
  history.replaceState(null,'',islandHash(state.selected));
  if(walking&&resume)startWalk(sound);
  if(announce){const s=chapterById(state.selected,segment);toast(`第 ${s.number} 段：${s.name} · ${s.reference}，切換至另一段敘事。`);}
  $('#map-layout').classList.add('scene-arriving');setTimeout(()=>$('#map-layout').classList.remove('scene-arriving'),320);
}
function selectStop(id, { focus = true } = {}) {
  const t = themeById.get(state.selected), s = t?.stops.find(s => s.id === id); if (!s) return;
  if(narrativeChapters[t.id]&&stateChapter(state)!==id)changeNarrativeChapter(id,{resume:false,announce:false});
  if(state.walking)exitWalk(false);
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',false));
  endConversation(false);state.stop = id;
  if(learningIslands[t.id]){if(learningTasks(t.id,state.mode).some(task=>task.id===id))state.learningCursor[learningKey(state)]=id;recordLearning({type:'observe',id});}
  state.progress = markStop(state.progress, t.id, id); persist(); renderDetail(); listThemes();
  world?.focusStop(id);
  const interior = ['tabernacle', 'solomon', 'herod'].includes(t.id) && ['lampstand', 'incense', 'ark', 'sanctuary', 'temple'].includes(id) || t.id==='exodus' && id==='passover' || t.id==='jerusalem' && id==='house';
  if (interior && !state.cutaway) {
    state.cutaway = true; world?.setCutaway(true); updateCutawayButton();
  }
  if (focus) $(learningIslands[t.id]?'#learning-heading':'#stop-heading')?.focus({ preventScroll: true });
}
function updateCutawayButton() {
  const button = $('#cutaway-button'); if (!button) return; button.setAttribute('aria-pressed', state.cutaway); button.classList.toggle('active', state.cutaway);
  button.innerHTML = `${icon('layers', 16)}${state.cutaway ? '顯示完整屋頂' : '打開建築剖面'}`;
}
function renderDetail() {
  const t = themeById.get(state.selected); if (!t) return;
  const current = t.stops.find(s => s.id === state.stop), saved = state.progress.saved.includes(t.id);
  const done = t.stops.filter(s => state.progress.stops.includes(`${t.id}/${s.id}`)).length;
  const canCut = !!historicalScenes[t.id]&&historicalScenes[t.id].cutaway!==false;
  const sceneInfo = historicalScenes[t.id];
  const index = current ? t.stops.indexOf(current) : -1;
  $('#detail').innerHTML = `
    <div class="detail-sticky"><div class="detail-top"><span class="eyebrow">ISLAND ${number(t.number)} <i>/</i> ${oldNew(t)}</span><div><button class="icon-button ${saved ? 'saved' : ''}" id="save-theme" aria-label="${saved ? '取消收藏' : '收藏主題'}" aria-pressed="${saved}">${icon('bookmark', 18)}</button><button class="icon-button" id="close-detail" aria-label="${state.walking?'結束交談':'返回群島全景'}">${icon('close', 20)}</button></div></div>
    <p class="detail-english">${t.english}</p><h2>${t.name}</h2><p class="detail-subtitle">${t.subtitle}</p><div class="detail-meta"><span>${icon('clock', 13)}${t.period}</span><span>${icon('compass', 13)}${t.stops.length} 個探索點</span></div>${modeStatus(state.mode)}</div>
    <div class="detail-scroll">${learningPanel(state,t)}${explorationFor(t.id)&&!state.walking?walkEntry(state.worldReady,t.id,stateChapter(state,t.id),stateNarrativePhase(state,t.id)):''}${peopleMarkup(state)}${sceneInfo ? `<section class="reconstruction-card"><span>詳細場景 · 復原預覽</span><strong>${sceneInfo.scale}</strong><button id="scene-evidence">查看尺度與復原取捨 ${icon('arrow',13)}</button></section>` : ''}<p class="detail-intro">${t.intro}</p>${scriptureReading(t.book, t.reference)}
    <div class="detail-actions"><button class="primary-button" id="start-tour">${icon(state.tour ? 'compass' : 'play', 15)}${learningIslands[t.id]?readingModes[state.mode].action:state.tour ? '重新開始導覽' : '跟著導覽走一趟'}<small>${learningIslands[t.id]?(state.mode==='general'?`${t.stops.length} 幕故事`:state.mode==='child'?'3 個觀察任務':'3 項資料對讀'):`約 ${t.stops.length} 分鐘`}</small></button>${canCut ? '<button class="secondary-button" id="cutaway-button" aria-pressed="false"></button>' : ''}</div>
    ${current ? `<section class="stop-card" aria-labelledby="stop-heading"><div class="stop-card-top"><span>${state.tour ? '跟著導覽' : '正在探索'} ${number(index + 1)} / ${number(t.stops.length)}</span><button id="close-stop" aria-label="收合探索點">${icon('close', 15)}</button></div><h3 id="stop-heading" tabindex="-1">${icon(current.icon, 21)}${current.name}</h3><p class="stop-question">${current.question}</p><p>${state.mode === 'child' ? current.child : current.summary}</p>${state.mode === 'study' ? `<div class="study-note"><span>進一步觀察</span><p>${current.study}</p></div>` : ''}${scriptureReferences(current.reference)}<button class="evidence-chip" id="stop-evidence">${icon('info', 12)}${evidenceLabels[current.evidence]}</button><div class="tour-navigation"><button id="previous-stop" ${index === 0 ? 'disabled' : ''}>上一站</button><span>${index + 1} / ${t.stops.length}</span><button id="next-stop">${index === t.stops.length - 1 ? '完成探索' : '下一站'}${icon(index === t.stops.length - 1 ? 'check' : 'arrow', 15)}</button></div></section>` : `<div class="guiding-question"><span>帶著一個問題出發</span><p>${t.question}</p></div>`}
    <div class="section-heading"><h3>這座島的探索點</h3><span>${done} / ${t.stops.length}</span></div><div class="stop-progress"><i style="width:${done / t.stops.length * 100}%"></i></div><div class="stop-list">${t.stops.map((s,i) => `<button data-stop="${s.id}" class="stop-row ${s.id === state.stop ? 'active' : ''}"><span>${state.progress.stops.includes(`${t.id}/${s.id}`) ? icon('check', 13) : number(i+1)}</span><strong>${s.name}<small>${s.reference}</small></strong>${icon('chevron', 14)}</button>`).join('')}</div>
    <div class="section-heading related-heading"><h3>從這裡，繼續閱讀</h3>${icon('route', 16)}</div><div class="related-list">${t.connections.map(c => { const other = themeById.get(c.id); return `<button class="related-row" data-related="${c.id}"><span class="related-number">${number(other.number)}</span><span><small>${c.type}</small><strong>${other.name}</strong></span>${icon('arrow', 16)}</button>`; }).join('')}</div>
    <button class="context-button" id="context-button">${icon('info', 15)}這個場景如何復原？${icon('chevron', 13)}</button><p class="detail-footnote">觀察場景 · 回到經文 · 連起故事</p></div>`;
  bindPeople();bindLearning();bindNarrativeChapters();
  $('#enter-walk-sound')?.addEventListener('click',()=>startWalk(true));$('#enter-walk-quiet')?.addEventListener('click',()=>startWalk(false));
  updateCutawayButton();
  $('#scene-evidence')?.addEventListener('click',()=>openContext(t));
  $('#save-theme').onclick = () => { state.progress.saved = saved ? state.progress.saved.filter(id => id !== t.id) : [...state.progress.saved, t.id]; persist(); renderDetail(); toast(saved ? '已取消收藏' : `已收藏「${t.name}」`); };
  $('#close-detail').onclick = ()=>state.walking?endConversation():overview();
  $('#start-tour').onclick = () => { if(learningIslands[t.id])beginLearning();else{state.tour = true; selectStop(t.stops[0].id);} };
  $('#cutaway-button')?.addEventListener('click', () => { state.cutaway = !state.cutaway; world?.setCutaway(state.cutaway); updateCutawayButton(); });
  document.querySelectorAll('[data-stop]').forEach(b => b.onclick = () => selectStop(b.dataset.stop));
  document.querySelectorAll('[data-related]').forEach(b => b.onclick = () => selectTheme(b.dataset.related));
  $('#context-button').onclick = () => openContext(t);
  if (current && !state.actor) {
    $('#close-stop').onclick = () => { state.stop = null; state.tour = false; renderDetail(); selectCurrentScene(t.id); };
    $('#previous-stop').onclick = () => selectStop(t.stops[getTourStep(t, index, -1)].id);
    $('#next-stop').onclick = () => {
      if (index < t.stops.length - 1) selectStop(t.stops[getTourStep(t, index, 1)].id);
      else { state.stop = null; state.tour = false; renderDetail(); selectCurrentScene(t.id); const remaining = t.stops.filter(s => !state.progress.stops.includes(`${t.id}/${s.id}`)).length; toast(remaining ? `已到最後一站，這座島還有 ${remaining} 個探索點可以閱讀。` : `已走完「${t.name}」的 ${t.stops.length} 個探索點，從相關主題繼續旅程。`); }
    };
    $('#stop-evidence').onclick = () => openContext(t, current);
    // Keep the current learning stop visible after changing reading modes or moving between steps.
    const scroller=$('#detail .detail-scroll'),card=$(learningIslands[t.id]?'.learning-panel':'.stop-card');
    if(card)scroller.scrollTop+=card.getBoundingClientRect().top-scroller.getBoundingClientRect().top-10;
  }
}

function selectActor(id) {
  if(!personById(state.selected,id))return;
  if(narrativeChapters[state.selected]&&!state.walking){const segment=chapterForPerson(state.selected,id);if(segment&&segment!==stateChapter(state))changeNarrativeChapter(segment,{resume:false,announce:false});}
  if(state.walking&&!world?.canTalk(id)){walkFeedback('再靠近角色一些，就能開始交談。');return;}
  readingSpeech.stop();sceneAudio.stopVoice();
  state.actor=id;state.dialogue=[];state.stop=null;state.tour=false;
  document.body.classList.add('in-conversation');
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',false));
  renderDetail();world?.converse(id);$('#conversation-heading')?.focus({preventScroll:true});
  if(currentExploration())playVoice('greeting');
}
function endConversation(render=true) {
  readingSpeech.stop();sceneAudio.stopVoice();const previous=state.actor;state.actor=null;state.dialogue=[];document.body.classList.remove('in-conversation');world?.converse(null);
  if(render&&state.selected){renderDetail();if(state.walking)$('#stage canvas')?.focus({preventScroll:true});else document.querySelector(`[data-person="${previous}"]`)?.focus({preventScroll:true});}
}
function bindPeople() {
  document.querySelectorAll('[data-person]').forEach(b=>b.onclick=()=>selectActor(b.dataset.person));
  const actor=personForMode(personById(state.selected,state.actor),state.selected,state.mode);if(!actor)return;
  function answer(topicId,followup=false) {
    const topic=actor.topics.find(t=>t.id===topicId);if(!topic)return;
    const line=followup?topic.followup:topic;if(!line)return;
    readingSpeech.stop();
    state.dialogue.push({...topic,...line,topic:topicId,isFollowup:followup});
    state.dialogue=state.dialogue.slice(-8);
    recordMission({type:'answer',person:actor.id,topic:topicId,followup});
    const panel=$('.people-panel');panel.outerHTML=peopleMarkup(state);bindPeople();
    $('#latest-answer')?.focus({preventScroll:true});const log=$('.conversation-log');log.scrollTop=log.scrollHeight;
    // Keep the question controls in reach, including on short phone screens.
    $('.people-panel').closest('.detail-scroll').scrollTop=0;
    if(currentExploration())playVoice(topicId+(followup?'-followup':''));
  }
  document.querySelectorAll('[data-question]').forEach(b=>b.onclick=()=>answer(b.dataset.question));
  document.querySelectorAll('[data-followup]').forEach(b=>b.onclick=()=>answer(b.dataset.followup,true));
  document.querySelector('[data-dialogue-stop]')?.addEventListener('click',e=>selectStop(e.currentTarget.dataset.dialogueStop));
  $('#end-conversation').onclick=()=>endConversation();$('#choose-person').onclick=()=>endConversation();
  $('#restart-conversation').onclick=()=>{state.dialogue=[];renderDetail();$('#conversation-heading')?.focus({preventScroll:true});if(currentExploration())playVoice('greeting');};
  $('#replay-voice')?.addEventListener('click',async()=>{if(!sceneAudio.enabled)await sceneAudio.enable();const last=state.dialogue.at(-1);playVoice(last?last.topic+(last.isFollowup?'-followup':''):'greeting');});
  $('#stop-voice')?.addEventListener('click',()=>sceneAudio.stopVoice());
  document.querySelector('[data-learning-return]')?.addEventListener('click',returnToLearning);
  document.querySelector('[data-read-character]')?.addEventListener('click',()=>{sceneAudio.stopVoice();if(currentExploration()?.recordedChild){const last=state.dialogue.at(-1);sceneAudio.enable().then(ok=>{if(ok)playVoice(last?last.topic+(last.isFollowup?'-followup':''):'greeting');});}else readingSpeech.read(state.dialogue.at(-1)?.answer||actor.greeting);});
  $('#stop-learning-speech')?.addEventListener('click',()=>{readingSpeech.stop();sceneAudio.stopVoice();});
  document.querySelectorAll('[data-study-stop]').forEach(b=>b.onclick=()=>{const tasks=learningTasks(state.selected,'study');state.learningCursor[learningKey(state)]=(tasks.find(t=>t.stop===b.dataset.studyStop)||tasks[0]).id;returnToLearning();});
}

function returnToLearning() {
  if(state.walking)exitWalk(false);else endConversation(false);
  renderDetail();$('#detail .detail-scroll').scrollTop=0;$('#learning-heading')?.focus({preventScroll:true});
}

function walkFeedback(text) {
  const el=$('#walk-feedback');if(!el){if(text)toast(text);return;}el.textContent=text;el.classList.add('show');clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>el.classList.remove('show'),4000);
}

function recordLearning(event) {
  const result=learningEvent(state.learning,state.selected,state.mode,event);
  state.learning=result.data;
  if(result.feedback)state.learningFeedback={...result.feedback,key:learningKey(state),id:event.id};
  writeLearning(storage,state.learning);return result.feedback;
}
function refreshLearning(focus=false) {
  const panel=$('.learning-panel'),theme=themeById.get(state.selected);if(!panel||!theme)return;
  panel.outerHTML=learningPanel(state,theme);bindLearning();
  if(focus)$('#learning-heading')?.focus({preventScroll:true});
}
function beginLearning() {
  const {task}=currentLearning(state);if(!task)return;
  state.learningCursor[learningKey(state)]=task.id;selectStop(task.stop);
}
function bindLearning() {
  document.querySelectorAll('[data-learning-island]').forEach(b=>b.onclick=()=>selectTheme(b.dataset.learningIsland));
  if(!learningIslands[state.selected]||state.actor)return;
  const current=()=>currentLearning(state);
  document.querySelectorAll('[data-learning-step]').forEach(b=>b.onclick=()=>{readingSpeech.stop();state.learningCursor[learningKey(state)]=b.dataset.learningStep;state.learningFeedback=null;refreshLearning(true);});
  document.querySelectorAll('[data-learning-go]').forEach(b=>b.onclick=()=>selectStop(b.dataset.learningGo));
  document.querySelectorAll('[data-learning-person]').forEach(b=>b.onclick=()=>selectActor(b.dataset.learningPerson));
  document.querySelectorAll('[data-learning-answer]').forEach(b=>b.onclick=()=>{
    readingSpeech.stop();const {task}=current();state.learningCursor[learningKey(state)]=task.id;
    recordLearning({type:'answer',id:task.id,choice:state.mode==='child'?Number(b.dataset.learningAnswer):b.dataset.learningAnswer});refreshLearning();
    const feedback=$('.learning-feedback,.learning-success');if(feedback){feedback.setAttribute('tabindex','-1');feedback.focus({preventScroll:true});feedback.scrollIntoView({block:'nearest'});}
  });
  function nextTask() {
    const {tasks,record,index}=current();const next=tasks.slice(index+1).concat(tasks.slice(0,index)).find(t=>!record.completed.includes(t.id));
    if(!next){refreshLearning(true);return;}state.learningCursor[learningKey(state)]=next.id;state.learningFeedback=null;selectStop(next.stop);
  }
  document.querySelector('[data-learning-next]')?.addEventListener('click',nextTask);
  document.querySelector('[data-learning-read]')?.addEventListener('click',()=>{const feedback=recordLearning({type:'read',id:current().task.id});if(feedback?.kind==='correct')nextTask();else refreshLearning();});
  document.querySelector('[data-learning-source]')?.addEventListener('click',()=>{
    recordLearning({type:'inspect',id:current().task.id});refreshLearning();document.querySelector('[data-learning-source]')?.focus({preventScroll:true});openModal(learningSourceModal(state));
  });
  document.querySelector('[data-learning-compare]')?.addEventListener('click',()=>openModal(learningComparison(state)));
  document.querySelectorAll('[data-learning-view]').forEach(b=>b.onclick=()=>{
    if(state.walking)exitWalk(false);world?.sceneView(b.dataset.learningView);
    document.querySelectorAll('[data-view]').forEach(other=>other.setAttribute('aria-pressed',other.dataset.view===b.dataset.learningView));
  });
  const note=$('#learning-note');if(note)note.oninput=()=>{
    const result=learningEvent(state.learning,state.selected,state.mode,{type:'note',text:note.value});state.learning=result.data;
    $('#learning-note-status').textContent=writeLearning(storage,state.learning)?'已保存在目前瀏覽器。':'目前只暫存在這個頁面，瀏覽器儲存空間無法使用。';
  };
  document.querySelector('[data-read-learning]')?.addEventListener('click',()=>{sceneAudio.stopVoice();readingSpeech.read(learningReadText(state));});
  $('#stop-learning-speech')?.addEventListener('click',()=>{readingSpeech.stop();sceneAudio.stopVoice();});
}
function updateReadingSpeech(info) {
  document.querySelectorAll('#learning-speech-status,[data-reading-status]').forEach(el=>el.textContent=info.message);
  const button=$('#stop-learning-speech');if(button)button.hidden=info.status!=='speaking';
}
function updateModePresentation() {
  const mode=readingModes[state.mode];document.body.dataset.readingMode=state.mode;$('#reading-mode').value=state.mode;
  $('#map-intro>p').textContent=mode.description;
  $('#start-exploring').innerHTML=`${mode.action} ${icon('arrow',19)}`;
  renderAtlasPanel();
}
function engageAtlas(){if(!state.selected)$('#map-layout').classList.add('atlas-engaged');}
function renderAtlasPanel(){
  const root=$('#journey-card');root.innerHTML=atlasPanel(state,{ids:new Set(filterThemes(state).map(t=>t.id))});
  root.querySelectorAll('[data-atlas-route]').forEach(b=>b.onclick=()=>chooseAtlasRoute(b.dataset.atlasRoute));
  root.querySelectorAll('[data-atlas-enter]').forEach(b=>b.onclick=()=>selectTheme(b.dataset.atlasEnter));
  $('#atlas-card-toggle').onclick=()=>{state.atlasCompact=!state.atlasCompact;renderAtlasPanel();};
  $('#atlas-travel')?.addEventListener('click',()=>{const route=atlasRouteById.get(state.atlasRoute);if(!route)return;
    const label=$('#atlas-travel-status');label.hidden=false;label.textContent=`${themeById.get(route.from).name} → ${themeById.get(route.to).name} · 沿閱讀連結前往`;$('#atlas-travel').disabled=true;
    if(!world?.travelAtlas(route.id,()=>{label.hidden=true;$('#map-layout').classList.add('scene-arriving');selectTheme(route.to);setTimeout(()=>$('#map-layout').classList.remove('scene-arriving'),320);})){label.hidden=true;$('#atlas-travel').disabled=false;}
  });
  $('#atlas-compare')?.addEventListener('click',()=>{const route=atlasRouteById.get(state.atlasRoute);if(!route)return;openModal(`<h2 id="modal-title">${route.type}<span>把兩座島放在一起讀</span></h2>${[route.from,route.to].map(id=>{const t=themeById.get(id);return `<section class="source-item"><h3>${t.name}</h3><p>${t.period} · ${t.question}</p><p>${t.intro}</p>${scriptureReading(t.book,t.reference)}</section>`;}).join('')}<p class="modal-small">${route.text} 群島位置與連結均為閱讀示意。</p>`);});
}
function chooseAtlasRoute(id){if(!atlasRouteById.has(id))return;state.atlasRoute=id;state.atlasCompact=false;engageAtlas();world?.setAtlasRoute(id);renderAtlasPanel();$('#atlas-travel')?.focus({preventScroll:true});}
function changeReadingMode(mode) {
  if(!Object.hasOwn(readingModes,mode))return;
  if(state.walking)exitWalk(false);endConversation(false);state.stop=null;state.tour=false;
  state.mode=mode;syncChapterLearningCursor();state.learning={...state.learning,mode};state.learningFeedback=null;writeLearning(storage,state.learning);
  updateModePresentation();renderDetail();if($('#detail .detail-scroll'))$('#detail .detail-scroll').scrollTop=0;
  toast(`${modes[mode]}：${readingModes[mode].title}`);
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)readingSpeech.stop();});
window.addEventListener('pagehide',()=>readingSpeech.stop());
function updateSoundState(info) {
  state.soundEnabled=info.enabled;state.audioVolumes=info.volume;
  try{storage?.setItem('bible-island:audio:v1',JSON.stringify(info.volume));}catch{}
  if(currentExploration()?.recordedChild&&state.mode==='child'&&state.actor){
    const label=document.querySelector('[data-reading-status]');if(label)label.textContent=info.status==='playing'?'情境配音播放中':info.status==='loading'?'正在載入配音…':info.status==='unavailable'?info.text:'';
    const stop=document.querySelector('#stop-learning-speech');if(stop)stop.hidden=!['playing','loading'].includes(info.status);
  }
  const button=$('#walk-audio-toggle');if(button){button.setAttribute('aria-pressed',info.enabled);button.setAttribute('aria-label',info.enabled?'關閉聲音':'開啟聲音');button.innerHTML=`${icon('volume',16)}<span>${info.enabled?'聲音開啟':'開啟聲音'}</span>`;}
  const subtitle=$('#walk-subtitle');if(subtitle){subtitle.hidden=info.status!=='playing';subtitle.textContent=info.status==='playing'?info.text:'';}
  const label=$('#voice-status');if(label)label.textContent=info.status==='playing'?'語音播放中':info.status==='loading'?'正在載入語音…':info.status==='unavailable'?info.text:'中文情境配音 · 可重播';
  const stop=$('#stop-voice');if(stop)stop.hidden=!['playing','loading'].includes(info.status);
  if(info.status==='unavailable')walkFeedback(info.text);
}
function playVoice(key) {
  if(!state.actor||!currentExploration()||state.mode==='child'&&!currentExploration()?.recordedChild)return;
  setCurrentAudioScene();
  sceneAudio.speak(state.actor,state.mode==='child'?'child-'+key:key,world?.personPosition(state.actor)||personById(state.selected,state.actor).position);
}
function recordMission(event) {
  if(!state.walking||state.mode!=='general'||state.selected!=='jerusalem')return;const before=missionStage(state.mission);state.mission=missionEvent(state.mission,event);
  writeMission(storage,state.mission);
  if(missionStage(state.mission)!==before){renderWalk();walkFeedback(missionStage(state.mission)===4?'旅程完成，閱讀札記已保存在這個瀏覽器。':'已記下觀察，下一段旅程已更新。');}
}
function startWalk(sound) {
  if(!currentExploration()||!world)return;
  endConversation(false);state.stop=null;state.tour=false;
  if(!world.startWalk())return;
  state.walking=true;state.walkCompact=matchMedia('(max-width:760px)').matches;document.body.classList.add('walking');renderDetail();renderWalk();setCurrentAudioScene();sceneAudio.setActive(true);sceneAudio.enable(sound);
  $('#stage canvas')?.focus({preventScroll:true});
}
function exitWalk(render=true) {
  if(!state.walking)return;
  endConversation(false);state.walking=false;sceneAudio.setActive(false);world?.exitWalk();document.body.classList.remove('walking');$('#walk-interface').hidden=true;
  if(render){renderDetail();$('#enter-walk-quiet')?.focus({preventScroll:true});}
}
function renderWalk() {
  if(!state.walking)return;const root=$('#walk-interface');root.hidden=false;root.innerHTML=walkMarkup(state);bindNarrativeChapters();
  const step=missionSteps[missionStage(state.mission)];world?.setWalkObjective(state.selected==='jerusalem'&&state.mode==='general'?step?.target||null:null);
  document.querySelectorAll('[data-walk-person]').forEach(b=>b.onclick=()=>world?.guideWalk({type:'person',id:b.dataset.walkPerson}));
  document.querySelectorAll('[data-walk-object]').forEach(b=>b.onclick=()=>{const o=currentExploration().objects.find(o=>o.id===b.dataset.walkObject);world?.guideWalk({type:'object',id:o.id,position:o.approach||o.position});});
  $('#walk-learning-return')?.addEventListener('click',returnToLearning);
  $('#walk-exit').onclick=()=>exitWalk();$('#walk-look').onclick=()=>world?.lockWalk();
  $('#walk-audio-toggle').onclick=()=>sceneAudio.enable(!sceneAudio.enabled);
  $('#environment-volume').value=(state.audioVolumes?.environment??.6)*100;$('#voice-volume').value=(state.audioVolumes?.voice??.9)*100;
  $('#music-volume').value=(state.audioVolumes?.music??.16)*100;
  $('#music-volume').oninput=e=>{sceneAudio.setVolume('music',Number(e.target.value)/100);$('#music-toggle').textContent=Number(e.target.value)>0?'關閉配樂':'開啟配樂';$('#music-toggle').setAttribute('aria-pressed',Number(e.target.value)>0);$('#music-toggle').setAttribute('aria-label',Number(e.target.value)>0?'關閉背景音樂':'開啟背景音樂');};
  $('#music-toggle').onclick=()=>{const value=(state.audioVolumes?.music??.16)>0?0:.16;sceneAudio.setVolume('music',value);$('#music-volume').value=value*100;$('#music-toggle').textContent=value?'關閉配樂':'開啟配樂';$('#music-toggle').setAttribute('aria-pressed',!!value);$('#music-toggle').setAttribute('aria-label',value?'關閉背景音樂':'開啟背景音樂');};
  $('#environment-volume').oninput=e=>sceneAudio.setVolume('environment',Number(e.target.value)/100);$('#voice-volume').oninput=e=>sceneAudio.setVolume('voice',Number(e.target.value)/100);
  $('#walk-interact').onclick=()=>world?.interactWalk();$('#walk-stop').onclick=()=>world?.stopWalkRoute();
  $('#walk-guide')?.addEventListener('click',()=>{if(!step?.target)return;world?.guideWalk(step.target);$('#stage canvas')?.focus({preventScroll:true});});
  $('#walk-reflect')?.addEventListener('click',showReflection);$('#walk-journal')?.addEventListener('click',showWalkJournal);
  $('#walk-restart')?.addEventListener('click',()=>{state.mission=freshMission();writeMission(storage,state.mission);renderWalk();});
  $('#mission-toggle').onclick=()=>{const open=$('#mission-body').hidden;$('#mission-body').hidden=!open;state.walkCompact=!open;$('#mission-toggle').setAttribute('aria-expanded',open);};
  function hold(button,start,stop) {
    button.onpointerdown=e=>{e.preventDefault();button.setPointerCapture(e.pointerId);start();};button.onpointerup=stop;button.onpointercancel=stop;button.onlostpointercapture=stop;
    button.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();start();}};button.onkeyup=stop;button.onblur=stop;
  }
  root.querySelectorAll('[data-walk-move]').forEach(b=>hold(b,()=>world?.walkAxis(...b.dataset.walkMove.split(',').map(Number)),()=>world?.walkAxis(0,0)));
  root.querySelectorAll('[data-walk-turn]').forEach(b=>hold(b,()=>world?.walkTurn(Number(b.dataset.walkTurn)),()=>world?.walkTurn(0)));
}
function updateWalkHUD(info) {
  if(!state.walking)return;
  $('#walk-interface').dataset.position=info.position.map(n=>n.toFixed(3)).join(',');
  if(info.locomotion){const root=$('#walk-interface'),s=info.locomotion;root.dataset.locomotion=s.animation;root.dataset.grounded=String(s.isGrounded);root.dataset.climbing=String(s.isClimbingStairs);root.dataset.groundNormal=s.groundNormal.map(n=>n.toFixed(4)).join(',');root.dataset.visualY=s.visualY.toFixed(4);root.dataset.groundSnap=String(s.groundSnapApplied);}
  const action=$('#walk-interact');if(action){action.disabled=!info.nearby;action.querySelector('span').textContent=info.nearby?(info.nearby.type==='person'?`與${info.nearby.name}交談`:`觀察${info.nearby.name}`):'走近人物或器皿，開始互動';}
  if($('#walk-distance'))$('#walk-distance').textContent=info.distance!==null?`約 ${Math.round(info.distance)} 公尺`:'';
  if($('#walk-region'))$('#walk-region').textContent=currentExploration().region(info.position);
  if($('#walk-stop'))$('#walk-stop').hidden=!info.navigating;
  if($('#walk-nav-state'))$('#walk-nav-state').textContent=info.navigating?'沿路行走中 · 按 WASD 或「停止」可接手':'WASD 移動 · 拖曳環顧 · 點地沿路前往';
}
async function openVessel(id) {
  const definitions=currentExploration()?.objects||[],definition=definitions.find(v=>v.id===id);
  if(!definition||!state.walking||!world?.canInspect(id))return;
  recordMission({type:'inspect',id});state.explorationSeen=observeObject(state.explorationSeen,state.selected,id);writeExploration(storage,state.explorationSeen);renderWalk();
  const teaching=currentExploration()?.teachingInspection,articulation=blenderModels[id]?.articulation;
  openModal(`<h2 id="modal-title">${definition.name}<span>${teaching?'教學近景 · 旋轉觀察，核對經文':'拿在手中，慢慢觀察'}</span></h2>${!teaching?`<div class="vessel-tabs" role="group" aria-label="比較器皿">${definitions.map(v=>`<button data-vessel="${v.id}" aria-pressed="${v.id===id}">${v.name}</button>`).join('')}</div>`:''}${currentExploration()?.moment?`<p class="source-note">現在觀察：${currentExploration().moment.name} · 其他時刻請關閉近景後切換時間卡。</p>`:''}<div id="vessel-viewer" class="vessel-viewer"></div><div class="vessel-controls"><button id="vessel-left" aria-label="向左旋轉器物">↶ 向左轉</button><span>拖曳或使用方向鍵</span><button id="vessel-right" aria-label="向右旋轉器物">向右轉 ↷</button></div>${articulation?`<div class="vessel-joint-controls"><button id="vessel-joint" aria-pressed="false">${articulation.openLabel}</button><span>${articulation.note}</span></div>`:''}<p>${definition.description}</p><div class="source-note"><strong>帶著問題觀察</strong><p>${definition.observation}</p></div>${teaching?`${scriptureReferences(definition.passage)}${definition.source?`<a class="source-item" href="${definition.source.url}" target="_blank" rel="noopener noreferrer">${definition.source.label} ↗</a>`:''}<p class="modal-small">${currentExploration().inspectionNote||'近景與構造為教學示意；不代表可以搬動聖物或自由進入聖所。'}</p>`:'<p class="modal-small">類型復原 · 未認定特定出土原物。石器的歷史解釋仍需對照研究。</p><a class="source-item" href="https://www.gov.il/en/pages/jerusalem-the-upper-city-during-the-second-temple-period" target="_blank" rel="noopener noreferrer">查閱上城住居與器皿發掘資料 ↗</a>'}${definition.stop?'<button id="inspect-learning-stop" class="primary-button">回到相關探索點與閱讀流程 →</button>':''}`);
  document.querySelectorAll('[data-vessel]').forEach(b=>b.onclick=()=>openVessel(b.dataset.vessel));
  $('#inspect-learning-stop')?.addEventListener('click',()=>{closeModal();selectStop(definition.stop);});
  const container=$('#vessel-viewer');try {const {mountVesselViewer}=await import('./vessels.js');if(!container.isConnected||!$('#modal').open)return;const view=mountVesselViewer(container,id,{phase:stateNarrativePhase(state)});modalCleanup=()=>view.dispose();$('#vessel-left').onclick=()=>view.rotate(.25);$('#vessel-right').onclick=()=>view.rotate(-.25);const joint=$('#vessel-joint');if(joint)joint.onclick=()=>{const expanded=joint.getAttribute('aria-pressed')!=='true';view.setExploded(expanded);joint.setAttribute('aria-pressed',String(expanded));joint.textContent=expanded?articulation.closeLabel:articulation.openLabel;};}catch{if(container.isConnected)container.textContent='此裝置無法開啟器物近景；仍可閱讀上方說明與經文。';}
}

function showReflection() {
  if(missionStage(state.mission)!==3)return;
  openModal(`<h2 id="modal-title">把觀察留成一個問題<span>山城的一段路 · 最後一站</span></h2><p>看過這座院落與器皿後，哪一個說法較恰當？</p><div class="reflection-choices"><button data-reflection="no">這一棟院落可以代表第一世紀耶路撒冷每個家庭。</button><button data-reflection="yes">住居受財力與街區影響，一棟房屋不能代表所有家庭。</button></div><p id="reflection-feedback" role="status"></p><p class="modal-small">提示：想想住戶剛才提到的上城住居與家庭差異。</p>`);
  document.querySelectorAll('[data-reflection]').forEach(b=>b.onclick=()=>{if(b.dataset.reflection==='yes'){recordMission({type:'reflect',correct:true});showWalkJournal();}else $('#reflection-feedback').textContent='再想一想：畫面選了一種家屋類型。不同財力與街區的家庭，生活空間會完全一樣嗎？';});
}
function showWalkJournal() {
  if(!state.mission.complete)return;
  openModal(`<h2 id="modal-title">山城的一段路<span>你的閱讀札記</span></h2><p>你已聆聽居民、觀察陶器與石器，並向住戶追問家屋的差異。</p><div class="source-note"><strong>這趟旅程留下的三個觀察</strong><p>山城的高低影響行走；器皿提供生活與材質線索；一棟院落不能代表所有家庭。</p></div><p>場景與角色是教學復原。這段路不是精確的第一世紀地圖，對白與中文配音也不是古人留下的逐字記錄。</p><section class="source-item scripture-source"><strong>經文：城、谷地與山坡 · YouVersion CSBT</strong>${scriptureReferences('John 18:1;Luke 19:29-37')}</section><a class="source-item" href="https://www.gov.il/en/pages/jerusalem-the-upper-city-during-the-second-temple-period" target="_blank" rel="noopener noreferrer">研究：上城住居與石製器皿 ${icon('external',13)}</a><p class="modal-small">完成紀錄只保存在目前瀏覽器。可以關閉札記，繼續自由探索。</p>`);
}

function openModal(content) {
  modalCleanup?.();modalCleanup=null;readingSpeech.stop();sceneAudio.stopVoice();world?.blockWalk(true);world?.setModalOpen(true);
  restoreFocus = document.activeElement; $('#modal-content').innerHTML = content;
  if (!$('#modal').open) $('#modal').showModal(); $('#modal-close').focus();
}
function closeModal() { $('#modal').close(); restoreFocus?.focus?.(); }
function openContext(t, stop) {
  openModal(`<h2 id="modal-title">${stop ? stop.name : t.name}<span>經文與復原說明</span></h2><p>${historicalScenes[t.id] ? historicalScenes[t.id].category+'。這是教學復原場景，尺度與資料依據如下。' : t.context}</p>${historicalScenes[t.id] ? `<section class="historical-evidence"><h3>這一版的尺度依據</h3><ul>${historicalScenes[t.id].facts.map(f=>`<li>${f}</li>`).join('')}</ul><div class="source-note"><strong>復原取捨與尚未確定的部分</strong><p>${historicalScenes[t.id].limits}</p></div></section>` : ''}${stop ? `<div class="source-note"><strong>${evidenceLabels[stop.evidence]} · ${stop.reference}</strong><p>${stop.study}</p></div>` : ''}<div class="evidence-legend">${Object.entries(evidenceLabels).map(([key,label]) => `<span class="evidence-${key}">${label}</span>`).join('')}</div><p class="modal-small">經文描述、考古參考、視覺復原與詮釋是不同層次的依據。模型用於協助閱讀，重要細節仍應對照經文與研究。</p><h3>延伸查閱</h3>${(historicalScenes[t.id]?.sources || sources).map(sourceMarkup).join('')}`);
}
function showSources() { openContext(themeById.get(state.selected || 'tabernacle')); }
function showAbout() {
  openModal(`<h2 id="modal-title">一段經文，<br>一個可以走進的世界。</h2><p>「讀聖經順起來」是一座給兒童與成人的互動聖經群島。我們透過空間、器物與古代生活背景，幫助讀者跨越時空，重新回到經文。</p><div class="about-stats"><span><strong>24</strong>主題島嶼</span><span><strong>${themes.reduce((n,t) => n+t.stops.length, 0)}</strong>探索點</span><span><strong>3</strong>閱讀深度</span></div><h3>讓場景服務閱讀</h3><p>每座島都有經文入口、探索點與相關主題。閱讀模式可以隨時切換，親子提問、一般導讀與深入研讀共用同一個場景。</p><h3>理解模型的依據</h3><p>群島排列是主題示意，並非實際地理。建築、時間與生活物件的復原有不同確定程度，請使用「經文與復原說明」查看依據。</p><h3>你的足跡留在這裡</h3><p>探索與收藏只保存在目前瀏覽器，不需要帳號。清除瀏覽器資料後會重設，且不會跨裝置同步。本站未安裝使用者追蹤服務。</p><a class="source-item" href="https://github.com/s19003045/bible-island" target="_blank" rel="noopener noreferrer"><strong>查看 GitHub 專案 ${icon('external', 14)}</strong></a>`);
}
function showHelp() {
  openModal(`<h2 id="modal-title">準備好，出發吧。<span>讓我們一起走進經文</span></h2><ol class="help-steps"><li><span>01</span><div><strong>選一座主題島</strong><p>點地圖上的名稱或左側清單。也可以搜尋器物，例如「燈臺」。</p></div></li><li><span>02</span><div><strong>走近，看看細節</strong><p>拖曳旋轉、滾輪或雙指縮放。點數字探索點，鏡頭會帶你走近。建築可切換剖面。</p></div></li><li><span>03</span><div><strong>帶著問題回到經文</strong><p>詳細場景可點綠色對話標記，或從「遇見這裡的人」選角色，提問與追問。對白為情境設計，可連回經文與探索點；也可以使用原有導覽逐站閱讀。</p></div></li></ol><div class="source-note"><strong>鍵盤也可以探索</strong><p>Tab 選擇控制項，Enter 啟動；按 / 搜尋、Esc 收合視窗或回到全景。在 3D 畫面聚焦時，左右方向鍵可旋轉。</p></div><p class="modal-small">不支援 3D 的裝置仍可透過清單閱讀全部主題。夜晚模式只改變場景光線，不代表某段事件發生的實際時間。</p>`);
}

$('#scene-menu').onclick = () => setAtlasOpen(!$('#atlas').classList.contains('open'));
document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => {
  if(state.walking)exitWalk(false);if(state.actor)endConversation();world?.sceneView(b.dataset.view);
  document.querySelectorAll('[data-view]').forEach(other=>other.setAttribute('aria-pressed',other===b));
});
$('#theme-list').onclick = e => { const b = e.target.closest('[data-theme]'); if (b) selectTheme(b.dataset.theme); };
$('#search').oninput = e => { state.query = e.target.value; listThemes(); };
document.querySelectorAll('[data-testament]').forEach(b => b.onclick = () => { state.testament = b.dataset.testament; updateFilters(); listThemes(); });
document.querySelectorAll('[data-era]').forEach(b => b.onclick = () => { state.era = b.dataset.era; updateFilters(); listThemes(); });
$('#reading-mode').onchange = e => changeReadingMode(e.target.value);
$('#atlas-journey').onchange=e=>{state.atlasJourney=e.target.value;state.atlasRoute=null;engageAtlas();renderAtlasPanel();world?.setAtlasJourney(state.atlasJourney);};
$('#overview').onclick = overview; $('#home-button').onclick = overview; $('#back-overview').onclick = overview;
$('.brand').onclick = e => { e.preventDefault(); overview(); };
$('#start-exploring').onclick=()=>selectTheme('tabernacle');
$('#timeline-toggle').onclick = () => { const show = $('#timeline').hidden; $('#timeline').hidden = !show; $('#timeline-toggle').classList.toggle('active', show); $('#timeline-toggle').setAttribute('aria-pressed', show); $('#journey-card').classList.toggle('timeline-open', show); };
$('#time-button').onclick = () => { state.night = !state.night; world?.setTime(state.night); $('#time-button').innerHTML = icon(state.night ? 'moon' : 'sun'); $('#time-button').setAttribute('aria-label', state.night ? '切換白天' : '切換夜晚'); document.body.classList.toggle('night', state.night); };
for (const [button, key, method] of [['labels-button','labels','setLabels'],['connections-button','connections','setConnections'],['pause-button','paused','setPaused']]) {
  $(`#${button}`).onclick = () => { state[key] = !state[key]; world?.[method](state[key]); $(`#${button}`).setAttribute('aria-pressed', state[key]); if (key === 'paused') { $(`#${button}`).innerHTML = icon(state.paused ? 'play' : 'pause'); $(`#${button}`).setAttribute('aria-label', state.paused ? '播放人物與環境動畫' : '暫停人物與環境動畫'); } };
}
$('#top-button').onclick = () => world?.topView(); $('#zoom-in').onclick = () => world?.zoom(.8); $('#zoom-out').onclick = () => world?.zoom(1.25);
$('#progress-nav').onclick = () => { state.visitedOnly = !state.visitedOnly; state.query = ''; state.era = 'all'; state.testament = 'all'; $('#search').value = ''; updateFilters(); listThemes(); setAtlasOpen(true); };
$('#explore-nav').onclick = () => { resetFilters(); closeAtlas(); };
$('#menu').onclick = () => setAtlasOpen(!$('#atlas').classList.contains('open'));
$('#about-nav').onclick = showAbout; $('#help').onclick = showHelp; $('#sources-button').onclick = showSources; $('#map-sources').onclick = showSources;
$('#modal-close').onclick = closeModal; $('#modal').addEventListener('click', e => { if (e.target === $('#modal')) { const r = $('#modal').getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeModal(); } });
$('#modal').addEventListener('close',()=>{modalCleanup?.();modalCleanup=null;world?.setModalOpen(false);world?.blockWalk(!!state.actor);restoreFocus?.focus?.();});
$('#modal').addEventListener('cancel', () => restoreFocus?.focus?.());
document.addEventListener('keydown', e => {
  const typing = /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName);
  if (e.key === '/' && !typing && !$('#modal').open) { e.preventDefault(); setAtlasOpen(true); $('#search').focus(); }
  if (e.key === 'Escape' && !$('#modal').open) { if ($('#atlas').classList.contains('open')) closeAtlas(); else if(state.actor)endConversation(); else if(state.walking)exitWalk(); else if (state.stop) { state.stop = null; state.tour = false; renderDetail(); selectCurrentScene(); } else if (state.selected) overview(); }
});
window.addEventListener('hashchange', () => { const id = new URLSearchParams(location.hash.slice(1)).get('island'); if (themeById.has(id)) selectTheme(id, { updateHash: false,chapter:new URLSearchParams(location.hash.slice(1)).get('chapter'),phase:new URLSearchParams(location.hash.slice(1)).get('phase') }); else overview(); });

updateModePresentation();listThemes(); updateProgressCount();
const initialId = new URLSearchParams(location.hash.slice(1)).get('island');
if (themeById.has(initialId)) selectTheme(initialId, { updateHash: false,chapter:new URLSearchParams(location.hash.slice(1)).get('chapter'),phase:new URLSearchParams(location.hash.slice(1)).get('phase') });
function worldError() {
  $('#loading').innerHTML = `${icon('book', 32)}<p>這個裝置暫時無法開啟 3D 場景。</p><small>全部經文導覽仍可從主題清單閱讀。</small><button class="secondary-button" id="fallback-start">探索摩西會幕</button>`;
  $('#fallback-start').onclick = () => selectTheme('tabernacle'); $('#stage').classList.add('fallback');
}
// Content is available before WebGL loads, so a GPU/import failure never removes the reading experience.
import('./world.js').then(({ createWorld }) => {
  world = createWorld($('#stage'), {
    onSelect: selectTheme,onRoute:chooseAtlasRoute,onAtlasInteract:engageAtlas,onAtlasTravelEnd:()=>{$('#atlas-travel-status').hidden=true;const b=$('#atlas-travel');if(b)b.disabled=false;}, onStop: selectStop, onActor: selectActor, onInspect:openVessel,onWalkUpdate:updateWalkHUD,onWalkMessage:walkFeedback,audio:sceneAudio,icon,
    onReady() { state.worldReady = true; $('#loading').classList.add('loaded'); setTimeout(() => $('#loading')?.remove(), 550); }, onError: worldError,
  });
  if (!world) return;
  world.setModalOpen(!!$('#modal').open);
  listThemes();
  const id = new URLSearchParams(location.hash.slice(1)).get('island');
  if (themeById.has(id)) selectTheme(id, { updateHash: false,chapter:new URLSearchParams(location.hash.slice(1)).get('chapter'),phase:new URLSearchParams(location.hash.slice(1)).get('phase') }); else if (state.selected) selectCurrentScene();
}).catch(error => { console.error('3D scene could not start', error); worldError(); });
