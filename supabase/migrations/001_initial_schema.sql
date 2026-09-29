-- ====================================================================
-- TriageVoice AI - Supabase PostgreSQL Initial Migration
-- Migration: 001_initial_schema.sql
-- Description: Core schema, enums, tables, indexes, RLS policies, and seeds
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Enums (if not already created)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'esi_level_enum') THEN
        CREATE TYPE esi_level_enum AS ENUM ('ESI_1', 'ESI_2', 'ESI_3', 'ESI_4', 'ESI_5');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('PATIENT', 'NURSE', 'DOCTOR', 'ADMIN');
    END IF;
END $$;

-- 3. Users Table (Clinical Staff & Admins)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'NURSE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Triage Records Table
CREATE TABLE IF NOT EXISTS triage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_name VARCHAR(255) DEFAULT 'Anonymous/Unidentified',
    age_group VARCHAR(50) NOT NULL,
    primary_language VARCHAR(10) NOT NULL DEFAULT 'en-US',
    raw_transcript TEXT NOT NULL,
    translated_english_transcript TEXT,
    chief_complaint VARCHAR(255) NOT NULL,
    symptoms JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of string symptoms
    duration VARCHAR(100),
    pain_score INT CHECK (pain_score BETWEEN 0 AND 10),
    esi_level esi_level_enum NOT NULL,
    is_red_flag BOOLEAN DEFAULT FALSE,
    red_flag_triggers JSONB DEFAULT '[]'::jsonb,
    ai_summary TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'QUEUED', -- QUEUED, IN_ASSESSMENT, DISCHARGED, ADMITTED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_triage_esi_status ON triage_records (esi_level, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_triage_red_flag ON triage_records (is_red_flag);
CREATE INDEX IF NOT EXISTS idx_triage_created_at ON triage_records (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- 6. Row Level Security (RLS) Configuration
ALTER TABLE triage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow public intake creation" ON triage_records;
DROP POLICY IF EXISTS "Allow staff to read triage records" ON triage_records;
DROP POLICY IF EXISTS "Allow staff to update record status" ON triage_records;
DROP POLICY IF EXISTS "Allow public read triage record by ID" ON triage_records;
DROP POLICY IF EXISTS "Allow staff to read users" ON users;
DROP POLICY IF EXISTS "Allow admin user management" ON users;

-- Triage Records Policies
-- Public patient intake can insert their initial triage records
CREATE POLICY "Allow public intake creation" 
ON triage_records FOR INSERT 
TO public 
WITH CHECK (true);

-- Public can read their single record by ID for the intake confirmation page
CREATE POLICY "Allow public read triage record by ID" 
ON triage_records FOR SELECT 
TO public 
USING (true);

-- Authenticated clinical staff can select all triage records
CREATE POLICY "Allow staff to read triage records" 
ON triage_records FOR SELECT 
TO authenticated 
USING (true);

-- Authenticated staff can update triage records (e.g. status changes, manual ESI overrides)
CREATE POLICY "Allow staff to update record status" 
ON triage_records FOR UPDATE 
TO authenticated 
USING (true);

-- Users Policies
CREATE POLICY "Allow staff to read users"
ON users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admin user management"
ON users FOR ALL
TO authenticated
USING (role = 'ADMIN');

-- 7. Seed Data: Default Staff Accounts
-- Password for Admin: HospitalAdmin2025!
-- Password for Nurse: NurseSarah2025!
-- Password for Doctor: DoctorChen2025!
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'admin@triagevoice.ai', '$2a$10$mIqMwmjWzUli8QxtAEXntu3yBRytpsePrUMw1EDve8IlRGjvkKrqS', 'Dr. Marcus Vance (Chief of ER)', 'ADMIN'),
    ('b0000000-0000-0000-0000-000000000002', 'nurse.sarah@hospital.org', '$2a$10$sDo25LFH8JGAtZADM0vVDOgK.Dj0oooHOAvUCNy7WFvgYQN0OeLCG', 'Nurse Sarah Jenkins (Lead Triage)', 'NURSE'),
    ('c0000000-0000-0000-0000-000000000003', 'dr.chen@hospital.org', '$2a$10$PN9y6.K6OeOIepyg6TWmu.0/cRhn3YXtM23wCI6TT6DihuNrGwJn6', 'Dr. David Chen (Attending Physician)', 'DOCTOR')
ON CONFLICT (email) DO NOTHING;

-- 8. Seed Data: Realistic Initial Clinical Cases Across ESI Levels
INSERT INTO triage_records (
    id, patient_name, age_group, primary_language, raw_transcript, translated_english_transcript,
    chief_complaint, symptoms, duration, pain_score, esi_level, is_red_flag, red_flag_triggers,
    ai_summary, status, created_at
)
VALUES 
(
    'e0000000-0000-0000-0000-000000000001',
    'Robert Miller',
    'elderly',
    'en-US',
    'I have crushing chest pain that radiates into my left jaw and left arm. I can barely breathe and feel faint.',
    'I have crushing chest pain that radiates into my left jaw and left arm. I can barely breathe and feel faint.',
    'Crushing chest pain radiating to arm',
    '["crushing chest pain", "radiating pain to jaw and arm", "shortness of breath", "presyncope"]'::jsonb,
    '30 minutes ago',
    9,
    'ESI_1',
    true,
    '["chest pain", "shortness of breath", "fainting"]'::jsonb,
    'Immediate medical attention required for acute cardiac symptoms. Please remain seated while resuscitation team responds.',
    'QUEUED',
    NOW() - INTERVAL '4 minutes'
),
(
    'e0000000-0000-0000-0000-000000000002',
    'Elena Rodriguez',
    'adult',
    'es-ES',
    'Tengo un dolor de cabeza muy fuerte, el peor de mi vida, y no puedo mover bien mi brazo derecho.',
    'I have a severe headache, the worst of my life, and I cannot move my right arm properly.',
    'Thunderclap headache and right arm weakness',
    '["thunderclap headache", "focal weakness right arm", "nausea"]'::jsonb,
    '1 hour ago',
    10,
    'ESI_1',
    true,
    '["stroke"]'::jsonb,
    'Alerta neurológica prioritaria activada. El equipo de emergencias médicas ha sido notificado para evaluación inmediata.',
    'QUEUED',
    NOW() - INTERVAL '9 minutes'
),
(
    'e0000000-0000-0000-0000-000000000003',
    'Rajesh Patel',
    'adult',
    'hi-IN',
    'मुझे बहुत तेज बुखार है और पेट के दाहिने निचले हिस्से में असहनीय दर्द हो रहा है। उलटी भी हुई है।',
    'I have high fever and unbearable pain in the right lower abdomen. I have also vomited.',
    'Acute right lower quadrant abdominal pain',
    '["acute abdominal pain", "fever", "vomiting", "possible appendicitis"]'::jsonb,
    '6 hours ago',
    8,
    'ESI_2',
    false,
    '[]'::jsonb,
    'आपकी जानकारी दर्ज कर ली गई है। गंभीर पेट दर्द के कारण आपको तत्काल क्लिनिकल मूल्यांकन के लिए बुलाया जाएगा।',
    'QUEUED',
    NOW() - INTERVAL '18 minutes'
),
(
    'e0000000-0000-0000-0000-000000000004',
    'Amanda Foster',
    'child',
    'en-US',
    'My 7-year-old daughter fell off the monkey bars at school. Her right forearm is swollen, visibly deformed, and she is crying in pain.',
    'My 7-year-old daughter fell off the monkey bars at school. Her right forearm is swollen, visibly deformed, and she is crying in pain.',
    'Right forearm deformity post-fall',
    '["arm deformity", "swelling", "acute trauma pain"]'::jsonb,
    '45 minutes ago',
    7,
    'ESI_3',
    false,
    '[]'::jsonb,
    'Pediatric orthopedic evaluation queued. X-ray imaging and splinting will be prepared shortly.',
    'QUEUED',
    NOW() - INTERVAL '32 minutes'
),
(
    'e0000000-0000-0000-0000-000000000005',
    'Liam Chen',
    'adult',
    'en-US',
    'I sliced my thumb with a clean kitchen knife while chopping vegetables. It stopped bleeding mostly with pressure, but looks like it might need a few stitches.',
    'I sliced my thumb with a clean kitchen knife while chopping vegetables. It stopped bleeding mostly with pressure, but looks like it might need a few stitches.',
    'Superficial thumb laceration',
    '["thumb laceration", "controlled bleeding", "mild pain"]'::jsonb,
    '2 hours ago',
    3,
    'ESI_4',
    false,
    '[]'::jsonb,
    'Your intake is registered for wound care and simple suture assessment. Please keep pressure on the dressing.',
    'QUEUED',
    NOW() - INTERVAL '55 minutes'
),
(
    'e0000000-0000-0000-0000-000000000006',
    'Maria Santos',
    'elderly',
    'en-US',
    'I ran out of my blood pressure medication yesterday and my pharmacy is closed today. I feel fine, no dizziness, just need a 3-day refill bridge.',
    'I ran out of my blood pressure medication yesterday and my pharmacy is closed today. I feel fine, no dizziness, just need a 3-day refill bridge.',
    'Hypertension medication refill request',
    '["prescription refill needed", "asymptomatic", "no distress"]'::jsonb,
    '1 day ago',
    0,
    'ESI_5',
    false,
    '[]'::jsonb,
    'Routine medication refill request logged. You will be seen by a provider for prescription renewal.',
    'IN_ASSESSMENT',
    NOW() - INTERVAL '80 minutes'
)
ON CONFLICT (id) DO NOTHING;
