'use client';

import React, { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { ScoutJSONFormat } from '@/lib/types';
import { saveLocalBuscaAndLeads } from '@/lib/storage';
import { importScoutDataToSupabase } from '@/lib/supabase-service';
import { gerarMensagemPadrao } from '@/lib/mensagem-template';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
    };
    reader.readAsText(file);
  };

  const handleProcessImport = async () => {
    setError(null);
    setSuccessMsg(null);
    if (!jsonText.trim()) {
      setError('Por favor, selecione um arquivo JSON ou cole o conteúdo do EIXO-SCOUT.');
      return;
    }

    try {
      setLoading(true);
      const parsed: ScoutJSONFormat = JSON.parse(jsonText);

      if (!parsed.nicho || !parsed.cidade || !Array.isArray(parsed.ranking)) {
        throw new Error('Formato do JSON inválido. Verifique se o arquivo foi gerado pelo EIXO-SCOUT.');
      }

      // Tentar salvar primeiramente no Supabase real
      try {
        const result = await importScoutDataToSupabase(parsed);
        setSuccessMsg(`Sucesso! ${result.leadsCount} empresas importadas para o Supabase Postgres!`);
      } catch (sbErr: any) {
        console.warn('Fallback para LocalStorage devido a erro no Supabase:', sbErr);
        // Fallback local se chaves do Supabase ainda não estiverem configuradas
        const buscaId = 'busca_' + Date.now();
        saveLocalBuscaAndLeads(
          {
            id: buscaId,
            nicho: parsed.nicho,
            cidade: parsed.cidade,
            data_busca: parsed.data_busca || new Date().toISOString(),
            total_encontradas: parsed.total_encontradas || parsed.ranking.length,
            resumo_json: parsed.resumo || { alto: 0, medio: 0, baixo: 0 },
            created_at: new Date().toISOString()
          },
          parsed.ranking.map((item, idx) => ({
            id: 'lead_' + Date.now() + '_' + idx,
            busca_id: buscaId,
            nome: item.nome,
            telefone: item.telefone,
            site: item.site,
            gmb_nota: item.gmb?.nota ?? null,
            gmb_avaliacoes: item.gmb?.avaliacoes ?? null,
            gmb_verificado: item.gmb?.verificado ?? false,
            site_https: item.site_auditoria?.https ?? false,
            site_responsivo: item.site_auditoria?.responsivo ?? false,
            instagram: item.redes_sociais?.instagram ?? null,
            facebook: item.redes_sociais?.facebook ?? null,
            score_pontos: item.score?.pontos ?? 0,
            score_nivel: item.score?.nivel ?? 'medio',
            score_detalhes: item.score?.detalhes ?? [],
            posicao_maps: item.posicao_maps,
            status_funil: 'Novo',
            // O item do scout guarda a nota em `gmb.nota`; passar o item cru
            // deixava `gmb_nota` undefined e a nota nunca entrava na mensagem.
            mensagem_sugerida: item.mensagem_sugerida || gerarMensagemPadrao(
              {
                nome: item.nome,
                posicao_maps: item.posicao_maps,
                gmb_nota: item.gmb?.nota ?? null,
              },
              parsed.nicho,
              parsed.cidade
            ),
            mensagem_editada: null,
            data_contato: null,
            notas: null,
            slug: `${item.nome.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`,
            created_at: new Date().toISOString()
          }))
        );
        setSuccessMsg(`Importado localmente com sucesso! (${parsed.ranking.length} empresas)`);
      }

      setTimeout(() => {
        setLoading(false);
        onSuccess();
        onClose();
      }, 1200);

    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Erro ao processar JSON');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl p-6 shadow-2xl space-y-5 text-slate-100">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-bold">Importar Busca do EIXO-SCOUT</h2>
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

        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-300">
            1. Carregar arquivo JSON gerado pelo EIXO-SCOUT:
          </label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer bg-slate-950 p-2 rounded-lg border border-slate-800"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            Ou cole o conteúdo JSON diretamente aqui:
          </label>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='{"nicho": "odontologia", "cidade": "Jundiaí/SP", ...}'
            rows={8}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleProcessImport}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
          >
            <FileText className="w-4 h-4" />
            {loading ? 'Importando...' : 'Processar & Salvar'}
          </button>
        </div>

      </div>
    </div>
  );
};
