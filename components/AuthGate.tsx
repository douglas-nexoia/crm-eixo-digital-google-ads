'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Somente o Dashboard interno e as páginas de gerenciamento exigem autenticação
const ROTAS_PRIVADAS = ['/', '/explorar', '/ranking', '/leads'];

function rotaExigeLogin(pathname: string | null): boolean {
  if (!pathname) return false;
  const p = pathname.toLowerCase().trim();
  
  // Dashboard interno
  if (p === '/' || p === '') return true;

  // Páginas restritas do CRM
  return ROTAS_PRIVADAS.some(
    (privada) => privada !== '/' && (p === privada || p.startsWith(`${privada}/`))
  );
}

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [temSessao, setTemSessao] = useState<boolean | null>(null);

  const precisaLogin = rotaExigeLogin(pathname);

  useEffect(() => {
    // Se a rota não exige login (/solicitar, /diagnostico, /login, etc.), NÃO faz nada
    if (!precisaLogin) {
      setTemSessao(true);
      return;
    }

    let ativo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      const sessaoAtiva = Boolean(data.session);
      setTemSessao(sessaoAtiva);
      if (!sessaoAtiva) {
        router.replace('/login');
      }
    });

    const { data: inscricao } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      if (!ativo) return;
      const sessaoAtiva = Boolean(sessao);
      setTemSessao(sessaoAtiva);
      if (!sessaoAtiva) {
        router.replace('/login');
      }
    });

    return () => {
      ativo = false;
      inscricao.subscription.unsubscribe();
    };
  }, [precisaLogin, router]);

  // Se a rota for pública, renderiza IMEDIATAMENTE os filhos
  if (!precisaLogin) {
    return <>{children}</>;
  }

  // Em rota privada enquanto verifica a sessão
  if (temSessao === null || !temSessao) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-[#0B0F19]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return <>{children}</>;
};
