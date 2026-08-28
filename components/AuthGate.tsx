'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Apenas estas rotas são restritas e exigem login
function rotaEhPrivada(p?: string | null): boolean {
  if (!p) return false;
  const path = p.toLowerCase().trim();
  
  if (path === '/') return true;
  if (path === '/explorar' || path.startsWith('/explorar/')) return true;
  if (path === '/ranking' || path.startsWith('/ranking/')) return true;
  if (path === '/leads' || path.startsWith('/leads/')) return true;

  return false;
}

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [autenticado, setAutenticado] = useState(false);
  const [checando, setChecando] = useState(true);

  const windowPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const rotaPrivada = rotaEhPrivada(pathname) || (windowPath ? rotaEhPrivada(windowPath) : false);

  useEffect(() => {
    // Se a rota for pública (/solicitar, /diagnostico, /login...), libera na hora
    if (!rotaPrivada) {
      setChecando(false);
      return;
    }

    let ativo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      const tem = Boolean(data.session);
      setAutenticado(tem);
      setChecando(false);

      if (!tem) {
        const cur = window.location.pathname;
        if (rotaEhPrivada(cur)) {
          router.replace('/login');
        }
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!ativo) return;
      const tem = Boolean(session);
      setAutenticado(tem);
      if (!tem) {
        const cur = window.location.pathname;
        if (rotaEhPrivada(cur)) {
          router.replace('/login');
        }
      }
    });

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, [rotaPrivada, router]);

  // Se for qualquer rota pública, renderiza IMEDIATAMENTE (zero bloqueio)
  if (!rotaPrivada) {
    return <>{children}</>;
  }

  if (checando) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-[#0B0F19]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!autenticado) {
    return null;
  }

  return <>{children}</>;
};
