import {walkSpawn,vesselDefinitions} from './walk-data.js';
import {tabernacleSpawn,tabernacleObjects} from './tabernacle-exploration.js';
export const explorationByIsland = {
  jerusalem:{title:'走進山城的一天',shortTitle:'山城的一段路',era:'JERUSALEM / 第一世紀',spawn:walkSpawn,objects:vesselDefinitions,
    intro:'自由行走、聆聽角色，走到院落觀察器皿。',enter:'開啟聲音，走進街區',hint:'場景、路線與中文配音皆為教學設計。',
    region:p=>p[0]>18&&p[2]>2?'街角石階':p[2]>21?'院落與南巷':p[2]<-8?'北側巷弄':'主街'},
  tabernacle:{title:'走進會幕旁的營地',shortTitle:'從營地走近會幕',era:'TABERNACLE / 曠野營地',spawn:tabernacleSpawn,objects:tabernacleObjects,
    intro:'走近工位、與人物交談，觀察織物、板架與洗濯盆，再回到經文。',enter:'開啟聲音，走進營地',
    hint:'教學觀察模式 · 指定營地與外院區域。內部請用剖面；此路線不代表古代任何身分皆可自由進入。',
    region:p=>p[0]<22?'外院教學觀察區':p[0]<25?'院幕入口':p[2]>2?'織作與營地':p[2]<-3?'家用器物與營地':'營地通道'},
};
export const explorationFor=id=>explorationByIsland[id];
