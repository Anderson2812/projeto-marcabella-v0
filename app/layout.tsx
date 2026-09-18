import type { Metadata } from 'next';
import './globals.css';
import { AppStoreProvider } from '@/lib/use-app-store';
import Navbar from '@/components/Navbar';
import ScrollToTop from '@/components/ScrollToTop';

export const metadata: Metadata = {
  title: 'Marcabella - Agendamento Simples para Profissionais de Beleza',
  description: 'Plataforma de agendamento online inteligente para manicures, lash designers, cabeleireiras e esteticistas.',
  icons: {
    icon: '/marcabella-logo.png',
    apple: '/marcabella-logo.png',
  },
  openGraph: {
    title: 'Marcabella - Agendamento Simples para Profissionais de Beleza',
    description: 'Plataforma de agendamento online inteligente para manicures, lash designers, cabeleireiras e esteticistas.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marcabella - Agendamento Simples para Profissionais de Beleza',
    description: 'Plataforma de agendamento online inteligente para manicures, lash designers, cabeleireiras e esteticistas.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('bellahora_theme_mode');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#F8F6F2] dark:bg-[#121212] text-[#3D3D3D] dark:text-[#E4E4E7] antialiased font-sans selection:bg-[#5A5A40] dark:bg-zinc-700 selection:text-white transition-colors duration-200" suppressHydrationWarning>
        <AppStoreProvider>
          <ScrollToTop />
          <Navbar />
          <main>{children}</main>
        </AppStoreProvider>
      </body>
    </html>
  );
}
