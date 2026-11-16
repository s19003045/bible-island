// Reading-space coordinates, never historical geography or a surveyed travel route.
export const atlasLayout={
  abraham:[-37,-16],joseph:[-27,-24],exodus:[-27,-11],sinai:[-39,1],tabernacle:[-25,5],jordan:[-14,-6],judges:[-12,8],
  david:[-4,-17],solomon:[7,-15],kingdoms:[12,-28],exile:[24,-22],
  'second-temple':[32,-8],nehemiah:[43,-15],intertestament:[43,0],
  nativity:[34,17],galilee:[23,15],samaria:[12,24],parables:[26,31],herod:[3,17],jerusalem:[2,29],passion:[-8,20],
  church:[-13,35],paul:[-26,28],letters:[-38,33],
};
export const atlasRegions=[
  {id:'patriarchs',name:'列祖與出埃及',position:[-30,-5]},
  {id:'kingdom',name:'王國與被擄',position:[9,-20]},
  {id:'return',name:'歸回與重建',position:[39,-7]},
  {id:'jesus',name:'耶穌的時代',position:[17,23]},
  {id:'church',name:'使徒與教會',position:[-27,31]},
];
const edge=(from,to,kind,type,text,primary=true)=>({id:`${from}:${to}`,from,to,kind,type,text,primary});
export const atlasRoutes=[
  edge('abraham','joseph','bridge','故事接續','從列祖家庭，讀到約瑟與家族來到埃及。'),
  edge('joseph','exodus','bridge','故事接續','家族來到埃及的敘事，提供出埃及的閱讀背景。'),
  edge('exodus','sinai','bridge','故事接續','離開埃及後，接著讀曠野供應與西奈立約。'),
  edge('sinai','tabernacle','bridge','故事接續','從立約與營地生活，走近會幕的建造。'),
  edge('tabernacle','jordan','bridge','故事接續','從曠野時期，延伸到過約旦河與進入迦南的敘事。'),
  edge('jordan','judges','bridge','故事接續','從進入迦南，接著認識士師與路得的生活背景。'),
  edge('judges','david','sea','故事接續','從士師時期，進入撒母耳與王國形成的敘事。'),
  edge('david','solomon','bridge','故事接續','從大衛與建殿準備，讀到所羅門建殿。'),
  edge('solomon','kingdoms','bridge','故事接續','從聯合王國，讀到分裂王國與先知。'),
  edge('kingdoms','exile','bridge','故事接續','分清王國與先知的背景，再閱讀被擄敘事。'),
  edge('exile','second-temple','time','故事接續','從被擄與歸回，讀到重建殿宇。'),
  edge('second-temple','nehemiah','bridge','背景延伸','比較殿宇重建與後來城牆重建的不同工程。'),
  edge('second-temple','intertestament','bridge','背景延伸','從歸回重建，延伸到波斯至羅馬的歷史背景。'),
  edge('intertestament','nativity','sea','背景延伸','認識帝國、語言與道路，再走進福音書的世界。'),
  edge('nativity','galilee','bridge','故事接續','從降生與成長敘事，走向加利利的湖與村落。'),
  edge('galilee','samaria','bridge','閱讀延伸','從加利利生活，延伸到路途與井旁相遇的敘事。'),
  edge('galilee','parables','bridge','主題延伸','從湖邊與村落的生活，理解比喻中的日常物件。'),
  edge('galilee','herod','sea','閱讀延伸','由加利利生活場景，接到耶路撒冷的聖殿背景。'),
  edge('herod','jerusalem','bridge','地理相鄰','將聖殿與耶路撒冷街區放在一起閱讀。'),
  edge('jerusalem','passion','bridge','故事接續','從城市與地勢，讀到耶穌最後一週的不同經文段落。'),
  edge('passion','church','time','故事接續','沿敘事先後，接到五旬節與初代教會。'),
  edge('church','paul','sea','故事接續','從耶路撒冷、安提阿等群體，延伸到保羅宣教。'),
  edge('paul','letters','sea','人物與書信','比較宣教旅程、送信者與群體朗讀的處境。'),
  edge('tabernacle','solomon','compare','空間比較','比較可搬遷的會幕與固定殿宇。',false),
  edge('solomon','second-temple','time','同地異時','分清第一聖殿與歸回重建的時代。',false),
  edge('second-temple','herod','time','同地異時','從歸回重建，切換到後來希律擴建的第二聖殿。',false),
  edge('exodus','jordan','compare','主題比較','比較出埃及渡海與過約旦河的敘事。',false),
];
export const atlasRouteById=new Map(atlasRoutes.map(r=>[r.id,r]));
export const atlasJourneys=[
  {id:'all',name:'群島主線',description:'沿時代與閱讀關係，從一座島走向下一段故事。',stops:[]},
  {id:'wilderness',name:'出埃及與會幕',description:'離開埃及，經過西奈，在營地走近會幕。',stops:['joseph','exodus','sinai','tabernacle','jordan']},
  {id:'temples',name:'聖殿的時代演變',description:'比較建築之前，先分清第一聖殿、歸回重建與希律擴建。',stops:['tabernacle','solomon','second-temple','herod']},
  {id:'gospels',name:'耶穌與耶路撒冷',description:'從家庭與村落，走向聖殿、山城與最後一週。',stops:['nativity','galilee','herod','jerusalem','passion']},
  {id:'mission',name:'使徒、宣教與書信',description:'從初代教會，接到宣教旅程、送信與群體閱讀。',stops:['church','paul','letters']},
];
export function routeGeometry(route,byId){
  const a=byId.get(route.from),b=byId.get(route.to),dx=b.position[0]-a.position[0],dz=b.position[1]-a.position[1],d=Math.hypot(dx,dz),nx=dx/d,nz=dz/d;
  const trimA=a.radius*.91,trimB=b.radius*.91,bend=route.kind==='compare'?5:route.kind==='sea'?2.5:route.kind==='time'?1.5:0;
  return {start:[a.position[0]+nx*trimA,.58,a.position[1]+nz*trimA],end:[b.position[0]-nx*trimB,.58,b.position[1]-nz*trimB],
    middle:[(a.position[0]+b.position[0])/2-nz*bend,route.kind==='sea'?.03:route.kind==='compare'?3.8:1.1,(a.position[1]+b.position[1])/2+nx*bend]};
}
export const atlasBounds={x1:-62,x2:65,z1:-49,z2:57,maxDistance:210,waterSize:12000};
// Fit projected island extents at the real aspect ratio, including room for labels.
export function atlasFrame(list,aspect,fov=39){
  const center=[list.reduce((n,t)=>n+t.position[0],0)/list.length,0,list.reduce((n,t)=>n+t.position[1],0)/list.length];
  const length=Math.hypot(.5,1.2,1.45),direction=[.5/length,1.2/length,1.45/length],sideLength=Math.hypot(direction[0],direction[2]);
  const right=[direction[2]/sideLength,0,-direction[0]/sideLength],up=[direction[1]*right[2],direction[2]*right[0]-direction[0]*right[2],-direction[1]*right[0]];
  const tanY=Math.tan(fov*Math.PI/360),tanX=tanY*aspect;let distance=30;
  for(const t of list){const dx=t.position[0]-center[0],dz=t.position[1]-center[2],depth=dx*direction[0]+dz*direction[2],padding=t.radius+2.5;
    distance=Math.max(distance,depth+(Math.abs(dx*right[0]+dz*right[2])+padding)/tanX,depth+(Math.abs(dx*up[0]+dz*up[2])+padding)/tanY);
  }
  return {center,offset:direction.map(n=>n*distance*(list.length===24?1.6:1))};
}
export function coastRadius(radius,angle,seed){return radius*(.94+.055*Math.sin(angle*3+seed)+.035*Math.sin(angle*5-seed*.4));}
export function visibleRoutes({journey='all',focus=null,ids=null}={}){
  const selected=atlasJourneys.find(j=>j.id===journey)||atlasJourneys[0],stops=new Set(selected.stops);
  return atlasRoutes.filter(r=>(!ids||ids.has(r.from)&&ids.has(r.to))&&(journey==='all'?r.primary||r.from===focus||r.to===focus:stops.has(r.from)&&stops.has(r.to)));
}
