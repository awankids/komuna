'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileNavBar from '@/components/MobileNavBar';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  UserPlus, 
  X, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  Users,
  UserCheck,
  UserX,
  FolderHeart,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ArrowRight,
  Info,
  ChevronRight,
  UserCheck2,
  Trash,
  Home,
  HeartHandshake,
  Baby,
  GraduationCap,
  Briefcase,
  Calendar,
  Layers,
  Coins,
  ShieldCheck,
  Eye,
  Check,
  FileText
} from 'lucide-react';

interface Rombongan {
  id: string;
  nama: string;
  ketuaId: string | null;
  hariPiket: number | null;
  ketuaNama: string;
  activeMemberCount: number;
  activeMembers: { id: string; nama: string }[];
}

interface Anggota {
  id: string;
  nama: string;
  noRumah: string;
  noHp: string | null;
  nik?: string | null;
  noKk?: string | null;
  tempatLahir?: string | null;
  tanggalLahir?: string | null;
  jenisKelamin?: string | null;
  agama?: string | null;
  pekerjaan?: string | null;
  statusPerkawinan?: string | null;
  statusKeluarga?: string; // 'kepala_keluarga' | 'istri' | 'anak' | 'orang_tua' | 'famili_lain'
  kepalaKeluargaId?: string | null;
  kepalaKeluarga?: { id: string; nama: string; noRumah: string; noKk?: string | null } | null;
  anggotaKeluarga?: Anggota[];
  isWajibJimpitan?: boolean;
  isWajibRonda?: boolean;
  rombonganId: string | null;
  rombongan: { id: string; nama: string } | null;
  statusAktif: boolean;
  createdAt?: string;
}

export default function AnggotaPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([]);
  const [rombonganList, setRombonganList] = useState<Rombongan[]>([]);
  
  // Tab Navigation: 'kk' (Kartu Keluarga Accordion), 'jiwa' (Semua Jiwa), 'rombongan', 'mutasi'
  const [activeTab, setActiveTab] = useState<'kk' | 'jiwa' | 'rombongan' | 'mutasi'>('kk');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRombonganFilter, setSelectedRombonganFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState('all');
  const [selectedHubunganFilter, setSelectedHubunganFilter] = useState('all');
  const [selectedUsiaFilter, setSelectedUsiaFilter] = useState('all');

  // Accordion state for KK list
  const [expandedKkIds, setExpandedKkIds] = useState<Set<string>>(new Set());

  // Demografi Summary KPIs
  const [demografiSummary, setDemografiSummary] = useState({
    totalJiwa: 0,
    totalKk: 0,
    totalLaki: 0,
    totalPerempuan: 0,
    totalBalita: 0,
    totalAnak: 0,
    totalProduktif: 0,
    totalLansia: 0
  });

  // Mutasi Kependudukan States
  const [mutasiList, setMutasiList] = useState<any[]>([]);
  const [mutasiSummary, setMutasiSummary] = useState({
    totalLahir: 0,
    totalMeninggal: 0,
    totalMasuk: 0,
    totalKeluar: 0,
    deltaNetto: 0,
    totalWargaAktif: 0
  });
  const [isMutasiModalOpen, setIsMutasiModalOpen] = useState(false);
  const [mutasiForm, setMutasiForm] = useState({
    jenisMutasi: 'lahir',
    tanggalPeristiwa: new Date().toISOString().split('T')[0],
    namaWarga: '',
    nik: '',
    noRumah: '',
    jenisKelamin: 'Laki-laki',
    keterangan: '',
    anggotaId: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [visibleRows, setVisibleRows] = useState(15);

  // Sorting states
  const [sortField, setSortField] = useState<'nama' | 'noRumah'>('nama');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal 1: Tambah / Edit Kepala Keluarga / Warga Utama
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentId, setCurrentId] = useState('');
  const [formValues, setFormValues] = useState({
    nama: '',
    noRumah: '',
    noHp: '',
    nik: '',
    noKk: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: 'Laki-laki',
    agama: 'Islam',
    pekerjaan: '',
    statusPerkawinan: 'Kawin',
    statusKeluarga: 'kepala_keluarga',
    kepalaKeluargaId: '',
    isWajibJimpitan: true,
    isWajibRonda: true,
    rombonganId: 'none',
    statusAktif: true
  });

  // Modal 2: Tambah / Edit Anggota Keluarga (Di Bawah KK Tertentu)
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [selectedKkForFamily, setSelectedKkForFamily] = useState<Anggota | null>(null);
  const [familyForm, setFamilyForm] = useState({
    id: '',
    nama: '',
    statusKeluarga: 'istri', // 'istri', 'anak', 'orang_tua', 'famili_lain'
    jenisKelamin: 'Perempuan',
    nik: '',
    tempatLahir: '',
    tanggalLahir: '',
    agama: 'Islam',
    pekerjaan: '',
    statusPerkawinan: 'Kawin',
    noHp: '',
    isWajibJimpitan: false,
    isWajibRonda: false
  });
  const [isEditingFamilyMember, setIsEditingFamilyMember] = useState(false);

  // Modal states for Rombongan (Group)
  const [isRomModalOpen, setIsRomModalOpen] = useState(false);
  const [romModalMode, setRomModalMode] = useState<'add' | 'edit'>('add');
  const [romCurrentId, setRomCurrentId] = useState('');
  const romFormNamaRef = useRef<HTMLInputElement>(null);
  const [selectedUnassignedMemberId, setSelectedUnassignedMemberId] = useState('none');

  // Notification states
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Custom confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  // Helpers: Calculate Age
  const calculateAgeNumber = (birthDate: string | Date | null | undefined): number | null => {
    if (!birthDate) return null;
    const d = new Date(birthDate);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  };

  const getAgeLabel = (birthDate: string | Date | null | undefined): string => {
    const age = calculateAgeNumber(birthDate);
    return age !== null ? `${age} thn` : '-';
  };

  const getFormattedBirth = (dateStr: string | Date | null | undefined, placeStr?: string | null): string => {
    if (!dateStr) return placeStr ? `${placeStr}, -` : '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return placeStr || '-';
    const dateFormatted = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    return placeStr ? `${placeStr}, ${dateFormatted}` : dateFormatted;
  };

  const getStatusKeluargaBadge = (status: string | undefined) => {
    switch (status) {
      case 'kepala_keluarga':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Kepala Keluarga</span>;
      case 'istri':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200">Istri</span>;
      case 'anak':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Anak</span>;
      case 'orang_tua':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Orang Tua / Lansia</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Famili Lain</span>;
    }
  };

  // Toast trigger
  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    toastTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) setShowToast(false);
    }, 4000);
  };

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const resA = await fetch('/api/anggota?format=object');
      const dataA = await resA.json();
      if (isMountedRef.current && !dataA.error) {
        if (dataA.data) {
          setAnggotaList(dataA.data);
          if (dataA.summary) setDemografiSummary(dataA.summary);
        } else if (Array.isArray(dataA)) {
          setAnggotaList(dataA);
        }
      }

      const resR = await fetch('/api/rombongan');
      const dataR = await resR.json();
      if (isMountedRef.current && !dataR.error) {
        setRombonganList(dataR);
      }

      const resM = await fetch('/api/mutasi-warga');
      const dataM = await resM.json();
      if (isMountedRef.current && dataM.data) {
        setMutasiList(dataM.data);
        if (dataM.summary) setMutasiSummary(dataM.summary);
      }
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    // Check URL parameters if present (deep linking from jadwal or other pages)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'kk' || tabParam === 'jiwa' || tabParam === 'rombongan' || tabParam === 'mutasi') {
        setActiveTab(tabParam);
      }
      const rombonganParam = params.get('rombonganId');
      if (rombonganParam) {
        setSelectedRombonganFilter(rombonganParam);
      }
    }

    fetchData();
    return () => {
      isMountedRef.current = false;
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Accordion Toggle
  const toggleKkExpand = (id: string) => {
    setExpandedKkIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExpandAll = () => {
    const allKkIds = anggotaList.filter(a => a.statusKeluarga === 'kepala_keluarga').map(a => a.id);
    setExpandedKkIds(new Set(allKkIds));
  };

  const handleCollapseAll = () => {
    setExpandedKkIds(new Set());
  };

  // Open Modal Tambah Kepala Keluarga Baru
  const handleOpenAddKK = () => {
    setModalMode('add');
    setCurrentId('');
    setFormValues({
      nama: '',
      noRumah: '',
      noHp: '',
      nik: '',
      noKk: '',
      tempatLahir: '',
      tanggalLahir: '',
      jenisKelamin: 'Laki-laki',
      agama: 'Islam',
      pekerjaan: '',
      statusPerkawinan: 'Kawin',
      statusKeluarga: 'kepala_keluarga',
      kepalaKeluargaId: '',
      isWajibJimpitan: true,
      isWajibRonda: true,
      rombonganId: 'none',
      statusAktif: true
    });
    setIsModalOpen(true);
  };

  // Open Modal Edit Anggota (General)
  const handleOpenEdit = (item: Anggota) => {
    setModalMode('edit');
    setCurrentId(item.id);
    setFormValues({
      nama: item.nama,
      noRumah: item.noRumah,
      noHp: item.noHp || '',
      nik: item.nik || '',
      noKk: item.noKk || '',
      tempatLahir: item.tempatLahir || '',
      tanggalLahir: item.tanggalLahir ? new Date(item.tanggalLahir).toISOString().split('T')[0] : '',
      jenisKelamin: item.jenisKelamin || 'Laki-laki',
      agama: item.agama || 'Islam',
      pekerjaan: item.pekerjaan || '',
      statusPerkawinan: item.statusPerkawinan || 'Kawin',
      statusKeluarga: item.statusKeluarga || 'kepala_keluarga',
      kepalaKeluargaId: item.kepalaKeluargaId || '',
      isWajibJimpitan: item.isWajibJimpitan ?? (item.statusKeluarga === 'kepala_keluarga'),
      isWajibRonda: item.isWajibRonda ?? (item.statusKeluarga === 'kepala_keluarga'),
      rombonganId: item.rombonganId || 'none',
      statusAktif: item.statusAktif
    });
    setIsModalOpen(true);
  };

  // Open Modal Tambah Anggota Keluarga (Locked to a Kepala Keluarga)
  const handleOpenAddFamilyMember = (kk: Anggota) => {
    setSelectedKkForFamily(kk);
    setIsEditingFamilyMember(false);
    setFamilyForm({
      id: '',
      nama: '',
      statusKeluarga: 'istri',
      jenisKelamin: 'Perempuan',
      nik: '',
      tempatLahir: '',
      tanggalLahir: '',
      agama: 'Islam',
      pekerjaan: '',
      statusPerkawinan: 'Kawin',
      noHp: '',
      isWajibJimpitan: false,
      isWajibRonda: false
    });
    setIsFamilyModalOpen(true);
  };

  // Open Modal Edit Anggota Keluarga (Child/Wife)
  const handleOpenEditFamilyMember = (kk: Anggota, member: Anggota) => {
    setSelectedKkForFamily(kk);
    setIsEditingFamilyMember(true);
    setFamilyForm({
      id: member.id,
      nama: member.nama,
      statusKeluarga: member.statusKeluarga || 'anak',
      jenisKelamin: member.jenisKelamin || (member.statusKeluarga === 'istri' ? 'Perempuan' : 'Laki-laki'),
      nik: member.nik || '',
      tempatLahir: member.tempatLahir || '',
      tanggalLahir: member.tanggalLahir ? new Date(member.tanggalLahir).toISOString().split('T')[0] : '',
      agama: member.agama || 'Islam',
      pekerjaan: member.pekerjaan || '',
      statusPerkawinan: member.statusPerkawinan || 'Belum Kawin',
      noHp: member.noHp || '',
      isWajibJimpitan: member.isWajibJimpitan ?? false,
      isWajibRonda: member.isWajibRonda ?? false
    });
    setIsFamilyModalOpen(true);
  };

  // Submit Modal 1: Kepala Keluarga / Umum
  const handleSubmitAnggota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.nama.trim() || !formValues.noRumah.trim()) {
      triggerToast('Nama dan Nomor Rumah wajib diisi', 'error');
      return;
    }

    try {
      const url = '/api/anggota';
      const method = modalMode === 'add' ? 'POST' : 'PUT';
      const body = modalMode === 'add' 
        ? formValues
        : { ...formValues, id: currentId };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        triggerToast(data.error || 'Gagal memproses data warga', 'error');
      } else {
        triggerToast(
          modalMode === 'add' ? 'Kepala Keluarga berhasil ditambahkan' : 'Data warga berhasil diperbarui',
          'success'
        );
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      triggerToast('Gagal memproses data warga', 'error');
    }
  };

  // Submit Modal 2: Anggota Keluarga
  const handleSubmitFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKkForFamily) return;
    if (!familyForm.nama.trim()) {
      triggerToast('Nama anggota keluarga wajib diisi', 'error');
      return;
    }

    try {
      const url = '/api/anggota';
      const method = isEditingFamilyMember ? 'PUT' : 'POST';
      const body = isEditingFamilyMember
        ? {
            id: familyForm.id,
            nama: familyForm.nama,
            noRumah: selectedKkForFamily.noRumah,
            noKk: selectedKkForFamily.noKk,
            statusKeluarga: familyForm.statusKeluarga,
            kepalaKeluargaId: selectedKkForFamily.id,
            jenisKelamin: familyForm.jenisKelamin,
            tempatLahir: familyForm.tempatLahir,
            tanggalLahir: familyForm.tanggalLahir,
            nik: familyForm.nik,
            agama: familyForm.agama,
            pekerjaan: familyForm.pekerjaan,
            statusPerkawinan: familyForm.statusPerkawinan,
            noHp: familyForm.noHp,
            isWajibJimpitan: familyForm.isWajibJimpitan,
            isWajibRonda: familyForm.isWajibRonda,
            statusAktif: true
          }
        : {
            nama: familyForm.nama,
            noRumah: selectedKkForFamily.noRumah,
            noKk: selectedKkForFamily.noKk,
            statusKeluarga: familyForm.statusKeluarga,
            kepalaKeluargaId: selectedKkForFamily.id,
            jenisKelamin: familyForm.jenisKelamin,
            tempatLahir: familyForm.tempatLahir,
            tanggalLahir: familyForm.tanggalLahir,
            nik: familyForm.nik,
            agama: familyForm.agama,
            pekerjaan: familyForm.pekerjaan,
            statusPerkawinan: familyForm.statusPerkawinan,
            noHp: familyForm.noHp,
            isWajibJimpitan: familyForm.isWajibJimpitan,
            isWajibRonda: familyForm.isWajibRonda
          };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        triggerToast(data.error || 'Gagal menyimpan anggota keluarga', 'error');
      } else {
        triggerToast(
          isEditingFamilyMember ? 'Data anggota keluarga berhasil diperbarui' : 'Anggota keluarga berhasil ditambahkan',
          'success'
        );
        setIsFamilyModalOpen(false);
        // Otomatis expand KK terkait agar langsung terlihat
        setExpandedKkIds(prev => new Set(prev).add(selectedKkForFamily.id));
        fetchData();
      }
    } catch (err) {
      console.error(err);
      triggerToast('Gagal memproses data anggota keluarga', 'error');
    }
  };

  // Delete Anggota
  const handleDeleteAnggota = (item: Anggota) => {
    const isKK = item.statusKeluarga === 'kepala_keluarga';
    const familyCount = item.anggotaKeluarga?.length || 0;

    setConfirmDialog({
      open: true,
      title: isKK ? 'Hapus Kepala Keluarga?' : 'Hapus Anggota Keluarga?',
      message: isKK && familyCount > 0 
        ? `PERINGATAN: ${item.nama} memiliki ${familyCount} anggota keluarga. Menghapus Kepala Keluarga ini akan melepaskan ikatan keluarga bagi istri dan anak-anaknya.`
        : `Apakah Anda yakin ingin menghapus data "${item.nama}" (${item.noRumah})? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        try {
          const res = await fetch(`/api/anggota?id=${item.id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.error) {
            triggerToast(data.error, 'error');
          } else {
            triggerToast('Data berhasil dihapus', 'success');
            fetchData();
          }
        } catch (err) {
          triggerToast('Gagal menghapus data', 'error');
        }
      }
    });
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmDialog({
      open: true,
      title: `Hapus ${selectedIds.size} Data Warga?`,
      message: `Apakah Anda yakin ingin menghapus ${selectedIds.size} warga yang dipilih secara massal?`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        try {
          const idsToDelete = Array.from(selectedIds);
          await Promise.all(
            idsToDelete.map(id => fetch(`/api/anggota?id=${id}`, { method: 'DELETE' }))
          );
          triggerToast(`${idsToDelete.length} data warga berhasil dihapus`, 'success');
          setSelectedIds(new Set());
          fetchData();
        } catch (err) {
          triggerToast('Gagal menghapus data secara massal', 'error');
        }
      }
    });
  };

  // Rombongan Handlers
  const handleOpenAddRombongan = () => {
    setRomModalMode('add');
    setRomCurrentId('');
    setIsRomModalOpen(true);
    setTimeout(() => { if (romFormNamaRef.current) romFormNamaRef.current.value = ''; }, 0);
  };

  const handleOpenEditRombongan = (rom: Rombongan) => {
    setRomModalMode('edit');
    setRomCurrentId(rom.id);
    setIsRomModalOpen(true);
    setTimeout(() => { if (romFormNamaRef.current) romFormNamaRef.current.value = rom.nama; }, 0);
  };

  const handleSubmitRombongan = async (e: React.FormEvent) => {
    e.preventDefault();
    const nama = romFormNamaRef.current?.value ?? '';
    if (!nama.trim()) {
      triggerToast('Nama rombongan wajib diisi', 'error');
      return;
    }

    try {
      const url = '/api/rombongan';
      const method = romModalMode === 'add' ? 'POST' : 'PUT';
      const body = romModalMode === 'add' ? { nama } : { id: romCurrentId, nama };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.error) {
        triggerToast(data.error, 'error');
      } else {
        triggerToast(romModalMode === 'add' ? 'Rombongan baru berhasil dibuat' : 'Nama rombongan berhasil diubah', 'success');
        setIsRomModalOpen(false);
        fetchData();
      }
    } catch (err) {
      triggerToast('Gagal memproses rombongan', 'error');
    }
  };

  const handleUpdateRombonganLeader = async (romId: string, romNama: string, newKetuaId: string) => {
    try {
      const res = await fetch('/api/rombongan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: romId, nama: romNama, ketuaId: newKetuaId === 'none' ? null : newKetuaId })
      });
      const data = await res.json();
      if (data.error) triggerToast(data.error, 'error');
      else {
        triggerToast('Ketua rombongan berhasil diperbarui', 'success');
        fetchData();
      }
    } catch (err) {
      triggerToast('Gagal memperbarui ketua rombongan', 'error');
    }
  };

  const handleDeleteRombongan = (romId: string, romNama: string) => {
    setConfirmDialog({
      open: true,
      title: 'Hapus Kelompok Rombongan?',
      message: `Apakah Anda yakin ingin menghapus "${romNama}"? Anggota di dalamnya akan diubah statusnya menjadi "Tanpa Rombongan".`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        try {
          const res = await fetch(`/api/rombongan?id=${romId}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.error) triggerToast(data.error, 'error');
          else {
            triggerToast('Rombongan berhasil dihapus', 'success');
            fetchData();
          }
        } catch (err) {
          triggerToast('Gagal menghapus rombongan', 'error');
        }
      }
    });
  };

  // Mutasi Handlers
  const handleSaveMutasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mutasiForm.namaWarga.trim()) {
      triggerToast('Nama warga wajib diisi', 'error');
      return;
    }

    try {
      const res = await fetch('/api/mutasi-warga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mutasiForm)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mencatat mutasi');

      triggerToast('Peristiwa mutasi warga berhasil dicatat', 'success');
      setIsMutasiModalOpen(false);
      setMutasiForm({
        jenisMutasi: 'lahir',
        tanggalPeristiwa: new Date().toISOString().split('T')[0],
        namaWarga: '',
        nik: '',
        noRumah: '',
        jenisKelamin: 'Laki-laki',
        keterangan: '',
        anggotaId: ''
      });
      fetchData();
    } catch (err: any) {
      triggerToast(err.message, 'error');
    }
  };

  const handleDeleteMutasi = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan mutasi ini?')) return;
    try {
      const res = await fetch(`/api/mutasi-warga?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      triggerToast('Catatan mutasi berhasil dihapus', 'success');
      fetchData();
    } catch (err) {
      triggerToast('Gagal menghapus catatan mutasi', 'error');
    }
  };

  // Filter & Sort Logic for Tab 1 (Kartu Keluarga) & Tab 2 (Semua Jiwa)
  const q = searchQuery.toLowerCase().trim();

  // Tab 1: KK List (Kepala Keluarga only)
  const kkListFiltered = anggotaList
    .filter(a => a.statusKeluarga === 'kepala_keluarga')
    .filter(kk => {
      // Search matches KK itself or any of its family members
      if (q) {
        const matchKk = kk.nama.toLowerCase().includes(q) || 
                        kk.noRumah.toLowerCase().includes(q) ||
                        (kk.noKk && kk.noKk.includes(q)) ||
                        (kk.nik && kk.nik.includes(q));
        const matchFamily = (kk.anggotaKeluarga || []).some(m => 
          m.nama.toLowerCase().includes(q) || (m.nik && m.nik.includes(q))
        );
        if (!matchKk && !matchFamily) return false;
      }

      if (selectedRombonganFilter !== 'all') {
        if (selectedRombonganFilter === 'none') {
          const hasRombongan = Boolean(kk.rombonganId || (kk.anggotaKeluarga || []).some(m => m.rombonganId));
          if (hasRombongan) return false;
        } else {
          const inRombongan = kk.rombonganId === selectedRombonganFilter || 
                              (kk.anggotaKeluarga || []).some(m => m.rombonganId === selectedRombonganFilter);
          if (!inRombongan) return false;
        }
      }

      if (selectedStatusFilter === 'aktif' && !kk.statusAktif) return false;
      if (selectedStatusFilter === 'nonaktif' && kk.statusAktif) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortField === 'noRumah') {
        return sortDirection === 'asc' ? a.noRumah.localeCompare(b.noRumah, undefined, { numeric: true }) : b.noRumah.localeCompare(a.noRumah, undefined, { numeric: true });
      }
      return sortDirection === 'asc' ? a.nama.localeCompare(b.nama) : b.nama.localeCompare(a.nama);
    });

  // Tab 2: Semua Jiwa List (All individual citizens)
  const allJiwaFiltered = anggotaList
    .filter(m => {
      if (q) {
        const match = m.nama.toLowerCase().includes(q) || 
                      m.noRumah.toLowerCase().includes(q) || 
                      (m.nik && m.nik.includes(q)) ||
                      (m.noKk && m.noKk.includes(q));
        if (!match) return false;
      }

      if (selectedGenderFilter !== 'all' && m.jenisKelamin !== selectedGenderFilter) return false;
      if (selectedHubunganFilter !== 'all' && m.statusKeluarga !== selectedHubunganFilter) return false;

      if (selectedUsiaFilter !== 'all') {
        const age = calculateAgeNumber(m.tanggalLahir);
        if (selectedUsiaFilter === 'balita') {
          if (age === null || age >= 5) return false;
        } else if (selectedUsiaFilter === 'anak') {
          if (age === null || age < 5 || age > 17) return false;
        } else if (selectedUsiaFilter === 'produktif') {
          if (age === null ? (m.statusKeluarga === 'anak' || m.statusKeluarga === 'orang_tua') : (age < 18 || age >= 60)) return false;
        } else if (selectedUsiaFilter === 'lansia') {
          if (age === null ? m.statusKeluarga !== 'orang_tua' : age < 60) return false;
        }
      }

      if (selectedRombonganFilter !== 'all') {
        const effectiveRomId = m.rombonganId || m.kepalaKeluarga?.id; // fallback to KK rombongan
        if (selectedRombonganFilter === 'none' && effectiveRomId) return false;
        if (selectedRombonganFilter !== 'none' && m.rombonganId !== selectedRombonganFilter) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortField === 'noRumah') {
        return sortDirection === 'asc' ? a.noRumah.localeCompare(b.noRumah, undefined, { numeric: true }) : b.noRumah.localeCompare(a.noRumah, undefined, { numeric: true });
      }
      return sortDirection === 'asc' ? a.nama.localeCompare(b.nama) : b.nama.localeCompare(a.nama);
    });

  // Helpers for Avatar
  const getAvatarInitials = (nama: string) => {
    const parts = nama.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return nama.slice(0, 2).toUpperCase();
  };

  const getAvatarBg = (index: number) => {
    const colors = ['bg-orange-500', 'bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-pink-600', 'bg-amber-600', 'bg-cyan-600', 'bg-indigo-600'];
    return colors[index % colors.length];
  };

  const getRombonganColor = (index: number) => {
    const colors = [
      'bg-orange-50 text-orange-700 border-orange-200',
      'bg-blue-50 text-blue-700 border-blue-200',
      'bg-purple-50 text-purple-700 border-purple-200',
      'bg-emerald-50 text-emerald-700 border-emerald-200',
      'bg-pink-50 text-pink-700 border-pink-200',
      'bg-indigo-50 text-indigo-700 border-indigo-200',
      'bg-amber-50 text-amber-700 border-amber-200'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="flex w-full min-h-screen bg-[#f8fafc]">
      <Sidebar activeMenu="Anggota" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 xl:px-10 2xl:px-12 py-6 md:py-8 space-y-6 md:space-y-7 pb-24 md:pb-16 font-sans">
          
          {/* Toast Alert */}
          {showToast && (
            <div className={`fixed bottom-6 right-6 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce z-50 text-white ${
              toastType === 'success' ? 'bg-emerald-600 shadow-emerald-100' : 'bg-red-600 shadow-red-100'
            }`}>
              {toastType === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-sm font-bold">{toastMessage}</span>
            </div>
          )}

          {/* Custom Confirm Dialog Modal */}
          {confirmDialog.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
                onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
              />
              <div className="relative bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-md w-full space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 mx-auto flex items-center justify-center">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">{confirmDialog.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{confirmDialog.message}</p>
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={confirmDialog.onConfirm}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
                  >
                    Ya, Lanjutkan
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Title and Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Kependudukan & Anggota Warga</h2>
              <p className="text-xs md:text-sm text-slate-400 font-medium">
                Pencatatan hierarki Kartu Keluarga (KK), register seluruh jiwa, dan jadwal piket rombongan RT.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAddKK}
                className="px-4 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold rounded-2xl shadow-sm transition-all flex items-center gap-2 cursor-pointer text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Kepala Keluarga Baru</span>
              </button>
            </div>
          </div>

          {/* Dynamic Demographic KPI Bento Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 text-left">
            
            {/* KPI 1: Total Jiwa */}
            <div className="bg-white rounded-3xl p-4.5 border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Jiwa</span>
                <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">{demografiSummary.totalJiwa}</h3>
                <span className="text-[10px] text-slate-400 font-medium">seluruh penduduk</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[var(--brand-primary)] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 2: Total Kartu Keluarga */}
            <div className="bg-white rounded-3xl p-4.5 border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kepala Keluarga</span>
                <h3 className="text-xl md:text-2xl font-bold text-blue-600 tracking-tight">{demografiSummary.totalKk}</h3>
                <span className="text-[10px] text-slate-400 font-medium">rumah tangga</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Home className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 3: Laki-laki vs Perempuan */}
            <div className="bg-white rounded-3xl p-4.5 border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender (L / P)</span>
                <h3 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
                  <span className="text-blue-600">{demografiSummary.totalLaki} L</span> / <span className="text-pink-600">{demografiSummary.totalPerempuan} P</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">komposisi gender</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 4: Balita & Anak */}
            <div className="bg-white rounded-3xl p-4.5 border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Balita & Anak</span>
                <h3 className="text-xl md:text-2xl font-bold text-emerald-600 tracking-tight">{demografiSummary.totalBalita + demografiSummary.totalAnak}</h3>
                <span className="text-[10px] text-slate-400 font-medium">{demografiSummary.totalBalita} balita, {demografiSummary.totalAnak} usia sekolah</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Baby className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 5: Lansia (>60 th) */}
            <div className="bg-white rounded-3xl p-4.5 border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lansia</span>
                <h3 className="text-xl md:text-2xl font-bold text-purple-600 tracking-tight">{demografiSummary.totalLansia}</h3>
                <span className="text-[10px] text-slate-400 font-medium">usia &ge; 60 tahun</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

          </div>

          {/* Sub-Tab Navigation Bar */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => { setActiveTab('kk'); setSelectedRombonganFilter('all'); }}
              className={`pb-3 px-5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'kk'
                  ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Home className="w-4 h-4 text-blue-500" />
              <span>Kartu Keluarga (KK)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">{demografiSummary.totalKk}</span>
            </button>

            <button
              onClick={() => { setActiveTab('jiwa'); setSelectedRombonganFilter('all'); }}
              className={`pb-3 px-5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'jiwa'
                  ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-500" />
              <span>Semua Jiwa</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">{demografiSummary.totalJiwa}</span>
            </button>

            <button
              onClick={() => setActiveTab('rombongan')}
              className={`pb-3 px-5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'rombongan'
                  ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-purple-500" />
              <span>Per Rombongan (Ronda)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">{rombonganList.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('mutasi')}
              className={`pb-3 px-5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'mutasi'
                  ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-500" />
              <span>Mutasi Kependudukan (LPJ)</span>
            </button>
          </div>

          {/* ============================================================ */}
          {/* TAB 1: KARTU KELUARGA (ACCORDION / HIERARKI KELUARGA)        */}
          {/* ============================================================ */}
          {activeTab === 'kk' && (
            <div className="space-y-4 text-left">
              
              {/* Filter & Control Bar */}
              <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative max-w-md w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari Kepala Keluarga, anggota keluarga, no. rumah, NIK..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedRombonganFilter}
                      onChange={(e) => setSelectedRombonganFilter(e.target.value)}
                      className="bg-[#f8fafc] border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-2xl focus:outline-none cursor-pointer"
                    >
                      <option value="all">Semua Rombongan</option>
                      {rombonganList.map((rom) => (
                        <option key={rom.id} value={rom.id}>{rom.nama}</option>
                      ))}
                      <option value="none">Tanpa Rombongan</option>
                    </select>

                    {selectedRombonganFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setSelectedRombonganFilter('all')}
                        className="px-2.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-2xl flex items-center gap-1 border border-amber-200 transition-colors cursor-pointer"
                        title="Reset Filter Rombongan"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleExpandAll}
                    className="px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl text-xs font-semibold cursor-pointer"
                  >
                    Buka Semua (Expand)
                  </button>
                  <button
                    onClick={handleCollapseAll}
                    className="px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl text-xs font-semibold cursor-pointer"
                  >
                    Tutup Semua
                  </button>
                </div>
              </div>

              {/* KK Accordion Cards List */}
              {isLoading ? (
                <div className="py-20 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-100">
                  Memuat data Kartu Keluarga...
                </div>
              ) : kkListFiltered.length === 0 ? (
                <div className="py-16 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-100 space-y-2">
                  <p className="font-bold text-slate-600">Tidak ada data Kepala Keluarga yang cocok</p>
                  <p className="text-xs">Silakan ubah filter pencarian atau tambahkan Kepala Keluarga baru.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {kkListFiltered.map((kk, idx) => {
                    const isExpanded = expandedKkIds.has(kk.id);
                    const familyMembers = kk.anggotaKeluarga || [];
                    const totalJiwaFamily = 1 + familyMembers.length;

                    return (
                      <div 
                        key={kk.id} 
                        className={`bg-white rounded-3xl border transition-all overflow-hidden ${
                          isExpanded ? 'border-orange-200 shadow-md ring-1 ring-orange-100' : 'border-slate-100 hover:border-slate-200 shadow-xs'
                        }`}
                      >
                        {/* KK Card Header (Click to Toggle) */}
                        <div 
                          onClick={() => toggleKkExpand(kk.id)}
                          className="p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/40 transition select-none"
                        >
                          <div className="flex items-start sm:items-center gap-3.5">
                            {/* Avatar */}
                            <div className={`w-11 h-11 rounded-2xl ${getAvatarBg(idx)} text-white font-bold flex items-center justify-center shrink-0 shadow-xs`}>
                              {getAvatarInitials(kk.nama)}
                            </div>

                            {/* Name & House */}
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm md:text-base font-bold text-slate-800 tracking-tight">{kk.nama}</h4>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  Kepala Keluarga
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                                  <Home className="w-3 h-3 text-slate-500" />
                                  <span>{kk.noRumah}</span>
                                </span>
                                {kk.noKk && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    No. KK: {kk.noKk}
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-medium">
                                {kk.rombongan ? (
                                  <span className="inline-flex items-center gap-1 text-slate-600 font-bold text-[11px] bg-slate-100 px-2 py-0.5 rounded-lg">
                                    <ShieldCheck className="w-3 h-3 text-slate-500" />
                                    <span>{kk.rombongan.nama}</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">Tanpa Rombongan Ronda</span>
                                )}
                                <span>•</span>
                                <span>{kk.noHp || 'No. HP belum diisi'}</span>
                                {kk.pekerjaan && (
                                  <>
                                    <span>•</span>
                                    <span className="inline-flex items-center gap-1">
                                      <Briefcase className="w-3 h-3 text-slate-400" />
                                      <span>{kk.pekerjaan}</span>
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Badges & Actions */}
                          <div className="flex items-center gap-2.5 justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                            {/* Family Count Badge */}
                            <div className="px-3 py-1.5 rounded-2xl bg-orange-50 border border-orange-200/80 text-[var(--brand-primary)] flex items-center gap-1.5 text-xs font-bold">
                              <Users className="w-3.5 h-3.5" />
                              <span>{totalJiwaFamily} Jiwa</span>
                            </div>

                            {/* Quick Add Family Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAddFamilyMember(kk);
                              }}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Tambah Istri / Anak / Orang Tua"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Tambah Anggota</span>
                            </button>

                            {/* Edit KK Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(kk);
                              }}
                              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                              title="Edit Kepala Keluarga"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete KK Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAnggota(kk);
                              }}
                              className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                              title="Hapus Kepala Keluarga"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            {/* Expand Chevron */}
                            <div className="p-1 text-slate-400">
                              {isExpanded ? <ChevronUp className="w-5 h-5 text-[var(--brand-primary)]" /> : <ChevronDown className="w-5 h-5" />}
                            </div>
                          </div>
                        </div>

                        {/* Sub-Section: Family Members (Expanded Accordion Body) */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 bg-[#fbfcfd] p-4 md:p-6 space-y-4 animate-in fade-in duration-200">
                            
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                  <span>Daftar Anggota Keluarga ({familyMembers.length} orang tercatat)</span>
                                </h5>
                                <p className="text-[11px] text-slate-400">
                                  Istri, anak-anak, orang tua, atau famili yang tinggal bersama di {kk.noRumah}.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleOpenAddFamilyMember(kk)}
                                className="px-3.5 py-1.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Tambah Istri / Anak</span>
                              </button>
                            </div>

                            {familyMembers.length === 0 ? (
                              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-2">
                                <p className="text-xs font-bold text-slate-600">Belum ada anggota keluarga yang didaftarkan</p>
                                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                                  Tekan tombol &quot;Tambah Istri / Anak&quot; untuk menambahkan data istri, anak, atau lansia di rumah ini agar administrasi warga lengkap.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddFamilyMember(kk)}
                                  className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>+ Tambah Anggota Pertama</span>
                                </button>
                              </div>
                            ) : (
                              <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                                  <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                      <th className="py-3 px-4 w-10">No</th>
                                      <th className="py-3 px-4">Nama Anggota</th>
                                      <th className="py-3 px-4">Hubungan</th>
                                      <th className="py-3 px-4">L/P</th>
                                      <th className="py-3 px-4">Usia & Tgl Lahir</th>
                                      <th className="py-3 px-4">NIK</th>
                                      <th className="py-3 px-4">Pekerjaan</th>
                                      <th className="py-3 px-4 text-right">Aksi</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {familyMembers.map((mem, memIdx) => (
                                      <tr key={mem.id} className="hover:bg-slate-50/60 transition">
                                        <td className="py-3 px-4 font-semibold text-slate-400">{memIdx + 1}</td>
                                        <td className="py-3 px-4 font-bold text-slate-800">
                                          {mem.nama}
                                        </td>
                                        <td className="py-3 px-4">
                                          {getStatusKeluargaBadge(mem.statusKeluarga)}
                                        </td>
                                        <td className="py-3 px-4 font-medium">
                                          {mem.jenisKelamin === 'Perempuan' ? (
                                            <span className="text-pink-600 font-bold">P</span>
                                          ) : (
                                            <span className="text-blue-600 font-bold">L</span>
                                          )}
                                        </td>
                                        <td className="py-3 px-4">
                                          <div className="space-y-0.5">
                                            <span className="font-bold text-slate-800">{getAgeLabel(mem.tanggalLahir)}</span>
                                            <span className="block text-[10px] text-slate-400">
                                              {getFormattedBirth(mem.tanggalLahir, mem.tempatLahir)}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                                          {mem.nik || '-'}
                                        </td>
                                        <td className="py-3 px-4 text-slate-600 font-medium">
                                          {mem.pekerjaan || '-'}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                          <div className="flex items-center justify-end gap-1">
                                            <button
                                              type="button"
                                              onClick={() => handleOpenEditFamilyMember(kk, mem)}
                                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                              title="Edit anggota keluarga"
                                            >
                                              <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteAnggota(mem)}
                                              className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                              title="Hapus anggota keluarga"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: SEMUA JIWA (REGISTER KEPENDUDUKAN LENGKAP)            */}
          {/* ============================================================ */}
          {activeTab === 'jiwa' && (
            <div className="space-y-4 text-left">
              
              {/* Filter Bar */}
              <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative max-w-md w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama, NIK, No. KK, atau no rumah..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  
                  {/* Gender Filter */}
                  <select
                    value={selectedGenderFilter}
                    onChange={(e) => setSelectedGenderFilter(e.target.value)}
                    className="bg-[#f8fafc] border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-2xl focus:outline-none cursor-pointer"
                  >
                    <option value="all">Semua Gender</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>

                  {/* Hubungan Keluarga Filter */}
                  <select
                    value={selectedHubunganFilter}
                    onChange={(e) => setSelectedHubunganFilter(e.target.value)}
                    className="bg-[#f8fafc] border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-2xl focus:outline-none cursor-pointer"
                  >
                    <option value="all">Semua Hubungan</option>
                    <option value="kepala_keluarga">Kepala Keluarga</option>
                    <option value="istri">Istri</option>
                    <option value="anak">Anak</option>
                    <option value="orang_tua">Orang Tua / Lansia</option>
                    <option value="famili_lain">Famili Lain</option>
                  </select>

                  {/* Usia Filter */}
                  <select
                    value={selectedUsiaFilter}
                    onChange={(e) => setSelectedUsiaFilter(e.target.value)}
                    className="bg-[#f8fafc] border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-2xl focus:outline-none cursor-pointer"
                  >
                    <option value="all">Semua Kategori Usia</option>
                    <option value="balita">Balita (&lt; 5 tahun)</option>
                    <option value="anak">Anak-Remaja (5 - 17 tahun)</option>
                    <option value="produktif">Usia Produktif (18 - 59 tahun)</option>
                    <option value="lansia">Lansia (&ge; 60 tahun)</option>
                  </select>

                </div>
              </div>

              {/* Table of All Citizens */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-4 md:p-6 flex flex-col justify-between">
                {isLoading ? (
                  <div className="py-20 text-center text-slate-400 font-medium">
                    Memuat data register kependudukan...
                  </div>
                ) : allJiwaFiltered.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 font-medium">
                    Tidak ada data kependudukan ditemukan.
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                    <table className="w-full text-left border-collapse min-w-[900px] text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-4 w-12">No</th>
                          <th className="py-3 px-4">Nama Warga</th>
                          <th className="py-3 px-4">No. Rumah</th>
                          <th className="py-3 px-4">Hubungan</th>
                          <th className="py-3 px-4">L/P</th>
                          <th className="py-3 px-4">Usia & TTL</th>
                          <th className="py-3 px-4">NIK & No. KK</th>
                          <th className="py-3 px-4">Operasional RT</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {allJiwaFiltered.slice(0, visibleRows).map((m, idx) => (
                          <tr key={m.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3.5 px-4 font-semibold text-slate-400">{idx + 1}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-800">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-xl ${getAvatarBg(idx)} text-white font-bold flex items-center justify-center shrink-0 text-[11px]`}>
                                  {getAvatarInitials(m.nama)}
                                </div>
                                <div>
                                  <span className="block">{m.nama}</span>
                                  {m.statusKeluarga !== 'kepala_keluarga' && m.kepalaKeluarga && (
                                    <span className="text-[10px] text-slate-400 font-medium block">
                                      KK: {m.kepalaKeluarga.nama}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-700">{m.noRumah}</td>
                            <td className="py-3.5 px-4">{getStatusKeluargaBadge(m.statusKeluarga)}</td>
                            <td className="py-3.5 px-4">
                              {m.jenisKelamin === 'Perempuan' ? (
                                <span className="text-pink-600 font-bold">P</span>
                              ) : (
                                <span className="text-blue-600 font-bold">L</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-800">{getAgeLabel(m.tanggalLahir)}</span>
                                <span className="block text-[10px] text-slate-400">
                                  {getFormattedBirth(m.tanggalLahir, m.tempatLahir)}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5 font-mono text-[10px]">
                                <span className="block text-slate-700">NIK: {m.nik || '-'}</span>
                                <span className="block text-slate-400">KK: {m.noKk || m.kepalaKeluarga?.noKk || '-'}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                {m.isWajibJimpitan ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <Coins className="w-2.5 h-2.5 text-amber-600" />
                                    <span>Jimpitan</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-300 text-[10px]">-</span>
                                )}
                                {m.isWajibRonda && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    <ShieldCheck className="w-2.5 h-2.5 text-blue-600" />
                                    <span>Ronda</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(m)}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                  title="Edit data warga"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAnggota(m)}
                                  className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Hapus data warga"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Load More Button */}
                {!isLoading && allJiwaFiltered.length > visibleRows && (
                  <div className="p-4 border-t border-slate-100 flex justify-center">
                    <button
                      onClick={() => setVisibleRows(prev => prev + 15)}
                      className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 rounded-2xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    >
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                      <span>Muat lebih banyak ({allJiwaFiltered.length - visibleRows} warga lagi)</span>
                    </button>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: PER ROMBONGAN (RONDA & JIMPITAN)                       */}
          {/* ============================================================ */}
          {activeTab === 'rombongan' && (
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight">Kelompok Rombongan Piket Ronda</h3>
                  <p className="text-xs text-slate-400">Jadwal pembagian giliran ronda malam dan petugas jimpitan RT.</p>
                </div>
                
                <button
                  onClick={handleOpenAddRombongan}
                  className="px-4 py-2 border border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold rounded-2xl hover:bg-[var(--brand-light)] transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Rombongan</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                {rombonganList.map((rom, index) => {
                  const isFiltered = selectedRombonganFilter === rom.id;

                  return (
                    <div 
                      key={rom.id} 
                      className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between min-h-48 relative group/card ${
                        isFiltered 
                          ? 'border-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/10 shadow-md' 
                          : 'border-slate-100 shadow-sm'
                      }`}
                    >
                      <div className="relative z-10 flex items-start justify-between">
                        <div className="space-y-1">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${getRombonganColor(index)}`}>
                            {rom.nama}
                          </span>
                          <h4 className="text-2xl font-bold text-slate-800 tracking-tight mt-2">{rom.activeMemberCount}</h4>
                          <span className="text-[10px] text-slate-400 font-semibold block leading-none">anggota piket</span>
                        </div>
                        
                        <div className="flex items-center gap-0.5 relative z-25 opacity-0 group-hover/card:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenEditRombongan(rom); }}
                            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
                            title="Ubah Nama"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteRombongan(rom.id, rom.nama); }}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                            title="Hapus Kelompok"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="relative z-10 border-t border-slate-100 pt-3 flex flex-col mt-4">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <UserCheck2 className="w-3 h-3 text-[var(--brand-primary)]" />
                          <span>Ketua Rombongan</span>
                        </label>
                        
                        <select
                          value={rom.ketuaId || 'none'}
                          onChange={(e) => handleUpdateRombonganLeader(rom.id, rom.nama, e.target.value)}
                          className="mt-1.5 w-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-2 py-1.5 rounded-xl focus:outline-none cursor-pointer"
                        >
                          <option value="none">Belum Ditentukan</option>
                          {rom.activeMembers.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.nama}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('kk');
                            setSelectedRombonganFilter(rom.id);
                          }}
                          className="mt-3 w-full py-1.5 px-3 bg-slate-50 hover:bg-[var(--brand-light)] border border-slate-200 hover:border-[var(--brand-primary)] text-slate-700 hover:text-[var(--brand-primary)] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Lihat KK ({rom.activeMemberCount} Anggota)</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-2xl p-4 flex items-center gap-3 text-left">
                <Info className="w-5 h-5 text-blue-500 shrink-0" />
                <span className="text-xs font-bold text-[#1e40af]">
                  Perubahan data rombongan hanya berlaku bagi Kepala Keluarga atau anggota yang memiliki kewajiban ronda malam.
                </span>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: MUTASI & DINAMIKA KEPENDUDUKAN (LPJ)                 */}
          {/* ============================================================ */}
          {activeTab === 'mutasi' && (
            <div className="space-y-5 text-left">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Kelahiran</span>
                  <h3 className="text-xl font-bold text-emerald-600">+{mutasiSummary.totalLahir}</h3>
                  <span className="text-[11px] text-slate-400">jiwa baru tahun ini</span>
                </div>
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Kematian</span>
                  <h3 className="text-xl font-bold text-slate-600">-{mutasiSummary.totalMeninggal}</h3>
                  <span className="text-[11px] text-slate-400">jiwa wafat</span>
                </div>
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Warga Masuk</span>
                  <h3 className="text-xl font-bold text-blue-600">+{mutasiSummary.totalMasuk}</h3>
                  <span className="text-[11px] text-slate-400">pindah datang</span>
                </div>
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Warga Keluar</span>
                  <h3 className="text-xl font-bold text-amber-600">-{mutasiSummary.totalKeluar}</h3>
                  <span className="text-[11px] text-slate-400">pindah keluar</span>
                </div>
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Pertumbuhan Netto</span>
                  <h3 className={`text-xl font-bold ${mutasiSummary.deltaNetto >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {mutasiSummary.deltaNetto >= 0 ? `+${mutasiSummary.deltaNetto}` : mutasiSummary.deltaNetto}
                  </h3>
                  <span className="text-[11px] text-slate-400">perubahan jiwa riil</span>
                </div>
              </div>

              {/* Table of Mutasi Log */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Buku Register Mutasi Kependudukan</h3>
                    <p className="text-xs text-slate-400">Catatan resmi peristiwa kelahiran, kematian, warga datang dan pindah untuk LPJ.</p>
                  </div>
                  <button
                    onClick={() => setIsMutasiModalOpen(true)}
                    className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-bold rounded-2xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Catat Peristiwa Mutasi</span>
                  </button>
                </div>

                {mutasiList.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-medium">
                    Belum ada peristiwa mutasi warga yang dicatat tahun ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Tanggal</th>
                          <th className="py-2.5 px-3">Jenis Mutasi</th>
                          <th className="py-2.5 px-3">Nama Warga / Bayi</th>
                          <th className="py-2.5 px-3">No Rumah</th>
                          <th className="py-2.5 px-3">Keterangan / Alasan</th>
                          <th className="py-2.5 px-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {mutasiList.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-500">
                              {new Date(m.tanggalPeristiwa).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="py-3 px-3">
                              {m.jenisMutasi === 'lahir' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">Kelahiran</span>}
                              {m.jenisMutasi === 'masuk' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600">Pindah Masuk</span>}
                              {m.jenisMutasi === 'keluar' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600">Pindah Keluar</span>}
                              {m.jenisMutasi === 'meninggal' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Meninggal</span>}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-800">
                              {m.namaWarga}
                              {m.jenisKelamin && <span className="block text-[10px] font-normal text-slate-400">{m.jenisKelamin}</span>}
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-600">{m.noRumah || '-'}</td>
                            <td className="py-3 px-3 text-slate-600 italic">&quot;{m.keterangan || '-'}&quot;</td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => handleDeleteMutasi(m.id)}
                                className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                                title="Hapus catatan mutasi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
        
        {/* Mobile Navigation Bar */}
        <MobileNavBar />
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: TAMBAH / EDIT KEPALA KELUARGA / WARGA UTAMA         */}
      {/* ============================================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4 text-left">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Home className="w-4 h-4 text-[var(--brand-primary)]" />
                <span>{modalMode === 'add' ? 'Tambah Kepala Keluarga (KK Baru)' : 'Edit Data Warga'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAnggota} className="space-y-3.5 text-xs">
              
              <div>
                <label className="block font-bold text-slate-600 mb-1">Nama Lengkap (Kepala Keluarga)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bp. Hendra Prasetya"
                  value={formValues.nama}
                  onChange={(e) => setFormValues(prev => ({ ...prev, nama: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">No. Rumah / Blok</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: No. 12"
                    value={formValues.noRumah}
                    onChange={(e) => setFormValues(prev => ({ ...prev, noRumah: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Nomor Kartu Keluarga (KK)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 3302xxxxxxxxxxxx"
                    value={formValues.noKk}
                    onChange={(e) => setFormValues(prev => ({ ...prev, noKk: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">NIK (16 Digit)</label>
                  <input
                    type="text"
                    placeholder="3302xxxxxxxxxxxx"
                    value={formValues.nik}
                    onChange={(e) => setFormValues(prev => ({ ...prev, nik: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)] font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">No. HP / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={formValues.noHp}
                    onChange={(e) => setFormValues(prev => ({ ...prev, noHp: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    placeholder="Contoh: Banyumas"
                    value={formValues.tempatLahir}
                    onChange={(e) => setFormValues(prev => ({ ...prev, tempatLahir: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={formValues.tanggalLahir}
                    onChange={(e) => setFormValues(prev => ({ ...prev, tanggalLahir: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Rombongan Ronda</label>
                  <select
                    value={formValues.rombonganId}
                    onChange={(e) => setFormValues(prev => ({ ...prev, rombonganId: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="none">Tanpa Rombongan</option>
                    {rombonganList.map((rom) => (
                      <option key={rom.id} value={rom.id}>{rom.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Pekerjaan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Karyawan Swasta"
                    value={formValues.pekerjaan}
                    onChange={(e) => setFormValues(prev => ({ ...prev, pekerjaan: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              {/* Checkboxes Operasional */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kewajiban Operasional RT</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formValues.isWajibJimpitan}
                      onChange={(e) => setFormValues(prev => ({ ...prev, isWajibJimpitan: e.target.checked }))}
                      className="w-4 h-4 rounded text-[var(--brand-primary)]"
                    />
                    <span>Wajib Jimpitan (Rumah)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formValues.isWajibRonda}
                      onChange={(e) => setFormValues(prev => ({ ...prev, isWajibRonda: e.target.checked }))}
                      className="w-4 h-4 rounded text-[var(--brand-primary)]"
                    />
                    <span>Wajib Piket Ronda</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white rounded-xl font-bold cursor-pointer"
                >
                  {modalMode === 'add' ? 'Simpan Kepala Keluarga' : 'Perbarui Data'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: TAMBAH / EDIT ANGGOTA KELUARGA (LOCKED TO A KK)     */}
      {/* ============================================================ */}
      {isFamilyModalOpen && selectedKkForFamily && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4 text-left">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  <span>{isEditingFamilyMember ? 'Edit Anggota Keluarga' : 'Tambah Anggota Keluarga'}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Menginduk ke: <strong className="text-slate-700">{selectedKkForFamily.nama}</strong> ({selectedKkForFamily.noRumah})
                </p>
              </div>
              <button onClick={() => setIsFamilyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitFamilyMember} className="space-y-3.5 text-xs">
              
              <div>
                <label className="block font-bold text-slate-600 mb-1">Nama Lengkap Anggota Keluarga</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ny. Ratna Sari / Muhammad Dwi Setyawan"
                  value={familyForm.nama}
                  onChange={(e) => setFamilyForm(prev => ({ ...prev, nama: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Hubungan dalam Keluarga</label>
                  <select
                    value={familyForm.statusKeluarga}
                    onChange={(e) => {
                      const st = e.target.value;
                      setFamilyForm(prev => ({
                        ...prev,
                        statusKeluarga: st,
                        jenisKelamin: st === 'istri' ? 'Perempuan' : prev.jenisKelamin,
                        statusPerkawinan: st === 'anak' ? 'Belum Kawin' : 'Kawin'
                      }));
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none font-bold"
                  >
                    <option value="istri">Istri</option>
                    <option value="anak">Anak</option>
                    <option value="orang_tua">Orang Tua / Mertua</option>
                    <option value="famili_lain">Famili Lain</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Jenis Kelamin</label>
                  <select
                    value={familyForm.jenisKelamin}
                    onChange={(e) => setFamilyForm(prev => ({ ...prev, jenisKelamin: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    placeholder="Kota kelahiran"
                    value={familyForm.tempatLahir}
                    onChange={(e) => setFamilyForm(prev => ({ ...prev, tempatLahir: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={familyForm.tanggalLahir}
                    onChange={(e) => setFamilyForm(prev => ({ ...prev, tanggalLahir: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">NIK (Nomor Induk Kependudukan)</label>
                  <input
                    type="text"
                    placeholder="3302xxxxxxxxxxxx"
                    value={familyForm.nik}
                    onChange={(e) => setFamilyForm(prev => ({ ...prev, nik: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Pekerjaan / Pendidikan</label>
                  <input
                    type="text"
                    placeholder="Pelajar / Mahasiswa / IRT"
                    value={familyForm.pekerjaan}
                    onChange={(e) => setFamilyForm(prev => ({ ...prev, pekerjaan: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1 text-slate-700">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Catatan Kewajiban Jimpitan & Ronda</span>
                <p className="text-[11px] text-emerald-700">
                  Secara default, anggota keluarga (istri/anak) <strong>tidak ditagihkan jimpitan</strong> dan <strong>tidak dikenakan jadwal ronda</strong> karena telah diwakili oleh Kepala Keluarga.
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFamilyModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  {isEditingFamilyMember ? 'Perbarui Anggota' : 'Simpan Anggota Keluarga'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: CRUD ROMBONGAN                                      */}
      {/* ============================================================ */}
      {isRomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">
                {romModalMode === 'add' ? 'Tambah Rombongan Baru' : 'Kelola Rombongan'}
              </h3>
              <button onClick={() => setIsRomModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRombongan} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Nama Rombongan</label>
                <input
                  ref={romFormNamaRef}
                  type="text"
                  required
                  placeholder="Contoh: Rombongan 8"
                  className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRomModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white rounded-xl font-bold cursor-pointer"
                >
                  Simpan Rombongan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: CATAT MUTASI WARGA                                  */}
      {/* ============================================================ */}
      {isMutasiModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[var(--brand-primary)]" />
                <span>Catat Peristiwa Mutasi Kependudukan</span>
              </h3>
              <button onClick={() => setIsMutasiModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMutasi} className="space-y-3 text-xs text-left">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Jenis Peristiwa</label>
                  <select
                    value={mutasiForm.jenisMutasi}
                    onChange={(e) => setMutasiForm(prev => ({ ...prev, jenisMutasi: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[var(--brand-primary)] font-bold"
                  >
                    <option value="lahir">Kelahiran Bayi</option>
                    <option value="masuk">Warga Pindah Masuk</option>
                    <option value="keluar">Warga Pindah Keluar</option>
                    <option value="meninggal">Warga Meninggal Dunia</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Tanggal Peristiwa</label>
                  <input
                    type="date"
                    required
                    value={mutasiForm.tanggalPeristiwa}
                    onChange={(e) => setMutasiForm(prev => ({ ...prev, tanggalPeristiwa: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Nama Warga / Bayi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Arkan / Bpk. Hendra"
                  value={mutasiForm.namaWarga}
                  onChange={(e) => setMutasiForm(prev => ({ ...prev, namaWarga: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Jenis Kelamin</label>
                  <select
                    value={mutasiForm.jenisKelamin}
                    onChange={(e) => setMutasiForm(prev => ({ ...prev, jenisKelamin: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">No. Rumah / Alamat</label>
                  <input
                    type="text"
                    placeholder="Contoh: No. 12"
                    value={mutasiForm.noRumah}
                    onChange={(e) => setMutasiForm(prev => ({ ...prev, noRumah: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">NIK (Opsional)</label>
                <input
                  type="text"
                  placeholder="16 digit NIK..."
                  value={mutasiForm.nik}
                  onChange={(e) => setMutasiForm(prev => ({ ...prev, nik: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)] font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Keterangan / Alasan / No. Surat</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Kelahiran anak kedua di RS Hermina / Pindah tugas ke Jakarta"
                  value={mutasiForm.keterangan}
                  onChange={(e) => setMutasiForm(prev => ({ ...prev, keterangan: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--brand-primary)] resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMutasiModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold cursor-pointer"
                >
                  Simpan Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
