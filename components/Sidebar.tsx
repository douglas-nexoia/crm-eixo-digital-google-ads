'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Trophy, ShieldCheck, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Carregar o estado do sidebar do localStorage ao montar o componente
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

  // Não renderizar Sidebar nas rotas sem sessão (diagnóstico público, formulário e login)
  const limpo = (pathname || '').replace(/^\/+|\/+$/g, '');
  const ehPublica = ['login', 'diagnostico', 'solicitar', 'diagnostico-gratis'].some(
    (rota) => limpo === rota || limpo.startsWith(`${rota}/`)
  );
  if (ehPublica) {
    return null;
  }

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { label: 'Explorar Leads', icon: Users, href: '/explorar' },
    { label: 'Ranking Concorrentes', icon: Trophy, href: '/ranking' },
  ];

  return (
    <aside 
      className={`relative bg-[#0B0F19] border-r border-[rgba(255,255,255,0.08)] flex flex-col justify-between p-4 shrink-0 h-screen sticky top-0 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Botão discreto para recolher/expandir posicionado no topo/borda entre as telas */}
      <button
        onClick={toggleSidebar}
        title={collapsed ? "Expandir menu" : "Recolher menu"}
        className="absolute -right-3.5 top-6 z-20 w-7 h-7 bg-[#0E1424] hover:bg-[#10B981] border border-[rgba(255,255,255,0.12)] hover:border-[#10B981] text-[#94A3B8] hover:text-[#08130F] rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        ) : (
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
        )}
      </button>

      <div className="space-y-6 overflow-hidden">
        {/* Brand Header */}
        <div className={`flex items-center gap-3 py-3 border-b border-[rgba(255,255,255,0.08)] ${collapsed ? 'justify-center px-0' : 'px-2'}`}>
          <div className="w-9 h-9 rounded-[10px] bg-[#10B981] flex items-center justify-center font-outfit font-black text-[#08130F] text-xl shadow-[0_0_15px_rgba(16,185,129,0.25)] shrink-0">
            E
          </div>
          {!collapsed && (
            <div className="truncate">
              <h1 className="font-bold font-outfit text-white text-base leading-tight">Eixo Digital</h1>
              <p className="text-xs text-[#10B981] font-medium">Prospecção & CRM</p>
            </div>
          )}
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
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 py-2.5 rounded-[10px] text-sm font-medium transition-all ${
                  collapsed ? 'justify-center px-0' : 'px-3'
                } ${
                  isActive
                    ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 font-bold'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#10B981]' : 'text-[#94A3B8]'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer info */}
      <div className={`border-t border-[rgba(255,255,255,0.08)] pt-4 space-y-2 ${collapsed ? 'text-center px-0' : 'px-2'}`}>
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sair' : undefined}
          className={`w-full flex items-center gap-3 py-2.5 rounded-[10px] text-sm font-medium text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.04)] transition-all cursor-pointer ${
            collapsed ? 'justify-center px-0' : 'px-3'
          }`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="truncate">Sair</span>}
        </button>

        <div className={`flex items-center gap-2 text-xs text-[#94A3B8] ${collapsed ? 'justify-center' : ''}`}>

          <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
          {!collapsed && <span className="truncate">Integrado ao EIXO-SCOUT</span>}
        </div>
        {!collapsed && <p className="text-[10px] text-[#64748B]">"Sua empresa no topo do Google"</p>}
      </div>
    </aside>
  );
};
