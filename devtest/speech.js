function browserPlaySpeech(text, index) {
  if (!window.speechSynthesis) return false;
  let engines = Array.from(speechSynthesis.getVoices()).filter(
    a => a.lang == "ja-JP"
  );
  let s = new SpeechSynthesisUtterance(text);
  s.lang = "ja-JP";
  if (index != null && engines[index]) {
    s.voice = engines[index];
  }
  speechSynthesis.speak(s);
  return true;
}

new DOMParser().parseFromString(
  `<?xml version="1.0"?>
<speak version="1.1" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.w3.org/2001/10/synthesis
                 http://www.w3.org/TR/speech-synthesis11/synthesis.xsd"
       xml:lang="ja-JP">
  <sub alias="こんにちは">今日</sub>
</speak>`,
  "application/xml"
).documentElement.textContent;
