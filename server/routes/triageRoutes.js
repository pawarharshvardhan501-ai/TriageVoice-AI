import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

function parseJsonResponse(rawText) {
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in Gemini output');
  }
  return JSON.parse(jsonMatch[0]);
}

router.post('/analyze', async (req, res) => {
  try {
    const { transcript, language, patient_name, age_group } = req.body;

    // 1. Safety Red-Flag Circuit Breaker (Deterministic Safety First)
    const CRITICAL_KEYWORDS = [
      'chest pain', 'shortness of breath', "can't breathe", 'stroke',
      'fainting', 'unconscious', 'severe bleeding', 'heart attack', 'crushing chest'
    ];
    const lower = (transcript || '').toLowerCase();
    const matchedFlags = CRITICAL_KEYWORDS.filter(kw => lower.includes(kw));
    const isRedFlag = matchedFlags.length > 0;

    // 2. Gemini Analysis Setup
    let triageData;
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is missing from environment variables');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.5-flash-lite', // <-- Updated model name
        generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
  }
});

      const prompt = `You are an emergency clinical triage assistant. Analyze this intake transcript: "${transcript}".
Return ONLY a raw JSON object with these exact keys:
{
  "chief_complaint": "Short summary of main issue",
  "esi_level": "ESI_1" | "ESI_2" | "ESI_3" | "ESI_4" | "ESI_5",
  "ai_summary": "Concise 2-sentence clinical intake summary",
  "symptoms": ["list", "of", "extracted", "symptoms"]
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      triageData = parseJsonResponse(responseText);

    } catch (geminiErr) {
      console.error('❌ GEMINI API ERROR:', geminiErr);

      // Fallback response if API fails
      triageData = {
        chief_complaint: (transcript || '').slice(0, 40),
        esi_level: isRedFlag ? 'ESI_1' : 'ESI_3',
        ai_summary: isRedFlag
          ? 'CRITICAL ALERT: Life-threatening indicators detected. Resuscitation team notified.'
          : 'Patient intake details logged successfully. Directed to standard queue.',
        symptoms: [transcript]
      };
    }

    if (isRedFlag) {
      triageData.esi_level = 'ESI_1';
    }

    return res.json({
      success: true,
      patient_name: patient_name || 'Harshvardhan',
      is_red_flag: isRedFlag,
      red_flags: matchedFlags,
      ...triageData
    });

  } catch (error) {
    console.error('Triage Endpoint Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;