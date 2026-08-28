import './globals.css';
import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { Sidebar } from '@/components/Sidebar';
import { AuthGate } from '@/components/AuthGate';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  // Necessário para caminhos relativos em og:image virarem URL absoluta —
  // sem isto o Next recusa o caminho relativo no build.
  metadataBase: new URL('https://crm.eixodigitalbr.com.br'),
  title: 'CRM — Eixo Digital',
  description: 'Sistema de prospecção e análise de presença digital no Google',
  icons: {
    icon: [
      { url: '/favicon.ico?v=2', sizes: 'any' },
      { url: '/icon.png?v=2', type: 'image/png' },
      { url: '/icon.svg?v=2', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=2', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} ${outfit.variable} ${inter.className} bg-[#0B0F19] text-[#F1F5F9] antialiased min-h-screen flex`}>
        <AuthGate>
          <Sidebar />
          <main className="flex-1 overflow-x-hidden min-h-screen">
            {children}
          </main>
        </AuthGate>
      </body>
    </html>
  );
}
