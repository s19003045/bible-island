import {churchWalkConfig,churchObjects} from './church-exploration.js';
import {passionWalkConfig,passionObjects} from './passion-exploration.js';
import {parablesWalkConfig,parablesObjects} from './parables-exploration.js';
import {samariaWalkConfig,samariaObjects} from './samaria-exploration.js';
import {galileeWalkConfig,galileeObjects} from './galilee-exploration.js';
import {nativityWalkConfig,nativityObjects} from './nativity-exploration.js';
import {intertestamentWalkConfig,intertestamentObjects} from './intertestament-exploration.js';
import {nehemiahWalkConfig,nehemiahObjects} from './nehemiah-exploration.js';
import {exileWalkConfig,exileObjects} from './exile-exploration.js';
import {kingdomsWalkConfig,kingdomsObjects} from './kingdoms-exploration.js';
import {davidWalkConfig,davidObjects} from './david-exploration.js';
import {ruthWalkConfig,ruthObjects} from './ruth-exploration.js';
import {sinaiWalkConfig,sinaiObjects} from './sinai-exploration.js';
import {josephWalkConfig,josephObjects} from './joseph-exploration.js';
import {abrahamWalkConfig,abrahamObjects} from './abraham-exploration.js';
import {paulWalkConfig,paulObjects} from './paul-exploration.js';
import {returnWalkConfig,returnObjects} from './return-exploration.js';
import {exodusObjects,exodusSegments,exodusWalkConfig} from './exodus-exploration.js';
import {walkSpawn,vesselDefinitions} from './walk-data.js';
import {tabernacleSpawn,tabernacleObjects} from './tabernacle-exploration.js';
import {solomonSpawn,solomonObjects} from './solomon-exploration.js';
import {herodSpawn,herodObjects} from './herod-exploration.js';
import {jordanSpawn,jordanObjects} from './jordan-exploration.js';
export const explorationByIsland = {
  church:{...churchWalkConfig(),objects:churchObjects},
  passion:{...passionWalkConfig(),objects:passionObjects},
  parables:{...parablesWalkConfig(),objects:parablesObjects},
  samaria:{...samariaWalkConfig(),objects:samariaObjects},
  galilee:{...galileeWalkConfig(),objects:galileeObjects},
  nativity:{...nativityWalkConfig(),objects:nativityObjects},
  intertestament:{...intertestamentWalkConfig(),objects:intertestamentObjects},
  nehemiah:{...nehemiahWalkConfig(),objects:nehemiahObjects},
  exile:{...exileWalkConfig(),objects:exileObjects},
  kingdoms:{...kingdomsWalkConfig(),objects:kingdomsObjects},
  david:{...davidWalkConfig(),objects:davidObjects},
  judges:{...ruthWalkConfig(),objects:ruthObjects},
  sinai:{...sinaiWalkConfig(),objects:sinaiObjects},
  joseph:{...josephWalkConfig(),objects:josephObjects},
  abraham:{...abrahamWalkConfig(),objects:abrahamObjects},
  paul:{...paulWalkConfig(),objects:paulObjects},
  'second-temple':{...returnWalkConfig(),objects:returnObjects},
  jordan:{title:'走過河谷，讀懂十二石',shortTitle:'約旦河與西岸記念',heading:'看乾地，也聽下一代的問題',era:'JORDAN / 約書亞記 3–4 章',spawn:jordanSpawn,startLookAt:[0,1,-10],objects:jordanObjects,destinations:true,recordedChild:true,teachingInspection:true,
    intro:'從東岸降到河床、上到西岸，向人物提問，旋轉剖面與十二石教具，再與渡海敘事對讀。',enter:'開啟聲音，走進河谷',hint:'距離與不同時刻經過壓縮；約櫃旁不開放步行。此處沒有左右水牆，不指認現代渡口或吉甲遺址。',inspectionNote:'現代教學模型；旋轉不表示可以拿取聖物。石頭、覆布與河床的形制仍須分清文字依據與補足。',region:p=>p[0]<-24?'東岸準備區':p[0]>24?'西岸記念區':'河中乾地教學區'},
  exodus:{title:'分三段走進出埃及',shortTitle:'出埃及的三段敘事',era:'EXODUS / 分段探索',objects:exodusObjects,segments:exodusSegments,destinations:true,recordedChild:true,teachingInspection:true,spawn:exodusSegments[0].spawn,
    intro:'先理解製磚勞役，再進入預備出發的家屋，最後走到海中乾地。',enter:'開啟聲音，走進本段',hint:'三段不是相鄰街區；請選擇章節探索，辨認敘事先後。',region:()=> '出埃及分段探索'},
  jerusalem:{title:'走進山城的一天',shortTitle:'山城的一段路',heading:'走街巷，也辨認故事的地點',destinations:true,recordedChild:true,era:'JERUSALEM / 第一世紀',spawn:walkSpawn,objects:vesselDefinitions,
    intro:'自由行走、聆聽角色，走到院落觀察器皿。',enter:'開啟聲音，走進街區',hint:'場景、路線與中文配音皆為教學設計。',
    region:p=>p[0]>18&&p[2]>2?'街角石階':p[2]>21?'院落與南巷':p[2]<-8?'北側巷弄':'主街'},
  tabernacle:{title:'走進會幕旁的營地',shortTitle:'從營地走近會幕',heading:'從日常，走近會幕',destinations:true,recordedChild:true,teachingInspection:true,era:'TABERNACLE / 曠野營地',spawn:tabernacleSpawn,objects:tabernacleObjects,
    intro:'走近工位、與人物交談，觀察織物、板架與洗濯盆，再回到經文。',enter:'開啟聲音，走進營地',
    hint:'教學觀察模式 · 指定營地與外院區域。內部請用剖面；此路線不代表古代任何身分皆可自由進入。',
    region:p=>p[0]<22?'外院教學觀察區':p[0]<25?'院幕入口':p[2]>2?'織作與營地':p[2]<-3?'家用器物與營地':'營地通道'},
  herod:{title:'走進第二聖殿的公共院區',shortTitle:'階梯、院界與柱廊',heading:'沿階梯上行，在柱廊停下',destinations:true,recordedChild:true,teachingInspection:true,era:'HEROD / 第一世紀聖殿背景',spawn:herodSpawn,startLookAt:[68,7.5,105],objects:herodObjects,
    intro:'從階梯走到公共觀察區，比較院界、石材與柱廊，向朝聖者、石作角色及聆聽者提問。',enter:'開啟聲音，走進外院',
    hint:'教學觀察路線 · 階梯入口與外院配置為選擇性復原，不是胡爾大門測繪。內院及殿宇不開放步行；柱廊中的不同經文不表示同日發生。',
    region:p=>p[2]>102?'上行階梯教學區':p[2]>45?'南側公共觀察區':p[0]>109&&p[2]>-53?'東側觀察通道':p[2]>-78?'石作解說區':'北側柱廊教學區'},
  solomon:{title:'走進所羅門聖殿的院中',shortTitle:'從帳幕到固定殿宇',heading:'抬頭看柱，繞看銅海',destinations:true,recordedChild:true,teachingInspection:true,
    era:'SOLOMON / 第一聖殿敘事',spawn:solomonSpawn,objects:solomonObjects,
    intro:'走過高差、繞看銅海與牛座，聽人物解說，再與會幕對讀。',enter:'開啟聲音，走進院中',
    hint:'教學觀察區 · 平台、階梯與院落格局屬推定；內殿與祭壇不開放步行。角色串聯建殿與獻殿經文，不表示兩事同時發生，也不代表古代身分皆可進入。',
    region:p=>p[0]<=18.5&&Math.abs(p[2])<5.4?'銅柱與教學平台':p[2]>7?'銅海與南側院區':p[2]<-8?'工藝解說與院中聚集區':'院中觀察通道'},
};
export const explorationFor=(id,segment=null,phase=null)=>id==='church'&&segment?churchWalkConfig(segment,phase):id==='passion'&&segment?passionWalkConfig(segment,phase):id==='parables'&&segment?parablesWalkConfig(segment,phase):id==='samaria'&&segment?samariaWalkConfig(segment,phase):id==='galilee'&&segment?galileeWalkConfig(segment,phase):id==='nativity'&&segment?nativityWalkConfig(segment,phase):id==='intertestament'&&segment?intertestamentWalkConfig(segment):id==='nehemiah'&&segment?nehemiahWalkConfig(segment,phase):id==='exile'&&segment?exileWalkConfig(segment):id==='kingdoms'&&segment?kingdomsWalkConfig(segment):id==='david'&&segment?davidWalkConfig(segment,phase):id==='judges'&&segment?ruthWalkConfig(segment):id==='sinai'&&segment?sinaiWalkConfig(segment):id==='joseph'&&segment?josephWalkConfig(segment):id==='abraham'&&segment?abrahamWalkConfig(segment):id==='paul'&&segment?paulWalkConfig(segment):id==='second-temple'&&segment?returnWalkConfig(segment):id==='exodus'&&segment?exodusWalkConfig(segment):explorationByIsland[id];
