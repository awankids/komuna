import fs from 'fs';
import path from 'path';
import { DEFAULT_LANDING_DATA, LandingPageData } from './landing-defaults';

const CMS_STORAGE_FILE = path.join(process.cwd(), 'data', 'cms-content.json');

/**
 * Membaca data CMS Landing Page secara terisolasi.
 * Sama sekali TIDAK menyentuh database operasional warga RT.
 */
export async function getCmsData(): Promise<LandingPageData> {
  try {
    if (fs.existsSync(CMS_STORAGE_FILE)) {
      const raw = fs.readFileSync(CMS_STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
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
  } catch (error) {
    console.warn('Failed to read isolated CMS file, using safe defaults:', error);
  }

  return DEFAULT_LANDING_DATA;
}

/**
 * Menyimpan data perubahan CMS Landing Page secara terisolasi.
 */
export async function saveCmsData(
  payload: Partial<LandingPageData>,
  updatedBy: string = 'Super Admin'
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

    const dir = path.dirname(CMS_STORAGE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const fileContent = JSON.stringify(
      {
        ...merged,
        _metadata: {
          updatedAt: new Date().toISOString(),
          updatedBy,
        },
      },
      null,
      2
    );

    fs.writeFileSync(CMS_STORAGE_FILE, fileContent, 'utf-8');

    return { success: true, data: merged };
  } catch (error: any) {
    console.error('Failed to save isolated CMS data:', error);
    return { success: false, error: error?.message || 'Gagal menyimpan data CMS' };
  }
}

/**
 * Me-reset konten CMS Landing Page kembali ke default mockup.
 */
export async function resetCmsData(): Promise<LandingPageData> {
  try {
    if (fs.existsSync(CMS_STORAGE_FILE)) {
      fs.unlinkSync(CMS_STORAGE_FILE);
    }
  } catch (error) {
    console.error('Failed to reset CMS file:', error);
  }
  return DEFAULT_LANDING_DATA;
}
