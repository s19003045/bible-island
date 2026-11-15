import test from 'node:test';
import assert from 'node:assert/strict';
import { themes, sources, themeById } from '../src/content.js';
import { historicalScenes } from '../src/historical-data.js';
import { peopleByIsland, dialogueSources } from '../src/people-data.js';
import { scriptureLinks } from '../src/scripture.js';
import { scriptureReading, scriptureReferences, sourceMarkup } from '../src/scripture-ui.js';
import { peopleMarkup } from '../src/people-ui.js';

const passages = reference => scriptureLinks(reference).map(link => new URL(link.url).pathname.split('/').at(-1));

test('Chinese and English references retain exact verses and the correct USFM book', () => {
  assert.deepEqual(passages('約翰福音 1:1–5'), ['JHN.1.1-5.CSBT']);
  assert.deepEqual(passages('John 1:1-5'), passages('約翰福音 1:1–5'));
  assert.deepEqual(passages('列王紀上 7:23–26；歷代志下 4:6'), ['1KI.7.23-26.CSBT', '2CH.4.6.CSBT']);
  assert.deepEqual(passages('撒母耳記上 16:1–13；撒母耳記下 5:6–12'), ['1SA.16.1-13.CSBT', '2SA.5.6-12.CSBT']);
});

test('chapter ranges, omitted book names and separate verses remain individually accessible', () => {
  assert.deepEqual(passages('Exodus 25-27;30;40'), ['EXO.25.CSBT', 'EXO.26.CSBT', 'EXO.27.CSBT', 'EXO.30.CSBT', 'EXO.40.CSBT']);
  assert.deepEqual(passages('出埃及記 25:31–40；26:35'), ['EXO.25.31-40.CSBT', 'EXO.26.35.CSBT']);
  assert.deepEqual(passages('約書亞記 4:1–9、19–24'), ['JOS.4.1-9.CSBT', 'JOS.4.19-24.CSBT']);
  assert.deepEqual(passages('出埃及記 12:8、34、39'), ['EXO.12.8.CSBT', 'EXO.12.34.CSBT', 'EXO.12.39.CSBT']);
  assert.deepEqual(passages('使徒行傳 13:4–13；27'), ['ACT.13.4-13.CSBT', 'ACT.27.CSBT']);
});

test('cross-chapter passages open valid separate chapters and preserve the starting-verse cue', () => {
  assert.deepEqual(passages('出埃及記 13:17–14:31'), ['EXO.13.CSBT', 'EXO.14.1-31.CSBT']);
  assert.equal(scriptureLinks('出埃及記 13:17–14:31')[0].label, '出埃及記 13 章（17 節起）');
  assert.deepEqual(passages('使徒行傳 21:37–22:2'), ['ACT.21.CSBT', 'ACT.22.1-2.CSBT']);
  assert.deepEqual(passages('馬可福音 15:42–16:8'), ['MRK.15.CSBT', 'MRK.16.1-8.CSBT']);
});

test('whole books and each thematic reading range expose every cited chapter', () => {
  assert.equal(scriptureLinks('阿摩司書').length, 9);
  assert.equal(scriptureLinks(themeById.get('tabernacle').book).length, 16);
  assert.deepEqual(passages(themeById.get('paul').book), [13,14,15,16,17,18,19,20,21,27,28].map(c => `ACT.${c}.CSBT`));
  assert.ok(passages(themeById.get('nativity').book).includes('MAT.2.CSBT'));
  assert.ok(passages(themeById.get('david').book).includes('1SA.16.CSBT'));
});

test('all authored scripture references across islands, stops, dialogue and sources use CSBT 312', () => {
  const references = themes.flatMap(t => [t.book, ...t.stops.map(s => s.reference)]);
  for (const scene of Object.values(historicalScenes)) for (const source of scene.sources) {
    if (source.scripture) references.push(source.scripture);
  }
  for (const people of Object.values(peopleByIsland)) for (const person of people) for (const topic of person.topics) {
    for (const turn of [topic, topic.followup].filter(t => t?.passage)) {
      if (!['Josephus', 'UpperCity'].includes(turn.passage)) references.push(turn.passage);
    }
  }
  for (const reference of references) {
    const links = scriptureLinks(reference);
    assert.ok(links.length > 0, reference);
    for (const link of links) {
      const url = new URL(link.url);
      assert.equal(url.origin, 'https://www.bible.com', reference);
      assert.match(url.pathname, /^\/zh-TW\/bible\/312\/[1-3A-Z]{3}\.\d+(?:\.\d+(?:-\d+)?)?\.CSBT$/, reference);
    }
  }
  assert.match(sources[0].title, /YouVersion.*CSBT/);
  assert.equal(new URL(sources[0].url).pathname, '/zh-TW/versions/312');
});

test('reading, stop, historical source and NPC markup expose every passage link', () => {
  const reference = 'John 18:1;Luke 19:29-37';
  const source = { title: '谷地與山路', note: '經文參照', scripture: reference };
  const person = peopleByIsland.jerusalem.find(p => p.topics.some(t => t.passage === reference));
  const topic = person.topics.find(t => t.passage === reference);
  const dialogue = peopleMarkup({ selected: 'jerusalem', actor: person.id, dialogue: [topic] });
  for (const markup of [scriptureReading(reference, '城、谷地與山坡'), scriptureReferences(reference), sourceMarkup(source), dialogue]) {
    for (const link of scriptureLinks(reference)) assert.ok(markup.includes(`href="${link.url}"`));
  }
  const reading = scriptureReading('Exodus 25-40', '出埃及記 25–40 章');
  assert.match(reading, /<summary>選擇章節（16）<\/summary>/);
  assert.match(reading, /YouVersion · CSBT 中文標準譯本/);
});

test('non-scripture history sources retain their research destinations', () => {
  assert.equal(new URL(dialogueSources('UpperCity', '住居發掘')[0].url).hostname, 'www.gov.il');
  assert.equal(new URL(dialogueSources('Josephus', '猶太戰記')[0].url).hostname, 'sacred-texts.com');
  assert.equal(dialogueSources('Josephus', '猶太戰記')[0].label, '猶太戰記');
  assert.ok(sources.some(source => new URL(source.url).pathname.startsWith('/learn/')));
});

test('invalid references fail explicitly instead of producing misleading reading links', () => {
  for (const reference of ['', 'Not a book 1', 'John 0', 'John 22', 'John 1:0', 'Exodus 27-25', 'Exodus 14:1-13:2']) {
    assert.throws(() => scriptureLinks(reference), /Invalid scripture reference/);
  }
});
