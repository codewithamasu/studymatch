# StudyMatch

Frontend prototype untuk aplikasi pencarian study partner dengan flow matching, onboarding profil belajar, dan autentikasi berbasis Supabase.

## Local setup

1. Install dependency:

```bash
npm install
```

2. Salin environment file:

```bash
cp .env.example .env
```

3. Isi kredensial Supabase di `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

4. Jalankan project:

```bash
npm run dev
```

## Supabase auth checklist

- Aktifkan provider `Email`.
- Aktifkan provider `Google`.
- Tambahkan redirect URL berikut di dashboard Supabase Auth:
  - `http://localhost:5173/auth/callback`
  - URL production kamu dengan path `/auth/callback`

## Available scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
