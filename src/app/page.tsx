import React from 'react';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { DEFAULT_LANDING_DATA, LandingPageData } from '@/lib/landing-defaults';

import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingHero from '@/components/landing/LandingHero';
import LandingFeatures from '@/components/landing/LandingFeatures';
import LandingSteps from '@/components/landing/LandingSteps';
import LandingStatsTrust from '@/components/landing/LandingStatsTrust';
import LandingTestimonials from '@/components/landing/LandingTestimonials';
import LandingFaq from '@/components/landing/LandingFaq';
import LandingCtaBanner from '@/components/landing/LandingCtaBanner';
import LandingFooter from '@/components/landing/LandingFooter';

export const metadata: Metadata = {
  title: 'Komuna - Kelola Kegiatan RT Jadi Lebih Mudah',
  description:
    'Aplikasi modern gotong-royong warga RT untuk mengelola kas, iuran, jimpitan ronda, dan administrasi kependudukan yang transparan dan akuntabel.',
};

// Server Component fetching CMS data directly from DB with safe fallback
async function getLandingContent(): Promise<LandingPageData> {
  try {
    const cmsRow = await db.landingPageCms.findUnique({
      where: { id: 'global' },
    });

    if (!cmsRow) {
      return DEFAULT_LANDING_DATA;
    }

    const hero = cmsRow.heroData ? JSON.parse(cmsRow.heroData) : DEFAULT_LANDING_DATA.hero;
    const statsTrust = cmsRow.statsData ? JSON.parse(cmsRow.statsData) : DEFAULT_LANDING_DATA.statsTrust;
    const features = cmsRow.featuresData ? JSON.parse(cmsRow.featuresData) : DEFAULT_LANDING_DATA.features;
    const stepsSection = cmsRow.stepsData ? JSON.parse(cmsRow.stepsData) : DEFAULT_LANDING_DATA.stepsSection;
    const testimonials = cmsRow.testimonialsData ? JSON.parse(cmsRow.testimonialsData) : DEFAULT_LANDING_DATA.testimonials;
    const faqs = cmsRow.faqData ? JSON.parse(cmsRow.faqData) : DEFAULT_LANDING_DATA.faqs;
    const footer = cmsRow.footerData ? JSON.parse(cmsRow.footerData) : DEFAULT_LANDING_DATA.footer;

    return {
      hero: { ...DEFAULT_LANDING_DATA.hero, ...hero },
      features: Array.isArray(features) && features.length > 0 ? features : DEFAULT_LANDING_DATA.features,
      stepsSection: { ...DEFAULT_LANDING_DATA.stepsSection, ...stepsSection },
      statsTrust: { ...DEFAULT_LANDING_DATA.statsTrust, ...statsTrust },
      testimonials: Array.isArray(testimonials) && testimonials.length > 0 ? testimonials : DEFAULT_LANDING_DATA.testimonials,
      faqs: Array.isArray(faqs) && faqs.length > 0 ? faqs : DEFAULT_LANDING_DATA.faqs,
      bottomCta: DEFAULT_LANDING_DATA.bottomCta,
      footer: { ...DEFAULT_LANDING_DATA.footer, ...footer },
    };
  } catch (error) {
    console.error('Failed to load landing content on server:', error);
    return DEFAULT_LANDING_DATA;
  }
}

export default async function LandingPage() {
  const content = await getLandingContent();

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 w-full">
      {/* 1. Header / Navbar */}
      <LandingNavbar
        appName={content.footer.appName}
        tagline={content.footer.tagline}
      />

      <main className="flex-1 w-full">
        {/* 2. Hero Section */}
        <LandingHero data={content.hero} />

        {/* 3. Features Bento 6 Cards */}
        <LandingFeatures features={content.features} />

        {/* 4. Steps Section (3 Langkah) */}
        <LandingSteps data={content.stepsSection} />

        {/* 5. Stats & Trust Section */}
        <LandingStatsTrust data={content.statsTrust} />

        {/* 6. Testimonials Section */}
        <LandingTestimonials testimonials={content.testimonials} />

        {/* 7. FAQ Accordion */}
        <LandingFaq faqs={content.faqs} />

        {/* 8. Bottom CTA Banner */}
        <LandingCtaBanner data={content.bottomCta} />
      </main>

      {/* 9. Footer */}
      <LandingFooter data={content.footer} />
    </div>
  );
}
