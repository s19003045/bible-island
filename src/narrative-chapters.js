import {exileSegments} from './exile-exploration.js';
import {kingdomsSegments} from './kingdoms-exploration.js';
import {davidSegments,davidArkPhases} from './david-exploration.js';
import {normalizeDavidPhase,davidPhaseIds} from './artifact-phases.js';
import {ruthSegments} from './ruth-exploration.js';
import {sinaiSegments} from './sinai-exploration.js';
import {josephSegments} from './joseph-exploration.js';
import {abrahamSegments} from './abraham-exploration.js';
import {paulSegments} from './paul-exploration.js';
import {exodusSegments} from './exodus-exploration.js';
import {returnSegments} from './return-exploration.js';
import {exodusChapterPicker} from './exodus-ui.js';
import {scriptureLinks} from './scripture.js';
export const narrativeChapters={exile:exileSegments,kingdoms:kingdomsSegments,david:davidSegments,judges:ruthSegments,sinai:sinaiSegments,joseph:josephSegments,abraham:abrahamSegments,paul:paulSegments,exodus:exodusSegments,'second-temple':returnSegments};
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
export function stateNarrativePhase(state,island=state.selected){return island==='david'&&stateChapter(state,island)==='ark'?normalizeDavidPhase(state.narrativePhases?.[island]):null;}
export function setNarrativePhase(state,island,id){if(island!=='david'||stateChapter(state,island)!=='ark'||!davidPhaseIds.includes(id))return false;(state.narrativePhases??={})[island]=id;return true;}
export function narrativePhasePicker(island,segment,phase,compact=false){
 if(island!=='david'||segment!=='ark')return '';const current=normalizeDavidPhase(phase),moment=davidArkPhases.find(p=>p.id===current);
 const context=`<h4>${moment.heading}</h4><p>${moment.intro}</p><p>${scriptureLinks(moment.passage).map(l=>`<a href="${l.url}" target="_blank" rel="noopener noreferrer">${l.label} · CSBT ↗</a>`).join(' · ')}</p>`;
 return `<section class="narrative-moments" aria-label="約櫃遷移的不同時刻"><span>同一章，也有停留與新的開始</span><div>${davidArkPhases.map((p,i)=>`<button data-narrative-phase="${p.id}" aria-pressed="${p.id===current}"><small>${i+1}</small>${p.name}</button>`).join('')}</div>${compact?`<details class="narrative-moment-context"><summary>時刻脈絡與經文</summary>${context}</details>`:context}</section>`;
}
export const chapterForPerson=(island,person)=>narrativeChapters[island]?.find(s=>s.person===person)?.id;
export function narrativeChapterPicker(island,id,phase=null,{compact=false}={}){
 if(island==='exodus')return exodusChapterPicker(id);
 const chapters=narrativeChapters[island];if(!chapters)return '';
 const active=chapterById(island,id)||chapters[0];
 return `<nav class="exodus-chapters" aria-label="${island==='exile'?'被擄巴比倫分章閱讀':island==='kingdoms'?'分裂王國與先知分章敘事':island==='david'?'撒母耳與大衛分章敘事':island==='judges'?'士師與路得分章敘事':island==='sinai'?'西奈與曠野分章敘事':island==='joseph'?'約瑟與埃及分章敘事':island==='abraham'?'列祖旅程分章敘事':island==='paul'?'保羅旅程分城敘事':'歸回建殿分章敘事'}"><span>${island==='exile'?'三段閱讀 · 先總覽，再分清不同文本處境':island==='kingdoms'?'三段敘事 · 分清示劍、兩處設立與阿摩司世代':island==='david'?'三段敘事 · 羊群、王城、遷移與安放':island==='judges'?'三段敘事 · 拾穗、夜與黎明、城門見證':island==='sinai'?'三段敘事 · 每日需要、供水、山前聆聽':island==='joseph'?'三段敘事 · 分清離鄉、饑荒與相認':island==='abraham'?'三段敘事 · 跟著地名與不同時刻':island==='paul'?'三次旅程 · 切換不同城市與時刻':'三段敘事 · 切換不同歷史階段'}</span><div>${chapters.map(s=>`<button data-narrative-segment="${s.id}" aria-pressed="${s.id===active.id}"><small>${s.number}</small>${s.name}</button>`).join('')}</div><p>${scriptureLinks(active.passage).map(l=>`<a href="${l.url}" target="_blank" rel="noopener noreferrer">${l.label} · CSBT ↗</a>`).join(' · ')} · 第 ${active.number} 段</p>${island==='paul'?`<details class="journey-itinerary"><summary>本次行程怎麼接起來？</summary><p>${active.route}</p><small>${active.routeNote}</small></details><p>另讀：<a href="${scriptureLinks('Acts 27-28')[0].url}" target="_blank" rel="noopener noreferrer">押解赴羅馬 · 徒 27–28 · CSBT ↗</a></p>`:''}${narrativePhasePicker(island,active.id,phase,compact)}</nav>`;
}
