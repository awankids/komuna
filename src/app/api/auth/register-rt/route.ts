import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, setSessionCookies } from '@/lib/auth';

function sanitizeRtRw(val?: string | null): string {
  if (!val) return '';
  return String(val).replace(/^(rt|rw)\s*\.?\s*/i, '').trim();
}

async function generateUniqueSlug(baseName: string): Promise<string> {
  const baseSlug = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'rt-baru';

  let candidateSlug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.komunitas.findUnique({
      where: { slug: candidateSlug },
      select: { id: true },
    });
    if (!existing) {
      return candidateSlug;
    }
    counter++;
    candidateSlug = `${baseSlug}-${counter}-${Math.floor(100 + Math.random() * 900)}`;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      // Step 1: Admin Data
      namaAdmin,
      jabatanAdmin,
      noHpAdmin,
      emailAdmin,
      passwordAdmin,

      // Step 2: Wilayah Data
      tingkatWilayah = 'RT',
      noRt,
      noRw,
      dusunPerumahan,
      desaKelurahan,
      kecamatan,
      kotaKabupaten,
      provinsi,
      kodePos,

      // Step 3: Operasional Data
      modulAktif = ['jimpitan', 'kas', 'anggota'],
      estimasiKk = '30-70',
      targetJimpitan = 2000000,
      temaWarna = 'orange',
      muatDataSimulasi = false,
    } = body;

    // 1. Validasi Field Wajib
    if (!namaAdmin || !namaAdmin.trim()) {
      return NextResponse.json({ error: 'Nama lengkap pengurus wajib diisi' }, { status: 400 });
    }
    if (!emailAdmin || !emailAdmin.trim() || !emailAdmin.includes('@')) {
      return NextResponse.json({ error: 'Alamat email tidak valid' }, { status: 400 });
    }
    if (!passwordAdmin || passwordAdmin.length < 6) {
      return NextResponse.json({ error: 'Kata sandi minimal 6 karakter' }, { status: 400 });
    }
    if (!noRt && !desaKelurahan && !dusunPerumahan) {
      return NextResponse.json({ error: 'Harap lengkapi identitas wilayah lingkungan Anda' }, { status: 400 });
    }

    const normalizedEmail = emailAdmin.toLowerCase().trim();

    // 2. Cek apakah email sudah terdaftar
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Alamat email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.' },
        { status: 409 }
      );
    }

    // 3. Sanitasi format RT & RW serta susun nama komunitas
    const cleanRt = sanitizeRtRw(noRt);
    const cleanRw = sanitizeRtRw(noRw);

    let wilayahLabel = '';
    if (tingkatWilayah === 'RT') {
      wilayahLabel = cleanRt ? `RT ${cleanRt}` : 'RT';
      if (cleanRw) wilayahLabel += `/RW ${cleanRw}`;
    } else if (tingkatWilayah === 'RW') {
      wilayahLabel = cleanRw ? `RW ${cleanRw}` : 'RW';
    } else {
      wilayahLabel = tingkatWilayah || 'RT';
    }

    const lokasiLabel = dusunPerumahan || desaKelurahan || 'Sejahtera';
    const namaKomunitas = `${wilayahLabel} ${lokasiLabel}`.trim();

    // 4. Buat slug unik anti bentrok
    const slug = await generateUniqueSlug(
      `${tingkatWilayah}-${cleanRt || '01'}-${dusunPerumahan || desaKelurahan || 'baru'}`
    );

    const modulString = Array.isArray(modulAktif) ? modulAktif.join(',') : (modulAktif || 'jimpitan,kas,anggota');
    const numericTargetJimpitan = Math.max(0, Number(targetJimpitan) || 2000000);
    const passwordHash = hashPassword(passwordAdmin);

    // 5. Eksekusi Transaksi Database Atomik (Komunitas, Pengurus, Pengaturan, & Data Simulasi)
    const { komunitas, user } = await db.$transaction(async (tx) => {
      // 5a. Buat Komunitas
      const newKomunitas = await tx.komunitas.create({
        data: {
          nama: namaKomunitas,
          slug,
          tingkatWilayah: tingkatWilayah || 'RT',
          noRt: cleanRt || null,
          noRw: cleanRw || null,
          dusunPerumahan: dusunPerumahan ? String(dusunPerumahan).trim() : null,
          desaKelurahan: desaKelurahan ? String(desaKelurahan).trim() : null,
          kecamatan: kecamatan ? String(kecamatan).trim() : null,
          kotaKabupaten: kotaKabupaten ? String(kotaKabupaten).trim() : null,
          provinsi: provinsi ? String(provinsi).trim() : null,
          kodePos: kodePos ? String(kodePos).trim() : null,
          targetJimpitan: numericTargetJimpitan,
          temaWarna: temaWarna || 'orange',
          modulAktif: modulString,
          estimasiKk: estimasiKk || '30-70',
          statusAktif: true,
        },
      });

      // 5b. Buat User Pengurus Pertama (Admin)
      const newUser = await tx.user.create({
        data: {
          nama: namaAdmin.trim(),
          email: normalizedEmail,
          noHp: noHpAdmin ? String(noHpAdmin).trim() : null,
          passwordHash,
          role: 'ADMIN',
          jabatan: jabatanAdmin || 'Ketua RT',
          statusAktif: true,
          komunitasId: newKomunitas.id,
        },
      });

      // 5c. Buat Pengaturan Aplikasi Khusus Komunitas Ini
      await tx.pengaturanAplikasi.create({
        data: {
          komunitasId: newKomunitas.id,
          namaApp: 'Komuna',
          namaRt: newKomunitas.nama,
          kotaWilayah: kotaKabupaten ? String(kotaKabupaten).trim() : (desaKelurahan ? String(desaKelurahan).trim() : 'Indonesia'),
          tagline: 'Kebersamaan, Terpadu, Transparan',
          targetJimpitan: numericTargetJimpitan,
          periodeAktif: `${new Date().getFullYear()} - ${new Date().getFullYear() + 5}`,
        },
      });

      // 5d. Inisialisasi Data Sampel (Jika Dipilih untuk Latihan)
      if (muatDataSimulasi) {
        await tx.anggota.create({
          data: {
            nama: `${namaAdmin.trim()} (Pengurus)`,
            noRumah: 'A-01',
            noHp: noHpAdmin || null,
            statusKeluarga: 'kepala_keluarga',
            isWajibJimpitan: true,
            isWajibRonda: true,
            komunitasId: newKomunitas.id,
          },
        });

        await tx.anggota.create({
          data: {
            nama: 'Bambang Sutrisno',
            noRumah: 'A-02',
            noHp: '081234567890',
            statusKeluarga: 'kepala_keluarga',
            isWajibJimpitan: true,
            isWajibRonda: true,
            komunitasId: newKomunitas.id,
          },
        });

        await tx.anggota.create({
          data: {
            nama: 'Haji Ahmad Fauzi',
            noRumah: 'B-01',
            noHp: '081398765432',
            statusKeluarga: 'kepala_keluarga',
            isWajibJimpitan: true,
            isWajibRonda: false,
            komunitasId: newKomunitas.id,
          },
        });

        await tx.transaksiKeuangan.create({
          data: {
            tanggal: new Date(),
            jenis: 'pemasukan',
            sumber: 'manual',
            kategori: 'Saldo Awal',
            keterangan: 'Penerimaan Kas Awal Pembentukan Akun Baru RT',
            nominal: 500000,
            komunitasId: newKomunitas.id,
          },
        });
      }

      return { komunitas: newKomunitas, user: newUser };
    });

    // 6. Berikan Sesi Login Otomatis
    await setSessionCookies({
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
      komunitasId: komunitas.id,
      komunitasNama: komunitas.nama,
      jabatan: user.jabatan,
    });

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran akun RT berhasil!',
      komunitas: {
        id: komunitas.id,
        nama: komunitas.nama,
        slug: komunitas.slug,
      },
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        jabatan: user.jabatan,
      },
      redirect: '/?welcome=new_rt',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error?.message || 'Terjadi kendala saat mendaftarkan akun RT. Silakan coba sesaat lagi.' },
      { status: 500 }
    );
  }
}
