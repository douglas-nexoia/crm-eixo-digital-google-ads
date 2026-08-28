'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Apenas estas rotas exigem sessão de login
const ROTAS_PRIVADAS = ['explorar', 'ranking', 'leads'];

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [autenticado, setAutenticado] = useState<boolean | null>(null);

  const path = (pathname || '').replace(/^\/+|\/+$/g, '');
  const isRaiz = path === '';
  const isPrivada = isRaiz || ROTAS_PRIVADAS.some((r) => path === r || path.startsWith(`${r}/`));

  useEffect(() => {
    if (!isPrivada) {
      setAutenticado(true);
      return;
    }

    let ativo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      const temSessao = Boolean(data.session);
      setAutenticado(temSessao);
      if (!temSessao) {
        router.replace('/login');
      }
    });

    const { data: inscricao } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      if (!ativo) return;
      const temSessao = Boolean(sessao);
      setAutenticado(temSessao);
      if (!temSessao) {
        router.replace('/login');
      }
    });

    return () => {
      ativo = false;
      inscricao.subscription.unsubscribe();
    };
  }, [isPrivada, pathname, router]);

  // Se a rota for pública (/solicitar, /diagnostico, /login...), renderiza direto sem travar
  if (!isPrivada) {
    return <>{children}</>;
  }

  // Rota privada sem sessão confirmada
  if (autenticado === null || !autenticado) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-[#0B0F19]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return <>{children}</>;
};
