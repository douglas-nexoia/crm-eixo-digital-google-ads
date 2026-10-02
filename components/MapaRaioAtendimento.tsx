'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Compass, CheckCircle2, Car, Loader2 } from 'lucide-react';
import { obterDadosCobertura } from '@/lib/cidades-coordenadas';

interface MapaRaioAtendimentoProps {
  cidade?: string | null;
  nomeEmpresa: string;
  nicho?: string | null;
}

export function MapaRaioAtendimento({ cidade, nomeEmpresa }: MapaRaioAtendimentoProps) {
  const [raioSelecionado, setRaioSelecionado] = useState<number>(35);
  const [carregando, setCarregando] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const cobertura = obterDadosCobertura(cidade);

  // Inicialização e montagem do mapa interativo via Leaflet + CARTO Voyager
  useEffect(() => {
    let ativo = true;

    async function carregarLeafletEMapa() {
      if (typeof window === 'undefined') return;

      // 1. Injetar CSS do Leaflet se necessário
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // 2. Injetar JS do Leaflet se necessário
      if (!(window as any).L) {
        await new Promise<void>((resolve, reject) => {
          const scriptExistente = document.getElementById('leaflet-js');
          if (scriptExistente) {
            scriptExistente.addEventListener('load', () => resolve());
            return;
          }
          const script = document.createElement('script');
          script.id = 'leaflet-js';
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => resolve();
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      if (!ativo) return;
      const L = (window as any).L;
      if (!L || !containerRef.current) return;

      // Destrói instância anterior se existir
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      // Inicializa o mapa com foco na coordenada da cidade
      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false, // Não trava o scroll da página no celular
      }).setView([cobertura.lat, cobertura.lon], 10);

      // Controle de zoom no canto superior direito
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Tiles do CARTO Voyager (ultra-rápidos, estética Google Maps, sem tela cinza)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Círculo sombreado do Raio de Atendimento Real (35 km)
      const circle = L.circle([cobertura.lat, cobertura.lon], {
        radius: raioSelecionado * 1000,
        color: '#047857',      // Borda verde esmeralda
        fillColor: '#10b981',  // Preenchimento translúcido
        fillOpacity: 0.16,
        weight: 2.5,
        dashArray: '6, 6',
      }).addTo(map);

      circleRef.current = circle;

      // Pino Central da Empresa
      const customIcon = L.divIcon({
        className: 'custom-pin-base',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(16, 185, 129, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 24px; height: 24px; border-radius: 50%; background: #065f46; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
              <div style="width: 7px; height: 7px; border-radius: 50%; background: #ffffff;"></div>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const marker = L.marker([cobertura.lat, cobertura.lon], { icon: customIcon }).addTo(map);
      markerRef.current = marker;

      // Enquadra o zoom perfeitamente para exibir todo o círculo de 35 km
      map.fitBounds(circle.getBounds(), { padding: [25, 25] });

      mapRef.current = map;
      setCarregando(false);
    }

    carregarLeafletEMapa();

    return () => {
      ativo = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [cobertura.lat, cobertura.lon]);

  // Atualiza o raio e reenquadra o mapa quando o usuário clica nos botões de km
  useEffect(() => {
    if (circleRef.current && mapRef.current) {
      circleRef.current.setRadius(raioSelecionado * 1000);
      mapRef.current.fitBounds(circleRef.current.getBounds(), {
        padding: [25, 25],
        animate: true,
      });
    }
  }, [raioSelecionado]);

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

        {/* Container do Mapa Leaflet */}
        <div className="relative w-full h-[320px] sm:h-[380px] overflow-hidden bg-zinc-100">
          <div ref={containerRef} className="w-full h-full z-0" />

          {/* Loader inicial enquanto tiles e Leaflet carregam */}
          {carregando && (
            <div className="absolute inset-0 bg-zinc-100/90 flex flex-col items-center justify-center gap-2 z-10">
              <Loader2 className="w-6 h-6 text-emerald-700 animate-spin" />
              <span className="text-xs text-zinc-600 font-medium">Carregando mapa da região...</span>
            </div>
          )}

          {/* Badge Flutuante no Topo Esquerdo */}
          <div className="absolute top-3 left-3 z-[400] pointer-events-none">
            <div className="bg-white/95 backdrop-blur-xs border border-zinc-200 rounded-lg p-2.5 shadow-sm text-xs">
              <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-[280px]">{nomeEmpresa}</span>
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-2">
                <span>Base: {cobertura.cidade}/{cobertura.estado}</span>
                <span>•</span>
                <span>~25 a 45 min de rota</span>
              </div>
            </div>
          </div>

          {/* Indicador Flutuante no Canto Inferior Direito */}
          <div className="absolute bottom-3 right-3 z-[400] pointer-events-none">
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
            <span>Principais Cidades e Regiões atendidas nesta rota:</span>
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
