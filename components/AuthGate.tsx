'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

/**
 * Rotas que continuam abertas sem sessão.
 *
 * /diagnostico é o relatório que vai por WhatsApp para o prospect — ele não
 * tem login e não pode ganhar um. O resto do CRM é privado.
 */
const ROTAS_PUBLICAS = ['/login', '/diagnostico', '/solicitar', '/diagnostico-gratis'];

const ehRotaPublica = (pathname: string) =>
  ROTAS_PUBLICAS.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`));

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const publica = ehRotaPublica(pathname);
  const [liberado, setLiberado] = useState(false);

  useEffect(() => {
    if (publica) return;

    let ativo = true;

    const aplicar = (temSessao: boolean) => {
      if (!ativo) return;
      setLiberado(temSessao);
      if (!temSessao) router.replace('/login');
    };

    supabase.auth.getSession().then(({ data }) => aplicar(Boolean(data.session)));

    // Cobre expiração do token e logout feito em outra aba.
    const { data: inscricao } = supabase.auth.onAuthStateChange((_evento, sessao) =>
      aplicar(Boolean(sessao))
    );

    return () => {
      ativo = false;
      inscricao.subscription.unsubscribe();
    };
  }, [publica, pathname, router]);

  if (publica) return <>{children}</>;

  // Enquanto a sessão não for confirmada nada do CRM é renderizado.
  if (!liberado) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[#64748B]" />
      </div>
    );
  }

  return <>{children}</>;
};
