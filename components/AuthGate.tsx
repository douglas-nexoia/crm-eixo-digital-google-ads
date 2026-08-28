'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const PREFIXOS_PUBLICOS = ['/diagnostico', '/solicitar', '/diagnostico-gratis', '/login'];

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [autenticado, setAutenticado] = useState<boolean | null>(null);

  const ehPublico = pathname ? PREFIXOS_PUBLICOS.some(p => pathname === p || pathname.startsWith(`${p}/`)) : false;

  useEffect(() => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : pathname;
    const isPublicWindow = currentPath ? PREFIXOS_PUBLICOS.some(p => currentPath === p || currentPath.startsWith(`${p}/`)) : false;

    if (ehPublico || isPublicWindow) {
      setAutenticado(true);
      return;
    }

    let ativo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      const temSessao = Boolean(data.session);
      setAutenticado(temSessao);
      
      const nowPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const nowPublic = PREFIXOS_PUBLICOS.some(p => nowPath === p || nowPath.startsWith(`${p}/`));
      
      if (!temSessao && !nowPublic) {
        router.replace('/login');
      }
    });

    const { data: inscricao } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      if (!ativo) return;
      const temSessao = Boolean(sessao);
      setAutenticado(temSessao);
      
      const nowPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const nowPublic = PREFIXOS_PUBLICOS.some(p => nowPath === p || nowPath.startsWith(`${p}/`));
      
      if (!temSessao && !nowPublic) {
        router.replace('/login');
      }
    });

    return () => {
      ativo = false;
      inscricao.subscription.unsubscribe();
    };
  }, [ehPublico, pathname, router]);

  if (ehPublico) {
    return <>{children}</>;
  }

  if (autenticado === null || !autenticado) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-[#0B0F19]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return <>{children}</>;
};
