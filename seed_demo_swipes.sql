-- ============================================================
-- StudyMatch: Demo Mode — Auto-Match Trigger
-- Tujuan: Siapapun yang swipe kanan ke profil dummy akan
--         LANGSUNG mendapat match, tanpa perlu mengetahui UUID
--         pengguna tersebut sebelumnya.
--
-- Cara pakai:
--   1. Buka Supabase Dashboard → SQL Editor
--   2. Jalankan STEP 1 dulu (tandai profil dummy), lalu STEP 2 (trigger)
--   3. Cukup dijalankan SATU KALI.
-- ============================================================


-- ─── STEP 1: Tandai semua profil dummy dengan flag is_demo ────────────────────
-- Ini menandai semua profil KECUALI profil asli Anda sebagai profil demo.
-- Jika nanti ada pengguna baru yang mendaftar (juri), mereka tidak akan
-- ikut ditandai karena onboarding_completed_at mereka berbeda waktu.
UPDATE profiles
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"is_demo": true}'::jsonb
WHERE id != 'a53e338a-4593-4f1f-8b7a-8c946c7b7274'
  AND onboarding_completed_at IS NOT NULL;

-- Verifikasi berapa profil yang ditandai
SELECT COUNT(*) AS demo_profiles_tagged FROM profiles WHERE metadata->>'is_demo' = 'true';


-- ─── STEP 2: Buat function auto-match ────────────────────────────────────────
CREATE OR REPLACE FUNCTION auto_match_on_demo_swipe()
RETURNS TRIGGER AS $$
DECLARE
  v_target_is_demo BOOLEAN;
  v_low_id  UUID;
  v_high_id UUID;
BEGIN
  -- Hanya proses swipe 'like'
  IF NEW.action != 'like' THEN
    RETURN NEW;
  END IF;

  -- Cek apakah target adalah profil demo
  SELECT COALESCE((metadata->>'is_demo')::boolean, false)
  INTO   v_target_is_demo
  FROM   profiles
  WHERE  id = NEW.target_profile_id;

  IF NOT v_target_is_demo THEN
    RETURN NEW;
  END IF;

  -- Profil demo otomatis "balik suka" ke user yang swipe
  INSERT INTO swipes (actor_profile_id, target_profile_id, action)
  VALUES (NEW.target_profile_id, NEW.actor_profile_id, 'like')
  ON CONFLICT (actor_profile_id, target_profile_id) DO UPDATE SET action = 'like';

  -- Buat record match (jika belum ada)
  v_low_id  := LEAST(NEW.actor_profile_id, NEW.target_profile_id);
  v_high_id := GREATEST(NEW.actor_profile_id, NEW.target_profile_id);

  INSERT INTO matches (profile_a_id, profile_b_id, compatibility_score)
  VALUES (v_low_id, v_high_id, 92)
  ON CONFLICT (profile_a_id, profile_b_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── STEP 3: Pasang trigger ke tabel swipes ────────────────────────────────────
DROP TRIGGER IF EXISTS trg_auto_match_demo ON swipes;

CREATE TRIGGER trg_auto_match_demo
  AFTER INSERT OR UPDATE ON swipes
  FOR EACH ROW
  EXECUTE FUNCTION auto_match_on_demo_swipe();

-- Konfirmasi trigger aktif
SELECT trigger_name, event_manipulation, event_object_table
FROM   information_schema.triggers
WHERE  trigger_name = 'trg_auto_match_demo';
