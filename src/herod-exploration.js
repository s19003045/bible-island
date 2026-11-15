import {proxyHeight} from './walk-data.js';

// Bounded interpretive route outside the inner sacred courts. Not a surveyed entrance plan.
export const herodSpawn=[68,.03,132];
export const herodSurfaces=[
 {id:'south-approach',x1:52,x2:84,z1:100,z2:135},
 {id:'south-public',x1:51,x2:119,z1:45,z2:101},
 {id:'east-passage',x1:110,x2:119,z1:-89,z2:46},
 {id:'north-colonnade',x1:18,x2:119,z1:-98,z2:-78},
 {id:'stone-teaching',x1:82,x2:119,z1:-79,z2:-53},
];
export const herodProxies=[{id:'herod-approach-flight',kind:'stairs',x1:52,x2:84,z1:102.85,z2:129.5,
 axis:'z',start:129.5,end:102.85,baseHeight:.03,rise:8,riserHeight:8/28}];
export function herodFloor(x,z){
 const proxy=herodProxies.find(p=>x>=p.x1&&x<=p.x2&&z>=p.z1&&z<=p.z2);
 return proxy?proxyHeight(proxy,x,z):z>129.5?.03:8.03;
}
const node=(id,name,action,slots,lookAt,tags,weight=1)=>({id,name,action,weight,capacity:slots.length,
 slots:slots.map(([x,z])=>[x,herodFloor(x,z),z]),lookAt,tags,dwell:action==='Interact'?[8,18]:[5,14]});
const row=(x,z)=>[[x,z],[x+1.4,z],[x+2.8,z]];
export const herodPOIs=[
 node('pilgrim-gather','同行者聚集處','Idle',[[77,54]],[68,102],['pilgrim']),
 node('pilgrim-view','院界外觀望','LookAround',[[78,49]],[54,0],['pilgrim'],2),
 node('pilgrim-rest','回望上行階梯','Idle',[[72,96]],[68,110],['pilgrim']),
 node('south-entry','入口平台停留','LookAround',row(59,98),[68,112],['south-visitor']),
 node('south-flight','階梯上行觀察','LookAround',[[61,114],[63,114]],[68,100],['south-visitor']),
 node('south-steps-foot','階梯下歇腳','Idle',row(72,132),[68,112],['south-visitor']),
 node('south-colonnade','柱廊陰影下','Idle',row(62,89),[72,90],['south-visitor']),
 node('south-landing-rest','上段階梯旁停留','Idle',row(74,106),[68,114],['south-visitor']),
 node('south-court-center','院中歇腳','Idle',row(80,80),[54,0],['south-visitor']),
 node('south-rest','同行隊伍旁','LookAround',row(59,126),[68,115],['south-visitor']),
 node('south-center','院中同行者','Idle',row(69,74),[54,0],['south-visitor']),
 node('south-east','東側往來','LookAround',row(91,75),[82,42],['south-visitor']),
 node('south-court','外院通道','LookAround',row(95,61),[54,0],['south-visitor']),
 node('south-boundary','在界線外觀察','LookAround',row(87,49),[83,43],['south-visitor']),
 node('south-west','院中相遇處','Idle',row(56,60),[54,0],['south-visitor']),
 node('east-return','東側南段','LookAround',row(111,36),[82,0],['east-visitor']),
 node('east-middle','東側中段','Idle',row(111,5),[54,0],['east-visitor']),
 node('east-north','東側北段','LookAround',row(111,-25),[0,-43],['east-visitor']),
 node('east-shade','柱廊旁停留','Idle',row(111,-47),[94,-60],['east-visitor']),
 node('stone-explain','石作教學處','Interact',[[92,-63]],[94,-60],['stone-worker'],2),
 node('stone-observe','石材尺度觀察','LookAround',[[98,-66]],[94,-60],['stone-worker']),
 node('stone-rest','工藝解說旁歇腳','Idle',[[96,-72]],[0,0],['stone-worker']),
 node('listener-shade','柱廊中的聆聽處','Idle',[[24,-90]],[31,-88],['listener'],2),
 node('listener-question','柱間停留','LookAround',[[30,-90]],[0,0],['listener']),
 node('listener-return','柱廊外側回望','Idle',[[25,-81]],[0,0],['listener']),
 node('north-assembly','柱廊外聚集','Idle',row(23,-82),[0,0],['north-visitor']),
 node('north-middle','柱廊往來','LookAround',row(45,-90),[0,0],['north-visitor']),
 node('north-walk','北側觀察通道','Idle',row(65,-82),[0,0],['north-visitor']),
 node('north-east','柱廊轉角','LookAround',row(95,-90),[0,0],['north-visitor']),
];
export const herodObjects=[
 {id:'herod-stone',name:'石材接縫教學模型',position:[94,8.91,-60],approach:[94,8.03,-57.8],lookAt:[94,9.25,-60],stop:'temple',
  description:'以縮小石塊示意加工表面、邊緣與接縫，並非從聖殿拆下的原石或某一塊出土石材的掃描。形制、刀痕與工作桌屬教學補足。',
  observation:'先比較真人與平台牆，再看近景。馬可的讚嘆與約翰的建造年數，分屬哪兩段敘事？',passage:'Mark 13:1-2;John 2:19-22'},
 {id:'herod-boundary',name:'院界與通行範圍示意',position:[81,8.91,46.5],approach:[81,8.03,48.6],lookAt:[81,9.2,46.5],stop:'steps',
  description:'縮小教具把低石欄、院牆與門的空間關係分開呈現。約瑟夫斯描述圍界與進入限制；此處構件不摹寫警告碑，不作古代原物的精確複製。',
  observation:'對照眼前的低欄與較高院牆。為何能在教學視圖剖看建築，並不代表古代每一位訪客都可穿越？',passage:'Luke 2:41-50',source:{label:'約瑟夫斯《猶太戰記》5.5.2',url:'https://sacred-texts.com/jud/josephus/war-5.htm'}},
 {id:'herod-capital',name:'柱廊構件教學模型',position:[31,8.91,-88],approach:[31,8.03,-85.3],lookAt:[31,9.25,-88],stop:'portico',
  description:'縮小展示柱身、柱頭與上部承托，方便在人的視線高度觀察。葉飾、曲線及組裝方式為示意，並非已確認的所羅門廊出土柱頭。',
  observation:'先抬頭比較柱與人的高度，再分清路加的聆聽敘事、約翰的所羅門廊，以及現代模型所選的柱式。',passage:'Luke 2:46-47;John 10:22-23'},
];
export function herodAllowed(agent,p){
 if(['pilgrim','south-visitor'].includes(agent.role))return p[2]>=45;
 if(agent.role==='east-visitor')return p[0]>=110;
 if(['listener','north-visitor'].includes(agent.role))return p[2]<=-78;
 if(agent.role==='stone-worker')return p[0]>=82&&p[2]<=-55;
 return true;
}
export const herodSpawnCandidates=[];
for(const s of herodSurfaces)for(let x=s.x1+1;x<s.x2-1;x+=2.4)for(let z=s.z1+1;z<s.z2-1;z+=2.4)herodSpawnCandidates.push([x,herodFloor(x,z),z]);
