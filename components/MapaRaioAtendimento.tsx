'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, Compass, CheckCircle2, Car } from 'lucide-react';
import { obterDadosCobertura } from '@/lib/cidades-coordenadas';

interface MapaRaioAtendimentoProps {
  cidade?: string | null;
  nomeEmpresa: string;
  nicho?: string | null;
}

export function MapaRaioAtendimento({ cidade, nomeEmpresa, nicho }: MapaRaioAtendimentoProps) {
  const [raioSelecionado, setRaioSelecionado] = useState<number>(35);

  const cobertura = obterDadosCobertura(cidade);

  // Calcula o bbox dinâmico conforme o raio selecionado
  const fatorGrauLat = (raioSelecionado / 111);
  const fatorGrauLon = (raioSelecionado / 102);

  const minLon = (cobertura.lon - fatorGrauLon).toFixed(4);
  const minLat = (cobertura.lat - fatorGrauLat).toFixed(4);
  const maxLon = (cobertura.lon + fatorGrauLon).toFixed(4);
  const maxLat = (cobertura.lat + fatorGrauLat).toFixed(4);

  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${cobertura.lat}%2C${cobertura.lon}`;

  return (
    <section className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
      {/* Cabeçalho do Bloco */}
      <div className="p-5 sm:p-6 border-b border-zinc-200 bg-zinc-50/70">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">
            01. Território &amp; Raio de Cobertura
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-100/80 text-emerald-900 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <Car className="w-3.5 h-3.5 text-emerald-700" />
            <span>Raio Ativo: ~{raioSelecionado} km a domicílio</span>
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight leading-snug">
          Onde a sua assistência técnica atende na prática
        </h2>
        <p className="text-sm text-zinc-650 mt-1 max-w-[65ch]">
          Assistências locais não dependem de clientes passando na calçada: a sua receita vem de técnicos rodando a domicílio em <strong>{cobertura.cidade}</strong> e nas cidades vizinhas.
        </p>
      </div>

      {/* Área do Mapa Interativo com Controles */}
      <div className="relative bg-zinc-100">
        {/* Seletor Rápido de Raio Operacional */}
        <div className="p-3 bg-white border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-zinc-700 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-emerald-700" />
            <span>Ajustar Raio de Atendimento:</span>
          </span>

          <div className="flex items-center gap-1.5">
            {[
              { km: 15, rotulo: '15 km (Centro e Bairros)' },
              { km: 35, rotulo: '35 km (Padrão Assistências)' },
              { km: 50, rotulo: '50 km (Cidades Vizinhas)' },
            ].map(opcao => (
              <button
                key={opcao.km}
                type="button"
                onClick={() => setRaioSelecionado(opcao.km)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  raioSelecionado === opcao.km
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-650 hover:bg-zinc-200 border border-zinc-200'
                }`}
              >
                {opcao.rotulo}
              </button>
            ))}
          </div>
        </div>

        {/* Mapa Embed OpenStreetMap com Bounding Box Real */}
        <div className="relative w-full h-[280px] sm:h-[340px] overflow-hidden bg-zinc-200">
          <iframe
            key={`${raioSelecionado}-${cobertura.cidade}`}
            title={`Mapa de cobertura em ${cobertura.cidade}`}
            src={osmUrl}
            className="w-full h-full border-0 filter contrast-[1.05]"
            loading="lazy"
          />

          {/* Badge Flutuante no Topo do Mapa */}
          <div className="absolute top-3 left-3 right-3 sm:right-auto flex flex-col gap-1.5 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-xs border border-zinc-200 rounded-lg p-2.5 shadow-sm text-xs">
              <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="truncate max-w-[220px] sm:max-w-none">{nomeEmpresa}</span>
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-2">
                <span>Base: {cobertura.cidade}/{cobertura.estado}</span>
                <span>•</span>
                <span>Tempo médio: ~25 a 45 min de rota</span>
              </div>
            </div>
          </div>

          {/* Indicador Flutuante no Canto Inferior */}
          <div className="absolute bottom-3 right-3 pointer-events-none">
            <div className="bg-emerald-900/90 text-white backdrop-blur-xs text-[11px] font-bold px-3 py-1.5 rounded-md shadow-md flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Zona de Captação Ativa: {raioSelecionado} km</span>
            </div>
          </div>
        </div>

        {/* Cidades Vizinhas & Rota Operacional */}
        <div className="p-4 sm:p-5 bg-white border-t border-zinc-200">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2.5">
            <Navigation className="w-3.5 h-3.5 text-emerald-700" />
            <span>Principais Cidades e Regiões dentro deste Raio:</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              {cobertura.cidade} (Sede)
            </span>
            {cobertura.cidadesVizinhas.map((vizinha, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-xs font-medium bg-zinc-50 text-zinc-750 border border-zinc-200 px-2.5 py-1 rounded-md"
              >
                <span>🚗</span>
                {vizinha}
              </span>
            ))}
          </div>

          {/* Fechamento Factual do Bloco 01 */}
          <div className="border-l-3 border-emerald-700 bg-emerald-50/50 p-3.5 sm:p-4 rounded-r-lg">
            <p className="text-xs sm:text-[13px] text-emerald-950 leading-relaxed">
              <strong>A pergunta que define o faturamento da sua assistência:</strong> Quando uma geladeira para de gelar, uma máquina de lavar trava ou o ar-condicionado quebra dentro desse raio de {raioSelecionado} km hoje, <strong>a sua empresa é a primeira que essa pessoa encontra no celular, ou essa ordem de serviço vai direto para o concorrente?</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
