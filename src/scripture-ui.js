import { scriptureLinks, scriptureVersion } from './scripture.js';
import { icon } from './icons.js';

const external = 'target="_blank" rel="noopener noreferrer"';
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function scriptureReferences(reference, className = 'stop-reference') {
  return `<div class="scripture-references" aria-label="經文連結：YouVersion CSBT">${scriptureLinks(reference).map(link =>
    `<a class="${className}" href="${link.url}" title="${escape(link.label)} · ${scriptureVersion.name}" ${external}>${icon('book', 13)}${escape(link.label)}${icon('external', 12)}</a>`).join('')}</div>`;
}

export function scriptureReading(reference, label) {
  const links = scriptureLinks(reference);
  return `<div class="scripture-reading"><a class="scripture-link" href="${links[0].url}" ${external}>${icon('book', 17)}<span>${escape(label)}<small>${scriptureVersion.name}${links.length > 1 ? ' · 從第一段開始' : ''}</small></span>${icon('external', 14)}</a>${links.length > 1 ? `<details class="scripture-passages"><summary>選擇章節（${links.length}）</summary>${scriptureReferences(reference)}</details>` : ''}</div>`;
}

export function sourceMarkup(source) {
  if (source.scripture) return `<section class="source-item scripture-source"><strong>${escape(source.title)}</strong><p>${escape(source.note)}</p><small>${scriptureVersion.name}</small>${scriptureReferences(source.scripture)}</section>`;
  return `<a class="source-item" href="${escape(source.url)}" ${external}><strong>${escape(source.title)}${icon('external', 13)}</strong><p>${escape(source.note)}</p></a>`;
}
