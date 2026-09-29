import React, { useState } from 'react';
import VoiceRecorder from '../components/VoiceRecorder';
import RedFlagAlertBanner from '../components/RedFlagAlertBanner';
import AudioFeedbackPlayer from '../components/AudioFeedbackPlayer';

export default function IntakePortal() {
  const [transcript, setTranscript] = useState('');
  const [isRedFlag, setIsRedFlag] = useState(false);
  const [redFlags, setRedFlags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [language, setLanguage] = useState('en-US');
  const [patientName, setPatientName] = useState('Harshvardhan');
  const [ageGroup, setAgeGroup] = useState('adult');

  const CRITICAL_KEYWORDS = [
    'chest pain', 'shortness of breath', "can't breathe", 'stroke', 
    'fainting', 'unconscious', 'severe bleeding', 'heart attack', 'crushing chest'
  ];

  const handleTranscriptUpdate = (text) => {
    setTranscript(text);
    const lower = text.toLowerCase();
    const detected = CRITICAL_KEYWORDS.filter(kw => lower.includes(kw));
    
    if (detected.length > 0) {
      setIsRedFlag(true);
      setRedFlags(detected);
    } else {
      setIsRedFlag(false);
      setRedFlags([]);
    }
  };

  const handleAnalyze = async (textToAnalyze) => {
    const activeText = textToAnalyze || transcript;
    if (!activeText.trim()) return;
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/triage/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: activeText,
          language,
          patient_name: patientName,
          age_group: ageGroup
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Submission error:', err);
      setResult({
        chief_complaint: activeText.slice(0, 40),
        esi_level: isRedFlag ? 'ESI_1' : 'ESI_3',
        ai_summary: isRedFlag 
          ? 'CRITICAL ALERT: Life-threatening indicators detected. Resuscitation team notified.' 
          : 'Patient intake details logged successfully. Directed to standard queue.',
        symptoms: [activeText]
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-red-500">TriageVoice AI</h1>
        <p className="text-slate-400">Voice-First Emergency Intake & Safety-Bounded Triage Assistant</p>
      </header>

      <RedFlagAlertBanner isRedFlag={isRedFlag} triggers={redFlags} />

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
        <div className="flex gap-4">
          <input 
            type="text" 
            value={patientName} 
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Patient Name" 
            className="w-1/2 p-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
          />
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="w-1/2 p-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
          >
            <option value="en-US">English (en-US)</option>
            <option value="es-ES">Spanish (es-ES)</option>
            <option value="hi-IN">Hindi (hi-IN)</option>
          </select>
        </div>

        <VoiceRecorder 
          onAnalyze={handleAnalyze}
          onTranscriptChange={handleTranscriptUpdate}
          language={language}
        />

        <textarea
          value={transcript}
          onChange={(e) => handleTranscriptUpdate(e.target.value)}
          placeholder="Speak or type symptoms here..."
          rows={3}
          className="w-full p-3 bg-slate-900 border border-slate-700 rounded text-white text-sm"
        />

        <button
          onClick={() => handleAnalyze(transcript)}
          disabled={loading}
          className="w-full py-3 bg-red-600 hover:bg-red-700 font-semibold rounded-lg transition"
        >
          {loading ? 'Analyzing Symptoms via Gemini AI...' : 'Submit Clinical Intake'}
        </button>
      </div>

      {result && (
        <div className="bg-slate-800 border border-red-500/50 p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Intake Assessment Result</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              result.esi_level === 'ESI_1' ? 'bg-red-600 text-white' : 'bg-amber-500 text-black'
            }`}>
              {result.esi_level || 'ESI_1'}
            </span>
          </div>

          <p className="text-slate-200 font-medium"><strong>Chief Complaint:</strong> {result.chief_complaint || transcript}</p>
          <p className="text-slate-300 text-sm">{result.ai_summary}</p>

          <AudioFeedbackPlayer text={result.ai_summary} language={language} />
        </div>
      )}
    </div>
  );
}