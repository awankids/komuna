import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PWARegister from "@/components/PWARegister";
import ThemeInitializer from "@/components/ThemeInitializer";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex bg-[#f8fafc] text-slate-800">
        <ThemeInitializer />
        <PWARegister />
        {children}
      </body>
    </html>
  );
}

