'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, MapPin, Building2, Phone, Globe, Flame, Loader2 } from 'lucide-react';

const NICHOS_COMUNS = [
  'Assistência Técnica de Eletrodomésticos',
  'Climatização e Ar Condicionado',
  'Conserto de Geladeira / Freezer',
  'Conserto de Máquinas de Lavar / Lava e Seca',
  'Clínica Odontológica / Dentista',
  'Clínica Médica / Saúde',
  'Estética e Beleza',
  'Oficina Mecânica / Auto Center',
  'Desentupidora e Dedetizadora',
  'Marcenaria e Móveis Planejados',
  'Outro Segmento',
];

export default function SolicitarDiagnosticoPage() {
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState('');
  const [nicho, setNicho] = useState(NICHOS_COMUNS[0]);
  const [nichoOutro, setNichoOutro] = useState('');
  const [telefone, setTelefone] = useState('');
  const [site, setSite] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepScan, setStepScan] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatarWhatsApp = (val: string) => {
    const limpo = val.replace(/\D/g, '').slice(0, 11);
    if (limpo.length <= 2) return limpo;
    if (limpo.length <= 6) return `(${limpo.slice(0, 2)}) ${limpo.slice(2)}`;
    if (limpo.length <= 10) return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`;
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`;
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatarWhatsApp(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const telLimpo = telefone.replace(/\D/g, '');
    if (!nome.trim() || !cidade.trim() || telLimpo.length < 10) {
      setErrorMsg('Por favor, preencha o nome da empresa, cidade e um WhatsApp válido com DDD.');
      return;
    }

    setIsSubmitting(true);
    setStepScan(1);

    try {
      const nichoFinal = nicho === 'Outro Segmento' && nichoOutro.trim() ? nichoOutro.trim() : nicho;

      // Animação de scanner
      setTimeout(() => setStepScan(2), 1200);
      setTimeout(() => setStepScan(3), 2600);

      const res = await fetch('/api/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          cidade: cidade.trim(),
          nicho: nichoFinal,
          telefone: telLimpo,
          site: site.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao processar diagnóstico.');
      }

      setStepScan(4);

      setTimeout(() => {
        router.push(`/diagnostico/${data.slug}`);
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Ocorreu um erro ao gerar seu diagnóstico. Tente novamente.');
      setIsSubmitting(false);
      setStepScan(0);
    }
  };

  return (
    <div className="min-h-screen bg-[#080d14] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* HEADER / NAVBAR */}
      <header className="border-b border-slate-800/80 bg-[#0d1522]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center font-black text-[#08130F] text-sm shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              E
            </div>
            <div>
              <span className="font-bold text-white tracking-wide text-sm md:text-base">EIXO DIGITAL</span>
              <span className="text-[10px] text-cyan-400 font-mono block -mt-1 tracking-wider uppercase">Google Ads & Presença Digital</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Diagnóstico 100% Gratuito
          </div>
        </div>
      </header>

      {/* HERO & FORM SECTION */}
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-14 w-full">
        
        {/* BADGE DE TOPO */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-800/80 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
            Raio-X de Presença & Leilão do Google
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.15] max-w-3xl mx-auto">
            Descubra o potencial de clientes da sua empresa no <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400">Google Ads</span>
          </h1>
          <p className="mt-3.5 text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Receba um laudo técnico completo mostrando a sua posição em relação aos concorrentes locais e quanto custa anunciar no leilão da sua cidade.
          </p>
        </div>

        {/* CARD DO FORMULÁRIO */}
        <div className="bg-[#0f1a2a]/90 border border-slate-800 rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl shadow-cyan-950/20 backdrop-blur-sm relative overflow-hidden">
          
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-sm flex items-center gap-3">
              <span className="text-lg">⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* LINHA 1: NOME E CIDADE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  Nome da sua Empresa <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Secatec Assistência Técnica"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-[#09101a] border border-slate-700/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  Cidade e Estado <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sorocaba/SP ou São Paulo/SP"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-[#09101a] border border-slate-700/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
              </div>
            </div>

            {/* LINHA 2: NICHO / SEGMENTO */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-cyan-400" />
                Seu Nicho / Especialidade <span className="text-cyan-400">*</span>
              </label>
              <select
                value={nicho}
                onChange={(e) => setNicho(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-[#09101a] border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all cursor-pointer"
              >
                {NICHOS_COMUNS.map((n) => (
                  <option key={n} value={n} className="bg-[#09101a] text-slate-100">
                    {n}
                  </option>
                ))}
              </select>

              {nicho === 'Outro Segmento' && (
                <input
                  type="text"
                  placeholder="Qual é o seu segmento? (Ex: Energia Solar, Despachante...)"
                  value={nichoOutro}
                  onChange={(e) => setNichoOutro(e.target.value)}
                  disabled={isSubmitting}
                  className="mt-3 w-full bg-[#09101a] border border-slate-700/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
              )}
            </div>

            {/* LINHA 3: WHATSAPP E SITE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  Seu WhatsApp com DDD <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="(11) 99999-9999"
                  value={telefone}
                  onChange={handleTelefoneChange}
                  disabled={isSubmitting}
                  className="w-full bg-[#09101a] border border-slate-700/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Você receberá o link do laudo e a análise também por WhatsApp.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  Site ou Instagram <span className="text-slate-400 font-normal text-[11px]">(Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: minhaempresa.com.br ou @perfil"
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-[#09101a] border border-slate-700/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Caso já possua site para auditarmos tags de tráfego.
                </span>
              </div>
            </div>

            {/* BOTÃO DE SUBMISSÃO */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-[#071318] font-black py-4 px-6 rounded-xl text-base sm:text-lg shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all transform active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processando Diagnóstico do Google...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>GERAR MEU DIAGNÓSTICO GRATUITO</span>
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </>
                )}
              </button>
            </div>

            {/* GARANTIAS / BENEFÍCIOS */}
            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Gratuito e Instantâneo</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Dados Oficiais do Leilão</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Sem compromisso comercial</span>
              </div>
            </div>

          </form>

        </div>

      </main>

      {/* MODAL DE SCANNER / PROGRESSO EM TEMPO REAL */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-[#060a10]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f1a2a] border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl shadow-cyan-950/40 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="w-16 h-16 rounded-full bg-cyan-950/80 border border-cyan-700/60 mx-auto flex items-center justify-center mb-5 text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)]">
              {stepScan < 4 ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              )}
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              {stepScan < 4 ? 'Analisando sua Presença no Google...' : 'Diagnóstico Concluído!'}
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Avaliando mercado de <strong className="text-slate-200">{nicho}</strong> em <strong className="text-slate-200">{cidade}</strong>.
            </p>

            {/* BARRA DE ETAPAS */}
            <div className="space-y-3 text-left mb-6">
              <div className={`p-3 rounded-lg border text-xs flex items-center gap-3 transition-all ${
                stepScan >= 1 ? 'bg-cyan-950/40 border-cyan-800/80 text-cyan-200' : 'bg-slate-900/40 border-slate-800 text-slate-500'
              }`}>
                {stepScan > 1 ? '✓' : '1.'} Localizando sua empresa e concorrentes no Google...
              </div>

              <div className={`p-3 rounded-lg border text-xs flex items-center gap-3 transition-all ${
                stepScan >= 2 ? 'bg-cyan-950/40 border-cyan-800/80 text-cyan-200' : 'bg-slate-900/40 border-slate-800 text-slate-500'
              }`}>
                {stepScan > 2 ? '✓' : '2.'} Calculando custos do leilão e volume de buscas na sua cidade...
              </div>

              <div className={`p-3 rounded-lg border text-xs flex items-center gap-3 transition-all ${
                stepScan >= 3 ? 'bg-cyan-950/40 border-cyan-800/80 text-cyan-200' : 'bg-slate-900/40 border-slate-800 text-slate-500'
              }`}>
                {stepScan >= 4 ? '✓' : '3.'} Estruturando cenários de investimento e retorno...
              </div>
            </div>

            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full transition-all duration-500"
                style={{ width: `${(stepScan / 4) * 100}%` }}
              ></div>
            </div>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#0a111c] py-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Eixo Digital — Soluções em Tráfego Pago & Presença Local.</p>
          <p className="text-slate-400 font-mono">Índice de Presença & Captação Digital</p>
        </div>
      </footer>

    </div>
  );
}
