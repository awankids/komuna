# Blueprint & Roadmap Sprint — Aplikasi Jimpitan RT

Mengikuti alur: **UX dulu → baru development**, supaya tampilan "sederhana" yang jadi inti requirement benar-benar tervalidasi sebelum coding, dan menghindari bolak-balik redesign.

Asumsi: 1 developer (solo), sprint = 1 minggu. Total estimasi **8 sprint (~8 minggu)** sampai versi rilis internal (dipakai 1 RT dulu sebagai pilot), setelah menambahkan mode offline-sync untuk Android.

---

## Sprint 0 — UX Design & Information Architecture (Minggu 1)

**Tujuan:** Menentukan alur pakai & wireframe sebelum ada 1 baris kode fungsional.

- [ ] Susun **user flow**: Admin login → pilih bulan → isi jimpitan harian → cek keuangan → generate laporan.
- [ ] Wireframe low-fidelity (bisa pakai Figma/Excalidraw) untuk 5 layar inti:
  1. Dashboard Jimpitan (tabel bulanan)
  2. Menu Anggota & Jadwal
  3. Menu Keuangan RT (list transaksi + form tambah)
  4. Menu Laporan (preview + tombol export PDF)
  5. Login
- [ ] Tentukan **design system** ringan: 1 warna primer, tipografi, ukuran tombol besar (ramah jempol/mobile), state warna untuk "sudah isi" vs "belum isi" di tabel.
- [ ] Uji wireframe ke 1-2 calon pengguna nyata (pengurus RT) — validasi apakah alur "klik tanggal → isi nominal" sudah intuitif.
- [ ] Finalisasi high-fidelity mockup (bisa langsung di Next.js + Tailwind sebagai static prototype, mirip pendekatan prototype HTML yang dipakai di ReelPasar).

**Output:** Prototype klik-klik (Figma atau HTML statis) yang sudah divalidasi, siap jadi acuan development.

---

## Sprint 1 — Setup Fondasi & Autentikasi (Minggu 2)

- [ ] Setup project Next.js (App Router) + Tailwind + struktur folder.
- [ ] Setup database (PostgreSQL via Supabase/Neon) + schema awal: `users`, `anggota`, `jadwal_petugas`.
- [ ] Implementasi Auth (login admin sederhana).
- [ ] Layout dasar aplikasi: sidebar/menu (Dashboard, Anggota, Keuangan, Laporan), responsive untuk mobile.
- [ ] Deploy awal ke Vercel (staging).

**Output:** Aplikasi kosong tapi bisa login & navigasi antar menu sesuai wireframe.

---

## Sprint 2 — Menu Anggota & Jadwal (Minggu 3)

- [ ] CRUD Anggota (tambah/edit/hapus/nonaktifkan).
- [ ] CRUD Jadwal Petugas (assign anggota ke tanggal tertentu).
- [ ] Fitur generate jadwal otomatis (rotasi round-robin 1 bulan) — opsional tapi sangat membantu.
- [ ] Validasi: 1 tanggal hanya 1 petugas (atau lebih jika RT punya beberapa titik jimpitan — perlu dikonfirmasi ke user).

**Output:** Admin bisa kelola daftar warga & jadwal piket jimpitan untuk bulan berjalan.

---

## Sprint 3 — Dashboard Jimpitan (Menu Utama) (Minggu 4)

- [ ] Tabel bulanan: render otomatis semua tanggal di bulan terpilih + nama petugas dari jadwal.
- [ ] Interaksi isi nominal per baris (inline edit / modal input).
- [ ] Disable input untuk tanggal yang belum terjadi.
- [ ] Highlight baris "hari ini" & indikator status (isi/belum isi).
- [ ] Total otomatis di footer + switcher bulan/tahun.
- [ ] Optimasi tampilan mobile (tabel scrollable / card view di layar kecil).

**Output:** Fitur inti aplikasi selesai — admin sudah bisa mencatat jimpitan harian.

---

## Sprint 4 — Menu Keuangan RT (Minggu 5)

- [ ] Auto-sync: total jimpitan harian otomatis masuk sebagai pemasukan di modul keuangan.
- [ ] Form input pemasukan lain-lain (manual) & pengeluaran (dengan kategori + keterangan + opsional upload bukti foto).
- [ ] List mutasi kas (urut tanggal, filter per bulan, filter jenis).
- [ ] Hitung saldo berjalan otomatis (saldo awal + pemasukan − pengeluaran).
- [ ] Proteksi: hanya admin yang bisa edit/hapus transaksi.

**Output:** Pembukuan kas RT lengkap, terintegrasi dengan data jimpitan.

---

## Sprint 5 — Menu Laporan & Export PDF (Minggu 6)

- [ ] Halaman preview laporan bulanan: rekap total pemasukan, pengeluaran, saldo akhir, saldo dibawa ke bulan depan.
- [ ] Rincian tabel jimpitan harian + rincian mutasi kas dalam laporan.
- [ ] Generate PDF (layout A4, rapi untuk di-print/ditempel) menggunakan `@react-pdf/renderer` atau Puppeteer.
- [ ] Arsip laporan: bisa buka ulang laporan bulan-bulan sebelumnya.

**Output:** Laporan bulanan siap cetak, fitur utama versi web selesai 100%.

---

## Sprint 6 — Android Wrapper & Mode Offline (Minggu 7)

- [ ] Bungkus web app dengan Capacitor → build APK Android.
- [ ] Setup database lokal di HP (SQLite via `@capacitor-community/sqlite`, atau Dexie.js/IndexedDB) dengan skema yang mencerminkan tabel utama: `Jimpitan`, `TransaksiKeuangan`, `Anggota`, `JadwalPetugas`.
- [ ] Ubah semua form input (isi nominal jimpitan, tambah transaksi, tambah anggota/jadwal) supaya **selalu menulis ke database lokal dulu** (offline-first), baru mencoba kirim ke server jika online.
- [ ] Tambahkan field `local_id`, `sync_status`, `created_at_local` ke setiap record yang dibuat di HP.
- [ ] Implementasi indikator status per baris data (`tersinkron` / `belum tersinkron` / `perlu ditinjau`) di UI.
- [ ] Buat endpoint API `POST /api/sync` di backend untuk menerima batch data dari HP.

**Output:** Aplikasi Android bisa dipakai penuh tanpa internet — semua menu (jimpitan, keuangan, anggota) tetap jalan, data tersimpan aman di HP.

---

## Sprint 7 — Sinkronisasi, QA, & Pilot Launch (Minggu 8)

- [ ] Implementasi deteksi koneksi (`@capacitor/network`) + trigger sync otomatis saat status berubah offline → online.
- [ ] Tombol "Sinkronkan Sekarang" untuk sync manual.
- [ ] Logika resolusi konflik: last-write-wins berbasis `created_at_local`, dengan penandaan khusus "perlu ditinjau admin" untuk bentrok nominal jimpitan di tanggal yang sama.
- [ ] Notifikasi ringkasan hasil sync (berhasil/gagal/perlu ditinjau) + halaman kecil untuk admin meninjau data konflik.
- [ ] Testing skenario offline nyata: mode pesawat, sinyal hilang di tengah input, HP di-restart sebelum sempat sync, 2 device input tanggal sama lalu sync bergantian.
- [ ] End-to-end testing seluruh alur (input jimpitan offline → online → keuangan → laporan PDF).
- [ ] Bug fixing & polish UI berdasarkan Sprint 0 design system.
- [ ] Rilis pilot ke 1 RT nyata untuk dipakai 1 bulan penuh sebagai uji coba (termasuk uji nyata area minim sinyal).
- [ ] Kumpulkan feedback pengguna nyata → jadi backlog fase 2.

**Output:** Aplikasi versi 1.0 dengan mode offline-sync yang teruji, dipakai oleh RT pilot, siap dievaluasi untuk fase 2 (role Petugas/Warga, notifikasi WA, dsb).

---

## Ringkasan Timeline

| Sprint | Fokus | Minggu |
|---|---|---|
| 0 | UX & Wireframe | 1 |
| 1 | Fondasi & Auth | 2 |
| 2 | Anggota & Jadwal | 3 |
| 3 | Dashboard Jimpitan | 4 |
| 4 | Keuangan RT | 5 |
| 5 | Laporan & PDF | 6 |
| 6 | Android Wrapper & Mode Offline | 7 |
| 7 | Sinkronisasi, QA & Pilot Launch | 8 |

## Catatan
- Urutan sprint sengaja meletakkan **Dashboard Jimpitan sebelum Keuangan RT**, karena keuangan butuh data jimpitan sebagai sumber pemasukan otomatis.
- Jika mau dipercepat, Sprint 2 & 3 bisa digabung (anggota/jadwal cukup sederhana), sehingga total bisa jadi 6 sprint.
- Rekomendasi: setelah Sprint 0 selesai, review dulu prototype UX sebelum lanjut coding — ini poin kritikal supaya tampilan tetap "sederhana" sesuai requirement awal, bukan makin kompleks di tengah jalan.
- Mode offline-sync (Sprint 6-7) sengaja dipisah jadi 2 sprint karena ini bagian paling berisiko secara teknis (butuh testing skenario nyata: sinyal hilang, HP restart, dua device input bersamaan). Jangan digabung terburu-buru dengan sprint lain agar tidak jadi sumber bug di versi rilis pertama.
- Kalau timeline mau dipangkas dan risiko offline dianggap bisa diterima lebih sederhana, opsi tercepat: fase 1 rilis dulu **tanpa** offline-sync (kembali ke 7 sprint), lalu offline-sync jadi update terpisah begitu versi dasar sudah stabil dipakai RT pilot.
