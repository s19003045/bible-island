import {churchSegments,churchReadingPhases,normalizeChurchPhase} from './church-exploration.js';
import {passionSegments,passionReadingPhases,normalizePassionPhase} from './passion-exploration.js';
import {parablesSegments,parablesReadingPhases,normalizeParablesPhase} from './parables-exploration.js';
import {samariaSegments,samariaReadingPhases,normalizeSamariaPhase} from './samaria-exploration.js';
import {galileeSegments,galileeReadingPhases,normalizeGalileePhase} from './galilee-exploration.js';
import {nativitySegments,nativityReadingPhases,normalizeNativityPhase} from './nativity-exploration.js';
import {intertestamentSegments} from './intertestament-exploration.js';
import {nehemiahSegments,nehemiahReadingPhases,normalizeNehemiahPhase} from './nehemiah-exploration.js';
import {exileSegments} from './exile-exploration.js';
import {kingdomsSegments} from './kingdoms-exploration.js';
import {davidSegments,davidArkPhases} from './david-exploration.js';
import {normalizeDavidPhase} from './artifact-phases.js';
import {ruthSegments} from './ruth-exploration.js';
import {sinaiSegments} from './sinai-exploration.js';
import {josephSegments} from './joseph-exploration.js';
import {abrahamSegments} from './abraham-exploration.js';
import {paulSegments} from './paul-exploration.js';
import {exodusSegments} from './exodus-exploration.js';
import {returnSegments} from './return-exploration.js';
import {exodusChapterPicker} from './exodus-ui.js';
import {scriptureLinks} from './scripture.js';
export const narrativeChapters={church:churchSegments,passion:passionSegments,parables:parablesSegments,samaria:samariaSegments,galilee:galileeSegments,nativity:nativitySegments,intertestament:intertestamentSegments,nehemiah:nehemiahSegments,exile:exileSegments,kingdoms:kingdomsSegments,david:davidSegments,judges:ruthSegments,sinai:sinaiSegments,joseph:josephSegments,abraham:abrahamSegments,paul:paulSegments,exodus:exodusSegments,'second-temple':returnSegments};
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
export const narrativePhasesFor=(island,segment)=>island==='church'?churchReadingPhases[segment]||[]:island==='passion'?passionReadingPhases[segment]||[]:island==='parables'?parablesReadingPhases[segment]||[]:island==='samaria'?samariaReadingPhases[segment]||[]:island==='galilee'?galileeReadingPhases[segment]||[]:island==='nativity'?nativityReadingPhases[segment]||[]:island==='nehemiah'?nehemiahReadingPhases[segment]||[]:island==='david'&&segment==='ark'?davidArkPhases:[];
export function stateNarrativePhase(state,island=state.selected){
 const segment=stateChapter(state,island),phases=narrativePhasesFor(island,segment);if(!phases.length)return null;
 const stored=['nehemiah','nativity','galilee','samaria','parables','passion','church'].includes(island)?state.narrativePhases?.[island]?.[segment]:state.narrativePhases?.[island];
 return phases.some(p=>p.id===stored)?stored:phases[0].id;
}
export function setNarrativePhase(state,island,id){
 const segment=stateChapter(state,island);if(!narrativePhasesFor(island,segment).some(p=>p.id===id))return false;
 const all=state.narrativePhases??={};if(['nehemiah','nativity','galilee','samaria','parables','passion','church'].includes(island)){if(!all[island]||typeof all[island]!=='object'||Array.isArray(all[island]))all[island]={};all[island][segment]=id;}else all[island]=id;return true;
}
export function narrativePhasePicker(island,segment,phase,compact=false){
 const phases=narrativePhasesFor(island,segment);if(!phases.length)return '';
 const current=island==='church'?normalizeChurchPhase(segment,phase):island==='passion'?normalizePassionPhase(segment,phase):island==='parables'?normalizeParablesPhase(segment,phase):island==='samaria'?normalizeSamariaPhase(segment,phase):island==='galilee'?normalizeGalileePhase(segment,phase):island==='nativity'?normalizeNativityPhase(segment,phase):island==='nehemiah'?normalizeNehemiahPhase(segment,phase):normalizeDavidPhase(phase),moment=phases.find(p=>p.id===current);
 const context=`<h4>${moment.heading}</h4><p>${moment.intro}</p><p>${scriptureLinks(moment.passage).map(l=>`<a href="${l.url}" target="_blank" rel="noopener noreferrer">${l.label} · CSBT ↗</a>`).join(' · ')}</p>`;
 return `<section class="narrative-moments" aria-label="${island==='church'?'聚集、日常與安提阿的分時閱讀':island==='passion'?'同席、苦難與清晨的分時閱讀':island==='parables'?'聆聽、尋回與預備的閱讀時刻':island==='samaria'?'井旁、道路與照顧的閱讀時刻':island==='galilee'?'加利利的分章閱讀與回看時刻':island==='nativity'?'降生與成長的不同閱讀時刻':island==='nehemiah'?'尼希米敘事的不同時刻':'約櫃遷移的不同時刻'}"><span>${island==='church'?'分清當天、持續日常與較後跨地關係':island==='passion'?'按馬可分清時刻、地方與人的回應':island==='parables'?'分清講述、敘事與結語的回應':island==='samaria'?'分清問答、時刻與持續的回應':island==='galilee'?'分清工作、先後與人的回應':island==='nativity'?'分清地點、時刻與人的處境':island==='nehemiah'?'同一章，也分清先後與構件狀態':'同一章，也有停留與新的開始'}</span><div>${phases.map((p,i)=>`<button data-narrative-phase="${p.id}" aria-pressed="${p.id===current}"><small>${i+1}</small>${p.name}</button>`).join('')}</div>${compact?`<details class="narrative-moment-context"><summary>時刻脈絡與經文</summary>${context}</details>`:context}</section>`;
}
export const chapterForPerson=(island,person)=>narrativeChapters[island]?.find(s=>s.person===person)?.id;
export function narrativeChapterPicker(island,id,phase=null,{compact=false}={}){
 if(island==='exodus')return exodusChapterPicker(id);
 const chapters=narrativeChapters[island];if(!chapters)return '';
 const active=chapterById(island,id)||chapters[0];
 return `<nav class="exodus-chapters" aria-label="${island==='church'?'聚集、日常與安提阿分章閱讀':island==='passion'?'同席、苦難與清晨分章閱讀':island==='parables'?'三段獨立比喻分章閱讀':island==='samaria'?'井旁敘事與道路比喻分章閱讀':island==='galilee'?'加利利湖岸、聚集與家屋分章閱讀':island==='nativity'?'降生、成長與成年返鄉分章閱讀':island==='intertestament'?'新約背景三個不同處境':island==='nehemiah'?'尼希米分章與分時閱讀':island==='exile'?'被擄巴比倫分章閱讀':island==='kingdoms'?'分裂王國與先知分章敘事':island==='david'?'撒母耳與大衛分章敘事':island==='judges'?'士師與路得分章敘事':island==='sinai'?'西奈與曠野分章敘事':island==='joseph'?'約瑟與埃及分章敘事':island==='abraham'?'列祖旅程分章敘事':island==='paul'?'保羅旅程分城敘事':'歸回建殿分章敘事'}"><span>${island==='church'?'三段閱讀 · 聚集、日常與安提阿':island==='passion'?'三段閱讀 · 同席、苦難與清晨':island==='parables'?'三段比喻 · 聆聽、尋回與預備':island==='samaria'?'三個窗口 · 井旁、道路與持續照顧':island==='galilee'?'三個窗口 · 湖岸、回看教導、家屋':island==='nativity'?'三個窗口 · 降生、成長與成年返鄉':island==='intertestament'?'三個窗口 · 諭令、銀幣、不同聽眾':island==='nehemiah'?'三段閱讀 · 察看、修建與聆聽':island==='exile'?'三段閱讀 · 先總覽，再分清不同文本處境':island==='kingdoms'?'三段敘事 · 分清示劍、兩處設立與阿摩司世代':island==='david'?'三段敘事 · 羊群、王城、遷移與安放':island==='judges'?'三段敘事 · 拾穗、夜與黎明、城門見證':island==='sinai'?'三段敘事 · 每日需要、供水、山前聆聽':island==='joseph'?'三段敘事 · 分清離鄉、饑荒與相認':island==='abraham'?'三段敘事 · 跟著地名與不同時刻':island==='paul'?'三次旅程 · 切換不同城市與時刻':'三段敘事 · 切換不同歷史階段'}</span><div>${chapters.map(s=>`<button data-narrative-segment="${s.id}" aria-pressed="${s.id===active.id}"><small>${s.number}</small>${s.name}</button>`).join('')}</div><p>${scriptureLinks(active.passage).map(l=>`<a href="${l.url}" target="_blank" rel="noopener noreferrer">${l.label} · CSBT ↗</a>`).join(' · ')} · 第 ${active.number} 段</p>${island==='paul'?`<details class="journey-itinerary"><summary>本次行程怎麼接起來？</summary><p>${active.route}</p><small>${active.routeNote}</small></details><p>另讀：<a href="${scriptureLinks('Acts 27-28')[0].url}" target="_blank" rel="noopener noreferrer">押解赴羅馬 · 徒 27–28 · CSBT ↗</a></p>`:''}${narrativePhasePicker(island,active.id,phase,compact)}</nav>`;
}
