# 比喻島配音與切段紀錄

2026-11-17。以`sites`授權的場景／NPC配音工作為父流程，依HeyGen narrator與script-writer撰寫及準備；不是影片、聲音複製或試音任務。三人各一個完整take、各8cue，合計24cue；生成前由`personForMode`匯出完整一般／親子稿，root逐份閱讀覆核。三份首次生成均成功，沒有錯誤重試或生成替代take。

| 居民 | 公開目錄ACTIVE聲線 | 原始服務秒數 | 網站MP3秒數 | cue |
| --- | --- | ---: | ---: | ---: |
| 田邊工作的居民 | Guoliang · Warm & Resonant | 103.186621 | 103.248 | 8 |
| 牧地旁的居民 | Haoran · Bright & Articulate | 97.288753 | 97.344 | 8 |
| 院落準備照明的居民 | Shuxian · Clear & Trustworthy | 105.211247 | 105.264 | 8 |

聲線由本次`list_voices(type=public,language=zh)`取得並確認ACTIVE；非虛構ID。請求language=zh、speed=1、withTimestamps=true，省略model與outputFormat，由服務選預設模型與WAV；返回結果未明列模型，不補填已驗型號。精確voiceId、提交文字、原始逐字與逐詞時間、音源URL及SHA在[來源紀錄](PARABLES-VOICE-PROVENANCE.json)。館藏資訊與閱讀重點的來源、未看圖及範圍在[研究起點](PARABLES-RESEARCH-START.md)與應用復原說明。

原始WAV保留`.qa/parables-*-resident.wav`，MP3為單聲道24kHz／128kbps，無加速、變調、裁剪或去噪。MP3時長由ffprobe量測，與WAV微小差距來自編碼。原始字元連接和每個提交字元完全一致；每cue以服務實際字元起終時間（前20ms／後40ms邊界）標記，未平均攤時間。整合測試逐cue核對一般與親子正文、時段範圍及canonical MP3 SHA。

文字與回傳字元／時段核對，不等同真人逐字完整聽驗；本輪尚未獲完整真人聽驗或台灣口音專家確認。語氣、專名、停頓與邊界仍可人工覆聽；實際瀏覽器播放／切換驗收另記[分章實作](PARABLES-CHAPTERS.md)，不從本表推定已播放。
