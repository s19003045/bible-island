import {walkSpawn,vesselDefinitions} from './walk-data.js';
import {tabernacleSpawn,tabernacleObjects} from './tabernacle-exploration.js';
import {solomonSpawn,solomonObjects} from './solomon-exploration.js';
export const explorationByIsland = {
  jerusalem:{title:'走進山城的一天',shortTitle:'山城的一段路',era:'JERUSALEM / 第一世紀',spawn:walkSpawn,objects:vesselDefinitions,
    intro:'自由行走、聆聽角色，走到院落觀察器皿。',enter:'開啟聲音，走進街區',hint:'場景、路線與中文配音皆為教學設計。',
    region:p=>p[0]>18&&p[2]>2?'街角石階':p[2]>21?'院落與南巷':p[2]<-8?'北側巷弄':'主街'},
  tabernacle:{title:'走進會幕旁的營地',shortTitle:'從營地走近會幕',heading:'從日常，走近會幕',destinations:true,recordedChild:true,teachingInspection:true,era:'TABERNACLE / 曠野營地',spawn:tabernacleSpawn,objects:tabernacleObjects,
    intro:'走近工位、與人物交談，觀察織物、板架與洗濯盆，再回到經文。',enter:'開啟聲音，走進營地',
    hint:'教學觀察模式 · 指定營地與外院區域。內部請用剖面；此路線不代表古代任何身分皆可自由進入。',
    region:p=>p[0]<22?'外院教學觀察區':p[0]<25?'院幕入口':p[2]>2?'織作與營地':p[2]<-3?'家用器物與營地':'營地通道'},
  solomon:{title:'走進所羅門聖殿的院中',shortTitle:'從帳幕到固定殿宇',heading:'抬頭看柱，繞看銅海',destinations:true,recordedChild:true,teachingInspection:true,
    era:'SOLOMON / 第一聖殿敘事',spawn:solomonSpawn,objects:solomonObjects,
    intro:'走過高差、繞看銅海與牛座，聽人物解說，再與會幕對讀。',enter:'開啟聲音，走進院中',
    hint:'教學觀察區 · 平台、階梯與院落格局屬推定；內殿與祭壇不開放步行。角色串聯建殿與獻殿經文，不表示兩事同時發生，也不代表古代身分皆可進入。',
    region:p=>p[0]<=18.5&&Math.abs(p[2])<5.4?'銅柱與教學平台':p[2]>7?'銅海與南側院區':p[2]<-8?'工藝解說與院中聚集區':'院中觀察通道'},
};
export const explorationFor=id=>explorationByIsland[id];
