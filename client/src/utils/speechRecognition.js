/**
 * Speech Recognition & Synthesis Utility
 * Interfaces with Web Speech API for voice streaming and text-to-speech feedback
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸', prompt: 'Speak clearly into the microphone. State your name, symptoms, and when they started.' },
  { code: 'es-ES', name: 'Español', flag: '🇪🇸', prompt: 'Hable claramente al micrófono. Indique sus síntomas y cuándo comenzaron.' },
  { code: 'hi-IN', name: 'हिन्दी (Hindi)', flag: '🇮🇳', prompt: 'माइक्रोफ़ोन में स्पष्ट रूप से बोलें। अपने लक्षण और वे कब शुरू हुए, बताएं।' },
  { code: 'fr-FR', name: 'Français', flag: '🇫🇷', prompt: 'Parlez clairement dans le microphone. Décrivez vos symptômes et leur durée.' },
  { code: 'zh-CN', name: '中文 (Mandarin)', flag: '🇨🇳', prompt: '请对着麦克风清晰说话，描述您的症状及持续时间。' },
  { code: 'ar-SA', name: 'العربية (Arabic)', flag: '🇸🇦', prompt: 'تحدث بوضوح في الميكروفون وصف أعراضك ومتى بدأت.' }
];

// Client-side Deterministic Red-Flag Patterns
export const CLIENT_RED_FLAGS = [
  // Cardiac / Thoracic
  { pattern: /chest pain/i, label: 'Chest Pain' },
  { pattern: /crushing chest/i, label: 'Crushing Chest Pressure' },
  { pattern: /heart attack/i, label: 'Possible Heart Attack' },
  { pattern: /radiating to.*arm/i, label: 'Pain Radiating to Arm' },
  { pattern: /radiating to.*jaw/i, label: 'Pain Radiating to Jaw' },
  
  // Respiratory
  { pattern: /shortness of breath/i, label: 'Shortness of Breath' },
  { pattern: /difficulty breathing/i, label: 'Difficulty Breathing' },
  { pattern: /cannot breathe|can't breathe/i, label: 'Inability to Breathe' },
  { pattern: /choking/i, label: 'Choking / Airway Obstruction' },
  { pattern: /turning blue|cyanosis/i, label: 'Cyanosis (Turning Blue)' },
  
  // Neurological / Stroke
  { pattern: /stroke/i, label: 'Acute Stroke Symptoms' },
  { pattern: /facial droop/i, label: 'Facial Drooping' },
  { pattern: /slurred speech/i, label: 'Slurred Speech' },
  { pattern: /numbness.*side|paraly/i, label: 'Focal Numbness / Weakness' },
  { pattern: /worst headache.*life|thunderclap/i, label: 'Thunderclap Headache' },
  { pattern: /seizure/i, label: 'Seizure Activity' },
  
  // Altered Consciousness
  { pattern: /unresponsive/i, label: 'Unresponsive' },
  { pattern: /unconscious/i, label: 'Unconscious' },
  { pattern: /passed out|fainting|blackout/i, label: 'Syncope / Fainting' },
  
  // Hemorrhage & Shock
  { pattern: /severe bleeding|heavy bleeding/i, label: 'Severe Bleeding' },
  { pattern: /coughing up blood|vomiting blood/i, label: 'Blood in Sputum / Vomit' },
  
  // Anaphylaxis
  { pattern: /anaphylaxis|throat closing|throat swelling/i, label: 'Airway / Anaphylaxis' },

  // Multilingual Spanish
  { pattern: /dolor.*pecho/i, label: 'Dolor de Pecho' },
  { pattern: /falta.*aire|dificultad para respirar/i, label: 'Falta de Aire' },
  { pattern: /inconsciente|desmayo/i, label: 'Inconsciente / Desmayo' },
  { pattern: /infarto/i, label: 'Sospecha de Infarto' },
  { pattern: /derrame cerebral/i, label: 'Derrame Cerebral' },
  { pattern: /sangrado severo/i, label: 'Sangrado Severo' },

  // Multilingual Hindi
  { pattern: /सीने में दर्द|छाती में दर्द/i, label: 'सीने में दर्द (Chest Pain)' },
  { pattern: /सांस लेने में तकलीफ|सांस नहीं आ रही/i, label: 'सांस में तकलीफ (Dyspnea)' },
  { pattern: /बेहोश/i, label: 'बेहोश (Unconscious)' },
  { pattern: /दिल का दौरा/i, label: 'दिल का दौरा (Heart Attack)' },
  { pattern: /खून बहना/i, label: 'खून बहना (Bleeding)' }
];

/**
 * Scan client text in real-time for critical keywords
 */
export const detectClientRedFlags = (text) => {
  if (!text) return [];
  const found = [];
  for (const item of CLIENT_RED_FLAGS) {
    if (item.pattern.test(text)) {
      if (!found.includes(item.label)) {
        found.push(item.label);
      }
    }
  }
  return found;
};

/**
 * Check if the browser supports Speech Recognition
 */
export const isSpeechRecognitionSupported = () => {
  return typeof window !== 'undefined' && Boolean(
    window.SpeechRecognition || 
    window.webkitSpeechRecognition
  );
};

/**
 * Factory to create and configure a Web Speech Recognition instance
 */
export const createSpeechRecognition = ({
  language = 'en-US',
  onResult,
  onError,
  onStart,
  onEnd
}) => {
  if (!isSpeechRecognitionSupported()) {
    console.warn('Speech recognition not supported in this browser.');
    return null;
  }

  const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognitionConstructor();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = language;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    if (onStart) onStart();
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcriptPiece = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcriptPiece;
      } else {
        interimTranscript += transcriptPiece;
      }
    }

    if (onResult) {
      onResult({
        finalTranscript,
        interimTranscript,
        combined: (finalTranscript + ' ' + interimTranscript).trim()
      });
    }
  };

  recognition.onerror = (event) => {
    console.warn('SpeechRecognition error:', event.error);
    if (onError) onError(event);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
};

/**
 * Vocalize text using window.speechSynthesis
 */
export const speakConfirmation = (text, language = 'en-US', { onStart, onEnd, onError } = {}) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('SpeechSynthesis is not supported in this browser.');
    if (onEnd) onEnd();
    return null;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = 0.95; // Slightly slower for clinical clarity
  utterance.pitch = 1.0;

  // Attempt to select a native voice matching the language
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(v => v.lang === language || v.lang.startsWith(language.slice(0, 2)));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  if (onError) utterance.onerror = onError;

  window.speechSynthesis.speak(utterance);
  return utterance;
};

export const stopSpeech = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};
