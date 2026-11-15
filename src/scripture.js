// YouVersion uses USFM book IDs and one chapter (or a verse range within it) per URL.
export const scriptureVersion = {
  name: 'YouVersion · CSBT 中文標準譯本',
  url: 'https://www.bible.com/zh-TW/versions/312',
};

const books = [
  ['GEN', '創世記', 'Genesis', 50], ['EXO', '出埃及記', 'Exodus', 40],
  ['LEV', '利未記', 'Leviticus', 27], ['NUM', '民數記', 'Numbers', 36],
  ['DEU', '申命記', 'Deuteronomy', 34], ['JOS', '約書亞記', 'Joshua', 24],
  ['JDG', '士師記', 'Judges', 21], ['RUT', '路得記', 'Ruth', 4],
  ['1SA', '撒母耳記上', '1 Samuel', 31], ['2SA', '撒母耳記下', '2 Samuel', 24],
  ['1KI', '列王紀上', '1 Kings', 22], ['2KI', '列王紀下', '2 Kings', 25],
  ['1CH', '歷代志上', '1 Chronicles', 29], ['2CH', '歷代志下', '2 Chronicles', 36],
  ['EZR', '以斯拉記', 'Ezra', 10], ['NEH', '尼希米記', 'Nehemiah', 13],
  ['EST', '以斯帖記', 'Esther', 10], ['JOB', '約伯記', 'Job', 42],
  ['PSA', '詩篇', 'Psalms', 150], ['PRO', '箴言', 'Proverbs', 31],
  ['ECC', '傳道書', 'Ecclesiastes', 12], ['SNG', '雅歌', 'Song of Songs', 8],
  ['ISA', '以賽亞書', 'Isaiah', 66], ['JER', '耶利米書', 'Jeremiah', 52],
  ['LAM', '耶利米哀歌', 'Lamentations', 5], ['EZK', '以西結書', 'Ezekiel', 48],
  ['DAN', '但以理書', 'Daniel', 12], ['HOS', '何西阿書', 'Hosea', 14],
  ['JOL', '約珥書', 'Joel', 3], ['AMO', '阿摩司書', 'Amos', 9],
  ['OBA', '俄巴底亞書', 'Obadiah', 1], ['JON', '約拿書', 'Jonah', 4],
  ['MIC', '彌迦書', 'Micah', 7], ['NAM', '那鴻書', 'Nahum', 3],
  ['HAB', '哈巴谷書', 'Habakkuk', 3], ['ZEP', '西番雅書', 'Zephaniah', 3],
  ['HAG', '哈該書', 'Haggai', 2], ['ZEC', '撒迦利亞書', 'Zechariah', 14],
  ['MAL', '瑪拉基書', 'Malachi', 4], ['MAT', '馬太福音', 'Matthew', 28],
  ['MRK', '馬可福音', 'Mark', 16], ['LUK', '路加福音', 'Luke', 24],
  ['JHN', '約翰福音', 'John', 21], ['ACT', '使徒行傳', 'Acts', 28],
  ['ROM', '羅馬書', 'Romans', 16], ['1CO', '哥林多前書', '1 Corinthians', 16],
  ['2CO', '哥林多後書', '2 Corinthians', 13], ['GAL', '加拉太書', 'Galatians', 6],
  ['EPH', '以弗所書', 'Ephesians', 6], ['PHP', '腓立比書', 'Philippians', 4],
  ['COL', '歌羅西書', 'Colossians', 4], ['1TH', '帖撒羅尼迦前書', '1 Thessalonians', 5],
  ['2TH', '帖撒羅尼迦後書', '2 Thessalonians', 3], ['1TI', '提摩太前書', '1 Timothy', 6],
  ['2TI', '提摩太後書', '2 Timothy', 4], ['TIT', '提多書', 'Titus', 3],
  ['PHM', '腓利門書', 'Philemon', 1], ['HEB', '希伯來書', 'Hebrews', 13],
  ['JAS', '雅各書', 'James', 5], ['1PE', '彼得前書', '1 Peter', 5],
  ['2PE', '彼得後書', '2 Peter', 3], ['1JN', '約翰一書', '1 John', 5],
  ['2JN', '約翰二書', '2 John', 1], ['3JN', '約翰三書', '3 John', 1],
  ['JUD', '猶大書', 'Jude', 1], ['REV', '啟示錄', 'Revelation', 22],
];
const aliases = books.flatMap(book => book.slice(0, 3).map(name => [name.toLowerCase(), book]))
  .sort((a, b) => b[0].length - a[0].length);

/** Expand every cited passage; never put unsupported cross-chapter/book ranges in a URL. */
export function scriptureLinks(reference) {
  const links = [];
  let book;
  const invalid = () => { throw new Error(`Invalid scripture reference: ${reference}`); };
  const add = (chapter, verse = '', suffix = '') => {
    if (!book || chapter < 1 || chapter > book[3]) invalid();
    links.push({
      label: `${book[1]} ${chapter}${verse ? `:${verse.replace('-', '–')}` : ' 章'}${suffix}`,
      url: `https://www.bible.com/zh-TW/bible/312/${book[0]}.${chapter}${verse ? `.${verse}` : ''}.CSBT`,
    });
  };
  const text = String(reference).trim().replace(/[–—]/g, '-').replace(/：/g, ':').replace(/章/g, '');
  if (!text) invalid();
  for (let group of text.split(/[;；]/)) {
    group = group.trim();
    const found = aliases.find(([name]) => group.toLowerCase().startsWith(name)
      && !/[a-z]/i.test(group.slice(name.length, name.length + 1)));
    if (found) { book = found[1]; group = group.slice(found[0].length).trim(); }
    if (!book) invalid();
    // A book without chapter numbers means the whole book, exposed as chapter links.
    if (!group) {
      if (!found) invalid();
      for (let chapter = 1; chapter <= book[3]; chapter++) add(chapter);
      continue;
    }
    let verseChapter;
    for (const part of group.split(/[,、]/).map(p => p.trim())) {
      let match = part.match(/^(\d+):(\d+)-(\d+):(\d+)$/);
      if (match) {
        const [, from, start, to, end] = match.map(Number);
        if (from >= to || start < 1 || end < 1) invalid();
        // Open the first chapter in full so readers can continue from the stated verse.
        add(from, '', `（${start} 節起）`);
        for (let chapter = from + 1; chapter < to; chapter++) add(chapter);
        add(to, end === 1 ? '1' : `1-${end}`);
        verseChapter = to;
        continue;
      }
      match = part.match(/^(?:(\d+):)?(\d+)(?:-(\d+))?$/);
      if (!match) invalid();
      const [, explicitChapter, first, last] = match;
      const from = Number(first), to = Number(last || first);
      if (from < 1 || to < from) invalid();
      if (explicitChapter) verseChapter = Number(explicitChapter);
      if (verseChapter !== undefined) add(verseChapter, `${from}${last ? `-${to}` : ''}`);
      else for (let chapter = from; chapter <= to; chapter++) add(chapter);
    }
  }
  return links.filter((link, index) => links.findIndex(other => other.url === link.url) === index);
}

// A primary reading entry starts at the first passage; UIs expose the full list alongside it.
export const scriptureUrl = reference => scriptureLinks(reference)[0].url;
export const scriptureSource = reference => ({ url: scriptureUrl(reference), scripture: reference });
