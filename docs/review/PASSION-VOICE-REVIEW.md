# 第22島配音製作紀錄

2026-11-17。Root逐段核讀實際 `personForMode` 所產生三人一般及親子台詞；每人8 cue，共24 cue。主線依已直接讀完的CSBT可14–16，跨卷比較以有卷名的入口另讀。口語不送入章名、Markdown、舞臺指示或計時標記。可十六章九到二十節等數字用中文自然敘述，沒有以加速塞入時長。

本輪即時public zh聲線清單實際回傳ACTIVE；備餐者用Shuxian、場域導讀者用Haoran、墓外導讀者用Guoliang。皆instant中文聲線，非原人物或臺灣口音認證，沒有聲音克隆。三份各一次first generation全成功，language=zh、speed=1、withTimestamps=true，不指定model或outputFormat；未重試、未生成候選試音。

| 角色 | 原服務WAV秒數 | 網站MP3實測秒數 | MP3位元組 |
| --- | ---: | ---: | ---: |
| passion-meal-resident | 94.59462585034014 | 94.656 | 1514925 |
| passion-journey-resident | 97.0378231292517 | 97.104 | 1554093 |
| passion-tomb-resident | 97.93319727891156 | 97.992 | 1568301 |

原WAV保留在`.qa/passion-*-resident.wav`。允許的本機準備只轉mono24kHz128kbpsMP3，未trim、未atempo，保持1.0×。起訖採服務實際字元時間，前20ms／後40ms有限padding，沒有均分字數。原字元完整串接逐一等於提交文字，8 cue起訖在實測長度內；來源、實際聲線、設定、SHA與字元時間見[provenance](PASSION-VOICE-PROVENANCE.json)。

此記錄證明生成、轉檔、字元與時間核對，**未宣稱完整真人聽驗、口音／情緒自然度全部通過或外部專家審稿**。瀏覽器實際播放與場景切換另記；字幕持續可讀，聲音預設由使用者開啟。
