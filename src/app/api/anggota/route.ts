import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function calculateAge(birthDate: Date | string | null): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) {
    age--;
  }
  return age;
}

// Auto-seed sample family members if only household heads exist
async function autoSeedFamilyMembers() {
  try {
    const familyMemberCount = await db.anggota.count({
      where: { statusKeluarga: { in: ['istri', 'anak', 'orang_tua', 'famili_lain'] } }
    });

    if (familyMemberCount === 0) {
      // Find top 3 Kepala Keluarga to attach realistic family members
      const agus = await db.anggota.findFirst({ where: { nama: { contains: 'Agus Nur Setyawan' } } });
      const anto = await db.anggota.findFirst({ where: { nama: { contains: 'Anto (Klitik)' } } });
      const aris = await db.anggota.findFirst({ where: { nama: { contains: 'Aris Putranto' } } });

      if (agus) {
        await db.anggota.update({
          where: { id: agus.id },
          data: {
            noKk: '3302101201080001',
            statusKeluarga: 'kepala_keluarga',
            jenisKelamin: 'Laki-laki',
            tempatLahir: 'Banyumas',
            tanggalLahir: new Date('1982-05-14'),
            pekerjaan: 'Wiraswasta',
            statusPerkawinan: 'Kawin',
            isWajibJimpitan: true,
            isWajibRonda: true
          }
        });

        // Add Istri & 2 Anak
        await db.anggota.createMany({
          data: [
            {
              nama: 'Ny. Ratna Sari Dewi',
              noRumah: agus.noRumah,
              noKk: '3302101201080001',
              nik: '3302105204850001',
              statusKeluarga: 'istri',
              kepalaKeluargaId: agus.id,
              jenisKelamin: 'Perempuan',
              tempatLahir: 'Banyumas',
              tanggalLahir: new Date('1985-04-12'),
              agama: 'Islam',
              pekerjaan: 'Guru',
              statusPerkawinan: 'Kawin',
              isWajibJimpitan: false,
              isWajibRonda: false,
              statusAktif: true
            },
            {
              nama: 'Muhammad Dwi Setyawan',
              noRumah: agus.noRumah,
              noKk: '3302101201080001',
              nik: '3302101708080002',
              statusKeluarga: 'anak',
              kepalaKeluargaId: agus.id,
              jenisKelamin: 'Laki-laki',
              tempatLahir: 'Banyumas',
              tanggalLahir: new Date('2008-08-17'), // 18 thn
              agama: 'Islam',
              pekerjaan: 'Pelajar / Mahasiswa',
              statusPerkawinan: 'Belum Kawin',
              isWajibJimpitan: false,
              isWajibRonda: false,
              statusAktif: true
            },
            {
              nama: 'Aisyah Putri Setyawan',
              noRumah: agus.noRumah,
              noKk: '3302101201080001',
              nik: '3302106503220003',
              statusKeluarga: 'anak',
              kepalaKeluargaId: agus.id,
              jenisKelamin: 'Perempuan',
              tempatLahir: 'Banyumas',
              tanggalLahir: new Date('2022-03-25'), // Balita 4 thn
              agama: 'Islam',
              pekerjaan: 'Belum Bekerja',
              statusPerkawinan: 'Belum Kawin',
              isWajibJimpitan: false,
              isWajibRonda: false,
              statusAktif: true
            }
          ]
        });
      }

      if (anto) {
        await db.anggota.update({
          where: { id: anto.id },
          data: {
            noKk: '3302101509090002',
            statusKeluarga: 'kepala_keluarga',
            jenisKelamin: 'Laki-laki',
            tempatLahir: 'Cilacap',
            tanggalLahir: new Date('1984-03-21'),
            pekerjaan: 'Karyawan Swasta',
            statusPerkawinan: 'Kawin',
            isWajibJimpitan: true,
            isWajibRonda: true
          }
        });

        await db.anggota.createMany({
          data: [
            {
              nama: 'Ny. Endang Purwanti',
              noRumah: anto.noRumah,
              noKk: '3302101509090002',
              nik: '3302106011870001',
              statusKeluarga: 'istri',
              kepalaKeluargaId: anto.id,
              jenisKelamin: 'Perempuan',
              tempatLahir: 'Cilacap',
              tanggalLahir: new Date('1987-11-20'),
              agama: 'Islam',
              pekerjaan: 'Ibu Rumah Tangga',
              statusPerkawinan: 'Kawin',
              isWajibJimpitan: false,
              isWajibRonda: false,
              statusAktif: true
            },
            {
              nama: 'Bagas Pratama',
              noRumah: anto.noRumah,
              noKk: '3302101509090002',
              nik: '3302101006140001',
              statusKeluarga: 'anak',
              kepalaKeluargaId: anto.id,
              jenisKelamin: 'Laki-laki',
              tempatLahir: 'Banyumas',
              tanggalLahir: new Date('2014-06-10'), // Anak 12 thn
              agama: 'Islam',
              pekerjaan: 'Pelajar',
              statusPerkawinan: 'Belum Kawin',
              isWajibJimpitan: false,
              isWajibRonda: false,
              statusAktif: true
            }
          ]
        });
      }

      if (aris) {
        await db.anggota.update({
          where: { id: aris.id },
          data: {
            noKk: '3302102004110003',
            statusKeluarga: 'kepala_keluarga',
            jenisKelamin: 'Laki-laki',
            tempatLahir: 'Purwokerto',
            tanggalLahir: new Date('1980-07-19'),
            pekerjaan: 'PNS',
            statusPerkawinan: 'Kawin',
            isWajibJimpitan: true,
            isWajibRonda: true
          }
        });

        await db.anggota.createMany({
          data: [
            {
              nama: 'Ny. Tri Wahyuni',
              noRumah: aris.noRumah,
              noKk: '3302102004110003',
              nik: '3302104509830002',
              statusKeluarga: 'istri',
              kepalaKeluargaId: aris.id,
              jenisKelamin: 'Perempuan',
              tempatLahir: 'Purwokerto',
              tanggalLahir: new Date('1983-09-05'),
              agama: 'Islam',
              pekerjaan: 'Bidan',
              statusPerkawinan: 'Kawin',
              isWajibJimpitan: false,
              isWajibRonda: false,
              statusAktif: true
            },
            {
              nama: 'Mbah Sumardi',
              noRumah: aris.noRumah,
              noKk: '3302102004110003',
              nik: '3302101402520001',
              statusKeluarga: 'orang_tua',
              kepalaKeluargaId: aris.id,
              jenisKelamin: 'Laki-laki',
              tempatLahir: 'Kebumen',
              tanggalLahir: new Date('1952-02-14'), // Lansia 74 thn
              agama: 'Islam',
              pekerjaan: 'Pensiunan',
              statusPerkawinan: 'Cerai Mati',
              isWajibJimpitan: false,
              isWajibRonda: false,
              statusAktif: true
            }
          ]
        });
      }
    }
  } catch (err) {
    console.error('Error auto-seeding family members:', err);
  }
}

// GET all anggota (with support for hierarchy, stats, and filters)
export async function GET(request: Request) {
  try {
    await autoSeedFamilyMembers();

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'all'; // 'all', 'kk', 'jiwa'
    const search = searchParams.get('search') || '';
    const statusKeluarga = searchParams.get('statusKeluarga') || 'all';
    const jenisKelamin = searchParams.get('jenisKelamin') || 'all';
    const kategoriUsia = searchParams.get('kategoriUsia') || 'all';
    const rombonganId = searchParams.get('rombonganId') || 'all';
    const format = searchParams.get('format') || 'array'; // 'array' (backward compatible) or 'object'

    // Fetch all members with their relations
    const allMembers = await db.anggota.findMany({
      include: {
        rombongan: true,
        kepalaKeluarga: {
          select: { id: true, nama: true, noRumah: true, noKk: true }
        },
        anggotaKeluarga: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: [
        { noRumah: 'asc' },
        { statusKeluarga: 'asc' },
        { nama: 'asc' }
      ]
    });

    // Compute Summary Demografi
    let totalJiwa = 0;
    let totalKk = 0;
    let totalLaki = 0;
    let totalPerempuan = 0;
    let totalBalita = 0;
    let totalAnak = 0;
    let totalProduktif = 0;
    let totalLansia = 0;

    allMembers.forEach(m => {
      if (!m.statusAktif) return;
      totalJiwa++;
      if (m.statusKeluarga === 'kepala_keluarga') totalKk++;
      if (m.jenisKelamin === 'Perempuan') totalPerempuan++;
      else totalLaki++;

      const age = calculateAge(m.tanggalLahir);
      if (age !== null) {
        if (age < 5) totalBalita++;
        else if (age <= 17) totalAnak++;
        else if (age < 60) totalProduktif++;
        else totalLansia++;
      } else {
        // Fallback default: non-children considered productive
        if (m.statusKeluarga === 'anak') totalAnak++;
        else if (m.statusKeluarga === 'orang_tua') totalLansia++;
        else totalProduktif++;
      }
    });

    const summary = {
      totalJiwa,
      totalKk,
      totalLaki,
      totalPerempuan,
      totalBalita,
      totalAnak,
      totalProduktif,
      totalLansia
    };

    // Filter members based on params
    let filtered = allMembers;

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(m => 
        m.nama.toLowerCase().includes(q) ||
        (m.noRumah && m.noRumah.toLowerCase().includes(q)) ||
        (m.nik && m.nik.includes(q)) ||
        (m.noKk && m.noKk.includes(q))
      );
    }

    if (statusKeluarga !== 'all') {
      filtered = filtered.filter(m => m.statusKeluarga === statusKeluarga);
    }

    if (jenisKelamin !== 'all') {
      filtered = filtered.filter(m => m.jenisKelamin === jenisKelamin);
    }

    if (rombonganId !== 'all') {
      if (rombonganId === 'none') {
        filtered = filtered.filter(m => !m.rombonganId);
      } else {
        filtered = filtered.filter(m => m.rombonganId === rombonganId);
      }
    }

    if (kategoriUsia !== 'all') {
      filtered = filtered.filter(m => {
        const age = calculateAge(m.tanggalLahir);
        if (kategoriUsia === 'balita') return age !== null && age < 5;
        if (kategoriUsia === 'anak') return age !== null && age >= 5 && age <= 17;
        if (kategoriUsia === 'produktif') return age === null ? (m.statusKeluarga !== 'anak' && m.statusKeluarga !== 'orang_tua') : (age >= 18 && age < 60);
        if (kategoriUsia === 'lansia') return age === null ? (m.statusKeluarga === 'orang_tua') : (age >= 60);
        return true;
      });
    }

    // Separate list of Kepala Keluarga (with nested family members)
    const kkList = allMembers.filter(m => m.statusKeluarga === 'kepala_keluarga');

    if (format === 'object' || view === 'kk') {
      return NextResponse.json({
        data: filtered,
        kkList,
        summary
      });
    }

    // Default backward compatible response is Array of filtered items
    return NextResponse.json(filtered);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal mengambil data anggota' }, { status: 500 });
  }
}

// POST new anggota (Support both Kepala Keluarga and Family Member)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      nama,
      noRumah,
      noHp,
      nik,
      noKk,
      tempatLahir,
      tanggalLahir,
      jenisKelamin,
      agama,
      pekerjaan,
      statusPerkawinan,
      statusKeluarga = 'kepala_keluarga',
      kepalaKeluargaId,
      isWajibJimpitan,
      isWajibRonda,
      rombonganId
    } = body;
    
    if (!nama) {
      return NextResponse.json({ error: 'Nama anggota wajib diisi' }, { status: 400 });
    }

    // If adding a family member under a KK, resolve KK data
    let finalNoRumah = noRumah;
    let finalNoKk = noKk;

    if (kepalaKeluargaId && statusKeluarga !== 'kepala_keluarga') {
      const kk = await db.anggota.findUnique({ where: { id: kepalaKeluargaId } });
      if (kk) {
        if (!finalNoRumah) finalNoRumah = kk.noRumah;
        if (!finalNoKk) finalNoKk = kk.noKk;
      }
    }

    if (!finalNoRumah) {
      return NextResponse.json({ error: 'Nomor Rumah wajib diisi atau ditentukan dari Kepala Keluarga' }, { status: 400 });
    }

    // Default flags: only KK has jimpitan & ronda by default
    const isKK = statusKeluarga === 'kepala_keluarga';
    const finalWajibJimpitan = isWajibJimpitan !== undefined ? Boolean(isWajibJimpitan) : isKK;
    const finalWajibRonda = isWajibRonda !== undefined ? Boolean(isWajibRonda) : isKK;

    const newAnggota = await db.anggota.create({
      data: { 
        nama, 
        noRumah: finalNoRumah, 
        noHp: noHp || null,
        nik: nik || null,
        noKk: finalNoKk || null,
        tempatLahir: tempatLahir || null,
        tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
        jenisKelamin: jenisKelamin || (statusKeluarga === 'istri' ? 'Perempuan' : 'Laki-laki'),
        agama: agama || 'Islam',
        pekerjaan: pekerjaan || null,
        statusPerkawinan: statusPerkawinan || (isKK ? 'Kawin' : statusKeluarga === 'anak' ? 'Belum Kawin' : 'Kawin'),
        statusKeluarga,
        kepalaKeluargaId: isKK ? null : (kepalaKeluargaId || null),
        isWajibJimpitan: finalWajibJimpitan,
        isWajibRonda: finalWajibRonda,
        rombonganId: isKK && rombonganId && rombonganId !== 'none' ? rombonganId : null, 
        statusAktif: true 
      },
      include: {
        rombongan: true,
        kepalaKeluarga: true,
        anggotaKeluarga: true
      }
    });
    
    return NextResponse.json(newAnggota, { status: 201 });
  } catch (error: any) {
    console.error('Error creating anggota:', error);
    return NextResponse.json({ error: 'Gagal menambahkan anggota baru' }, { status: 500 });
  }
}

// PUT / UPDATE anggota
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      id, 
      nama, 
      noRumah, 
      noHp, 
      nik,
      noKk,
      tempatLahir,
      tanggalLahir,
      jenisKelamin,
      agama,
      pekerjaan,
      statusPerkawinan,
      statusKeluarga,
      kepalaKeluargaId,
      isWajibJimpitan,
      isWajibRonda,
      rombonganId, 
      statusAktif 
    } = body;
    
    if (!id || !nama || !noRumah) {
      return NextResponse.json({ error: 'ID, Nama, dan Nomor Rumah wajib diisi' }, { status: 400 });
    }

    const isKK = statusKeluarga === 'kepala_keluarga';
    
    const updated = await db.anggota.update({
      where: { id },
      data: { 
        nama, 
        noRumah, 
        noHp: noHp || null,
        nik: nik !== undefined ? (nik || null) : undefined,
        noKk: noKk !== undefined ? (noKk || null) : undefined,
        tempatLahir: tempatLahir !== undefined ? (tempatLahir || null) : undefined,
        tanggalLahir: tanggalLahir !== undefined ? (tanggalLahir ? new Date(tanggalLahir) : null) : undefined,
        jenisKelamin: jenisKelamin !== undefined ? jenisKelamin : undefined,
        agama: agama !== undefined ? agama : undefined,
        pekerjaan: pekerjaan !== undefined ? (pekerjaan || null) : undefined,
        statusPerkawinan: statusPerkawinan !== undefined ? statusPerkawinan : undefined,
        statusKeluarga: statusKeluarga !== undefined ? statusKeluarga : undefined,
        kepalaKeluargaId: isKK ? null : (kepalaKeluargaId !== undefined ? (kepalaKeluargaId || null) : undefined),
        isWajibJimpitan: isWajibJimpitan !== undefined ? Boolean(isWajibJimpitan) : undefined,
        isWajibRonda: isWajibRonda !== undefined ? Boolean(isWajibRonda) : undefined,
        rombonganId: rombonganId === 'none' ? null : (rombonganId !== undefined ? (rombonganId || null) : undefined), 
        statusAktif: statusAktif !== undefined ? statusAktif : undefined
      },
      include: {
        rombongan: true,
        kepalaKeluarga: true,
        anggotaKeluarga: true
      }
    });
    
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating anggota:', error);
    return NextResponse.json({ error: 'Gagal memperbarui data anggota' }, { status: 500 });
  }
}

// DELETE anggota
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID anggota wajib dicantumkan' }, { status: 400 });
    }

    // Check if this member is a Kepala Keluarga with active family members
    const familyCount = await db.anggota.count({
      where: { kepalaKeluargaId: id }
    });

    if (familyCount > 0) {
      // Detach family members so they don't break foreign key constraints
      await db.anggota.updateMany({
        where: { kepalaKeluargaId: id },
        data: { kepalaKeluargaId: null }
      });
    }
    
    await db.anggota.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true, message: 'Anggota berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting anggota:', error);
    return NextResponse.json({ error: 'Gagal menghapus anggota' }, { status: 500 });
  }
}
