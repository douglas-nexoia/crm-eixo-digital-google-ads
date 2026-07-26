'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);
  const [verificando, setVerificando] = useState(true);

  // Quem já tem sessão não precisa ver o formulário.
  useEffect(() => {
    let ativo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      if (data.session) {
        router.replace('/');
      } else {
        setVerificando(false);
      }
    });

    return () => {
      ativo = false;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setEntrando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    if (error) {
      setEntrando(false);
      setErro(
        error.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos.'
          : error.message
      );
      return;
    }

    router.replace('/');
  };

  if (verificando) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[#64748B]" />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-[12px] bg-[#10B981] flex items-center justify-center font-outfit font-black text-[#08130F] text-2xl shadow-[0_0_20px_rgba(16,185,129,0.25)] mb-4">
            E
          </div>
          <h1 className="font-outfit font-bold text-white text-2xl tracking-[-0.3px]">
            Eixo Digital
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">Acesso restrito ao CRM</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-7 space-y-5"
        >
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-[#94A3B8]">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0B0F19] border border-[rgba(255,255,255,0.12)] rounded-[10px] px-4 py-2.5 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:border-[#10B981] transition-colors"
              placeholder="voce@eixodigitalbr.com.br"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="senha" className="block text-sm font-medium text-[#94A3B8]">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              required
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full bg-[#0B0F19] border border-[rgba(255,255,255,0.12)] rounded-[10px] px-4 py-2.5 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:border-[#10B981] transition-colors"
              placeholder="••••••••"
            />
          </div>

          {erro && (
            <div className="flex items-start gap-2 text-sm text-[#F87171] bg-[#F87171]/10 border border-[#F87171]/20 rounded-[10px] px-3 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{erro}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={entrando}
            className="w-full flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#0EA372] disabled:opacity-60 disabled:cursor-not-allowed text-[#08130F] font-bold text-sm rounded-[10px] px-6 py-3 shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all cursor-pointer"
          >
            {entrando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Entrando…
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Entrar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
