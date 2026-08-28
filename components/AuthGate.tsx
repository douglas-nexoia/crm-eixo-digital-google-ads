'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function isPublicPath(p?: string | null): boolean {
  if (!p) return false;
  const path = p.toLowerCase().trim();
  return (
    path === '/login' ||
    path.startsWith('/login/') ||
    path === '/solicitar' ||
    path.startsWith('/solicitar/') ||
    path === '/diagnostico' ||
    path.startsWith('/diagnostico/') ||
    path === '/diagnostico-gratis' ||
    path.startsWith('/diagnostico-gratis/')
  );
}

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [autenticado, setAutenticado] = useState(false);
  const [loading, setLoading] = useState(true);

  const windowPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const ehPublico = isPublicPath(pathname) || isPublicPath(windowPath);

  useEffect(() => {
    // Se for público, não faz nada
    if (ehPublico) {
      setLoading(false);
      return;
    }

    let ativo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      const tem = Boolean(data.session);
      setAutenticado(tem);
      setLoading(false);

      if (!tem) {
        const current = typeof window !== 'undefined' ? window.location.pathname : '';
        if (!isPublicPath(current)) {
          router.replace('/login');
        }
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!ativo) return;
      const tem = Boolean(session);
      setAutenticado(tem);
      if (!tem) {
        const current = typeof window !== 'undefined' ? window.location.pathname : '';
        if (!isPublicPath(current)) {
          router.replace('/login');
        }
      }
    });

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, [ehPublico, router]);

  // Se a rota for pública, renderiza IMEDIATAMENTE os filhos
  if (ehPublico) {
    return <>{children}</>;
  }

  if (loading) {
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
