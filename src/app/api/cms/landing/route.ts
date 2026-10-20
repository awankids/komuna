import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth';
import { DEFAULT_LANDING_DATA, LandingPageData } from '@/lib/landing-defaults';

export async function GET() {
  try {
    if (!db || !(db as any).landingPageCms) {
      return NextResponse.json(DEFAULT_LANDING_DATA);
    }

    const cmsRow = await db.landingPageCms.findUnique({
      where: { id: 'global' },
    });

    if (!cmsRow) {
      return NextResponse.json(DEFAULT_LANDING_DATA);
    }

    // Merge database stored JSON with safe defaults
    const hero = cmsRow.heroData ? JSON.parse(cmsRow.heroData) : DEFAULT_LANDING_DATA.hero;
    const statsTrust = cmsRow.statsData ? JSON.parse(cmsRow.statsData) : DEFAULT_LANDING_DATA.statsTrust;
    const features = cmsRow.featuresData ? JSON.parse(cmsRow.featuresData) : DEFAULT_LANDING_DATA.features;
    const stepsSection = cmsRow.stepsData ? JSON.parse(cmsRow.stepsData) : DEFAULT_LANDING_DATA.stepsSection;
    const testimonials = cmsRow.testimonialsData ? JSON.parse(cmsRow.testimonialsData) : DEFAULT_LANDING_DATA.testimonials;
    const faqs = cmsRow.faqData ? JSON.parse(cmsRow.faqData) : DEFAULT_LANDING_DATA.faqs;
    const footer = cmsRow.footerData ? JSON.parse(cmsRow.footerData) : DEFAULT_LANDING_DATA.footer;

    const data: LandingPageData = {
      hero: { ...DEFAULT_LANDING_DATA.hero, ...hero },
      features: Array.isArray(features) && features.length > 0 ? features : DEFAULT_LANDING_DATA.features,
      stepsSection: { ...DEFAULT_LANDING_DATA.stepsSection, ...stepsSection },
      statsTrust: { ...DEFAULT_LANDING_DATA.statsTrust, ...statsTrust },
      testimonials: Array.isArray(testimonials) && testimonials.length > 0 ? testimonials : DEFAULT_LANDING_DATA.testimonials,
      faqs: Array.isArray(faqs) && faqs.length > 0 ? faqs : DEFAULT_LANDING_DATA.faqs,
      bottomCta: DEFAULT_LANDING_DATA.bottomCta,
      footer: { ...DEFAULT_LANDING_DATA.footer, ...footer },
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to get landing CMS data:', error);
    return NextResponse.json(DEFAULT_LANDING_DATA);
  }
}

export async function PUT(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant || tenant.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Super Admin yang berhak mengubah konten landing page' },
        { status: 403 }
      );
    }

    const payload: Partial<LandingPageData> = await request.json();

    const updated = await db.landingPageCms.upsert({
      where: { id: 'global' },
      update: {
        heroData: payload.hero ? JSON.stringify(payload.hero) : undefined,
        statsData: payload.statsTrust ? JSON.stringify(payload.statsTrust) : undefined,
        featuresData: payload.features ? JSON.stringify(payload.features) : undefined,
        stepsData: payload.stepsSection ? JSON.stringify(payload.stepsSection) : undefined,
        testimonialsData: payload.testimonials ? JSON.stringify(payload.testimonials) : undefined,
        faqData: payload.faqs ? JSON.stringify(payload.faqs) : undefined,
        footerData: payload.footer ? JSON.stringify(payload.footer) : undefined,
        updatedBy: tenant.nama || tenant.email || 'Super Admin',
      },
      create: {
        id: 'global',
        heroData: JSON.stringify(payload.hero || DEFAULT_LANDING_DATA.hero),
        statsData: JSON.stringify(payload.statsTrust || DEFAULT_LANDING_DATA.statsTrust),
        featuresData: JSON.stringify(payload.features || DEFAULT_LANDING_DATA.features),
        stepsData: JSON.stringify(payload.stepsSection || DEFAULT_LANDING_DATA.stepsSection),
        testimonialsData: JSON.stringify(payload.testimonials || DEFAULT_LANDING_DATA.testimonials),
        faqData: JSON.stringify(payload.faqs || DEFAULT_LANDING_DATA.faqs),
        footerData: JSON.stringify(payload.footer || DEFAULT_LANDING_DATA.footer),
        updatedBy: tenant.nama || tenant.email || 'Super Admin',
      },
    });

    return NextResponse.json({ success: true, message: 'Konten landing page berhasil diperbarui', updated });
  } catch (error: any) {
    console.error('Failed to update landing CMS data:', error);
    return NextResponse.json({ error: error?.message || 'Gagal menyimpan perubahan CMS' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await getTenantContext();
    if (!tenant || tenant.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Super Admin yang berhak melakukan tindakan ini' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    if (body.action === 'reset') {
      await db.landingPageCms.deleteMany({
        where: { id: 'global' },
      });
      return NextResponse.json({ success: true, message: 'Konten berhasil di-reset ke nilai default mockup', data: DEFAULT_LANDING_DATA });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenal' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to reset landing CMS:', error);
    return NextResponse.json({ error: 'Gagal mereset konten CMS' }, { status: 500 });
  }
}
