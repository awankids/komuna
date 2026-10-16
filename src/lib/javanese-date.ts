// Helper Penentuan Hari & Pasaran Jawa (Weton) yang diselaraskan 100% dengan Kalender Agenda RT

export const PASARAN_LIST = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'] as const;
export type PasaranType = typeof PASARAN_LIST[number];

export const HARI_LIST = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const;
export type HariType = typeof HARI_LIST[number];

// Daftar kombinasi populer untuk kompatibilitas
export const POPULAR_HARI_JAWA_OPTIONS = [
  'Minggu Pon',
  'Minggu Wage',
  'Minggu Kliwon',
  'Minggu Legi',
  'Minggu Pahing',
  'Jumat Kliwon',
  'Jumat Legi',
  'Jumat Pon',
  'Jumat Wage',
  'Jumat Pahing',
  'Sabtu Kliwon',
  'Sabtu Wage',
  'Sabtu Legi',
  'Sabtu Pahing',
  'Sabtu Pon',
  'Senin Legi',
  'Senin Pon',
  'Kamis Wage',
  'Kamis Pahing',
  'Rabu Pon',
];

/**
 * Menghitung Pasaran Jawa persis sesuai algoritma Kalender Agenda RT
 * Referensi: 17 Agustus 1945 = Legi
 */
export function getPasaran(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '';
  const dateStr =
    typeof dateInput === 'string'
      ? dateInput.split('T')[0]
      : dateInput.toISOString().split('T')[0];

  const pasaranNames = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'];
  const reference = new Date(Date.UTC(1945, 7, 17)); // Aug 17, 1945 = Legi
  const date = new Date(`${dateStr}T00:00:00Z`);
  const diffDays = Math.floor((date.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24));
  const index = ((diffDays % 5) + 5) % 5;
  return pasaranNames[index];
}

/**
 * Menghitung Hari Jawa (Nama Hari + Pasaran) persis seperti pada Kalender Agenda RT
 * Contoh: "Minggu Pon", "Jumat Legi", "Sabtu Kliwon"
 */
export function getHariJawa(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '';
  const dateStr =
    typeof dateInput === 'string'
      ? dateInput.split('T')[0]
      : dateInput.toISOString().split('T')[0];

  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return '';
  const [y, m, d] = parts;
  const localDate = new Date(y, m - 1, d);
  const dayName = HARI_LIST[localDate.getDay()];
  const pasaran = getPasaran(dateStr);
  return `${dayName} ${pasaran}`;
}

/**
 * Info Weton lengkap untuk komponen arisan & agenda
 */
export function getWeton(dateInput: Date | string | null | undefined): {
  dayName: string;
  pasaran: string;
  hariJawa: string;
  wetonMasehi: string;
  malamWeton: string;
  displayLabel: string;
} {
  if (!dateInput) {
    return {
      dayName: '',
      pasaran: '',
      hariJawa: '',
      wetonMasehi: '',
      malamWeton: '',
      displayLabel: '',
    };
  }

  const hariJawa = getHariJawa(dateInput);
  const pasaran = getPasaran(dateInput);
  const dateStr =
    typeof dateInput === 'string'
      ? dateInput.split('T')[0]
      : dateInput.toISOString().split('T')[0];
  const parts = dateStr.split('-').map(Number);
  const dayName = parts.length === 3 ? HARI_LIST[new Date(parts[0], parts[1] - 1, parts[2]).getDay()] : '';

  return {
    dayName,
    pasaran,
    hariJawa,
    wetonMasehi: hariJawa,
    malamWeton: `Malam ${hariJawa}`,
    displayLabel: hariJawa,
  };
}

/**
 * Mencari tanggal berikutnya yang memiliki Hari Jawa tertentu sesuai Kalender Agenda RT
 * Siklus Selapanan = 35 hari
 */
export function findNextWetonDate(targetHariJawa: string, fromDate: Date = new Date()): Date {
  if (!targetHariJawa) {
    const fallback = new Date(fromDate);
    fallback.setDate(fallback.getDate() + 35);
    return fallback;
  }

  // Bersihkan kata "Malam" jika ada untuk pencocokan ke nama hari kalender RT
  const cleanTarget = targetHariJawa
    .replace(/^malam\s+/i, '')
    .trim()
    .toLowerCase();

  const start = new Date(fromDate);
  start.setHours(12, 0, 0, 0); // gunakan midday agar aman dari offset timezone

  // Scan hingga 35 hari ke depan (siklus selapanan penuh)
  for (let i = 0; i <= 35; i++) {
    const candidate = new Date(start);
    candidate.setDate(start.getDate() + i);
    const hj = getHariJawa(candidate).toLowerCase();

    if (hj === cleanTarget || cleanTarget.includes(hj) || hj.includes(cleanTarget)) {
      return candidate;
    }
  }

  // Fallback 35 hari ke depan
  const fallback = new Date(fromDate);
  fallback.setDate(fallback.getDate() + 35);
  return fallback;
}
