-- ============================================================
-- StudyMatch: Demo Mode — Pre-seed Swipes
-- Tujuan: Agar semua profil dummy di database sudah "like" profil
--         pengguna asli, sehingga swipe kanan akan langsung match.
--
-- Cara pakai:
--   1. Buka Supabase Dashboard → SQL Editor
--   2. Paste dan jalankan query ini SATU KALI sebelum demo.
--
-- User UUID (pengguna asli): a53e338a-4593-4f1f-8b7a-8c946c7b7274
-- ============================================================

-- Step 1: Insert swipe "like" dari SEMUA profil lain ke profil Anda.
-- Ini memastikan saat Anda swipe kanan pada siapapun, akan langsung match.
INSERT INTO swipes (actor_profile_id, target_profile_id, action)
SELECT
  p.id AS actor_profile_id,                         -- profil dummy
  'a53e338a-4593-4f1f-8b7a-8c946c7b7274' AS target_profile_id, -- Anda
  'like' AS action
FROM profiles p
WHERE p.id != 'a53e338a-4593-4f1f-8b7a-8c946c7b7274'
  AND p.onboarding_completed_at IS NOT NULL          -- hanya profil yang sudah onboarding
ON CONFLICT (actor_profile_id, target_profile_id) DO UPDATE
  SET action = 'like';                               -- update jika sudah ada

-- Verifikasi: cek jumlah baris yang berhasil di-insert
SELECT
  COUNT(*) AS swipes_seeded,
  'All dummy profiles now like your profile ✅' AS status
FROM swipes
WHERE target_profile_id = 'a53e338a-4593-4f1f-8b7a-8c946c7b7274'
  AND action = 'like';
