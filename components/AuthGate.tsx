'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ROTAS_PUBLICAS = ['login', 'diagnostico', 'solicitar', 'diagnostico-gratis'];

const ehRotaPublica = (pathname?: string | null) => {
  if (!pathname) {
    if (typeof window !== 'undefined') {
      const atual = window.location.pathname.replace(/^\/+|\/+$/g, '');
      return ROTAS_PUBLICAS.some((rota) => atual === rota || atual.startsWith(`${rota}/`));
    }
    return true;
  }
  const limpo = pathname.replace(/^\/+|\/+$/g, '');
  return ROTAS_PUBLICAS.some((rota) => limpo === rota || limpo.startsWith(`${rota}/`));
};

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [liberado, setLiberado] = useState(false);
  const [checouSessao, setChecouSessao] = useState(false);

  const publica = ehRotaPublica(pathname);

  useEffect(() => {
    if (publica) {
      setLiberado(true);
      setChecouSessao(true);
      return;
    }

    let ativo = true;

    const aplicar = (temSessao: boolean) => {
      if (!ativo) return;
      setLiberado(temSessao);
      setChecouSessao(true);

      const rotaAtual = typeof window !== 'undefined' ? window.location.pathname : pathname;
      if (!temSessao && !ehRotaPublica(rotaAtual)) {
        router.replace('/login');
      }
    };

    supabase.auth.getSession().then(({ data }) => aplicar(Boolean(data.session)));

    const { data: inscricao } = supabase.auth.onAuthStateChange((_evento, sessao) =>
      aplicar(Boolean(sessao))
    );

    return () => {
      ativo = false;
      inscricao.subscription.unsubscribe();
    };
  }, [publica, pathname, router]);

  if (publica) return <>{children}</>;

  if (!checouSessao || !liberado) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[#64748B]" />
      </div>
    );
  }

  return <>{children}</>;
};
