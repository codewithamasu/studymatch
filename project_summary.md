# StudyMatch: Project Handover Summary

Dokumen ini merangkum seluruh kemajuan teknis, arsitektur, dan prinsip desain "StudyMatch" untuk memastikan transisi yang mulus ke sesi kerja baru.

## 🚀 Overview Teknologi
- **Frontend:** React + Vite + Tailwind CSS
- **State Management:** Zustand (Refactored from Context)
- **Backend/Auth:** Supabase (PostgreSQL + RLS)
- **Animations:** GSAP (ScrollTrigger, Context, Draggable)
- **Icons:** Lucide React

---

## 🏗️ Arsitektur State Management (Zustand)
Seluruh global state telah dipindahkan dari legacy `useContext` ke Zustand stores yang terorganisir di `@/store`:

### 1. `useAuthStore.js`
- Mengelola sesi Supabase, profil user, dan aksi auth (`signIn`, `signUp`, `signOut`, `updateProfile`).
- **Persistence:** Menyimpan user di `localStorage` agar sesi tetap ada setelah refresh.
- **Hydration:** Secara otomatis mengambil data profil lengkap dari tabel `public.profiles`.

### 2. `useOnboardingStore.js`
- Mengelola form multi-step (3 tahap) dengan validasi `canProceed`.
- Mendukung draf profile sementara sebelum di-save ke database.

### 3. `useChatStore.js`
- Sinkronisasi pesan real-time, indikator mengetik (`isTyping`), dan sistem draf pesan per percakapan.

---

## 💾 Database Schema (PostgreSQL)
Skema dirancang untuk skalabilitas dan keamanan tinggi menggunakan RLS (Row Level Security):

- **`profiles`**: Metadata akademik (university, subjects, availability, study_style).
- **`swipes`**: Logika matching (left/right/up). Mutual right-swipe otomatis membuat record di `matches`.
- **`matches`**: Relasi antar dua user dengan `compatibility_score` dinamis.
- **`conversations` & `messages`**: Struktur chat terpusat dengan dukungan RLS per `match_id`.
- **`sessions`**: Manajemen jadwal belajar (online via Jitsi meeting_room_id atau offline via location_text).

---

## 🎨 "Impeccable Style" & Design Principles
Aplikasi ini mengikuti standar kualitas visual premium dengan profil **Gen-Z Appeal**:

1. **Interactive & Curiosity-Driven:** UI terinspirasi dating apps (Tinder-style swipes di Discover).
2. **Premium Aesthetics:**
   - **Glassmorphism:** Efek blur transparan pada card dan sidebar.
   - **Modern Type:** Kombinasi `Fraunces` (serif untuk title) dan `Inter` (sans untuk body).
   - **Tailored Gradients:** Gradasi halus dari Oxford Blue ke Cyan/Indigo.
3. **Motion Design (GSAP):**
   - Transisi halaman yang "fluid" (bukan sekadar fade).
   - Micro-interactions pada tombol dan input focus.
   - Draggable cards pada fitur Discover.
4. **Seamless Dual-Theme:** Adaptif sempurna untuk Light Mode dan Dark Mode.

---

## 🛠️ Current Progress & Next Steps
- [x] **Refactor State:** Selesai (Zustand terintegrasi di Navbar, Auth, Onboarding, Chat, Discover, Dashboard).
- [x] **Supabase Integration:** Real database terhubung (bukan lagi full mock).
- [x] **UI Polish:** Dashboard, Sessions, dan Chat sudah "Impeccable".
- [ ] **Next:** Implementasi fitur kolaborasi real-time lebih dalam (Shared Study Goals di Chat) dan integrasi Video Call Jitsi yang lebih stabil.

> [!IMPORTANT]
> **Environment Variables:** Pastikan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` sudah terpasang di akun baru agar aplikasi berfungsi normal.
