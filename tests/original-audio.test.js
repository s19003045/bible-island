import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {scores,effectGroups,scoreForScene} from '../src/soundtrack.js';
import {themes} from '../src/content.js';
const root=new URL('../public/audio/original/',import.meta.url);
test('five shipped loop pairs and every physical effect match verified original audio provenance',async()=>{
 const base=JSON.parse(await readFile(new URL('provenance.json',root))),moods=JSON.parse(await readFile(new URL('moods-provenance.json',root))),music=[base.music,...moods.moods];
 assert.equal(music.length,5);assert.equal(moods.pass,true);let verified=0;
 for(const entry of [...music,...base.effects])for(const file of entry.files.filter(f=>/\.(ogg|mp3)$/.test(f.path))){const bytes=await readFile(new URL(file.path,root));assert.equal(bytes.length,file.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);verified++;}
 assert.equal(verified,90);assert.equal(new Set(themes.map(t=>scoreForScene(t.id).id)).size,5);
 for(const score of Object.values(scores)){const entry=music.find(m=>m.files.some(f=>f.path===score.src.replace('audio/original/','')+'.ogg'));assert.ok(entry);assert.equal(score.seconds,entry.frames/(entry.sampleRate??base.sampleRate));}
 assert.equal(Object.values(effectGroups).flat().length,40);
});
