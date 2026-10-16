// Helper Penentuan Hari & Pasaran Jawa (Weton) dan Kalender Selapanan RT

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

// 1 Jan 1970 UTC was Kamis Wage.
// In our array index matching: 
// [Wage, Kliwon, Legi, Pahing, Pon]
const PASARAN_EPOCH_OFFSET = 0;
const PASARAN_CYCLE = ['Wage', 'Kliwon', 'Legi', 'Pahing', 'Pon'] as const;

export const POPULAR_HARI_JAWA_OPTIONS = [
  'Malam Minggu Pon',
  'Malam Minggu Wage',
  'Malam Minggu Kliwon',
  'Malam Minggu Legi',
  'Malam Minggu Pahing',
  'Malam Jumat Kliwon',
  'Malam Jumat Pon',
  'Malam Jumat Wage',
  'Malam Jumat Legi',
  'Malam Jumat Pahing',
  'Malam Sabtu Kliwon',
  'Malam Sabtu Wage',
  'Malam Senin Pon',
  'Malam Kamis Pahing',
  'Minggu Pon',
  'Minggu Pahing',
  'Minggu Wage',
  'Minggu Kliwon',
  'Sabtu Kliwon',
  'Sabtu Wage',
  'Jumat Kliwon',
  'Senin Legi',
  'Rabu Pon',
];

/**
 * Menghitung Pasaran & Weton dari tanggal Masehi
 */
export function getWeton(inputDate: Date | string): {
  dayName: string;
  pasaran: string;
  wetonMasehi: string; // e.g. "Sabtu Pahing"
  malamWeton: string;  // e.g. "Malam Minggu Pon" (karena malam hari dimulai maghrib)
  displayLabel: string;
} {
  const d = new Date(inputDate);
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();

  // UTC midnight for accurate day difference
  const utcDate = Date.UTC(year, month, day);
  const daysSinceEpoch = Math.floor(utcDate / 86400000);

  const pasaranIndex = ((daysSinceEpoch % 5) + 5) % 5;
  const pasaran = PASARAN_CYCLE[pasaranIndex];
  const dayIndex = d.getDay();
  const dayName = HARI_LIST[dayIndex];

  // Malam Minggu adalah Sabtu malam (menjelang Minggu)
  // Malam hari Jawa berikutnya:
  const nextDayIndex = (dayIndex + 1) % 7;
  const nextPasaranIndex = (pasaranIndex + 1) % 5;
  const nextDayName = HARI_LIST[nextDayIndex];
  const nextPasaran = PASARAN_CYCLE[nextPasaranIndex];

  const wetonMasehi = `${dayName} ${pasaran}`;
  const malamWeton = `Malam ${nextDayName} ${nextPasaran}`;

  return {
    dayName,
    pasaran,
    wetonMasehi,
    malamWeton,
    displayLabel: `${wetonMasehi} (${malamWeton})`,
  };
}

/**
 * Mencari tanggal Masehi terdekat berikutnya untuk Weton / Hari Jawa tertentu
 * Siklus Selapanan = 35 hari
 */
export function findNextWetonDate(wetonString: string, fromDate: Date = new Date()): Date {
  const target = wetonString.trim().toLowerCase();
  const start = new Date(fromDate);
  start.setHours(0, 0, 0, 0);

  // Scan up to 70 days forward (2 selapanan)
  for (let i = 0; i <= 70; i++) {
    const candidate = new Date(start);
    candidate.setDate(start.getDate() + i);

    const info = getWeton(candidate);
    
    // Check match for either direct weton or malam weton
    if (
      info.wetonMasehi.toLowerCase() === target ||
      info.malamWeton.toLowerCase() === target ||
      target.includes(info.wetonMasehi.toLowerCase()) ||
      target.includes(info.malamWeton.toLowerCase())
    ) {
      return candidate;
    }
  }

  // Fallback: return 30 days from now
  const fallback = new Date(fromDate);
  fallback.setDate(fallback.getDate() + 30);
  return fallback;
}
