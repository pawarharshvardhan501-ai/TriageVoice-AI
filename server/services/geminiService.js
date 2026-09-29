import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { checkRedFlags } from './safetyEngine.js';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const isGeminiAvailable = Boolean(
  apiKey && 
  apiKey !== 'AIzaSy_YOUR_GEMINI_API_KEY_HERE' && 
  !apiKey.includes('YOUR_GEMINI')
);

let ai = null;
if (isGeminiAvailable) {
  try {
    ai = new GoogleGenAI({ apiKey });
    console.log('⚡ Google Gen AI SDK initialized with gemini-2.5-flash');
  } catch (err) {
    console.warn('⚠️  Failed to initialize Google Gen AI SDK:', err.message);
  }
} else {
  console.log('ℹ️  GEMINI_API_KEY not set or placeholder. Clinical deterministic fallback engine active.');
}

export const triageResponseSchema = {
  type: Type.OBJECT,
  properties: {
    chief_complaint: { 
      type: Type.STRING, 
      description: "Short 3-5 word summary of primary complaint in English." 
    },
    translated_english_transcript: { 
      type: Type.STRING, 
      description: "Full English translation of patient speech." 
    },
    symptoms: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of explicit clinical symptoms mentioned." 
    },
    duration: { 
      type: Type.STRING, 
      description: "Reported symptom duration or onset time." 
    },
    pain_score: { 
      type: Type.INTEGER, 
      description: "Extracted pain score between 0 and 10. Default 0 if unmentioned." 
    },
    esi_level: { 
      type: Type.STRING, 
      enum: ["ESI_1", "ESI_2", "ESI_3", "ESI_4", "ESI_5"],
      description: "Calculated Emergency Severity Index recommendation."
    },
    is_red_flag: { 
      type: Type.BOOLEAN, 
      description: "True if symptoms contain acute life-threatening markers." 
    },
    red_flag_triggers: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Specific triggers identified (e.g., 'chest pain', 'numbness')."
    },
    ai_summary: { 
      type: Type.STRING, 
      description: "Empathetic, non-diagnostic confirmation message in the patient's spoken language to read back to the patient." 
    }
  },
  required: ["chief_complaint", "symptoms", "esi_level", "is_red_flag", "ai_summary"]
};

/**
 * Deterministic Rule-Based Fallback Parser (Active when offline or GEMINI_API_KEY not configured)
 */
function runDeterministicFallbackParser(transcript, language = 'en-US', age_group = 'adult') {
  const lower = transcript.toLowerCase();
  const redFlags = checkRedFlags(transcript);
  const isRed = redFlags.length > 0;

  // Extract pain score if mentioned (e.g. "pain is 8/10", "pain 7 out of 10", "pain level 9", "8 out of 10")
  let painScore = 0;
  const painMatch = lower.match(/pain.*?(\d{1,2})\s*(?:out of 10|\/10)?/i) || 
                    lower.match(/(\d{1,2})\s*(?:out of 10|\/10)/i) ||
                    lower.match(/dolor.*?(\d{1,2})/i) ||
                    lower.match(/दर्द.*?(\d{1,2})/i);
  if (painMatch) {
    const parsed = parseInt(painMatch[1], 10);
    if (parsed >= 0 && parsed <= 10) painScore = parsed;
  }

  // Symptom extraction heuristic
  const symptomKeywords = [
    { pattern: /chest pain|crushing chest/i, symptom: 'chest pain' },
    { pattern: /shortness of breath|difficulty breathing|breathless/i, symptom: 'dyspnea (shortness of breath)' },
    { pattern: /headache|migraine/i, symptom: 'headache' },
    { pattern: /fever|temperature|chills/i, symptom: 'fever' },
    { pattern: /abdominal pain|stomach pain|belly/i, symptom: 'abdominal pain' },
    { pattern: /vomit|nausea|throwing up/i, symptom: 'nausea/vomiting' },
    { pattern: /cough|coughing/i, symptom: 'cough' },
    { pattern: /cut|bleed|laceration|wound/i, symptom: 'laceration / bleeding' },
    { pattern: /dizzy|dizziness|lightheaded/i, symptom: 'dizziness' },
    { pattern: /fracture|broken|fall|swollen|swelling/i, symptom: 'swelling / acute trauma' },
    { pattern: /rash|itching|hives/i, symptom: 'skin rash' },
    { pattern: /refill|prescription|medication/i, symptom: 'medication refill' }
  ];

  const symptoms = [];
  for (const item of symptomKeywords) {
    if (item.pattern.test(lower)) symptoms.push(item.symptom);
  }
  if (symptoms.length === 0) {
    symptoms.push('Reported discomfort');
  }

  // Duration extraction heuristic
  let duration = 'Recent onset';
  const durationMatch = lower.match(/(\d+\s*(?:minute|hour|day|week|month)s?(?:\s*ago)?)/i);
  if (durationMatch) {
    duration = durationMatch[1];
  }

  // Chief complaint synthesis
  let chief_complaint = symptoms.slice(0, 2).join(' and ');
  chief_complaint = chief_complaint.charAt(0).toUpperCase() + chief_complaint.slice(1);

  // ESI Level determination
  let esi_level = 'ESI_4';
  if (isRed) {
    esi_level = 'ESI_1';
  } else if (painScore >= 8 || lower.includes('severe') || lower.includes('confus')) {
    esi_level = 'ESI_2';
  } else if (symptoms.length >= 2 || painScore >= 5 || lower.includes('fracture') || lower.includes('vomit')) {
    esi_level = 'ESI_3';
  } else if (lower.includes('refill') || lower.includes('minor') || painScore <= 2) {
    esi_level = 'ESI_5';
  }

  // Multilingual summary synthesis
  let ai_summary = 'Your intake information has been safely received. A triage nurse will attend to you shortly.';
  if (language.startsWith('es')) {
    ai_summary = isRed
      ? '¡Alerta de emergencia activada! Por favor permanezca sentado, el equipo médico de reanimación ha sido notificado.'
      : 'Su información de ingreso ha sido registrada de manera segura. Un enfermero de triaje le atenderá a la brevedad.';
  } else if (language.startsWith('hi')) {
    ai_summary = isRed
      ? 'आपातकालीन चेतावनी सक्रिय! कृपया शांत रहें, पुनर्जीवन टीम को तत्काल सूचित कर दिया गया है।'
      : 'आपकी जानकारी सफलतापूर्वक दर्ज कर ली गई है। शीघ्र ही एक नर्स आपकी जांच करेगी।';
  } else if (isRed) {
    ai_summary = 'Emergency resuscitation alert triggered. Please stay seated; the medical team has been alerted immediately.';
  }

  return {
    chief_complaint,
    translated_english_transcript: transcript,
    symptoms,
    duration,
    pain_score: painScore,
    esi_level,
    is_red_flag: isRed,
    red_flag_triggers: redFlags,
    ai_summary
  };
}

/**
 * Main Analysis Service:
 * 1. Executes Deterministic Safety Circuit-Breaker
 * 2. Invokes Gemini 2.5 Flash via @google/genai SDK with strict JSON schema
 * 3. Enforces deterministic red-flag overrides on LLM response
 */
export const analyzeSymptomTranscript = async (transcript, language = 'en-US', age_group = 'adult', patient_name = 'Anonymous') => {
  // Step 1: Pre-execution deterministic safety circuit-breaker
  const deterministicTriggers = checkRedFlags(transcript);
  const isDeterministicCritical = deterministicTriggers.length > 0;

  let structuredData = null;

  // Step 2: Invoke Gemini 2.5 Flash if available
  if (ai) {
    try {
      const prompt = `Analyze the following raw clinical voice transcript provided in language code "${language}" from a patient (${age_group}, Name: ${patient_name}). Extract the clinical information and standard English translation strictly following the provided schema.
      
If the spoken language is not English, ensure:
1. "translated_english_transcript" contains a faithful, clear English translation.
2. "chief_complaint" and "symptoms" are in clinical English.
3. "ai_summary" is an empathetic, non-diagnostic confirmation message in the patient's spoken language code ("${language}").

Raw Voice Transcript:
"${transcript}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: `You are an emergency medical triage processing engine embedded in a safety-critical clinical intake application. Your sole responsibility is to convert raw, unstructured patient voice transcripts into structured, operational clinical JSON data.

CRITICAL CONSTRAINTS:
- You DO NOT provide medical diagnoses, treatment plans, or drug recommendations.
- You MUST strictly evaluate urgency using standard Emergency Severity Index (ESI) criteria:
  ESI_1: Resuscitation - Immediate life-saving intervention needed (unresponsive, severe respiratory distress, cardiac arrest, crushing chest pain, stroke symptoms).
  ESI_2: Emergent - High risk, acute confusion, severe pain (8-10/10), acute abdominal distress, respiratory compromise.
  ESI_3: Urgent - Stable, requires two or more resources (e.g., lab + X-ray, complex splinting).
  ESI_4: Less Urgent - Stable, requires single resource (e.g., simple suture, basic X-ray).
  ESI_5: Non-Urgent - Stable, requires no resources (e.g., routine medication refill, minor rash, suture removal).
- If any life-threatening indicators are present, set is_red_flag to true and populate red_flag_triggers.
- Translate all extracted clinical fields into clear, standardized English regardless of input language.`,
          responseMimeType: 'application/json',
          responseSchema: triageResponseSchema,
          temperature: 0.1,
        },
      });

      if (response && response.text) {
        structuredData = JSON.parse(response.text);
      }
    } catch (llmError) {
      console.warn('⚠️  Gemini API call failed or encountered error, falling back to deterministic parser:', llmError.message);
      structuredData = null;
    }
  }

  // Fallback to rule-based parser if LLM is unavailable or failed
  if (!structuredData) {
    structuredData = runDeterministicFallbackParser(transcript, language, age_group);
  }

  // Step 3: DETERMINISTIC CIRCUIT-BREAKER ENFORCEMENT
  // If deterministic safety engine caught critical keywords, OVERRIDE any lower ESI
  if (isDeterministicCritical) {
    structuredData.is_red_flag = true;
    structuredData.esi_level = 'ESI_1';
    
    // Merge deterministic triggers
    const existing = new Set(structuredData.red_flag_triggers || []);
    for (const trig of deterministicTriggers) {
      existing.add(trig);
    }
    structuredData.red_flag_triggers = Array.from(existing);
  }

  // Ensure default safety fields
  if (!structuredData.pain_score && structuredData.pain_score !== 0) {
    structuredData.pain_score = 0;
  }
  if (!Array.isArray(structuredData.symptoms)) {
    structuredData.symptoms = [structuredData.chief_complaint || 'Symptom reported'];
  }
  if (!Array.isArray(structuredData.red_flag_triggers)) {
    structuredData.red_flag_triggers = isDeterministicCritical ? deterministicTriggers : [];
  }

  return structuredData;
};
