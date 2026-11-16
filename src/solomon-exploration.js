import {proxyHeight} from './walk-data.js';

// A bounded teaching court. This platform, stair and route are not an excavated plan.
export const solomonSpawn=[37,.31,0];
export const solomonSurfaces=[{id:'court',x1:9,x2:40,z1:-23,z2:23}];
export const solomonProxies=[{id:'solomon-court-flight',kind:'stairs',x1:16.5,x2:18.5,z1:-2.2,z2:2.2,
  axis:'x',start:18.5,end:16.5,baseHeight:.31,rise:.99,riserHeight:.2475}];
export function solomonFloor(x,z){
  const proxy=solomonProxies.find(p=>x>=p.x1&&x<=p.x2&&z>=p.z1&&z<=p.z2);
  return proxy?proxyHeight(proxy,x,z):x<=16.5&&Math.abs(z)<=5.4?1.3:.31;
}
const node=(id,name,action,slots,lookAt,tags,weight=1)=>({id,name,action,weight,capacity:slots.length,
  slots:slots.map(([x,z])=>[x,solomonFloor(x,z),z]),lookAt,tags,dwell:action==='Interact'?[8,17]:[4,12]});
export const solomonPOIs=[
  node('bronze-explain','銅器解說處','Interact',[[26,17]],[22,12],['bronze-worker'],2),
  node('bronze-view','從側面觀察牛座','LookAround',[[26.5,12]],[22,12],['bronze-worker']),
  node('bronze-rest','銅器旁歇腳','Idle',[[28.5,18]],[22,12],['bronze-worker']),
  node('singer-gather','歌者敘事解說處','Interact',[[35,-17]],[24,-2],['singer'],2),
  node('singer-view','回望殿宇','LookAround',[[33,-20]],[8,0],['singer']),
  node('singer-rest','院邊停留','Idle',[[37,-12]],[24,-2],['singer']),
  node('visitor-columns','比較柱與人的尺度','LookAround',[[15.8,2],[15.8,-2]],[14.2,3.4],['visitor']),
  node('visitor-court','院中對照會幕','Idle',[[19,-18],[20.3,-18]],[8,0],['visitor']),
  node('visitor-sea','遠看銅海','LookAround',[[23,17],[24.3,17]],[22,12],['visitor']),
  node('court-entry','院中往來','Idle',[[35,4],[36.3,4],[37.6,4]],[14,0],['resident']),
  node('court-north','北側院邊','LookAround',[[12,-16],[13.3,-16],[14.6,-16]],[14,-3.4],['resident']),
  node('court-north-east','院中歇腳','Idle',[[27,-19],[28.3,-19],[29.6,-19]],[8,0],['resident']),
  node('court-south','南側觀察區','LookAround',[[12,19],[13.3,19],[14.6,19]],[22,12],['resident']),
  node('court-south-east','東南通道','Idle',[[34,19],[35.3,19],[36.6,19]],[22,12],['resident']),
  node('court-east','東側通道','LookAround',[[36,9],[37.3,9],[38.6,9]],[22,12],['resident']),
  node('court-west-north','殿側回望','LookAround',[[11,-10],[12.3,-10],[13.6,-10]],[8,0],['resident']),
  node('court-sea-side','銅海南側','LookAround',[[19,18],[20.3,18],[21.6,18]],[22,12],['resident']),
  node('court-southeast-rest','院邊停留','Idle',[[30,13],[31.3,13],[32.6,13]],[22,12],['resident']),
];
export const solomonObjects=[
  {id:'pillar-capital',name:'柱頂與石榴教學模型',position:[14.1,2.1,0],approach:[16,1.3,.8],lookAt:[14.1,2.5,.3],stop:'pillars',
    description:'院中教具呈現百合花式柱頂、交錯網飾與兩排石榴，並非移下原柱頂。教具依列王紀上 7:20 採兩排共兩百顆的配置；花瓣、鏈條路徑與組裝方式是復原選擇，不是出土原物的複製。',
    observation:'先向上比較真人與銅柱的尺度，再看近景。哪些構件有文字依據？哪些曲線是模型的補足？',passage:'1 Kings 7:15-22'},
  {id:'solomon-sea',name:'銅海與十二牛座',position:[22,2.625,12],approach:[22,.31,14.9],lookAt:[22,2.8,14.2],viewTarget:[22,1.7,12],stop:'sea',sceneOnly:true,
    description:'近景縮小展示銅海和十二隻鑄牛，每三隻朝向一方，後身向內。場景盆體依十肘直徑、五肘盆高及本專案一肘 0.45 m 的選擇建模；牛座高度、牛形與盆曲線仍屬復原。不要把盆高與包含牛座的總高混為一談。這不是會幕洗濯盆或可拿起的日用器皿。',
    observation:'旋轉數四個方向的牛，再比較會幕洗濯盆。列王紀記載的形制，與歷代志說明的用途有何關聯？',passage:'1 Kings 7:23-26;2 Chronicles 4:6;Exodus 30:17-21'},
  {id:'temple-masonry',name:'石材與香柏木構造示意',position:[32,1.06,-12],approach:[32,.31,-10.1],lookAt:[32,1.4,-11.8],stop:'sanctuary',
    description:'以局部剖面比較預先加工的石材背體與香柏木內襯。木覆面可暫時分開觀察，並非古人把內襯留成這樣；石塊排法、接縫、木紋、接口與陳列桌均為教學安排，不是出土構件或完整殿牆的等比復原。',
    observation:'對照會幕可搬動的板架：固定殿宇的石材、木材與覆面，怎樣改變空間及搬運方式？',passage:'1 Kings 6:7-18;Exodus 26:15-30'},
];
export function solomonAllowed(agent,p){
  if(agent.role==='bronze-worker')return p[0]>=24.5&&p[2]>=8;
  if(agent.role==='singer')return p[0]>=31&&p[2]<=-8;
  return true;
}
export const solomonSpawnCandidates=[];
for(let x=10;x<=39;x+=1.5)for(let z=-21;z<=21;z+=1.5)solomonSpawnCandidates.push([x,solomonFloor(x,z),z]);
