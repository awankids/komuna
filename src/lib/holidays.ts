export interface IndonesianHoliday {
  date: string; // YYYY-MM-DD
  name: string;
  isNationalHoliday: boolean; // Tanggal Merah resmi
  isCutiBersama?: boolean;
}

// Data Resmi Hari Libur Nasional & Cuti Bersama Indonesia (2024 - 2027)
const HOLIDAYS_DATA: IndonesianHoliday[] = [
  // --- 2025 ---
  { date: '2025-01-01', name: 'Tahun Baru 2025 Masehi', isNationalHoliday: true },
  { date: '2025-01-27', name: 'Isra Mikraj Nabi Muhammad SAW', isNationalHoliday: true },
  { date: '2025-01-29', name: 'Tahun Baru Imlek 2576 Kongzili', isNationalHoliday: true },
  { date: '2025-03-29', name: 'Hari Suci Nyepi (Tahun Baru Saka 1947)', isNationalHoliday: true },
  { date: '2025-03-31', name: 'Hari Raya Idul Fitri 1446 Hijriah', isNationalHoliday: true },
  { date: '2025-04-01', name: 'Hari Raya Idul Fitri 1446 Hijriah', isNationalHoliday: true },
  { date: '2025-04-18', name: 'Wafat Yesus Kristus (Jumat Agung)', isNationalHoliday: true },
  { date: '2025-05-01', name: 'Hari Buruh Internasional', isNationalHoliday: true },
  { date: '2025-05-12', name: 'Hari Raya Waisak 2569 BE', isNationalHoliday: true },
  { date: '2025-05-29', name: 'Kenaikan Yesus Kristus', isNationalHoliday: true },
  { date: '2025-06-01', name: 'Hari Lahir Pancasila', isNationalHoliday: true },
  { date: '2025-06-06', name: 'Hari Raya Idul Adha 1446 Hijriah', isNationalHoliday: true },
  { date: '2025-06-27', name: 'Tahun Baru Islam 1447 Hijriah', isNationalHoliday: true },
  { date: '2025-08-17', name: 'Hari Kemerdekaan Republik Indonesia', isNationalHoliday: true },
  { date: '2025-09-05', name: 'Maulid Nabi Muhammad SAW', isNationalHoliday: true },
  { date: '2025-12-25', name: 'Hari Raya Natal', isNationalHoliday: true },

  // --- 2026 ---
  { date: '2026-01-01', name: 'Tahun Baru 2026 Masehi', isNationalHoliday: true },
  { date: '2026-01-16', name: 'Isra Mikraj Nabi Muhammad SAW', isNationalHoliday: true },
  { date: '2026-02-17', name: 'Tahun Baru Imlek 2577 Kongzili', isNationalHoliday: true },
  { date: '2026-03-19', name: 'Hari Suci Nyepi (Tahun Baru Saka 1948)', isNationalHoliday: true },
  { date: '2026-03-20', name: 'Hari Raya Idul Fitri 1447 Hijriah', isNationalHoliday: true },
  { date: '2026-03-21', name: 'Hari Raya Idul Fitri 1447 Hijriah', isNationalHoliday: true },
  { date: '2026-04-03', name: 'Wafat Yesus Kristus (Jumat Agung)', isNationalHoliday: true },
  { date: '2026-05-01', name: 'Hari Buruh Internasional', isNationalHoliday: true },
  { date: '2026-05-14', name: 'Kenaikan Yesus Kristus', isNationalHoliday: true },
  { date: '2026-05-27', name: 'Hari Raya Idul Adha 1447 Hijriah', isNationalHoliday: true },
  { date: '2026-05-31', name: 'Hari Raya Waisak 2570 BE', isNationalHoliday: true },
  { date: '2026-06-01', name: 'Hari Lahir Pancasila', isNationalHoliday: true },
  { date: '2026-06-16', name: 'Tahun Baru Islam 1448 Hijriah', isNationalHoliday: true },
  { date: '2026-08-17', name: 'Hari Kemerdekaan Republik Indonesia (17 Agustus)', isNationalHoliday: true },
  { date: '2026-08-25', name: 'Maulid Nabi Muhammad SAW', isNationalHoliday: true },
  { date: '2026-12-25', name: 'Hari Raya Natal', isNationalHoliday: true },

  // --- 2027 ---
  { date: '2027-01-01', name: 'Tahun Baru 2027 Masehi', isNationalHoliday: true },
  { date: '2027-02-06', name: 'Tahun Baru Imlek 2578 Kongzili', isNationalHoliday: true },
  { date: '2027-03-09', name: 'Hari Raya Idul Fitri 1448 Hijriah', isNationalHoliday: true },
  { date: '2027-03-10', name: 'Hari Raya Idul Fitri 1448 Hijriah', isNationalHoliday: true },
  { date: '2027-03-26', name: 'Wafat Yesus Kristus (Jumat Agung)', isNationalHoliday: true },
  { date: '2027-05-01', name: 'Hari Buruh Internasional', isNationalHoliday: true },
  { date: '2027-05-06', name: 'Kenaikan Yesus Kristus', isNationalHoliday: true },
  { date: '2027-05-16', name: 'Hari Raya Idul Adha 1448 Hijriah', isNationalHoliday: true },
  { date: '2027-05-20', name: 'Hari Raya Waisak 2571 BE', isNationalHoliday: true },
  { date: '2027-06-01', name: 'Hari Lahir Pancasila', isNationalHoliday: true },
  { date: '2027-06-06', name: 'Tahun Baru Islam 1449 Hijriah', isNationalHoliday: true },
  { date: '2027-08-15', name: 'Maulid Nabi Muhammad SAW', isNationalHoliday: true },
  { date: '2027-08-17', name: 'Hari Kemerdekaan Republik Indonesia', isNationalHoliday: true },
  { date: '2027-12-25', name: 'Hari Raya Natal', isNationalHoliday: true },
];

// Hari Besar Nasional Non-Libur (Observances)
const OBSERVANCES_DATA: { [mmdd: string]: string } = {
  '01-25': 'Hari Gizi Nasional',
  '02-09': 'Hari Pers Nasional',
  '03-09': 'Hari Musik Nasional',
  '04-21': 'Hari Kartini',
  '04-22': 'Hari Bumi',
  '05-02': 'Hari Pendidikan Nasional (Hardiknas)',
  '05-20': 'Hari Kebangkitan Nasional (Harkitnas)',
  '07-23': 'Hari Anak Nasional',
  '09-09': 'Hari Olahraga Nasional (Haornas)',
  '09-28': 'Hari Kereta Api Nasional',
  '10-01': 'Hari Kesaktian Pancasila',
  '10-02': 'Hari Batik Nasional',
  '10-05': 'Hari TNI',
  '10-28': 'Hari Sumpah Pemuda',
  '11-10': 'Hari Pahlawan',
  '11-25': 'Hari Guru Nasional',
  '12-22': 'Hari Ibu',
};

/**
 * Get Indonesian National Holiday or Observance for a given YYYY-MM-DD date string
 */
export function getIndonesianHoliday(dateStr: string): {
  isRedDate: boolean;
  name: string;
  type: 'national' | 'observance';
} | null {
  if (!dateStr) return null;
  const cleanDate = dateStr.split('T')[0];

  // 1. Check official national holidays
  const holiday = HOLIDAYS_DATA.find(h => h.date === cleanDate);
  if (holiday) {
    return {
      isRedDate: true,
      name: holiday.name,
      type: 'national'
    };
  }

  // 2. Check Hari Minggu (Sunday is always a red date in Indonesia)
  const dParts = cleanDate.split('-').map(Number);
  if (dParts.length === 3) {
    const dObj = new Date(Date.UTC(dParts[0], dParts[1] - 1, dParts[2]));
    if (dObj.getUTCDay() === 0) { // Sunday
      const mmdd = `${String(dParts[1]).padStart(2, '0')}-${String(dParts[2]).padStart(2, '0')}`;
      const obsName = OBSERVANCES_DATA[mmdd];
      return {
        isRedDate: true,
        name: obsName || 'Hari Minggu',
        type: 'national'
      };
    }
  }

  // 3. Check fixed national observances
  if (dParts.length === 3) {
    const mmdd = `${String(dParts[1]).padStart(2, '0')}-${String(dParts[2]).padStart(2, '0')}`;
    const obsName = OBSERVANCES_DATA[mmdd];
    if (obsName) {
      return {
        isRedDate: false,
        name: obsName,
        type: 'observance'
      };
    }
  }

  return null;
}
