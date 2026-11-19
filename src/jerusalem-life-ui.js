import {lifeRoleLabels,lifeHistoricalNote} from './jerusalem-life-content.js';

export function lifeObservationMarkup(island){
  if(island!=='jerusalem')return '';
  return `<details class="life-observation"><summary>看看居民的一天</summary><p>走近看雙手如何拿取、放下，以及人物如何回到日常工作。</p><div class="life-observation-roles">${Object.entries(lifeRoleLabels).map(([id,label])=>`<button data-life-observe="${id}" aria-pressed="false">${label}</button>`).join('')}</div><p data-life-observation-status role="status">選擇人物，鏡頭會跟隨他的日常活動。</p><button data-life-observe-stop hidden>停止跟隨鏡頭</button><details><summary>${lifeHistoricalNote.label}</summary><p>${lifeHistoricalNote.text}</p>${lifeHistoricalNote.sources.map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label} ↗</a>`).join('')}</details></details>`;
}

export function updateLifeObservation(info,root=document){
  root.querySelectorAll('[data-life-observe]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lifeObserve===info?.id));
  root.querySelectorAll('[data-life-observe-stop]').forEach(b=>{b.hidden=!info;});
  const text=info?`${lifeRoleLabels[info.id]||'居民'} · ${info.label}`:'選擇人物，鏡頭會跟隨他的日常活動。';
  root.querySelectorAll('[data-life-observation-status]').forEach(p=>{if(p.textContent!==text)p.textContent=text;});
}
