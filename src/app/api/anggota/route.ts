import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantContext, requireTenantContext } from '@/lib/auth';

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

// GET all anggota (with support for hierarchy, stats, and filters)
export async function GET(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tidak memiliki otorisasi komunitas' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'all'; // 'all', 'kk', 'jiwa'
    const search = searchParams.get('search') || '';
    const statusKeluarga = searchParams.get('statusKeluarga') || 'all';
    const jenisKelamin = searchParams.get('jenisKelamin') || 'all';
    const kategoriUsia = searchParams.get('kategoriUsia') || 'all';
    const rombonganId = searchParams.get('rombonganId') || 'all';
    const format = searchParams.get('format') || 'array'; // 'array' (backward compatible) or 'object'

    // Fetch members scoped strictly to tenant.komunitasId
    const allMembers = await db.anggota.findMany({
      where: {
        komunitasId: tenant.komunitasId,
      },
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
    const tenant = await requireTenantContext();
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
      const kk = await db.anggota.findFirst({
        where: { id: kepalaKeluargaId, komunitasId: tenant.komunitasId }
      });
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
        komunitasId: tenant.komunitasId,
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
    const tenant = await requireTenantContext();
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

    // Verify tenant ownership
    const existing = await db.anggota.findFirst({
      where: { id, komunitasId: tenant.komunitasId }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Data anggota tidak ditemukan di komunitas Anda' }, { status: 404 });
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
    const tenant = await requireTenantContext();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID anggota wajib dicantumkan' }, { status: 400 });
    }

    // Verify tenant ownership
    const existing = await db.anggota.findFirst({
      where: { id, komunitasId: tenant.komunitasId }
    });
    if (!existing) {
      return NextResponse.json({ error: 'Data anggota tidak ditemukan di komunitas Anda' }, { status: 404 });
    }

    // Check if this member is a Kepala Keluarga with active family members
    const familyCount = await db.anggota.count({
      where: { kepalaKeluargaId: id, komunitasId: tenant.komunitasId }
    });

    if (familyCount > 0) {
      // Detach family members so they don't break foreign key constraints
      await db.anggota.updateMany({
        where: { kepalaKeluargaId: id, komunitasId: tenant.komunitasId },
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
