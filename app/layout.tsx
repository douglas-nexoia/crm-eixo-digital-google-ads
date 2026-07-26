import './globals.css';
import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { Sidebar } from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'CRM — Eixo Digital',
  description: 'Sistema de prospecção e análise de presença digital no Google',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} ${outfit.variable} ${inter.className} bg-[#0B0F19] text-[#F1F5F9] antialiased min-h-screen flex`}>
        <Sidebar />
        <main className="flex-1 overflow-x-hidden min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
