'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Trophy, ShieldCheck, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ROTAS_PRIVADAS = ['explorar', 'ranking', 'leads'];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedState = localStorage.getItem('eixo_sidebar_collapsed');
    if (savedState !== null) {
      setCollapsed(savedState === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    localStorage.setItem('eixo_sidebar_collapsed', String(nextState));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const path = (pathname || '').replace(/^\/+|\/+$/g, '');
  const isRaiz = path === '';
  const isPrivada = isRaiz || ROTAS_PRIVADAS.some((r) => path === r || path.startsWith(`${r}/`));

  // Só exibe o Sidebar em rotas privadas do CRM (não exibe em /login, /solicitar, /diagnostico...)
  if (!isPrivada || path === 'login') {
    return null;
  }

  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Explorar Leads',
      href: '/explorar',
      icon: Users,
    },
    {
      name: 'Ranking de Cidades',
      href: '/ranking',
      icon: Trophy,
    },
  ];

  return (
    <aside
      className={`relative flex flex-col justify-between border-r border-[#1E293B] bg-[#0F172A] transition-all duration-300 z-30 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-[#1E293B]">
          <div className={`flex items-center gap-3 overflow-hidden ${collapsed ? 'justify-center w-full' : ''}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#10B981] text-[#08130F] font-bold shadow-md shadow-[#10B981]/20">
              E
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-outfit font-bold text-sm tracking-tight text-white">Eixo Digital</span>
                <span className="text-[10px] text-[#10B981] font-mono tracking-wider">GOOGLE ADS CRM</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 shadow-sm shadow-[#10B981]/5'
                    : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F1F5F9]'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.name : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#10B981]' : 'text-[#64748B]'}`} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Toggle & Logout */}
      <div className="p-2 border-t border-[#1E293B] space-y-1">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[#EF4444] hover:bg-[#EF4444]/10 transition-all ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sair da Conta</span>}
        </button>

        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-lg text-[#64748B] hover:bg-[#1E293B] hover:text-[#F1F5F9] transition-all"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
