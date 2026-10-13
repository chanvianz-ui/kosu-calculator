# Kosu Calculator

Aplikasi web mobile-responsive untuk menghitung persentase Kosu sisa dan hasil takaran bahan. Tema dark, tanpa backend, dan riwayat disimpan di `localStorage` browser.

## Rumus utama

- Berat bersih baskom = berat baskom + isi − berat kosong baskom (default 504 g)
- Berat bersih teko = berat teko + isi − berat kosong teko (default 170 g)
- Total Kosu sisa = berat bersih baskom + berat bersih teko
- Persentase Kosu = total Kosu sisa ÷ patokan Kosu utuh (default 9.044) × 100%

Takaran default yang dikonfirmasi:
- Fresh Milk: 3.784
- Creamer: 3.100
- Kopi: 2.160

Richmilk dan oatmilk disediakan sebagai kolom takaran opsional, tanpa rumus atau takaran yang diasumsikan. Semua takaran, berat wadah, dan patokan Kosu dapat disesuaikan di kode/antarmuka.

## Menjalankan secara lokal

Butuh Node.js 18 atau lebih baru.

```bash
npm install
npm run dev
```

Buka http://localhost:3000.

Untuk memeriksa build production:

```bash
npm run build
npm start
```

## Deploy ke Vercel

1. Ekstrak ZIP ini.
2. Buat repository GitHub dan upload semua isi folder proyek (bukan folder ZIP-nya).
3. Masuk ke Vercel dan pilih **Add New → Project**.
4. Import repository GitHub tersebut.
5. Framework akan terdeteksi sebagai Next.js. Biarkan build command default (`next build`) dan deploy.
6. Buka URL hasil deployment di HP.

Tidak memerlukan environment variables atau database.

## Penyimpanan lokal

Pengaturan dan riwayat disimpan di browser/perangkat yang dipakai. Data tidak otomatis tersinkron ke perangkat lain dan bisa hilang jika data situs/browser dihapus. Tab Riwayat menyediakan ekspor JSON sebagai cadangan.
