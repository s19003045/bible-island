import {peopleByIsland} from '../src/people-data.js';
import {personForMode} from '../src/learning-model.js';
const island=process.argv[2],people=peopleByIsland[island],childOnly=process.argv.includes('--child-only');
if(!people)throw new Error('Supply a valid island ID.');
const takes=people.map(person=>{
 const cues=childOnly?[]:[{key:'greeting',text:person.greeting}];
 if(!childOnly)for(const t of person.topics){cues.push({key:t.id,text:t.answer});if(t.followup)cues.push({key:t.id+'-followup',text:t.followup.answer});}
 const child=personForMode(person,island,'child');cues.push({key:'child-greeting',text:child.greeting});
 for(const t of child.topics){cues.push({key:'child-'+t.id,text:t.answer});if(t.followup)cues.push({key:'child-'+t.id+'-followup',text:t.followup.answer});}
 return {id:person.id,name:person.name,cues,text:cues.map(c=>c.text).join('\n\n')};
});
process.stdout.write(JSON.stringify(takes,null,2)+'\n');
