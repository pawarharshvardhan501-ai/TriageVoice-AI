import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    })
  : null;

if (isSupabaseConfigured) {
  console.log('⚡ Supabase Cloud PostgreSQL client initialized at:', supabaseUrl);
} else {
  console.log('ℹ️  Supabase credentials not configured in .env. Running with robust in-memory clinical database adapter.');
  console.log('   Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to server/.env to sync directly to cloud database.');
}

// In-Memory Fallback Store (Pre-seeded with clinical data matching 001_initial_schema.sql)
const inMemoryUsers = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    email: 'admin@triagevoice.ai',
    password_hash: '$2a$10$mIqMwmjWzUli8QxtAEXntu3yBRytpsePrUMw1EDve8IlRGjvkKrqS', // HospitalAdmin2025!
    full_name: 'Dr. Marcus Vance (Chief of ER)',
    role: 'ADMIN',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    email: 'nurse.sarah@hospital.org',
    password_hash: '$2a$10$sDo25LFH8JGAtZADM0vVDOgK.Dj0oooHOAvUCNy7WFvgYQN0OeLCG', // NurseSarah2025!
    full_name: 'Nurse Sarah Jenkins (Lead Triage)',
    role: 'NURSE',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    email: 'dr.chen@hospital.org',
    password_hash: '$2a$10$PN9y6.K6OeOIepyg6TWmu.0/cRhn3YXtM23wCI6TT6DihuNrGwJn6', // DoctorChen2025!
    full_name: 'Dr. David Chen (Attending Physician)',
    role: 'DOCTOR',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

const inMemoryRecords = [
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    patient_name: 'Robert Miller',
    age_group: 'elderly',
    primary_language: 'en-US',
    raw_transcript: 'I have crushing chest pain that radiates into my left jaw and left arm. I can barely breathe and feel faint.',
    translated_english_transcript: 'I have crushing chest pain that radiates into my left jaw and left arm. I can barely breathe and feel faint.',
    chief_complaint: 'Crushing chest pain radiating to arm',
    symptoms: ['crushing chest pain', 'radiating pain to jaw and arm', 'shortness of breath', 'presyncope'],
    duration: '30 minutes ago',
    pain_score: 9,
    esi_level: 'ESI_1',
    is_red_flag: true,
    red_flag_triggers: ['chest pain', 'shortness of breath', 'fainting'],
    ai_summary: 'Immediate medical attention required for acute cardiac symptoms. Please remain seated while resuscitation team responds.',
    status: 'QUEUED',
    created_at: new Date(Date.now() - 4 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 60000).toISOString()
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    patient_name: 'Elena Rodriguez',
    age_group: 'adult',
    primary_language: 'es-ES',
    raw_transcript: 'Tengo un dolor de cabeza muy fuerte, el peor de mi vida, y no puedo mover bien mi brazo derecho.',
    translated_english_transcript: 'I have a severe headache, the worst of my life, and I cannot move my right arm properly.',
    chief_complaint: 'Thunderclap headache and right arm weakness',
    symptoms: ['thunderclap headache', 'focal weakness right arm', 'nausea'],
    duration: '1 hour ago',
    pain_score: 10,
    esi_level: 'ESI_1',
    is_red_flag: true,
    red_flag_triggers: ['stroke symptoms'],
    ai_summary: 'Alerta neurológica prioritaria activada. El equipo de emergencias médicas ha sido notificado para evaluación inmediata.',
    status: 'QUEUED',
    created_at: new Date(Date.now() - 9 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 9 * 60000).toISOString()
  },
  {
    id: 'e0000000-0000-0000-0000-000000000003',
    patient_name: 'Rajesh Patel',
    age_group: 'adult',
    primary_language: 'hi-IN',
    raw_transcript: 'मुझे बहुत तेज बुखार है और पेट के दाहिने निचले हिस्से में असहनीय दर्द हो रहा है। उलटी भी हुई है।',
    translated_english_transcript: 'I have high fever and unbearable pain in the right lower abdomen. I have also vomited.',
    chief_complaint: 'Acute right lower quadrant abdominal pain',
    symptoms: ['acute abdominal pain', 'fever', 'vomiting', 'possible appendicitis'],
    duration: '6 hours ago',
    pain_score: 8,
    esi_level: 'ESI_2',
    is_red_flag: false,
    red_flag_triggers: [],
    ai_summary: 'आपकी जानकारी दर्ज कर ली गई है। गंभीर पेट दर्द के कारण आपको तत्काल क्लिनICAL मूल्यांकन के लिए बुलाया जाएगा।',
    status: 'QUEUED',
    created_at: new Date(Date.now() - 18 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 18 * 60000).toISOString()
  },
  {
    id: 'e0000000-0000-0000-0000-000000000004',
    patient_name: 'Amanda Foster',
    age_group: 'child',
    primary_language: 'en-US',
    raw_transcript: 'My 7-year-old daughter fell off the monkey bars at school. Her right forearm is swollen, visibly deformed, and she is crying in pain.',
    translated_english_transcript: 'My 7-year-old daughter fell off the monkey bars at school. Her right forearm is swollen, visibly deformed, and she is crying in pain.',
    chief_complaint: 'Right forearm deformity post-fall',
    symptoms: ['arm deformity', 'swelling', 'acute trauma pain'],
    duration: '45 minutes ago',
    pain_score: 7,
    esi_level: 'ESI_3',
    is_red_flag: false,
    red_flag_triggers: [],
    ai_summary: 'Pediatric orthopedic evaluation queued. X-ray imaging and splinting will be prepared shortly.',
    status: 'QUEUED',
    created_at: new Date(Date.now() - 32 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 32 * 60000).toISOString()
  },
  {
    id: 'e0000000-0000-0000-0000-000000000005',
    patient_name: 'Liam Chen',
    age_group: 'adult',
    primary_language: 'en-US',
    raw_transcript: 'I sliced my thumb with a clean kitchen knife while chopping vegetables. It stopped bleeding mostly with pressure, but looks like it might need a few stitches.',
    translated_english_transcript: 'I sliced my thumb with a clean kitchen knife while chopping vegetables. It stopped bleeding mostly with pressure, but looks like it might need a few stitches.',
    chief_complaint: 'Superficial thumb laceration',
    symptoms: ['thumb laceration', 'controlled bleeding', 'mild pain'],
    duration: '2 hours ago',
    pain_score: 3,
    esi_level: 'ESI_4',
    is_red_flag: false,
    red_flag_triggers: [],
    ai_summary: 'Your intake is registered for wound care and simple suture assessment. Please keep pressure on the dressing.',
    status: 'QUEUED',
    created_at: new Date(Date.now() - 55 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 55 * 60000).toISOString()
  },
  {
    id: 'e0000000-0000-0000-0000-000000000006',
    patient_name: 'Maria Santos',
    age_group: 'elderly',
    primary_language: 'en-US',
    raw_transcript: 'I ran out of my blood pressure medication yesterday and my pharmacy is closed today. I feel fine, no dizziness, just need a 3-day refill bridge.',
    translated_english_transcript: 'I ran out of my blood pressure medication yesterday and my pharmacy is closed today. I feel fine, no dizziness, just need a 3-day refill bridge.',
    chief_complaint: 'Hypertension medication refill request',
    symptoms: ['prescription refill needed', 'asymptomatic', 'no distress'],
    duration: '1 day ago',
    pain_score: 0,
    esi_level: 'ESI_5',
    is_red_flag: false,
    red_flag_triggers: [],
    ai_summary: 'Routine medication refill request logged. You will be seen by a provider for prescription renewal.',
    status: 'IN_ASSESSMENT',
    created_at: new Date(Date.now() - 80 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 80 * 60000).toISOString()
  }
];

// ESI sorting weight: ESI_1 is highest priority (1), ESI_5 is lowest (5)
const ESI_WEIGHTS = {
  'ESI_1': 1,
  'ESI_2': 2,
  'ESI_3': 3,
  'ESI_4': 4,
  'ESI_5': 5
};

export const dbService = {
  // USER OPERATIONS
  async findUserByEmail(email) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (error) {
        console.error('Supabase findUserByEmail error:', error.message);
        // Fallback to in-memory if table does not exist yet
      } else if (data) {
        return data;
      }
    }
    return inMemoryUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async createUser({ email, password_hash, full_name, role = 'NURSE' }) {
    const newUser = {
      id: crypto.randomUUID(),
      email,
      password_hash,
      full_name,
      role,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();
      if (!error && data) {
        return data;
      }
      console.warn('Supabase createUser failed, saving to in-memory store:', error?.message);
    }

    inMemoryUsers.push(newUser);
    return newUser;
  },

  // TRIAGE RECORD OPERATIONS
  async insertTriageRecord(record) {
    const newRecord = {
      id: crypto.randomUUID(),
      patient_name: record.patient_name || 'Anonymous/Unidentified',
      age_group: record.age_group || 'adult',
      primary_language: record.primary_language || 'en-US',
      raw_transcript: record.raw_transcript,
      translated_english_transcript: record.translated_english_transcript || record.raw_transcript,
      chief_complaint: record.chief_complaint,
      symptoms: Array.isArray(record.symptoms) ? record.symptoms : [],
      duration: record.duration || 'Not specified',
      pain_score: typeof record.pain_score === 'number' ? record.pain_score : 0,
      esi_level: record.esi_level || 'ESI_4',
      is_red_flag: Boolean(record.is_red_flag),
      red_flag_triggers: Array.isArray(record.red_flag_triggers) ? record.red_flag_triggers : [],
      ai_summary: record.ai_summary || '',
      status: record.status || 'QUEUED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('triage_records')
        .insert([newRecord])
        .select()
        .single();
      if (!error && data) {
        return data;
      }
      console.warn('Supabase insertTriageRecord failed, fallback to in-memory store:', error?.message);
    }

    inMemoryRecords.unshift(newRecord);
    return newRecord;
  },

  async getTriageRecordById(id) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('triage_records')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!error && data) {
        return data;
      }
    }
    return inMemoryRecords.find(r => r.id === id) || null;
  },

  async listTriageQueue({ status, search, esi_level } = {}) {
    let records = [];

    if (isSupabaseConfigured) {
      let query = supabase.from('triage_records').select('*');
      if (status && status !== 'ALL') {
        query = query.eq('status', status);
      }
      if (esi_level && esi_level !== 'ALL') {
        query = query.eq('esi_level', esi_level);
      }
      query = query.order('is_red_flag', { ascending: false })
                   .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (!error && data) {
        records = data;
      } else {
        console.warn('Supabase listTriageQueue error, falling back to memory store:', error?.message);
        records = [...inMemoryRecords];
      }
    } else {
      records = [...inMemoryRecords];
    }

    // Apply filtering in memory (covers fallback & local searches)
    if (status && status !== 'ALL') {
      records = records.filter(r => r.status === status);
    }
    if (esi_level && esi_level !== 'ALL') {
      records = records.filter(r => r.esi_level === esi_level);
    }
    if (search && search.trim() !== '') {
      const q = search.toLowerCase();
      records = records.filter(r => 
        (r.patient_name && r.patient_name.toLowerCase().includes(q)) ||
        (r.chief_complaint && r.chief_complaint.toLowerCase().includes(q)) ||
        (r.raw_transcript && r.raw_transcript.toLowerCase().includes(q)) ||
        (r.translated_english_transcript && r.translated_english_transcript.toLowerCase().includes(q)) ||
        (Array.isArray(r.symptoms) && r.symptoms.some(s => s.toLowerCase().includes(q)))
      );
    }

    // Strict Clinical Queue Ordering:
    // 1. ESI Urgency: ESI_1 first, then ESI_2, ESI_3, ESI_4, ESI_5
    // 2. Red-flag indicators top
    // 3. Longest wait time (earliest created_at) within the same ESI tier
    return records.sort((a, b) => {
      // Red flag precedence within tier
      const aWeight = ESI_WEIGHTS[a.esi_level] || 99;
      const bWeight = ESI_WEIGHTS[b.esi_level] || 99;

      if (aWeight !== bWeight) {
        return aWeight - bWeight;
      }
      if (a.is_red_flag !== b.is_red_flag) {
        return a.is_red_flag ? -1 : 1;
      }
      // Earliest arrival first (longest wait time)
      return new Date(a.created_at) - new Date(b.created_at);
    });
  },

  async updateTriageRecord(id, updates) {
    const allowedKeys = ['status', 'esi_level', 'chief_complaint', 'ai_summary', 'patient_name'];
    const filteredUpdates = {
      updated_at: new Date().toISOString()
    };
    for (const key of allowedKeys) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('triage_records')
        .update(filteredUpdates)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        return data;
      }
      console.warn('Supabase updateTriageRecord error, fallback to memory store:', error?.message);
    }

    const index = inMemoryRecords.findIndex(r => r.id === id);
    if (index === -1) {
      return null;
    }
    inMemoryRecords[index] = {
      ...inMemoryRecords[index],
      ...filteredUpdates
    };
    return inMemoryRecords[index];
  },

  async getStats() {
    const queue = await this.listTriageQueue({ status: 'ALL' });
    const active = queue.filter(r => r.status === 'QUEUED' || r.status === 'IN_ASSESSMENT');
    const esi1Count = active.filter(r => r.esi_level === 'ESI_1').length;
    const esi2Count = active.filter(r => r.esi_level === 'ESI_2').length;
    const redFlagCount = active.filter(r => r.is_red_flag).length;

    // Calculate average wait time for queued patients in minutes
    const now = Date.now();
    const queued = active.filter(r => r.status === 'QUEUED');
    const totalWaitMs = queued.reduce((sum, r) => sum + (now - new Date(r.created_at).getTime()), 0);
    const avgWaitMinutes = queued.length > 0 ? Math.round((totalWaitMs / queued.length) / 60000) : 0;

    return {
      total_active: active.length,
      esi_1_critical: esi1Count,
      esi_2_emergent: esi2Count,
      red_flags_active: redFlagCount,
      avg_wait_minutes: avgWaitMinutes,
      total_records: queue.length
    };
  }
};
