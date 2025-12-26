
export function speak(text: string, language: string) {
  if (!('speechSynthesis' in window)) {
    console.warn("Speech synthesis not supported in this browser.");
    return;
  }

  // Cancel any ongoing speech to avoid overlapping audio
  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);

  const langMap: Record<string, string> = {
    en: "en-IN",
    hi: "hi-IN",
    bn: "bn-IN",
    ta: "ta-IN",
    te: "te-IN",
    mr: "mr-IN",
    gu: "gu-IN",
    kn: "kn-IN",
    ml: "ml-IN",
    pa: "pa-IN",
    ur: "ur-PK",
    as: "as-IN",
    or: "or-IN"
  };

  const targetLang = langMap[language] || "en-IN";
  utter.lang = targetLang;
  
  // Try to find a voice that matches the target language
  const voices = window.speechSynthesis.getVoices();
  const matchingVoice = voices.find(v => v.lang.startsWith(targetLang.split('-')[0]));
  if (matchingVoice) {
    utter.voice = matchingVoice;
  }

  utter.rate = 0.95;
  utter.pitch = 1.0;

  utter.onerror = (event: any) => {
    // Ignore 'interrupted' or 'canceled' errors as they are expected behavior
    // when we call speechSynthesis.cancel() to start a new message.
    if (event.error === 'interrupted' || event.error === 'canceled') {
      return;
    }
    console.error(`SpeechSynthesis Error: ${event.error}`, event);
  };

  window.speechSynthesis.speak(utter);
}

// Ensure voices are loaded (Chrome requirement)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }
}
