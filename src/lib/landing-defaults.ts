export interface HeroData {
  badge: string;
  headlineMain: string;
  headlineHighlight: string;
  subheadline: string;
  ctaPrimaryText: string;
  ctaPrimaryLink: string;
  ctaSecondaryText: string;
  ctaSecondaryLink: string;
  socialProofText: string;
  floatingBadge1: string;
  floatingBadge2: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: string; // 'Wallet' | 'Coins' | 'FileText' | 'Users' | 'Bell' | 'Smartphone' | 'Shield' | 'Sparkles'
  theme: string; // 'emerald' | 'purple' | 'amber' | 'blue' | 'rose' | 'indigo'
}

export interface StepItem {
  number: number;
  title: string;
  description: string;
  icon: string;
}

export interface StepsSectionData {
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  steps: StepItem[];
}

export interface StatItem {
  id: string;
  value: string;
  label: string;
  icon: string; // 'Users' | 'Shield' | 'Zap' | 'Star'
}

export interface StatsTrustData {
  badge: string;
  title: string;
  description: string;
  stats: StatItem[];
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  rating: number;
  quote: string;
  avatarColor: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface BottomCtaData {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
}

export interface FooterData {
  appName: string;
  tagline: string;
  copyright: string;
  waNumber: string;
  igUrl: string;
  ytUrl: string;
}

export interface LandingPageData {
  hero: HeroData;
  features: FeatureItem[];
  stepsSection: StepsSectionData;
  statsTrust: StatsTrustData;
  testimonials: TestimonialItem[];
  faqs: FaqItem[];
  bottomCta: BottomCtaData;
  footer: FooterData;
}

export const DEFAULT_LANDING_DATA: LandingPageData = {
  hero: {
    badge: 'Sistem Operasional RT Terpadu',
    headlineMain: 'Portal Operasional &',
    headlineHighlight: 'Transparansi Warga RT',
    subheadline:
      'Kelola pencatatan jimpitan harian, keuangan kas RT, jadwal ronda siskamling, dan penerbitan surat pengantar secara terpadu, transparan, dan akuntabel.',
    ctaPrimaryText: 'Mulai Sekarang — Gratis',
    ctaPrimaryLink: '/daftar',
    ctaSecondaryText: 'Coba Demo Interaktif',
    ctaSecondaryLink: '/demo',
    socialProofText: 'Dipercaya oleh 1.200+ RT di seluruh Indonesia',
    floatingBadge1: 'Kas Real-Time & Transparan',
    floatingBadge2: 'Surat Ber-QR Jadi dlm 2 Menit',
  },
  features: [
    {
      id: 'f1',
      title: 'Jimpitan & Kas Digital',
      description: 'Catat setoran harian cepat, rekap otomatis real-time, dan cetak LPJ siap saji untuk transparansi warga.',
      icon: 'Coins',
      theme: 'orange',
    },
    {
      id: 'f2',
      title: 'Gotong Royong & Ronda',
      description: 'Jadwal rombongan piket transparan, absensi ronda, dan notifikasi pengingat warga terpusat.',
      icon: 'Shield',
      theme: 'blue',
    },
    {
      id: 'f3',
      title: 'Aman & Terkontrol',
      description: 'Proteksi password salted scrypt dengan hak akses bertingkat untuk pengurus, bendahara, dan warga.',
      icon: 'Users',
      theme: 'emerald',
    },
    {
      id: 'f4',
      title: 'Inventaris & Surat',
      description: 'Kelola peminjaman barang RT dan penerbitan surat pengantar resmi lengkap dengan QR code terverifikasi.',
      icon: 'FileText',
      theme: 'purple',
    },
    {
      id: 'f5',
      title: 'Arisan Warga Digital',
      description: 'Kocokan roda putar arisan digital transparan di HP atau layar rapat RT. Adil, terbuka, tanpa prasangka.',
      icon: 'Sparkles',
      theme: 'amber',
    },
    {
      id: 'f6',
      title: 'Kas & Laporan Keuangan',
      description: 'Buku kas digital dengan rekap penerimaan dan pengeluaran yang dapat dipantau bersama setiap saat.',
      icon: 'Wallet',
      theme: 'indigo',
    },
  ],
  stepsSection: {
    badge: 'Alur Cepat & Praktis',
    title: '3 Langkah Memulai Komuna di Lingkungan RT Anda',
    subtitle: 'Didesain ramah pengguna dan ringan di segala tipe smartphone, cocok untuk semua kalangan warga.',
    ctaText: 'Pelajari Selengkapnya →',
    ctaLink: '#layanan',
    steps: [
      {
        number: 1,
        title: 'Daftarkan RT Anda',
        description: 'Isi nama RT dan nomor RW Anda dalam 1 menit tanpa syarat berbelit-belit.',
        icon: 'Smartphone',
      },
      {
        number: 2,
        title: 'Undang Pengurus & Warga',
        description: 'Bagikan tautan pendaftaran warga langsung ke grup WhatsApp RT dalam hitungan detik.',
        icon: 'Users',
      },
      {
        number: 3,
        title: 'Operasional Berjalan Tertib',
        description: 'Kas tercatat rapi, iuran lancar, surat jadi cepat, dan warga semakin guyub kompak.',
        icon: 'Rocket',
      },
    ],
  },
  statsTrust: {
    badge: 'Kenapa Pilih Komuna?',
    title: 'Bikin Warga Tenang, Pengurus Senang',
    description: 'Tinggalkan buku tulis lusuh yang mudah hilang. Beralih ke sistem gotong-royong digital yang ramah dan transparan.',
    stats: [
      {
        id: 's1',
        value: '1.200+',
        label: 'RT & RW Terdaftar',
        icon: 'Users',
      },
      {
        id: 's2',
        value: '100%',
        label: 'Kas Terbuka & Bebas Curiga',
        icon: 'Shield',
      },
      {
        id: 's3',
        value: '0 Kertas',
        label: 'Surat & Tanda Terima Digital',
        icon: 'Zap',
      },
      {
        id: 's4',
        value: '4,9/5',
        label: 'Tingkat Kepuasan Warga',
        icon: 'Star',
      },
    ],
  },
  testimonials: [
    {
      id: 't1',
      name: 'Pak Bambang Suherman',
      role: 'Ketua RT 04 Sukamaju, Depok',
      rating: 5,
      quote:
        'Dulu tiap akhir bulan pusing bikin laporan kas di buku tulis. Sekarang tinggal klik, laporan PDF transparan siap dibagikan ke grup WA warga!',
      avatarColor: 'bg-emerald-600',
    },
    {
      id: 't2',
      name: 'Ibu Ratna Dewi',
      role: 'Bendahara RT 02, Bandung',
      rating: 5,
      quote:
        'Warga gak ada yang curiga lagi soal saldo kas. Semua bisa cek kas dan pemasukan jimpitan secara transparan dari HP masing-masing.',
      avatarColor: 'bg-amber-600',
    },
    {
      id: 't3',
      name: 'Kang Asep Gunawan',
      role: 'Petugas Ronda Malam, Bogor',
      rating: 5,
      quote:
        'Input jimpitan waktu keliling siskamling malam gampang banget lewat HP. Gak perlu lagi bawa buku catatan kecil yang sering basah kena hujan.',
      avatarColor: 'bg-blue-600',
    },
  ],
  faqs: [
    {
      id: 'faq1',
      question: 'Apakah aplikasi Komuna gratis digunakan untuk RT kami?',
      answer:
        'Ya, 100% gratis! Fitur pencatatan kas, jimpitan ronda harian, dan data warga dapat digunakan secara cuma-cuma tanpa biaya tersembunyi.',
    },
    {
      id: 'faq2',
      question: 'Apakah bapak-ibu warga yang sudah sepuh (lansia) bisa menggunakannya?',
      answer:
        'Sangat mudah! Tampilan Komuna didesain dengan tombol besar, tulisan jelas, dan alur sederhana seperti aplikasi pesan instan WhatsApp.',
    },
    {
      id: 'faq3',
      question: 'Apakah harus mengunduh aplikasi dari Google Play Store?',
      answer:
        'Tidak wajib! Komuna adalah Progressive Web App (PWA) modern yang sangat ringan. Cukup buka di browser HP dan tekan "Tambah ke Layar Utama". Memori HP tetap lega.',
    },
    {
      id: 'faq4',
      question: 'Bagaimana jika petugas ronda keliling di area yang susah sinyal?',
      answer:
        'Komuna dilengkapi teknologi offline-first. Petugas tetap bisa mencatat jimpitan saat keliling, dan data akan otomatis tersinkronisasi saat tersambung internet kembali.',
    },
  ],
  bottomCta: {
    title: 'Waktunya Bikin RT Anda Makin Guyub & Modern!',
    subtitle: 'Bergabunglah bersama ribuan pengurus RT lainnya. Coba gratis sekarang tanpa syarat rumit.',
    buttonText: 'Daftarkan RT Saya Sekarang',
    buttonLink: '/daftar',
  },
  footer: {
    appName: 'komuna.id',
    tagline: 'Super-App Gotong Royong Warga RT/RW',
    copyright: '© 2026 Komuna.id. Platform Digital Gotong Royong Indonesia.',
    waNumber: '6281234567890',
    igUrl: 'https://instagram.com/komuna.id',
    ytUrl: 'https://youtube.com/@komuna',
  },
};
