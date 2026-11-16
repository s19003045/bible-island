// Local exports from scripts/blender/build-assets.py. No remote model services.
export const blenderModels = {
  resident:{type:'character',src:'models/judean-resident.glb',height:1.71,era:'Early Roman Judea; composite teaching resident'},
  'clay-vessel':{type:'object',src:'models/clay-vessel.glb',height:.548},
  'stone-vessel':{type:'object',src:'models/stone-vessel.glb',height:.328},
  'woven-sample':{type:'object',src:'models/woven-sample.glb',height:.7315,triangleBudget:40000,byteBudget:1100000},
  'board-joint':{type:'object',src:'models/board-joint.glb',height:.846,articulation:{part:'joint-board',offset:[0,.18,0],openLabel:'分開板與座',closeLabel:'還原接合',note:'接合局部教具 · 可還原'}},
  'tabernacle-basin':{type:'object',src:'models/tabernacle-basin.glb',height:1.24},
  'solomon-sea':{type:'object',src:'models/solomon-sea.glb',height:.70,triangleBudget:65000,byteBudget:2300000},
  'pillar-capital':{type:'object',src:'models/pillar-capital.glb',height:.80,triangleBudget:32000,byteBudget:950000},
  'temple-masonry':{type:'object',src:'models/temple-masonry.glb',height:.581,articulation:{part:'cedar-facing',offset:[0,0,.18],openLabel:'分開木覆面',closeLabel:'還原覆面',note:'局部構造教具 · 可還原'}},
  'herod-stone':{type:'object',src:'models/herod-stone.glb',height:.400,articulation:{part:'ashlar-right',offset:[.16,0,0],openLabel:'分開接縫',closeLabel:'還原接縫',note:'加工接縫教具 · 可還原'}},
  'herod-boundary':{type:'object',src:'models/herod-boundary.glb',height:.692,byteBudget:900000,articulation:{part:'boundary-layer',offset:[0,0,.14],openLabel:'分開低欄層',closeLabel:'還原層次',note:'空間關係示意 · 非通行操作'}},
  'herod-capital':{type:'object',src:'models/herod-capital.glb',height:.760,triangleBudget:26000,byteBudget:1300000},
  'brick-mould':{type:'object',src:'models/brick-mould.glb',height:.120,articulation:{part:'brick-frame',offset:[0,.18,0],openLabel:'抬起磚模',closeLabel:'還原磚模',note:'成形構造教具 · 可還原'}},
  'passover-kit':{type:'object',src:'models/passover-kit.glb',height:.283,triangleBudget:26000,byteBudget:1400000,inspectionView:[1.05,2.1,1.25],articulation:{part:'kneading-wrap',offset:[.26,.24,-.22],openLabel:'移開布包',closeLabel:'還原包裹',note:'布包與器皿教學剖看 · 可還原'}},
  'crossing-ground':{type:'object',src:'models/crossing-ground.glb',height:.391,triangleBudget:20000,byteBudget:1100000,inspectionView:[.8,2.7,1.0]},
};
