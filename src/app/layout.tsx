import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import PWARegister from "@/components/PWARegister";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Komuna - Aplikasi Pencatatan Jimpitan RT",
  description: "Aplikasi pencatatan jimpitan gotong-royong warga RT",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Komuna",
  },
};

export const viewport: Viewport = {
  themeColor: "#f95713",
  width: "device-width",
  initialScale: 1,
};

// Suppress React 19 development warning for Next.js Script tag injection
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag')) {
      return;
    }
    originalError.apply(console, args);
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex bg-[#f8fafc] text-slate-800">
        <Script src="/theme-init.js" strategy="beforeInteractive" />
        <PWARegister />
        {children}
      </body>
    </html>
  );
}

