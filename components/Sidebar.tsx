'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Trophy, BarChart3, Settings, ShieldCheck } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  // Não renderizar Sidebar na rota pública de diagnóstico
  if (pathname.startsWith('/diagnostico')) {
    return null;
  }

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { label: 'Explorar Leads', icon: Users, href: '/explorar' },
    { label: 'Ranking Concorrentes', icon: Trophy, href: '/ranking' },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0 h-screen sticky top-0">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-3 border-b border-slate-800/80">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-blue-500/20">
            E
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-base leading-tight">Eixo Digital</h1>
            <p className="text-xs text-emerald-400 font-medium">Prospecção & CRM</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer info */}
      <div className="border-t border-slate-800/80 pt-4 px-2 space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Integrado ao EIXO-SCOUT</span>
        </div>
        <p className="text-[10px] text-slate-400">"Sua empresa no topo do Google"</p>
      </div>
    </aside>
  );
};
