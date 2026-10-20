import { db } from './db';
import { DEFAULT_LANDING_DATA, LandingPageData } from './landing-defaults';

/**
 * Membaca konten CMS Landing Page secara terisolasi.
 * Mengambil dari tabel terisolasi PlatformCms dengan fallback aman ke DEFAULT_LANDING_DATA.
 * SAMA SEKALI tidak menyentuh tabel operasional warga RT (User, Transaksi, Jimpitan, dll).
 */
export async function getCmsData(): Promise<LandingPageData> {
  try {
    if (db && (db as any).platformCms) {
      const row = await (db as any).platformCms.findUnique({
        where: { id: 'global' },
      });

      if (row?.content) {
        const parsed = JSON.parse(row.content);
        if (parsed && typeof parsed === 'object') {
          return {
            hero: { ...DEFAULT_LANDING_DATA.hero, ...parsed.hero },
            features: Array.isArray(parsed.features) && parsed.features.length > 0 ? parsed.features : DEFAULT_LANDING_DATA.features,
            stepsSection: { ...DEFAULT_LANDING_DATA.stepsSection, ...parsed.stepsSection },
            statsTrust: { ...DEFAULT_LANDING_DATA.statsTrust, ...parsed.statsTrust },
            testimonials: Array.isArray(parsed.testimonials) && parsed.testimonials.length > 0 ? parsed.testimonials : DEFAULT_LANDING_DATA.testimonials,
            faqs: Array.isArray(parsed.faqs) && parsed.faqs.length > 0 ? parsed.faqs : DEFAULT_LANDING_DATA.faqs,
            bottomCta: { ...DEFAULT_LANDING_DATA.bottomCta, ...parsed.bottomCta },
            footer: { ...DEFAULT_LANDING_DATA.footer, ...parsed.footer },
          };
        }
      }
    }
  } catch (error) {
    console.warn('CMS read error, falling back to safe defaults:', error);
  }

  return DEFAULT_LANDING_DATA;
}

/**
 * Menyimpan data perubahan CMS Landing Page secara persisten ke database (kompatibel Vercel Serverless).
 * Menggunakan upsert database sehingga TIDAK AKAN PERNAH memicu error ENOENT / EROFS pada filesystem serverless.
 */
export async function saveCmsData(
  payload: Partial<LandingPageData>,
  updatedBy: string = 'Platform Super Admin'
): Promise<{ success: boolean; data?: LandingPageData; error?: string }> {
  try {
    const current = await getCmsData();

    const merged: LandingPageData = {
      hero: payload.hero ? { ...current.hero, ...payload.hero } : current.hero,
      features: payload.features && Array.isArray(payload.features) ? payload.features : current.features,
      stepsSection: payload.stepsSection ? { ...current.stepsSection, ...payload.stepsSection } : current.stepsSection,
      statsTrust: payload.statsTrust ? { ...current.statsTrust, ...payload.statsTrust } : current.statsTrust,
      testimonials: payload.testimonials && Array.isArray(payload.testimonials) ? payload.testimonials : current.testimonials,
      faqs: payload.faqs && Array.isArray(payload.faqs) ? payload.faqs : current.faqs,
      bottomCta: payload.bottomCta ? { ...current.bottomCta, ...payload.bottomCta } : current.bottomCta,
      footer: payload.footer ? { ...current.footer, ...payload.footer } : current.footer,
    };

    if (db && (db as any).platformCms) {
      await (db as any).platformCms.upsert({
        where: { id: 'global' },
        create: {
          id: 'global',
          content: JSON.stringify(merged),
          updatedBy,
        },
        update: {
          content: JSON.stringify(merged),
          updatedBy,
        },
      });

      return { success: true, data: merged };
    }

    return { success: false, error: 'Database CMS belum siap' };
  } catch (error: any) {
    console.error('Failed to save CMS data to database:', error);
    return { success: false, error: error?.message || 'Gagal menyimpan data CMS' };
  }
}

/**
 * Me-reset konten CMS Landing Page kembali ke default mockup.
 */
export async function resetCmsData(): Promise<LandingPageData> {
  try {
    if (db && (db as any).platformCms) {
      await (db as any).platformCms.deleteMany({
        where: { id: 'global' },
      });
    }
  } catch (error) {
    console.error('Failed to reset CMS data:', error);
  }
  return DEFAULT_LANDING_DATA;
}
