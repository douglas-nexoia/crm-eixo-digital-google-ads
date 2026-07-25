import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Sidebar } from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased min-h-screen flex`}>
        <Sidebar />
        <main className="flex-1 overflow-x-hidden min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
