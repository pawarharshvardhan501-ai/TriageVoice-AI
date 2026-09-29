/**
 * Deterministic Safety Circuit-Breaker Engine
 * Evaluates transcripts for acute, life-threatening red-flag keywords
 * and overrides LLM classification with mandatory ESI Level 1 (Resuscitation)
 */

export const CRITICAL_RED_FLAGS = [
  // Cardiac / Thoracic
  { pattern: /chest pain/i, label: 'Chest Pain' },
  { pattern: /crushing chest/i, label: 'Crushing Chest Pressure' },
  { pattern: /heart attack/i, label: 'Possible Myocardial Infarction' },
  { pattern: /radiating to.*arm/i, label: 'Pain Radiating to Arm' },
  { pattern: /radiating to.*jaw/i, label: 'Pain Radiating to Jaw' },
  
  // Respiratory Compromise
  { pattern: /shortness of breath/i, label: 'Acute Dyspnea (Shortness of Breath)' },
  { pattern: /difficulty breathing/i, label: 'Severe Respiratory Distress' },
  { pattern: /cannot breathe/i, label: 'Inability to Breathe' },
  { pattern: /can't breathe/i, label: 'Inability to Breathe' },
  { pattern: /choking/i, label: 'Airway Compromise / Choking' },
  { pattern: /turning blue|cyanosis/i, label: 'Cyanosis / Hypoxia' },
  { pattern: /gasping for air/i, label: 'Agonal / Gasping Respiration' },
  
  // Neurological / Stroke
  { pattern: /stroke/i, label: 'Acute Stroke Symptoms' },
  { pattern: /facial droop/i, label: 'Facial Droop' },
  { pattern: /slurred speech/i, label: 'Slurred Speech' },
  { pattern: /numbness.*side/i, label: 'Hemiplegia / Unilateral Numbness' },
  { pattern: /cannot move.*arm|cannot move.*leg/i, label: 'Focal Motor Deficit' },
  { pattern: /worst headache.*life|thunderclap/i, label: 'Thunderclap Headache' },
  { pattern: /seizure/i, label: 'Active / Prolonged Seizure' },
  
  // Altered Consciousness / Syncope
  { pattern: /unresponsive/i, label: 'Unresponsive Patient' },
  { pattern: /unconscious/i, label: 'Loss of Consciousness' },
  { pattern: /passed out|fainting|blackout/i, label: 'Syncope / Collapse' },
  { pattern: /not waking up/i, label: 'Comatose / Stupor' },
  
  // Hemorrhage & Shock
  { pattern: /severe bleeding|heavy bleeding/i, label: 'Exsanguinating Hemorrhage' },
  { pattern: /coughing up blood/i, label: 'Massive Hemoptysis' },
  { pattern: /vomiting blood/i, label: 'Hematemesis' },
  
  // Allergic & Anaphylaxis
  { pattern: /anaphylaxis/i, label: 'Anaphylaxis' },
  { pattern: /throat closing|throat swelling/i, label: 'Acute Laryngeal Edema' },

  // Multilingual Support - Spanish (es-ES)
  { pattern: /dolor.*pecho/i, label: 'Dolor de Pecho (Chest Pain)' },
  { pattern: /falta.*aire|dificultad para respirar/i, label: 'Dificultad Respiratoria (Shortness of Breath)' },
  { pattern: /inconsciente|desmayo|perdi.*conocimiento/i, label: 'Pérdida de Conciencia (Unconscious / Syncope)' },
  { pattern: /infarto/i, label: 'Sospecha de Infarto (Heart Attack)' },
  { pattern: /derrame cerebral/i, label: 'Derrame Cerebral (Stroke)' },
  { pattern: /sangrado severo|mucha sangre/i, label: 'Sangrado Severo (Severe Bleeding)' },
  { pattern: /no puede respirar/i, label: 'Asfixia (Cannot Breathe)' },

  // Multilingual Support - Hindi (hi-IN)
  { pattern: /सीने में दर्द|छाती में दर्द/i, label: 'Chest Pain (सीने में दर्द)' },
  { pattern: /सांस लेने में तकलीफ|सांस नहीं आ रही/i, label: 'Severe Dyspnea (सांस लेने में तकलीफ)' },
  { pattern: /बेहोश|अचेत/i, label: 'Loss of Consciousness (बेहोश)' },
  { pattern: /दिल का दौरा/i, label: 'Heart Attack (दिल का दौरा)' },
  { pattern: /खून बहना|बहुत ज्यादा खून/i, label: 'Severe Bleeding (खून बहना)' }
];

/**
 * Checks a transcript string against all deterministic safety rules.
 * @param {string} text - Raw patient voice transcript
 * @returns {string[]} Array of human-readable trigger labels
 */
export const checkRedFlags = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  const triggers = [];
  for (const { pattern, label } of CRITICAL_RED_FLAGS) {
    if (pattern.test(text)) {
      if (!triggers.includes(label)) {
        triggers.push(label);
      }
    }
  }
  return triggers;
};

/**
 * Returns true if the transcript triggers any critical red flag.
 * @param {string} text
 * @returns {boolean}
 */
export const isCriticalRedFlag = (text) => {
  return checkRedFlags(text).length > 0;
};
