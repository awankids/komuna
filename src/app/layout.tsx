import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
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
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('komuna-theme') || 'orange';
                  const isDark = localStorage.getItem('komuna-dark') === 'yes';
                  const font = localStorage.getItem('komuna-font') || 'outfit';
                  const size = localStorage.getItem('komuna-size') || 'normal';
                  const style = localStorage.getItem('komuna-style') || 'classic';
                  
                  const cl = document.documentElement.classList;
                  // Remove only theme/font/size/dark/style classes to preserve Next.js/Tailwind font variables
                  Array.from(cl).forEach(c => {
                    if (c.startsWith('theme-') || c.startsWith('font-') || c.startsWith('size-') || c.startsWith('style-') || c === 'dark') {
                      cl.remove(c);
                    }
                  });
                  cl.add('theme-' + theme);
                  cl.add('font-' + font);
                  cl.add('size-' + size);
                  cl.add('style-' + style);
                  if (isDark) {
                    cl.add('dark');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="min-h-full flex bg-[#f8fafc] text-slate-800">
        <PWARegister />
        {children}
      </body>
    </html>
  );
}

