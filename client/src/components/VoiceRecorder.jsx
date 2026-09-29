import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Globe, Volume2, Sparkles, AlertCircle, RefreshCw, 
  Send, User, Clock, CheckCircle2, ChevronDown 
} from 'lucide-react';
import { 
  SUPPORTED_LANGUAGES, 
  createSpeechRecognition, 
  detectClientRedFlags,
  isSpeechRecognitionSupported 
} from '../utils/speechRecognition';
import RedFlagAlertBanner from './RedFlagAlertBanner';

export default function VoiceRecorder({ onAnalyze, isAnalyzing = false }) {
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState('en-US');
  const [ageGroup, setAgeGroup] = useState('adult');
  const [patientName, setPatientName] = useState('');
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [detectedRedFlags, setDetectedRedFlags] = useState([]);
  const [browserSpeechSupported, setBrowserSpeechSupported] = useState(true);
  const [recognitionError, setRecognitionError] = useState(null);

  const recognitionRef = useRef(null);

  useEffect(() => {
    setBrowserSpeechSupported(isSpeechRecognitionSupported());
  }, []);

  // Monitor transcript changes for deterministic red flags in real-time
  useEffect(() => {
    const fullCurrentText = (transcript + ' ' + interimText).trim();
    const flags = detectClientRedFlags(fullCurrentText);
    setDetectedRedFlags(flags);
  }, [transcript, interimText]);

  const startRecording = () => {
    setRecognitionError(null);

    if (!isSpeechRecognitionSupported()) {
      setRecognitionError('Speech recognition is not supported in this browser. Please type your symptoms below.');
      return;
    }

    try {
      const recognition = createSpeechRecognition({
        language,
        onStart: () => {
          setIsRecording(true);
          setRecognitionError(null);
        },
        onResult: ({ finalTranscript, interimTranscript }) => {
          if (finalTranscript) {
            setTranscript((prev) => (prev ? prev + ' ' + finalTranscript : finalTranscript));
          }
          setInterimText(interimTranscript);
        },
        onError: (event) => {
          if (event.error === 'not-allowed') {
            setRecognitionError('Microphone permission was denied. Please allow microphone access or type your symptoms.');
          } else if (event.error === 'no-speech') {
            // benign timeout, ignore
          } else {
            setRecognitionError(`Speech recognition issue: ${event.error}`);
          }
          setIsRecording(false);
        },
        onEnd: () => {
          setIsRecording(false);
          setInterimText('');
        }
      });

      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
      }
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setRecognitionError('Unable to access microphone. You may type your symptoms directly.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setInterimText('');
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const clearTranscript = () => {
    stopRecording();
    setTranscript('');
    setInterimText('');
    setDetectedRedFlags([]);
  };

  const handlePresetSelect = (presetText, presetLang, presetAge = 'adult') => {
    stopRecording();
    setLanguage(presetLang);
    setAgeGroup(presetAge);
    setTranscript(presetText);
    setInterimText('');
    const flags = detectClientRedFlags(presetText);
    setDetectedRedFlags(flags);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalContent = (transcript + ' ' + interimText).trim();
    if (!finalContent || finalContent.length < 3) {
      alert('Please speak or type your symptoms before submitting.');
      return;
    }

    stopRecording();
    onAnalyze({
      transcript: finalContent,
      language,
      age_group: ageGroup,
      patient_name: patientName.trim() || 'Anonymous'
    });
  };

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Real-time Deterministic Red-Flag Circuit Breaker Banner */}
      <RedFlagAlertBanner triggers={detectedRedFlags} />

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transition-all">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-hospital-900 via-hospital-700 to-hospital-900 text-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sky-200 text-xs font-semibold backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-sky-300" />
                Emergency Clinical Voice Intake
              </div>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
                Tell us what you are experiencing
              </h2>
              <p className="mt-1 text-sky-100 text-sm">
                Speak naturally in your preferred language. AI and clinical safety protocols prioritize your care immediately.
              </p>
            </div>

            {/* Language Dropdown */}
            <div className="relative">
              <label htmlFor="language-select" className="block text-xs font-medium text-sky-200 mb-1">
                Spoken Language
              </label>
              <div className="relative">
                <select
                  id="language-select"
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    if (isRecording) stopRecording();
                  }}
                  className="appearance-none bg-white/15 hover:bg-white/20 border border-white/30 text-white font-semibold text-sm rounded-xl pl-3 pr-8 py-2 backdrop-blur-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="text-slate-900 bg-white">
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-white/80 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Patient Details Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Patient Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe or leave for Anonymous"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-hospital-600 focus:ring-2 focus:ring-hospital-100 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Age Category
              </label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:border-hospital-600 focus:ring-2 focus:ring-hospital-100 text-slate-800 font-medium"
              >
                <option value="infant">Infant (0 - 1 year)</option>
                <option value="child">Child (1 - 17 years)</option>
                <option value="adult">Adult (18 - 64 years)</option>
                <option value="elderly">Elderly (65+ years)</option>
              </select>
            </div>
          </div>

          {/* Voice Microphone Centerpiece */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl relative overflow-hidden">
            {/* Status Indicator */}
            <div className="mb-4 flex items-center gap-2">
              <span className={`inline-block w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-slate-400'}`} />
              <span className="text-xs font-bold tracking-wider uppercase text-slate-700">
                {isRecording ? 'Listening in real-time...' : 'Click to begin voice intake'}
              </span>
            </div>

            {/* Sound Wave Animation Visualizer */}
            {isRecording && (
              <div className="flex items-center gap-1.5 h-12 mb-4">
                <div className="w-1.5 bg-red-500 rounded-full soundwave-bar" />
                <div className="w-1.5 bg-red-600 rounded-full soundwave-bar" />
                <div className="w-1.5 bg-red-500 rounded-full soundwave-bar" />
                <div className="w-1.5 bg-red-600 rounded-full soundwave-bar" />
                <div className="w-1.5 bg-red-500 rounded-full soundwave-bar" />
                <div className="w-1.5 bg-red-600 rounded-full soundwave-bar" />
                <div className="w-1.5 bg-red-500 rounded-full soundwave-bar" />
                <div className="w-1.5 bg-red-500 rounded-full soundwave-bar" />
              </div>
            )}

            {/* Big Mic Button */}
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isAnalyzing}
              aria-label={isRecording ? 'Stop recording voice' : 'Start recording voice'}
              className={`relative group p-6 sm:p-7 rounded-full transition-all duration-300 transform active:scale-95 shadow-xl ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700 text-white ring-8 ring-red-100 animate-pulse'
                  : 'bg-hospital-600 hover:bg-hospital-700 text-white ring-4 ring-sky-100 hover:shadow-2xl'
              }`}
            >
              {isRecording ? (
                <MicOff className="w-10 h-10 animate-bounce" />
              ) : (
                <Mic className="w-10 h-10 group-hover:scale-110 transition-transform" />
              )}
            </button>

            <p className="mt-4 text-xs text-slate-500 text-center max-w-md">
              {currentLangObj.prompt}
            </p>

            {recognitionError && (
              <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{recognitionError}</span>
              </div>
            )}
          </div>

          {/* Live Transcript Streaming & Manual Edit Box */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="transcript-area" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-hospital-600" />
                Live Voice Transcript & Symptoms
              </label>
              <div className="flex items-center gap-3">
                {detectedRedFlags.length > 0 && (
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                    🚨 Safety Red Flag Active
                  </span>
                )}
                {transcript && (
                  <button
                    type="button"
                    onClick={clearTranscript}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              <textarea
                id="transcript-area"
                rows={4}
                value={transcript + (interimText ? (transcript ? ' ' : '') + interimText : '')}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  setInterimText('');
                }}
                placeholder={currentLangObj.prompt}
                className="w-full p-4 rounded-xl border border-slate-300 text-slate-900 text-base sm:text-lg focus:border-hospital-600 focus:ring-2 focus:ring-hospital-100 placeholder:text-slate-400 font-normal leading-relaxed resize-y"
              />
              {isRecording && interimText && (
                <div className="absolute bottom-3 right-3 text-xs font-semibold text-hospital-600 bg-hospital-50 px-2 py-1 rounded-md animate-pulse">
                  Streaming speech...
                </div>
              )}
            </div>
          </div>

          {/* Quick Simulation Presets for Testing & Demos */}
          <div className="pt-2">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              🧪 Quick Clinical Presets (Click to test triage flows):
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handlePresetSelect('I have crushing chest pain that radiates into my left arm and jaw. I can barely breathe and my vision is going dark.', 'en-US', 'elderly')}
                className="text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>🚨 Crushing Chest Pain (ESI 1)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('Tengo un dolor muy fuerte en el pecho que se me va al brazo izquierdo y me falta el aire desde hace 20 minutos.', 'es-ES', 'adult')}
                className="text-xs font-medium bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>🇪🇸 Spanish: Dolor de pecho (ESI 1)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('मेरे सीने में बहुत तेज दर्द है और मुझे सांस लेने में तकलीफ हो रही है। चक्कर भी आ रहे हैं।', 'hi-IN', 'adult')}
                className="text-xs font-medium bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>🇮🇳 Hindi: सीने में दर्द (ESI 1)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('I fell down the stairs and twisted my left ankle. It is swollen and bruised and hurts when I put weight on it, pain is about 5/10.', 'en-US', 'adult')}
                className="text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <span>🦴 Sprained Ankle (ESI 3)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('I need a refill on my blood pressure prescription for lisinopril. I feel completely normal, no headache or pain.', 'en-US', 'adult')}
                className="text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <span>💊 Prescription Refill (ESI 5)</span>
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>HIPAA Compliant &amp; Deterministic Circuit Breaker Active</span>
            </div>

            <button
              type="submit"
              disabled={isAnalyzing || (!transcript.trim() && !interimText.trim())}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
                detectedRedFlags.length > 0
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-200'
                  : 'bg-hospital-600 hover:bg-hospital-700 shadow-sky-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Analyzing &amp; Triaging...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Clinical Intake</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
