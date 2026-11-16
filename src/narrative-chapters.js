import {paulSegments} from './paul-exploration.js';
import {exodusSegments} from './exodus-exploration.js';
import {returnSegments} from './return-exploration.js';
import {exodusChapterPicker} from './exodus-ui.js';
import {scriptureLinks} from './scripture.js';
export const narrativeChapters={paul:paulSegments,exodus:exodusSegments,'second-temple':returnSegments};
export const chapterById=(island,id)=>narrativeChapters[island]?.find(s=>s.id===id);
export function stateChapter(state,island=state.selected){
 if(!narrativeChapters[island])return null;
 const id=island==='exodus'?state.exodusSegment:state.narrativeSegments?.[island];
 return chapterById(island,id)?.id||narrativeChapters[island][0].id;
}
export function setNarrativeChapter(state,island,id){
 if(!chapterById(island,id))return false;
 if(island==='exodus')state.exodusSegment=id;else(state.narrativeSegments??={})[island]=id;
 return true;
}
export const chapterForPerson=(island,person)=>narrativeChapters[island]?.find(s=>s.person===person)?.id;
export function narrativeChapterPicker(island,id){
 if(island==='exodus')return exodusChapterPicker(id);
 const chapters=narrativeChapters[island];if(!chapters)return '';
 const active=chapterById(island,id)||chapters[0];
 return `<nav class="exodus-chapters" aria-label="${island==='paul'?'保羅旅程分城敘事':'歸回建殿分章敘事'}"><span>${island==='paul'?'三次旅程 · 切換不同城市與時刻':'三段敘事 · 切換不同歷史階段'}</span><div>${chapters.map(s=>`<button data-narrative-segment="${s.id}" aria-pressed="${s.id===active.id}"><small>${s.number}</small>${s.name}</button>`).join('')}</div><p><a href="${scriptureLinks(active.passage)[0].url}" target="_blank" rel="noopener noreferrer">${active.reference} · CSBT ↗</a> · 第 ${active.number} 段</p>${island==='paul'?`<details class="journey-itinerary"><summary>本次行程怎麼接起來？</summary><p>${active.route}</p><small>${active.routeNote}</small></details><p>另讀：<a href="${scriptureLinks('Acts 27-28')[0].url}" target="_blank" rel="noopener noreferrer">押解赴羅馬 · 徒 27–28 · CSBT ↗</a></p>`:''}</nav>`;
}
