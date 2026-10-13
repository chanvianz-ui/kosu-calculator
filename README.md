# Kosu Calculator

Aplikasi kalkulator Kosu dengan riwayat bersama berbasis Supabase Realtime.

## Environment variables

Atur di Vercel Project Settings → Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL` — URL project Supabase.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Publishable key Supabase.

Jangan pernah memasukkan `service_role` key ke frontend. Tabel `public.kosu_history` harus dibuat dan RLS policies diaktifkan lewat SQL Editor Supabase. Aktifkan tabel pada publication `supabase_realtime`.

## Lokal

```bash
npm install
npm run dev
```

Riwayat dibaca dan disimpan ke `kosu_history`. Pilihan penghitung yang tersedia: Chandra, Isfa, Ghani.
