// Optional, user-initiated browser speech. Authored narration only, never a substitute Bible text.
export function createReadingSpeech(onState = () => {}, host = globalThis) {
  const synth = host.speechSynthesis;
  let generation = 0, utterance = null;
  const report = (status, message) => onState({ status, message });
  function stop() { generation++; if (utterance) synth?.cancel(); utterance = null; report('idle', ''); }
  return {
    stop,
    read(text) {
      stop();
      if (!synth || !host.SpeechSynthesisUtterance) { report('unavailable', '此瀏覽器未提供朗讀功能，可直接閱讀文字。'); return false; }
      const voices = synth.getVoices(), voice = voices.find(v => /^zh[-_]TW/i.test(v.lang)) || voices.find(v => /^zh/i.test(v.lang));
      if (!voice) { report('unavailable', '目前沒有可用的中文語音，可直接閱讀文字。'); return false; }
      const token = generation;
      utterance = new host.SpeechSynthesisUtterance(text); utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = .9;
      utterance.onstart = () => { if (token === generation) report('speaking', '中文導讀朗讀中'); };
      utterance.onend = () => { if (token === generation) { utterance = null; report('idle', '朗讀完畢'); } };
      utterance.onerror = () => { if (token === generation) { utterance = null; report('unavailable', '語音暫時無法播放，可直接閱讀文字。'); } };
      try { synth.speak(utterance); report('speaking', '中文導讀朗讀中'); return true; }
      catch { utterance = null; report('unavailable', '語音暫時無法播放，可直接閱讀文字。'); return false; }
    },
  };
}
