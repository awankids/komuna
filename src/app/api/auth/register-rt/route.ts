import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, setSessionCookies } from '@/lib/auth';

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'rt-baru';
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

    // 3. Susun Nama & Slug Komunitas Unik
    const namaKomunitas = [
      tingkatWilayah,
      noRt ? `RT ${noRt}` : '',
      noRw ? `RW ${noRw}` : '',
      dusunPerumahan || desaKelurahan || 'Sejahtera',
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    let baseSlug = generateSlug(
      `${tingkatWilayah}-${noRt || '01'}-${dusunPerumahan || desaKelurahan || 'baru'}`
    );
    
    // Cek duplikasi slug
    const existingSlug = await db.komunitas.findUnique({ where: { slug: baseSlug } });
    if (existingSlug) {
      baseSlug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const modulString = Array.isArray(modulAktif) ? modulAktif.join(',') : (modulAktif || 'jimpitan,kas,anggota');

    // 4. Buat Record Komunitas Baru di Database
    const komunitas = await db.komunitas.create({
      data: {
        nama: namaKomunitas,
        slug: baseSlug,
        tingkatWilayah: tingkatWilayah || 'RT',
        noRt: noRt ? String(noRt).trim() : null,
        noRw: noRw ? String(noRw).trim() : null,
        dusunPerumahan: dusunPerumahan ? String(dusunPerumahan).trim() : null,
        desaKelurahan: desaKelurahan ? String(desaKelurahan).trim() : null,
        kecamatan: kecamatan ? String(kecamatan).trim() : null,
        kotaKabupaten: kotaKabupaten ? String(kotaKabupaten).trim() : null,
        provinsi: provinsi ? String(provinsi).trim() : null,
        kodePos: kodePos ? String(kodePos).trim() : null,
        targetJimpitan: Number(targetJimpitan) || 2000000,
        temaWarna: temaWarna || 'orange',
        modulAktif: modulString,
        estimasiKk: estimasiKk || '30-70',
        statusAktif: true,
      },
    });

    // 5. Buat User Administrator Akun
    const passwordHash = hashPassword(passwordAdmin);
    const user = await db.user.create({
      data: {
        nama: namaAdmin.trim(),
        email: normalizedEmail,
        noHp: noHpAdmin ? String(noHpAdmin).trim() : null,
        passwordHash,
        role: 'ADMIN',
        jabatan: jabatanAdmin || 'Ketua RT',
        statusAktif: true,
        komunitasId: komunitas.id,
      },
    });

    // 6. Inisialisasi Data Sampel (Jika Dipilih untuk Latihan)
    if (muatDataSimulasi) {
      try {
        // Contoh 3 Anggota Awal
        const warga1 = await db.anggota.create({
          data: {
            nama: `${namaAdmin.trim()} (Pengurus)`,
            noRumah: 'A-01',
            noHp: noHpAdmin || null,
            statusKeluarga: 'kepala_keluarga',
            isWajibJimpitan: true,
            isWajibRonda: true,
          },
        });

        await db.anggota.create({
          data: {
            nama: 'Bambang Sutrisno',
            noRumah: 'A-02',
            noHp: '081234567890',
            statusKeluarga: 'kepala_keluarga',
            isWajibJimpitan: true,
            isWajibRonda: true,
          },
        });

        await db.anggota.create({
          data: {
            nama: 'Haji Ahmad Fauzi',
            noRumah: 'B-01',
            noHp: '081398765432',
            statusKeluarga: 'kepala_keluarga',
            isWajibJimpitan: true,
            isWajibRonda: false,
          },
        });

        // Contoh Kas Saldo Awal
        await db.transaksiKeuangan.create({
          data: {
            tanggal: new Date(),
            jenis: 'pemasukan',
            sumber: 'manual',
            kategori: 'Saldo Awal',
            keterangan: 'Penerimaan Kas Awal Pembentukan Akun Baru RT',
            nominal: 500000,
          },
        });
      } catch (seedErr) {
        console.warn('Simulasi data partial seeding notice:', seedErr);
      }
    }

    // 7. Berikan Sesi Login Otomatis
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
