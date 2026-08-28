'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [autenticado, setAutenticado] = useState<boolean | null>(null);

  // Descobrir a rota atual com segurança total (SSR e Cliente)
  const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');

  // Rotas que NUNCA exigem login
  const isPublica =
    !currentPath ||
    currentPath.startsWith('/solicitar') ||
    currentPath.startsWith('/diagnostico') ||
    currentPath.startsWith('/diagnostico-gratis') ||
    currentPath.startsWith('/login');

  useEffect(() => {
    // Se for rota pública, NUNCA executa checagem de sessão nem redirecionamento
    if (isPublica) {
      setAutenticado(true);
      return;
    }

    let ativo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      const temSessao = Boolean(data.session);
      setAutenticado(temSessao);
      
      const nowPath = window.location.pathname;
      const nowPublic =
        nowPath.startsWith('/solicitar') ||
        nowPath.startsWith('/diagnostico') ||
        nowPath.startsWith('/diagnostico-gratis') ||
        nowPath.startsWith('/login');

      if (!temSessao && !nowPublic) {
        router.replace('/login');
      }
    });

    const { data: inscricao } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      if (!ativo) return;
      const temSessao = Boolean(sessao);
      setAutenticado(temSessao);

      const nowPath = window.location.pathname;
      const nowPublic =
        nowPath.startsWith('/solicitar') ||
        nowPath.startsWith('/diagnostico') ||
        nowPath.startsWith('/diagnostico-gratis') ||
        nowPath.startsWith('/login');

      if (!temSessao && !nowPublic) {
        router.replace('/login');
      }
    });

    return () => {
      ativo = false;
      inscricao.subscription.unsubscribe();
    };
  }, [isPublica, pathname, router]);

  // Se a rota for pública, renderiza IMEDIATAMENTE (zero bloqueio)
  if (isPublica) {
    return <>{children}</>;
  }

  // Rota restrita sem sessão
  if (autenticado === null || !autenticado) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-[#0B0F19]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return <>{children}</>;
};
