import {scriptureLinks} from './scripture.js';
import {exodusSegments,exodusSegmentById} from './exodus-exploration.js';
export function exodusChapterPicker(segment){
 const active=exodusSegmentById.get(segment)||exodusSegments[0];
 return `<nav class="exodus-chapters" aria-label="出埃及分段敘事"><span>三段敘事 · 不同時間與地點</span><div>${exodusSegments.map(s=>`<button data-exodus-segment="${s.id}" aria-pressed="${s.id===active.id}"><small>${s.number}</small>${s.name}</button>`).join('')}</div><p><a href="${scriptureLinks(active.passage)[0].url}" target="_blank" rel="noopener noreferrer">${active.reference} · CSBT ↗</a> · 第 ${active.number} 段</p></nav>`;
}
