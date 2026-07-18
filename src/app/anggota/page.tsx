'use client';

import React, { useState, useEffect } from 'react';
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
  Trash
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
  rombonganId: string | null;
  rombongan: { id: string; nama: string } | null;
  statusAktif: boolean;
}

export default function AnggotaPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([]);
  const [rombonganList, setRombonganList] = useState<Rombongan[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRombonganFilter, setSelectedRombonganFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'semua' | 'rombongan'>('semua');
  
  const [isLoading, setIsLoading] = useState(true);
  const [visibleRows, setVisibleRows] = useState(12);

  // Sorting states
  const [sortField, setSortField] = useState<'nama' | 'noRumah'>('nama');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal states for Anggota
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentId, setCurrentId] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formNoRumah, setFormNoRumah] = useState('');
  const [formNoHp, setFormNoHp] = useState('');
  const [formRombonganId, setFormRombonganId] = useState('none');
  const [formStatusAktif, setFormStatusAktif] = useState(true);

  // Modal states for Rombongan (Group)
  const [isRomModalOpen, setIsRomModalOpen] = useState(false);
  const [romModalMode, setRomModalMode] = useState<'add' | 'edit'>('add');
  const [romCurrentId, setRomCurrentId] = useState('');
  const [romFormNama, setRomFormNama] = useState('');
  const [selectedUnassignedMemberId, setSelectedUnassignedMemberId] = useState('none');

  // Notification states
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);

  // Custom confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const resA = await fetch('/api/anggota');
      const dataA = await resA.json();
      if (!dataA.error) {
        setAnggotaList(dataA);
      }

      const resR = await fetch('/api/rombongan');
      const dataR = await resR.json();
      if (!dataR.error) {
        setRombonganList(dataR);
      }
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Open modal for Anggota Add
  const handleOpenAdd = () => {
    setModalMode('add');
    setCurrentId('');
    setFormNama('');
    setFormNoRumah('');
    setFormNoHp('');
    setFormRombonganId(rombonganList.length > 0 ? rombonganList[0].id : 'none');
    setFormStatusAktif(true);
    setIsModalOpen(true);
  };

  // Open modal for Anggota Edit
  const handleOpenEdit = (anggota: Anggota) => {
    setModalMode('edit');
    setCurrentId(anggota.id);
    setFormNama(anggota.nama);
    setFormNoRumah(anggota.noRumah);
    setFormNoHp(anggota.noHp || '');
    setFormRombonganId(anggota.rombonganId || 'none');
    setFormStatusAktif(anggota.statusAktif);
    setIsModalOpen(true);
  };

  // Open modal for Rombongan Add
  const handleOpenAddRombongan = () => {
    setRomModalMode('add');
    setRomCurrentId('');
    setRomFormNama('');
    setIsRomModalOpen(true);
  };

  // Open modal for Rombongan Edit
  const handleOpenEditRombongan = (rom: Rombongan) => {
    setRomModalMode('edit');
    setRomCurrentId(rom.id);
    setRomFormNama(rom.nama);
    setIsRomModalOpen(true);
  };

  // Handle Anggota Submit
  const handleSubmitAnggota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama || !formNoRumah) {
      triggerToast('Nama dan Nomor Rumah wajib diisi', 'error');
      return;
    }

    try {
      const url = '/api/anggota';
      const method = modalMode === 'add' ? 'POST' : 'PUT';
      const body = modalMode === 'add' 
        ? { nama: formNama, noRumah: formNoRumah, noHp: formNoHp, rombonganId: formRombonganId }
        : { id: currentId, nama: formNama, noRumah: formNoRumah, noHp: formNoHp, rombonganId: formRombonganId, statusAktif: formStatusAktif };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.error) {
        triggerToast(data.error, 'error');
      } else {
        triggerToast(
          modalMode === 'add' ? 'Anggota berhasil ditambahkan' : 'Data anggota berhasil diperbarui',
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

  // Handle Rombongan Submit (Add/Edit)
  const handleSubmitRombongan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!romFormNama.trim()) {
      triggerToast('Nama rombongan wajib diisi', 'error');
      return;
    }

    try {
      const url = '/api/rombongan';
      const method = romModalMode === 'add' ? 'POST' : 'PUT';
      const body = romModalMode === 'add'
        ? { nama: romFormNama }
        : { id: romCurrentId, nama: romFormNama };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.error) {
        triggerToast(data.error, 'error');
      } else {
        triggerToast(
          romModalMode === 'add' ? 'Rombongan baru berhasil dibuat' : 'Nama rombongan berhasil diubah',
          'success'
        );
        setIsRomModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      triggerToast('Gagal memproses kelompok rombongan', 'error');
    }
  };

  // Handle Rombongan Leader Update
  const handleUpdateRombonganLeader = async (romId: string, romNama: string, leaderId: string) => {
    try {
      const res = await fetch('/api/rombongan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: romId,
          nama: romNama,
          ketuaId: leaderId === 'none' ? null : leaderId
        }),
      });

      const data = await res.json();
      if (data.error) {
        triggerToast(data.error, 'error');
      } else {
        triggerToast('Ketua rombongan berhasil diperbarui', 'success');
        fetchData();
      }
    } catch (err) {
      console.error(err);
      triggerToast('Gagal memperbarui ketua rombongan', 'error');
    }
  };

  const getHariPiketLabel = (hariVal: number | null) => {
    if (!hariVal) return 'Belum Ditentukan';
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    return days[hariVal - 1] || 'Belum Ditentukan';
  };

  const handleRemoveMemberFromGroup = async (member: Anggota) => {
    try {
      const res = await fetch('/api/anggota', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: member.id,
          nama: member.nama,
          noRumah: member.noRumah,
          noHp: member.noHp,
          statusAktif: member.statusAktif,
          rombonganId: 'none'
        })
      });
      const data = await res.json();
      if (data.error) {
        triggerToast(data.error, 'error');
      } else {
        triggerToast(`Berhasil mengeluarkan ${member.nama} dari ${romFormNama}`, 'success');
        fetchData();
      }
    } catch (err) {
      console.error(err);
      triggerToast('Gagal mengeluarkan anggota', 'error');
    }
  };

  const handleAddMemberToGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnassignedMemberId || selectedUnassignedMemberId === 'none') {
      triggerToast('Pilih warga terlebih dahulu', 'error');
      return;
    }
    const member = anggotaList.find(a => a.id === selectedUnassignedMemberId);
    if (!member) return;

    try {
      const res = await fetch('/api/anggota', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: member.id,
          nama: member.nama,
          noRumah: member.noRumah,
          noHp: member.noHp,
          statusAktif: member.statusAktif,
          rombonganId: romCurrentId
        })
      });
      const data = await res.json();
      if (data.error) {
        triggerToast(data.error, 'error');
      } else {
        triggerToast(`Berhasil menambahkan ${member.nama} ke ${romFormNama}`, 'success');
        setSelectedUnassignedMemberId('none');
        fetchData();
      }
    } catch (err) {
      console.error(err);
      triggerToast('Gagal menambahkan anggota', 'error');
    }
  };

  // Handle delete Anggota
  const handleDeleteAnggota = (id: string, name: string) => {
    setConfirmDialog({
      open: true,
      title: 'Hapus Anggota',
      message: `Apakah Anda yakin ingin menghapus data anggota "${name}"? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        try {
          const res = await fetch(`/api/anggota?id=${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.error) {
            triggerToast(data.error, 'error');
          } else {
            triggerToast('Anggota berhasil dihapus', 'success');
            fetchData();
          }
        } catch (err) {
          console.error(err);
          triggerToast('Gagal menghapus data', 'error');
        }
      }
    });
  };

  // Handle delete Rombongan
  const handleDeleteRombongan = (id: string, name: string) => {
    setConfirmDialog({
      open: true,
      title: 'Hapus Rombongan',
      message: `Apakah Anda yakin ingin menghapus kelompok "${name}"? Anggota di dalamnya akan dipindahkan ke Tanpa Rombongan.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        try {
          const res = await fetch(`/api/rombongan?id=${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.error) {
            triggerToast(data.error, 'error');
          } else {
            triggerToast('Kelompok rombongan berhasil dihapus', 'success');
            fetchData();
          }
        } catch (err) {
          console.error(err);
          triggerToast('Gagal menghapus rombongan', 'error');
        }
      }
    });
  };

  const handleSort = (field: 'nama' | 'noRumah') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Bulk selection helpers
  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (visibleIds: string[]) => {
    const allSelected = visibleIds.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        visibleIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        visibleIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const handleBulkDelete = () => {
    const count = selectedIds.size;
    setConfirmDialog({
      open: true,
      title: `Hapus ${count} Anggota`,
      message: `Apakah Anda yakin ingin menghapus ${count} anggota yang dipilih? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        try {
          await Promise.all(
            [...selectedIds].map(id =>
              fetch(`/api/anggota?id=${id}`, { method: 'DELETE' })
            )
          );
          triggerToast(`${count} anggota berhasil dihapus`, 'success');
          setSelectedIds(new Set());
          fetchData();
        } catch (err) {
          console.error(err);
          triggerToast('Gagal menghapus beberapa anggota', 'error');
        }
      }
    });
  };

  // Filter list by search query & select criteria
  const filteredList = anggotaList.filter((item) => {
    // 1. Search Query
    const matchesSearch = 
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.noRumah.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.noHp && item.noHp.includes(searchQuery));
    
    // 2. Rombongan filter
    const matchesRombongan = 
      selectedRombonganFilter === 'all' || 
      item.rombonganId === selectedRombonganFilter;

    // 3. Status filter
    const matchesStatus = 
      selectedStatusFilter === 'all' || 
      (selectedStatusFilter === 'aktif' && item.statusAktif) || 
      (selectedStatusFilter === 'nonaktif' && !item.statusAktif);

    return matchesSearch && matchesRombongan && matchesStatus;
  });

  // Sort list
  const sortedAndFilteredList = [...filteredList].sort((a, b) => {
    let valA: string | number = '';
    let valB: string | number = '';

    if (sortField === 'nama') {
      valA = a.nama.toLowerCase();
      valB = b.nama.toLowerCase();
    } else if (sortField === 'noRumah') {
      const numA = parseInt(a.noRumah.replace(/\D/g, ''), 10);
      const numB = parseInt(b.noRumah.replace(/\D/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }
      valA = a.noRumah.toLowerCase();
      valB = b.noRumah.toLowerCase();
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginated/Limited view of list
  const visibleList = sortedAndFilteredList.slice(0, visibleRows);

  // Group stats calculations
  const totalAnggota = anggotaList.length;
  const anggotaAktifCount = anggotaList.filter(a => a.statusAktif).length;
  const nonaktifCount = anggotaList.filter(a => !a.statusAktif).length;
  const totalRombonganCount = rombonganList.length;

  // Helper to generate initials for avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Generate color palette for avatars
  const getAvatarBg = (name: string) => {
    const colors = [
      'from-emerald-400 to-teal-500',
      'from-sky-400 to-blue-500',
      'from-purple-400 to-indigo-500',
      'from-orange-400 to-amber-500',
      'from-pink-400 to-rose-500',
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  // Color styles for Rombongan badges
  const getRombonganColor = (index: number) => {
    const colorStyles = [
      'bg-emerald-50 text-emerald-600 border-emerald-100', // R1
      'bg-sky-50 text-sky-600 border-sky-100', // R2
      'bg-purple-50 text-purple-600 border-purple-100', // R3
      'bg-orange-50 text-orange-600 border-orange-100', // R4
      'bg-pink-50 text-pink-600 border-pink-100', // R5
      'bg-indigo-50 text-indigo-600 border-indigo-100', // R6
      'bg-amber-50 text-amber-600 border-amber-100', // R7
    ];
    return colorStyles[index % colorStyles.length];
  };

  const getRombonganColorClass = (rombonganId: string | null) => {
    if (!rombonganId) return 'bg-slate-50 text-slate-400 border-slate-100';
    const index = rombonganList.findIndex(r => r.id === rombonganId);
    return getRombonganColor(index >= 0 ? index : 0);
  };

  return (
    <div className="flex w-full min-h-screen bg-[#f8fafc]">
      <Sidebar activeMenu="Anggota" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl w-full mx-auto pb-24 md:pb-16 font-sans">
          
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
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
              />
              {/* Dialog Card */}
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
                {/* Icon */}
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 mx-auto mb-5">
                  <Trash2 className="w-7 h-7 text-red-500" />
                </div>
                {/* Title */}
                <h3 className="text-lg font-bold text-slate-800 text-center mb-2">{confirmDialog.title}</h3>
                {/* Message */}
                <p className="text-sm text-slate-500 text-center leading-relaxed font-medium mb-8">
                  {confirmDialog.message}
                </p>
                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                    className="flex-1 px-5 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all text-sm cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={confirmDialog.onConfirm}
                    className="flex-1 px-5 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-100 transition-all text-sm cursor-pointer"
                  >
                    Ya, Hapus
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Title and Subtitle */}
          <div className="space-y-1 text-left">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Anggota</h2>
            <p className="text-xs md:text-sm text-slate-400 font-medium">Kelola data anggota warga RT 04.</p>
          </div>

          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            
            {/* Stat Card 1: Total Anggota */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between text-left">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Anggota</span>
                <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">{totalAnggota}</h3>
                <span className="text-[11px] text-slate-400 font-medium">orang</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[var(--brand-light)] text-[var(--brand-primary)] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* Stat Card 2: Anggota Piket Hack Aktif */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between text-left">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Anggota Aktif</span>
                <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">{anggotaAktifCount}</h3>
                <span className="text-[11px] text-slate-400 font-medium">orang</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            {/* Stat Card 3: Nonaktif */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between text-left">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nonaktif</span>
                <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">{nonaktifCount}</h3>
                <span className="text-[11px] text-slate-400 font-medium">orang</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
                <UserX className="w-5 h-5" />
              </div>
            </div>

            {/* Stat Card 4: Total Rombongan */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between text-left">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rombongan</span>
                <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">{totalRombonganCount}</h3>
                <span className="text-[11px] text-slate-400 font-medium">rombongan</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <FolderHeart className="w-5 h-5" />
              </div>
            </div>

          </div>

          {/* Search, Filter dropdowns & Add Anggota Row */}
          <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, no rumah atau HP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-[#f95713] transition-all"
              />
            </div>
            
            {/* Filters and Add Button */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
              
              {/* Rombongan dynamic dropdown filter */}
              <select
                value={selectedRombonganFilter}
                onChange={(e) => setSelectedRombonganFilter(e.target.value)}
                className="bg-[#f8fafc] border border-slate-200 text-xs font-bold text-slate-600 px-3 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 cursor-pointer"
              >
                <option value="all">Semua Rombongan</option>
                {rombonganList.map((rom) => (
                  <option key={rom.id} value={rom.id}>{rom.nama}</option>
                ))}
                <option value="none">Tanpa Rombongan</option>
              </select>

              {/* Status active dropdown filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-[#f8fafc] border border-slate-200 text-xs font-bold text-slate-600 px-3 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="aktif">Status Aktif</option>
                <option value="nonaktif">Status Nonaktif</option>
              </select>

              {/* Tambah Anggota Button */}
              <button
                onClick={handleOpenAdd}
                className="px-5 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold rounded-2xl shadow-sm transition-all flex items-center gap-2 cursor-pointer text-xs"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>Tambah Anggota</span>
              </button>

            </div>
          </div>

          {/* Bulk Action Bar — shown when any row is selected */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between bg-slate-800 text-white rounded-2xl px-5 py-3 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-[var(--brand-primary)] flex items-center justify-center">
                  <span className="text-xs font-bold">{selectedIds.size}</span>
                </div>
                <span className="text-sm font-bold">{selectedIds.size} anggota dipilih</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  Batal Pilih
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 text-xs font-bold bg-red-500 hover:bg-red-400 text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-900/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus {selectedIds.size} Anggota
                </button>
              </div>
            </div>
          )}

          {/* Tab Selection Row */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => { setActiveTab('semua'); setSelectedRombonganFilter('all'); }}
              className={`pb-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'semua' && selectedRombonganFilter === 'all'
                  ? 'border-[#f95713] text-[#f95713]'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Semua Warga
            </button>
            <button
              onClick={() => setActiveTab('rombongan')}
              className={`pb-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'rombongan'
                  ? 'border-[#f95713] text-[#f95713]'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Per Rombongan
            </button>
          </div>

          {/* Main Table Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-4 md:p-6 flex flex-col justify-between">
            {isLoading ? (
              <div className="py-20 text-center text-slate-400 font-medium">
                Memuat data anggota...
              </div>
            ) : visibleList.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-medium">
                Tidak ada data anggota ditemukan.
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {/* Checkbox Select All */}
                    <th className="py-4 pl-6 pr-2 w-10">
                      <input
                        type="checkbox"
                        checked={visibleList.length > 0 && visibleList.every(item => selectedIds.has(item.id))}
                        ref={el => {
                          if (el) el.indeterminate = visibleList.some(item => selectedIds.has(item.id)) && !visibleList.every(item => selectedIds.has(item.id));
                        }}
                        onChange={() => toggleSelectAll(visibleList.map(i => i.id))}
                        className="w-4 h-4 rounded accent-[#f95713] cursor-pointer"
                      />
                    </th>
                    <th className="py-4 px-4 w-12">No</th>
                    <th 
                      className="py-4 px-6 cursor-pointer select-none hover:bg-slate-100/40 hover:text-slate-700 transition-colors"
                      onClick={() => handleSort('nama')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Nama Anggota</span>
                        {sortField === 'nama' ? (
                          sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-[#f95713]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#f95713]" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-350" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="py-4 px-6 cursor-pointer select-none hover:bg-slate-100/40 hover:text-slate-700 transition-colors"
                      onClick={() => handleSort('noRumah')}
                    >
                      <div className="flex items-center gap-1">
                        <span>No Rumah</span>
                        {sortField === 'noRumah' ? (
                          sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-[#f95713]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#f95713]" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-350" />
                        )}
                      </div>
                    </th>
                    <th className="py-4 px-6">Rombongan</th>
                    <th className="py-4 px-6">No HP</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleList.map((item, index) => {
                    const isChecked = selectedIds.has(item.id);
                    return (
                    <tr key={item.id} className={`transition-colors ${isChecked ? 'bg-orange-50/60' : 'hover:bg-slate-50/50'}`}>
                      {/* Checkbox cell */}
                      <td className="py-4 pl-6 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(item.id)}
                          className="w-4 h-4 rounded accent-[#f95713] cursor-pointer"
                        />
                      </td>
                      {/* No column */}
                      <td className="py-4 px-4 text-sm font-semibold text-slate-400">
                        {index + 1}
                      </td>
                      
                      {/* Name with circular avatar */}
                      <td className="py-4 px-6 text-sm">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${getAvatarBg(item.nama)} text-white font-bold text-xs flex items-center justify-center shadow-inner`}>
                            {getInitials(item.nama)}
                          </div>
                          <span className="font-bold text-slate-800">{item.nama}</span>
                        </div>
                      </td>

                      {/* No Rumah */}
                      <td className="py-4 px-6 text-sm font-semibold text-slate-500">
                        {item.noRumah}
                      </td>

                      {/* Rombongan badge */}
                      <td className="py-4 px-6 text-sm">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-lg border ${getRombonganColorClass(item.rombonganId)}`}>
                          {item.rombongan?.nama || 'Tanpa Rombongan'}
                        </span>
                      </td>

                      {/* No HP */}
                      <td className="py-4 px-6 text-sm font-semibold text-slate-500">
                        {item.noHp || '-'}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-sm">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-lg border ${
                          item.statusAktif 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}>
                          {item.statusAktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-sm text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Data"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAnggota(item.id, item.nama)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-650 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Warga"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}

            {/* Load More Button */}
            {!isLoading && sortedAndFilteredList.length > visibleRows && (
              <div className="p-4 border-t border-slate-100 flex justify-center">
                <button
                  onClick={() => setVisibleRows(prev => prev + 12)}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-500 rounded-2xl flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                >
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                  <span>Muat lebih banyak</span>
                </button>
              </div>
            )}
          </div>

          {/* Section: Daftar Rombongan (Rombongan cards list) */}
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-extrabold text-slate-850 tracking-tight">Daftar Rombongan</h3>
              
              <button
                onClick={handleOpenAddRombongan}
                className="px-4 py-2 border border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold rounded-2xl hover:bg-[var(--brand-light)] transition-all flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Rombongan</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {rombonganList.map((rom, index) => {
                const isFiltered = selectedRombonganFilter === rom.id;

                return (
                  <div 
                    key={rom.id} 
                    className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between min-h-48 relative group/card ${
                      isFiltered 
                        ? 'border-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/10 shadow-md' 
                        : 'border-slate-100/80 shadow-sm'
                    }`}
                  >
                    {/* Filter click zone */}
                    <div 
                      onClick={() => {
                        setSelectedRombonganFilter(isFiltered ? 'all' : rom.id);
                        setActiveTab('semua');
                      }}
                      className="absolute inset-0 z-0 cursor-pointer rounded-3xl"
                    />

                    {/* Group Header Info */}
                    <div className="relative z-10 flex items-start justify-between">
                      <div className="space-y-1">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${getRombonganColor(index)}`}>
                          {rom.nama}
                        </span>
                        <h4 className="text-2xl font-bold text-slate-800 tracking-tight mt-2">{rom.activeMemberCount}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold block leading-none">anggota aktif</span>
                        {rom.hariPiket && (
                          <span className="text-[9px] bg-[var(--brand-light)] border border-[var(--brand-primary)]/20 text-[var(--brand-primary)] font-bold px-1.5 py-0.5 rounded mt-2 inline-block">
                            📅 Piket: {getHariPiketLabel(rom.hariPiket)}
                          </span>
                        )}
                      </div>
                      
                      {/* CRUD group actions */}
                      <div className="flex items-center gap-0.5 relative z-25 opacity-0 group-hover/card:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenEditRombongan(rom); }}
                          className="p-1 hover:bg-slate-150 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
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
                    
                    {/* Leader assignment checklist (dropdown selection) */}
                    <div className="relative z-10 border-t border-slate-100 pt-3 flex flex-col mt-4">
                      <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <UserCheck2 className="w-3 h-3 text-[#f95713]" />
                        <span>Ketua Rombongan</span>
                      </label>
                      
                      <select
                        value={rom.ketuaId || 'none'}
                        onChange={(e) => handleUpdateRombonganLeader(rom.id, rom.nama, e.target.value)}
                        className="mt-1.5 w-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-750 px-2 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
                      >
                        <option value="none">Belum Ditentukan</option>
                        {rom.activeMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            ✓ {member.nama}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Callout Blue alert box */}
          <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-2xl p-4 flex items-center gap-3 text-left">
            <Info className="w-5 h-5 text-blue-500 shrink-0" />
            <span className="text-xs font-bold text-[#1e40af]">
              Perubahan data anggota akan mempengaruhi jadwal jimpitan. Pastikan data sudah benar.
            </span>
          </div>

          {/* CRUD Modal for Anggota */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                    {modalMode === 'add' ? 'Tambah Anggota Baru' : 'Edit Data Anggota'}
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmitAnggota} className="mt-6 space-y-5">
                  
                  <div className="flex flex-col text-left">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                    <input
                      type="text"
                      placeholder="Contoh: Budi Santoso"
                      value={formNama}
                      onChange={(e) => setFormNama(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm font-bold text-slate-850 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-[#f95713] transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col text-left">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">No. Rumah / Blok</label>
                      <input
                        type="text"
                        placeholder="Contoh: No. 12"
                        value={formNoRumah}
                        onChange={(e) => setFormNoRumah(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm font-bold text-slate-850 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-[#f95713] transition-all"
                        required
                      />
                    </div>

                    <div className="flex flex-col text-left">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">No. HP (WhatsApp)</label>
                      <input
                        type="text"
                        placeholder="Contoh: 0812-3456-..."
                        value={formNoHp}
                        onChange={(e) => setFormNoHp(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm font-bold text-slate-850 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-[#f95713] transition-all"
                      />
                    </div>
                  </div>

                  {/* Rombongan Dropdown */}
                  <div className="flex flex-col text-left">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Rombongan (Piket Ronda)</label>
                    <select
                      value={formRombonganId}
                      onChange={(e) => setFormRombonganId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm font-bold text-slate-850 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-[#f95713] transition-all cursor-pointer"
                    >
                      <option value="none">Tanpa Rombongan</option>
                      {rombonganList.map((rom) => (
                        <option key={rom.id} value={rom.id}>{rom.nama}</option>
                      ))}
                    </select>
                  </div>

                  {modalMode === 'edit' && (
                    <div className="flex items-center gap-3 bg-[#f8fafc] p-3.5 rounded-xl border border-slate-100">
                      <input
                        type="checkbox"
                        id="status-checkbox"
                        checked={formStatusAktif}
                        onChange={(e) => setFormStatusAktif(e.target.checked)}
                        className="w-4.5 h-4.5 text-[#f95713] border-slate-350 rounded-sm focus:ring-[#f95713]"
                      />
                      <label htmlFor="status-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                        Status Keaktifan Warga (Aktif untuk Piket Ronda)
                      </label>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 border border-slate-200 font-bold rounded-xl text-slate-500 hover:bg-slate-50 transition-colors text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-bold rounded-xl shadow-sm transition-all text-xs cursor-pointer"
                    >
                      {modalMode === 'add' ? 'Simpan Anggota' : 'Perbarui Data'}
                    </button>
                  </div>
                </form>

              </div>
            </div>
          )}

          {/* CRUD Modal for Rombongan */}
          {isRomModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                    {romModalMode === 'add' ? 'Tambah Rombongan Baru' : 'Kelola Rombongan'}
                  </h3>
                  <button
                    onClick={() => setIsRomModalOpen(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-6 space-y-6">
                  {/* Form to change group name */}
                  <form onSubmit={handleSubmitRombongan} className="space-y-4">
                    <div className="flex flex-col text-left">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nama Rombongan</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Contoh: Rombongan 8"
                          value={romFormNama}
                          onChange={(e) => setRomFormNama(e.target.value)}
                          className="flex-1 px-4 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm font-bold text-slate-850 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-[#f95713] transition-all"
                          required
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#f95713] text-white font-bold rounded-xl text-xs hover:bg-orange-600 transition-colors cursor-pointer"
                        >
                          Simpan
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Member list and management (Only in edit mode) */}
                  {romModalMode === 'edit' && (
                    <div className="space-y-4 text-left border-t border-slate-100 pt-4">
                      
                      {/* Current members list */}
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Daftar Anggota Kelompok</label>
                        
                        <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-3 max-h-44 overflow-y-auto space-y-2">
                          {anggotaList.filter(a => a.rombonganId === romCurrentId).length === 0 ? (
                            <div className="text-xs text-slate-400 font-medium py-6 text-center">
                              Belum ada anggota di rombongan ini.
                            </div>
                          ) : (
                            anggotaList.filter(a => a.rombonganId === romCurrentId).map(member => (
                              <div key={member.id} className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-100/50 shadow-xs">
                                <div className="flex items-center gap-2">
                                  <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${getAvatarBg(member.nama)} text-white font-bold text-[10px] flex items-center justify-center`}>
                                    {getInitials(member.nama)}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-850">{member.nama}</span>
                                    <span className="text-[9px] text-slate-400 font-semibold">{member.noRumah}</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMemberFromGroup(member)}
                                  className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-650 rounded-lg transition-colors cursor-pointer"
                                  title="Keluarkan dari Rombongan"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Add unassigned member form */}
                      <div className="border-t border-slate-100 pt-4 space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tambah Warga ke Kelompok</label>
                        
                        <div className="flex gap-2">
                          <select
                            value={selectedUnassignedMemberId}
                            onChange={(e) => setSelectedUnassignedMemberId(e.target.value)}
                            className="flex-1 px-3 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                          >
                            <option value="none">Pilih Warga (Aktif & Belum Berkelompok)...</option>
                            {anggotaList
                              .filter(a => a.statusAktif && !a.rombonganId)
                              .map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.nama} ({m.noRumah})
                                </option>
                              ))
                            }
                          </select>
                          <button
                            type="button"
                            onClick={handleAddMemberToGroup}
                            className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Batal Close Button */}
                  <div className="flex items-center justify-end pt-4 border-t border-slate-100 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsRomModalOpen(false)}
                      className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                    >
                      Tutup
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
        {/* Mobile Navigation Bar */}
        <MobileNavBar />
      </div>
    </div>
  );
}
