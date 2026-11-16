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
};
