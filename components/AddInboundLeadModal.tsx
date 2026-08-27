'use client';

import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, PlusCircle, ShieldAlert, Sparkles, Database } from 'lucide-react';
import { Lead, StatusFunil, TagsRastreamento, ScoreNivel } from '@/lib/types';
import { addLeadToSupabase } from '@/lib/supabase-service';

interface AddInboundLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddInboundLeadModal: React.FC<AddInboundLeadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [nome, setNome] = useState('');
  const [nicho, setNicho] = useState('');
  const [cidade, setCidade] = useState('');
  const [telefone, setTelefone] = useState('');
  const [site, setSite] = useState('');
  const [posicaoMaps, setPosicaoMaps] = useState<number>(10);
  const [origem, setOrigem] = useState('Inbound - Instagram Ads');
  const [statusFunil, setStatusFunil] = useState<StatusFunil>('Aguardando Diagnóstico');

  // GMB Fields
  const [gmbNota, setGmbNota] = useState<number | null>(4.0);
  const [gmbAvaliacoes, setGmbAvaliacoes] = useState<number | null>(5);
  const [gmbVerificado, setGmbVerificado] = useState(false);

  // Site Fields
  const [siteHttps, setSiteHttps] = useState(false);
  const [siteResponsivo, setSiteResponsivo] = useState(false);
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');

  // Ads & Tags Fields
  const [anuncioDetectado, setAnuncioDetectado] = useState(false);
  const [tagGtm, setTagGtm] = useState(false);
  const [tagGoogleAds, setTagGoogleAds] = useState(false);
  const [tagGa4, setTagGa4] = useState(false);
  const [tagMetaPixel, setTagMetaPixel] = useState(false);

  if (!isOpen) return null;

  const calculateScore = (): { pontos: number; nivel: ScoreNivel; detalhes: string[] } => {
    let pontos = 100;
    const detalhes: string[] = [];

    // GMB
    if (!gmbVerificado) {
      pontos -= 15;
      detalhes.push('Perfil do GMB não verificado');
    }
    if (gmbAvaliacoes === null || gmbAvaliacoes < 10) {
      pontos -= 15;
      detalhes.push(`Poucas avaliações no GMB (${gmbAvaliacoes ?? 0})`);
    }
    if (gmbNota === null || gmbNota < 4.5) {
      pontos -= 10;
      detalhes.push(`Nota média do GMB baixa (${gmbNota ?? 'N/A'})`);
    }

    // Site
    if (!site.trim()) {
      pontos -= 25;
      detalhes.push('Não possui site próprio');
    } else {
      if (!siteHttps) {
        pontos -= 10;
        detalhes.push('Site sem conexão HTTPS segura');
      }
      if (!siteResponsivo) {
        pontos -= 15;
        detalhes.push('Site não otimizado para celular (mobile)');
      }
    }

    // Tags
    if (!tagGtm) {
      pontos -= 5;
      detalhes.push('Sem container do Google Tag Manager');
    }
    if (!tagGoogleAds) {
      pontos -= 15;
      detalhes.push('Falta Tag de Conversão do Google Ads');
    }
    if (!tagGa4) {
      pontos -= 5;
      detalhes.push('Sem Tag do Google Analytics 4 (GA4)');
    }
    if (!tagMetaPixel) {
      pontos -= 10;
      detalhes.push('Sem Pixel do Facebook para remarketing');
    }

    pontos = Math.max(0, pontos);

    let nivel: ScoreNivel = 'medio';
    if (pontos >= 80) {
      nivel = 'baixo'; // Oportunidade baixa pois o lead já está bem otimizado
    } else if (pontos < 50) {
      nivel = 'alto'; // Oportunidade alta de venda (muitos gargalos)
    }

    return { pontos, nivel, detalhes };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!nome.trim()) {
      setError('Por favor, informe o Nome da Empresa.');
      return;
    }

    try {
      setLoading(true);

      const scoreInfo = calculateScore();

      const tags_rastreamento: TagsRastreamento = {
        gtm: tagGtm,
        google_ads: tagGoogleAds,
        ga4: tagGa4,
        meta_pixel: tagMetaPixel,
      };

      const cleanPhone = telefone.replace(/\D/g, '');
      const slug = `${nome.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

      const leadPayload: Partial<Lead> = {
        nome: nome.trim(),
        nicho: nicho.trim() || 'Geral',
        cidade: cidade.trim() || 'Geral',
        telefone: cleanPhone || undefined,
        site: site.trim() || undefined,
        posicao_maps: Number(posicaoMaps) || 10,
        origem,
        status_funil: statusFunil,
        gmb_nota: gmbNota,
        gmb_avaliacoes: gmbAvaliacoes,
        gmb_verificado: gmbVerificado,
        site_https: siteHttps,
        site_responsivo: siteResponsivo,
        instagram: instagram.trim() || undefined,
        facebook: facebook.trim() || undefined,
        anuncio_detectado: anuncioDetectado,
        tags_rastreamento,
        score_pontos: scoreInfo.pontos,
        score_nivel: scoreInfo.nivel,
        score_detalhes: scoreInfo.detalhes,
        slug
      };

      const result = await addLeadToSupabase(leadPayload);

      if (result) {
        setSuccessMsg(`Sucesso! Lead "${nome}" registrado e auditado com sucesso!`);
        setTimeout(() => {
          setLoading(false);
          onSuccess();
          onClose();
        }, 1200);
      } else {
        throw new Error('Falha ao registrar o lead no Supabase. Verifique se o schema foi atualizado.');
      }

    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Erro inesperado ao registrar o lead.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <PlusCircle className="w-6 h-6 text-[#10B981]" />
            <div>
              <h2 className="text-xl font-bold font-outfit text-white">Cadastrar Novo Lead & Auditoria</h2>
              <p className="text-xs text-[#94A3B8]">Insira os dados do prospect Inbound para gerar o Relatório de Visibilidade.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-800 text-red-300 p-3 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-300 p-3 rounded-lg flex items-center gap-2 text-sm">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Bloco 1: Informações de Contato */}
            <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#10B981] mb-2 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                <span>1. Dados Cadastrais & Origem</span>
              </h3>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome da Empresa *</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Mr. Conforto e Refrigeração"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Nicho</label>
                  <input
                    type="text"
                    value={nicho}
                    onChange={(e) => setNicho(e.target.value)}
                    placeholder="Ex: climatização"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Cidade/UF</label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Ex: Valinhos/SP"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Telefone (WhatsApp)</label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="Ex: (19) 99999-9999"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Posição no Google Maps</label>
                  <input
                    type="number"
                    value={posicaoMaps}
                    onChange={(e) => setPosicaoMaps(Number(e.target.value))}
                    min={1}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Origem do Lead</label>
                  <select
                    value={origem}
                    onChange={(e) => setOrigem(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#10B981]"
                  >
                    <option value="Inbound - Instagram Ads">Instagram Ads</option>
                    <option value="Inbound - YouTube Ads">YouTube Ads</option>
                    <option value="Inbound - Formulário Site">Formulário Site</option>
                    <option value="Outbound">Outbound (Scout)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Estágio do Funil</label>
                  <select
                    value={statusFunil}
                    onChange={(e) => setStatusFunil(e.target.value as StatusFunil)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#10B981]"
                  >
                    <option value="Aguardando Diagnóstico">Aguardando Diagnóstico</option>
                    <option value="Novo">Novo</option>
                    <option value="Contatado">Contatado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Site</label>
                <input
                  type="url"
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  placeholder="https://www.site.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#10B981]"
                />
              </div>
            </div>

            {/* Bloco 2: Google Meu Negócio (SEO Local) */}
            <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#10B981] mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>2. Auditoria do Google Meu Negócio</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Nota GMB (0 a 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={gmbNota ?? ''}
                    onChange={(e) => setGmbNota(e.target.value ? Number(e.target.value) : null)}
                    placeholder="Ex: 4.8"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Avaliações</label>
                  <input
                    type="number"
                    value={gmbAvaliacoes ?? ''}
                    onChange={(e) => setGmbAvaliacoes(e.target.value ? Number(e.target.value) : null)}
                    placeholder="Ex: 24"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                <input
                  type="checkbox"
                  id="gmbVerificado"
                  checked={gmbVerificado}
                  onChange={(e) => setGmbVerificado(e.target.checked)}
                  className="rounded border-slate-800 text-[#10B981] focus:ring-[#10B981] w-4 h-4 bg-slate-950"
                />
                <label htmlFor="gmbVerificado" className="text-xs text-slate-300 cursor-pointer">
                  Perfil Local Verificado/Reivindicado?
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Link Instagram</label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="instagram.com/perfil"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Link Facebook</label>
                  <input
                    type="text"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="facebook.com/pagina"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bloco 3: Site, Google Ads e Rastreamento de Tags (Auditoria Profunda) */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#10B981] flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#10B981]" />
              <span>3. Auditoria do Site, Anúncios & Rastreamento de Conversão (Tags)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Saúde do Site */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-800 pb-1.5">Saúde do Site</h4>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="siteHttps"
                      checked={siteHttps}
                      onChange={(e) => setSiteHttps(e.target.checked)}
                      className="rounded border-slate-800 text-[#10B981] focus:ring-[#10B981] w-4 h-4 bg-slate-950"
                    />
                    <label htmlFor="siteHttps" className="text-xs text-slate-300 cursor-pointer">SSL / HTTPS Ativo (Seguro)</label>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="siteResponsivo"
                      checked={siteResponsivo}
                      onChange={(e) => setSiteResponsivo(e.target.checked)}
                      className="rounded border-slate-800 text-[#10B981] focus:ring-[#10B981] w-4 h-4 bg-slate-950"
                    />
                    <label htmlFor="siteResponsivo" className="text-xs text-slate-300 cursor-pointer">Site Responsivo (Mobile)</label>
                  </div>
                </div>
              </div>

              {/* Status de Anúncios */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-800 pb-1.5">Tráfego Pago</h4>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 bg-[#10B981]/5 p-2 rounded border border-[#10B981]/25">
                    <input
                      type="checkbox"
                      id="anuncioDetectado"
                      checked={anuncioDetectado}
                      onChange={(e) => setAnuncioDetectado(e.target.checked)}
                      className="rounded border-slate-800 text-[#10B981] focus:ring-[#10B981] w-4 h-4 bg-slate-950"
                    />
                    <label htmlFor="anuncioDetectado" className="text-xs text-emerald-400 font-semibold cursor-pointer">
                      Aparece anunciando no Google?
                    </label>
                  </div>
                </div>
              </div>

              {/* Tags de Conversão */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-800 pb-1.5">Tags Configuradas (Rastreamento)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="tagGtm"
                      checked={tagGtm}
                      onChange={(e) => setTagGtm(e.target.checked)}
                      className="rounded border-slate-800 text-[#10B981] focus:ring-[#10B981] w-4.5 h-4.5 bg-slate-950"
                    />
                    <label htmlFor="tagGtm" className="text-xs text-slate-300 cursor-pointer font-medium">GTM Container</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="tagGoogleAds"
                      checked={tagGoogleAds}
                      onChange={(e) => setTagGoogleAds(e.target.checked)}
                      className="rounded border-slate-800 text-[#10B981] focus:ring-[#10B981] w-4.5 h-4.5 bg-slate-950"
                    />
                    <label htmlFor="tagGoogleAds" className="text-xs text-slate-300 cursor-pointer font-medium">Google Ads Tag</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="tagGa4"
                      checked={tagGa4}
                      onChange={(e) => setTagGa4(e.target.checked)}
                      className="rounded border-slate-800 text-[#10B981] focus:ring-[#10B981] w-4.5 h-4.5 bg-slate-950"
                    />
                    <label htmlFor="tagGa4" className="text-xs text-slate-300 cursor-pointer font-medium">GA4 Tag</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="tagMetaPixel"
                      checked={tagMetaPixel}
                      onChange={(e) => setTagMetaPixel(e.target.checked)}
                      className="rounded border-slate-800 text-[#10B981] focus:ring-[#10B981] w-4.5 h-4.5 bg-slate-950"
                    />
                    <label htmlFor="tagMetaPixel" className="text-xs text-slate-300 cursor-pointer font-medium">Facebook Pixel</label>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-[#10B981] hover:bg-[#22C55E] disabled:opacity-50 text-[#08130F] font-bold px-6 py-2.5 rounded-lg text-sm shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              {loading ? 'Salvando...' : 'Cadastrar Lead & Diagnóstico'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
