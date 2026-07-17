# PRD — Aplikasi Pencatatan Jimpitan RT
**Nama Kerja:** JimpitanKu (bisa diganti nanti)
**Versi:** 1.0
**Tanggal:** 16 Juli 2026
**Platform:** Web (Next.js) + Android (mobile companion)

---

## 1. Latar Belakang

Jimpitan adalah tradisi gotong-royong warga RT/RW di mana warga menyisihkan uang/beras setiap hari yang dikumpulkan petugas ronda/jimpitan secara bergilir. Selama ini pencatatan dilakukan manual di buku kas, rawan hilang, sulit direkap, dan tidak transparan ke warga. Aplikasi ini dibuat untuk mendigitalkan pencatatan jimpitan sekaligus keuangan RT secara umum (kas masuk dan keluar), dengan tampilan yang **sederhana** agar mudah dipakai oleh admin/pengurus RT yang belum tentu melek teknologi.

## 2. Tujuan Produk

1. Memudahkan admin RT mencatat setoran jimpitan harian per petugas/jadwal.
2. Menyediakan satu tempat pencatatan kas RT (jimpitan + pemasukan lain + pengeluaran).
3. Menghasilkan laporan bulanan otomatis (rekap saldo) yang bisa dicetak/PDF untuk dibagikan ke warga saat rapat RT.
4. Transparansi: warga bisa melihat rekap tanpa perlu akses edit.

## 3. Target Pengguna & Role

| Role | Deskripsi | Akses |
|---|---|---|
| **Admin RT** | Ketua RT / bendahara / sekretaris | Full akses: kelola anggota, jadwal, input jimpitan, kelola keuangan, generate laporan |
| **Petugas Jimpitan** | Warga yang piket menagih jimpitan (opsional login) | Input nominal jimpitan sesuai jadwalnya saja |
| **Warga (opsional, fase 2)** | Warga umum | Lihat dashboard & laporan (read-only) |

> Asumsi: di fase 1, cukup 1 role **Admin** yang mengoperasikan semua menu (termasuk isi kolom nominal harian), karena skala RT biasanya 1-2 orang pengurus yang pegang aplikasi. Role Petugas & Warga read-only masuk fase 2 jika dibutuhkan.

## 4. Ruang Lingkup Fitur (Fase 1 — MVP)

### 4.1 Menu Anggota
- Tambah/edit/hapus data anggota warga (Nama, No. Rumah/Blok, No. HP, status aktif).
- Tambah/edit jadwal petugas jimpitan (rotasi harian/mingguan — anggota mana bertugas tanggal berapa).
- Generate jadwal otomatis (opsional): rotasi round-robin dari daftar anggota untuk 1 bulan.

### 4.2 Dashboard Jimpitan (Menu utama)
- Tampilan **tabel per bulan** (pilih bulan & tahun via dropdown/switcher).
- Kolom: **Tanggal/Hari**, **Nama Petugas** (otomatis dari jadwal), **Nominal Jimpitan Hari Itu**, **Status** (sudah isi/belum).
- Admin klik baris tanggal berjalan → input/edit nominal.
- Baris tanggal belum terjadi (masa depan) → disabled/tidak bisa diisi.
- Total otomatis di footer tabel (jumlah jimpitan bulan berjalan).
- Highlight baris hari ini.

### 4.3 Menu Keuangan RT
- Catat **pemasukan**: otomatis tarik dari total jimpitan harian + input manual pemasukan lain (misal sumbangan, kas RT, denda, dll).
- Catat **pengeluaran**: kategori bebas/manual (misal: kebersihan, keamanan, sosial, listrik pos ronda, dll), dengan tanggal, keterangan, nominal, bukti (upload foto struk — opsional).
- List transaksi berjalan (mutasi kas) urut tanggal, bisa filter per bulan.
- Saldo berjalan otomatis dihitung (saldo awal bulan + pemasukan − pengeluaran).

### 4.4 Menu Laporan
- Generate laporan bulanan: total pemasukan (jimpitan + lain-lain), total pengeluaran, saldo akhir bulan, saldo dibawa ke bulan berikutnya.
- Rincian tabel jimpitan per hari + rincian mutasi kas.
- Export/print **PDF** siap cetak untuk dibagikan/ditempel/rapat RT.
- Riwayat laporan per bulan (arsip, bisa dibuka ulang bulan-bulan sebelumnya).

### 4.5 Autentikasi
- Login sederhana (email/username + password) untuk Admin.
- (Fase 2) Multi-user dengan role Petugas/Warga.

### 4.6 Mode Offline & Sinkronisasi (Android)
Karena admin/petugas sering input jimpitan langsung saat keliling rumah warga (sinyal HP kerap lemah/hilang di dalam gang atau area tertentu), aplikasi Android **wajib bisa dipakai tanpa koneksi internet** dan mengirim data begitu koneksi tersedia lagi.

- **Penyimpanan lokal**: setiap input (nominal jimpitan, transaksi keuangan, perubahan anggota/jadwal) yang dibuat saat offline disimpan dulu di database lokal di HP.
- **Indikator status**: setiap data offline ditandai status `belum tersinkron` (misal ikon jam/awan-coret) sampai berhasil terkirim ke server.
- **Sinkronisasi otomatis**: begitu HP mendeteksi koneksi internet aktif kembali, aplikasi otomatis mengirim (upload) semua data yang masih tertahan di lokal ke server, tanpa perlu aksi manual dari admin.
- **Sinkronisasi manual**: tetap sediakan tombol "Sinkronkan Sekarang" untuk jaga-jaga (misal admin ingin memastikan data terkirim sebelum HP dimatikan).
- **Penanganan konflik**: karena skala 1 RT dan biasanya cuma 1 admin aktif yang input per waktu, dipakai strategi sederhana **last-write-wins berbasis timestamp**, dengan pengecualian khusus untuk kolom nominal jimpitan per tanggal — jika ada 2 data offline untuk tanggal yang sama, sistem menandai sebagai "perlu ditinjau admin" agar tidak ada nominal yang tertimpa tanpa disadari.
- **Notifikasi hasil sync**: setelah sync selesai, tampilkan ringkasan singkat ("12 data berhasil disinkronkan") dan daftar data yang gagal/butuh ditinjau (jika ada).
- **Batas data offline**: aplikasi tetap bisa dipakai offline berhari-hari (tidak ada limit ketat), tapi disarankan sync minimal 1x sehari agar dashboard web tetap up-to-date buat yang mengecek dari browser.
- Fitur ini **khusus berlaku di aplikasi Android**; versi web tetap membutuhkan koneksi internet aktif (browser selalu online saat diakses).

## 5. Di Luar Ruang Lingkup Fase 1 (Backlog)
- Notifikasi WhatsApp/reminder ke petugas jadwal hari itu.
- Multi-RT / multi-tenant (1 instance untuk banyak RT sekaligus).
- Approval/verifikasi berjenjang (petugas input → admin approve).
- Export Excel.
- Statistik/grafik tren jimpitan.

## 6. Data Model (Ringkas)

```
Anggota
- id, nama, no_rumah, no_hp, status_aktif

JadwalPetugas
- id, anggota_id, tanggal, keterangan

Jimpitan (harian)
- id, tanggal, jadwal_id (FK ke JadwalPetugas), nominal, diisi_oleh, diisi_pada, catatan

TransaksiKeuangan
- id, tanggal, jenis (pemasukan/pengeluaran), sumber (jimpitan/lain-lain/manual), kategori, keterangan, nominal, bukti_url

LaporanBulanan (bisa generated, tidak perlu disimpan permanen — dihitung on-the-fly dari Jimpitan + TransaksiKeuangan)
- bulan, tahun, total_pemasukan, total_pengeluaran, saldo_awal, saldo_akhir

User (Admin/Petugas)
- id, nama, email, password_hash, role
```

**Field tambahan untuk dukungan sinkronisasi** (ditambahkan ke tabel `Jimpitan`, `TransaksiKeuangan`, `Anggota`, `JadwalPetugas` — semua tabel yang bisa diisi/diubah dari HP saat offline):

```
- local_id        (UUID dibuat di HP saat data dibuat offline, jadi acuan sebelum dapat id resmi dari server)
- sync_status      (synced / pending / conflict)
- created_at_local (timestamp saat data dibuat di HP, dipakai untuk last-write-wins)
- synced_at        (timestamp saat berhasil terkirim ke server)
```

## 7. Non-Functional Requirements

- **Sederhana & ringan**: UI minimal, tidak butuh training khusus untuk pengurus RT.
- **Mobile-first**: mayoritas input dilakukan dari HP (Android), tabel dashboard tetap harus nyaman di layar kecil.
- **Data akurat**: validasi nominal (angka positif), tidak bisa double-input tanggal yang sama.
- **Keamanan**: hanya admin yang bisa hapus/edit transaksi keuangan; audit log sederhana (siapa isi, kapan).
- **Cetak PDF rapi**: layout laporan harus enak dibaca & di-print di kertas A4.
- **Offline-first di Android (wajib fase 1)**: admin/petugas bisa tetap input data walau tanpa sinyal, data tersimpan aman di lokal dan otomatis terkirim saat online kembali (lihat detail di 4.6). Tidak boleh ada data hilang akibat aplikasi ditutup/HP restart sebelum sempat sync.

## 8. Rekomendasi Tech Stack

| Layer | Pilihan |
|---|---|
| Web Frontend | Next.js (App Router) + Tailwind CSS |
| Mobile Android | **Capacitor** membungkus Next.js/PWA yang sama (1 codebase UI) — alternatif: React Native/Expo jika butuh UX native penuh |
| Backend | Next.js API Routes / Route Handlers (atau backend terpisah bila mau scale — Laravel juga bisa mengikuti pola project ReelPasar) |
| Database | PostgreSQL (Supabase/Neon) — cocok untuk relasi Anggota-Jadwal-Transaksi |
| Auth | NextAuth.js / Supabase Auth (sederhana, credential-based) |
| PDF Generation | `@react-pdf/renderer` atau Puppeteer (render HTML laporan → PDF) |
| Penyimpanan Offline (Android) | SQLite lokal via `@capacitor-community/sqlite`, atau alternatif lebih ringan: IndexedDB via Dexie.js kalau ingin tetap 1 kode web murni |
| Mekanisme Sync | Background sync job (Capacitor) yang mendeteksi status koneksi (`@capacitor/network`) → kirim batch data `pending` ke API saat online, dengan endpoint khusus `POST /api/sync` |
| Hosting | Vercel (web) + build APK via Capacitor untuk Android |

> Karena skala aplikasi kecil (1 RT, data ringan), pilihan **Next.js full-stack + Capacitor** paling efisien: 1 codebase, tidak perlu maintain 2 aplikasi terpisah (web & native). Ini beda dengan ReelPasar yang butuh Laravel terpisah karena kompleksitas lebih tinggi.

## 9. Metrik Keberhasilan (Fase 1)

- Admin bisa input jimpitan harian dalam < 30 detik per hari.
- Laporan bulanan bisa di-generate & di-print dalam < 1 menit.
- 100% data bulan berjalan tercatat tanpa kehilangan data (no manual buku lagi).
