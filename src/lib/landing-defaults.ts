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
  icon: string; // 'Wallet' | 'Coins' | 'FileText' | 'Users' | 'Bell' | 'Smartphone'
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
    badge: 'Solusi Digital untuk RT/RW',
    headlineMain: 'Kelola Kegiatan RT',
    headlineHighlight: 'Jadi Lebih Mudah',
    subheadline:
      'Komuna.id membantu pengurus RT mengelola administrasi, iuran, kas, laporan, dan komunikasi warga dalam satu aplikasi yang sederhana dan mudah digunakan.',
    ctaPrimaryText: 'Mulai Sekarang',
    ctaPrimaryLink: '/daftar',
    ctaSecondaryText: 'Lihat Demo',
    ctaSecondaryLink: '/demo',
    socialProofText: 'Sudah digunakan oleh 1.200+ RT di seluruh Indonesia',
    floatingBadge1: 'Transparan dan Akuntabel',
    floatingBadge2: 'Akses di mana saja',
  },
  features: [
    {
      id: 'f1',
      title: 'Kelola Kas RT',
      description: 'Catat pemasukan, pengeluaran dan saldo kas dengan mudah.',
      icon: 'Wallet',
      theme: 'emerald',
    },
    {
      id: 'f2',
      title: 'Iuran & Jimpitan',
      description: 'Kelola iuran warga, jimpitan, dan kegiatan sosial lainnya.',
      icon: 'Coins',
      theme: 'purple',
    },
    {
      id: 'f3',
      title: 'Laporan Keuangan',
      description: 'Dapatkan laporan otomatis dalam format PDF kapan saja.',
      icon: 'FileText',
      theme: 'amber',
    },
    {
      id: 'f4',
      title: 'Data Warga',
      description: 'Simpan data warga dan riwayat transaksi dengan aman.',
      icon: 'Users',
      theme: 'blue',
    },
    {
      id: 'f5',
      title: 'Notifikasi',
      description: 'Ingatkan jatuh tempo iuran dan pengumuman penting.',
      icon: 'Bell',
      theme: 'rose',
    },
    {
      id: 'f6',
      title: 'Akses Mobile',
      description: 'Bisa digunakan di smartphone maupun tablet.',
      icon: 'Smartphone',
      theme: 'indigo',
    },
  ],
  stepsSection: {
    badge: 'Cara Kerja',
    title: 'Mudah digunakan, hanya 3 langkah',
    subtitle: 'Daftar, atur data RT, dan mulai kelola kegiatan dengan praktis.',
    ctaText: 'Lihat Fitur Lengkap →',
    ctaLink: '#fitur',
    steps: [
      {
        number: 1,
        title: 'Daftar Akun',
        description: 'Buat akun dengan mudah menggunakan nomor HP yang aktif.',
        icon: 'Smartphone',
      },
      {
        number: 2,
        title: 'Atur Data RT',
        description: 'Masukkan informasi warga, kas, iuran, dan kegiatan RT sesuai kebutuhan.',
        icon: 'Users',
      },
      {
        number: 3,
        title: 'Mulai Kelola',
        description: 'Nikmati kemudahan mengelola RT dengan fitur lengkap dan praktis.',
        icon: 'Rocket',
      },
    ],
  },
  statsTrust: {
    badge: 'Dipercaya oleh Warga',
    title: 'RT Anda Lebih Maju Bersama Komuna.id',
    description: 'Ratusan RT di seluruh Indonesia sudah merasakan manfaatnya. Sekarang giliran RT Anda!',
    stats: [
      {
        id: 's1',
        value: '1.200+',
        label: 'RT Aktif',
        icon: 'Users',
      },
      {
        id: 's2',
        value: '99,9%',
        label: 'Data Aman',
        icon: 'Shield',
      },
      {
        id: 's3',
        value: '24/7',
        label: 'Akses Kapan Saja',
        icon: 'Zap',
      },
      {
        id: 's4',
        value: '4,8/5',
        label: 'Rating Pengguna',
        icon: 'Star',
      },
    ],
  },
  testimonials: [
    {
      id: 't1',
      name: 'Budi Santoso',
      role: 'Ketua RT 03',
      rating: 5,
      quote:
        'Aplikasi ini sangat membantu saya dalam mengelola administrasi RT. Semua jadi lebih rapi dan transparan.',
      avatarColor: 'bg-emerald-600',
    },
    {
      id: 't2',
      name: 'Siti Aisyah',
      role: 'Bendahara RT',
      rating: 5,
      quote:
        'Laporan keuangan bisa langsung dibuat dan diunduh dalam bentuk PDF. Praktis dan mudah digunakan.',
      avatarColor: 'bg-amber-600',
    },
    {
      id: 't3',
      name: 'Ahmad Fauzi',
      role: 'Warga RT',
      rating: 5,
      quote:
        'Sekarang saya bisa cek iuran dan kegiatan RT dengan mudah. Fiturnya lengkap dan tampilannya juga simpel.',
      avatarColor: 'bg-blue-600',
    },
  ],
  faqs: [
    {
      id: 'faq1',
      question: 'Apakah aplikasi Komuna.id gratis digunakan?',
      answer:
        'Ya, Komuna.id menyediakan paket gratis untuk kebutuhan dasar pencatatan jimpitan, kas warga, dan data warga dengan fitur lengkap.',
    },
    {
      id: 'faq2',
      question: 'Bagaimana warga bisa melihat saldo kas dan jadwal ronda?',
      answer:
        'Warga dapat login menggunakan nomor HP mereka untuk melihat transparansi saldo kas RT, jadwal ronda malam, dan riwayat iuran jimpitan keluarga mereka secara mandiri.',
    },
    {
      id: 'faq3',
      question: 'Apakah harus mengunduh aplikasi dari Play Store?',
      answer:
        'Komuna.id adalah Progressive Web App (PWA) modern. Anda dapat langsung membuka web dan menekan tombol "Tambah ke Layar Utama" tanpa memakan memori HP yang besar.',
    },
    {
      id: 'faq4',
      question: 'Apakah data kependudukan warga kami aman?',
      answer:
        'Tentu. Seluruh data dienkripsi, terisolasi per wilayah RT (multi-tenant), dan dilindungi oleh otentikasi ketat berstandar keamanan industri modern.',
    },
  ],
  bottomCta: {
    title: 'Siap untuk mengelola RT Anda secara lebih mudah?',
    subtitle: 'Bergabunglah bersama ribuan RT lainnya di seluruh Indonesia.',
    buttonText: 'Daftar Sekarang',
    buttonLink: '/daftar',
  },
  footer: {
    appName: 'komuna.id',
    tagline: 'Kebersamaan, Terpadu, Transparan',
    copyright: '© 2026 Komuna.id. Hak cipta dilindungi undang-undang.',
    waNumber: '6281234567890',
    igUrl: 'https://instagram.com/komuna.id',
    ytUrl: 'https://youtube.com/@komuna',
  },
};
