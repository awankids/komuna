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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <Script
          id="komuna-theme-init"
          strategy="beforeInteractive"
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

              // Global unhandled error listener for client-side diagnostic logging
              if (typeof window !== 'undefined') {
                window.addEventListener('error', function(event) {
                  try {
                    var logs = JSON.parse(localStorage.getItem('komuna-error-logs') || '[]');
                    logs.unshift({
                      timestamp: new Date().toISOString(),
                      type: 'error',
                      message: event.message || 'Unknown client-side runtime error',
                      source: event.filename ? (event.filename.split('/').pop() + ':' + event.lineno) : 'Unknown script source',
                      url: window.location.href
                    });
                    localStorage.setItem('komuna-error-logs', JSON.stringify(logs.slice(0, 50)));
                  } catch (err) {}
                });
              }
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

