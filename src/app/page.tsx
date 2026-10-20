import React from 'react';
import type { Metadata } from 'next';
import { getCmsData } from '@/lib/cms-db';
import { LandingPageData } from '@/lib/landing-defaults';

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

export default async function LandingPage() {
  // Mengambil konten dari engine CMS terisolasi (100% terpisah dari database operasional RT)
  const content: LandingPageData = await getCmsData();

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
