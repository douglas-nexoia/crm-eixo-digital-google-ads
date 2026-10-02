'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Compass, CheckCircle2, Car, Loader2 } from 'lucide-react';
import { obterDadosCobertura } from '@/lib/cidades-coordenadas';
import { obterCenarioUrgencia } from '@/lib/cenarios-urgencia';

interface MapaRaioAtendimentoProps {
  cidade?: string | null;
  nomeEmpresa: string;
  nicho?: string | null;
}

export function MapaRaioAtendimento({ cidade, nomeEmpresa, nicho }: MapaRaioAtendimentoProps) {
  const [raioSelecionado, setRaioSelecionado] = useState<number>(35);
  const [carregando, setCarregando] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const cobertura = obterDadosCobertura(cidade);
  const cenario = obterCenarioUrgencia(nicho, nomeEmpresa);

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

      // Tiles do ESRI World Street Map (sem marca d'água, sem API key, alta definição)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
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
      <div className="p-5 sm:p-7 border-b border-zinc-200 bg-zinc-50/70">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-800">
            01. Território &amp; Raio de Cobertura
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-full">
            <Car className="w-4 h-4 text-emerald-700" />
            <span>Raio Ativo: ~{raioSelecionado} km</span>
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight leading-tight mb-2">
          Onde a sua assistência atende na prática
        </h2>
        <p className="text-base text-zinc-700 leading-relaxed max-w-[65ch]">
          Sua assistência roda a domicílio em <strong>{cobertura.cidade}</strong> e região. Quando alguém precisa de conserto urgente nessa área, quem essa pessoa encontra no celular?
        </p>
      </div>

      {/* Área do Mapa Interativo com Controles */}
      <div className="relative bg-zinc-100">
        {/* Seletor Rápido de Raio Operacional */}
        <div className="p-3.5 bg-white border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3">
          <span className="font-bold text-xs sm:text-sm text-zinc-800 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-emerald-700" />
            <span>Raio de Atendimento:</span>
          </span>

          <div className="flex items-center gap-2">
            {[
              { km: 15, rotulo: '15 km (Centro)' },
              { km: 35, rotulo: '35 km (Padrão)' },
              { km: 50, rotulo: '50 km (Região)' },
            ].map(opcao => (
              <button
                key={opcao.km}
                type="button"
                onClick={() => setRaioSelecionado(opcao.km)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  raioSelecionado === opcao.km
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
                }`}
              >
                {opcao.rotulo}
              </button>
            ))}
          </div>
        </div>

        {/* Container do Mapa Leaflet */}
        <div className="relative w-full h-[320px] sm:h-[400px] overflow-hidden bg-zinc-100">
          <div ref={containerRef} className="w-full h-full z-0" />

          {/* Loader inicial enquanto tiles e Leaflet carregam */}
          {carregando && (
            <div className="absolute inset-0 bg-zinc-100/90 flex flex-col items-center justify-center gap-2 z-10">
              <Loader2 className="w-6 h-6 text-emerald-700 animate-spin" />
              <span className="text-sm text-zinc-700 font-semibold">Carregando mapa da região...</span>
            </div>
          )}

          {/* Badge Flutuante no Topo Esquerdo */}
          <div className="absolute top-3 left-3 z-[400] pointer-events-none">
            <div className="bg-white/95 backdrop-blur-xs border border-zinc-200 rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-1.5 font-bold text-sm text-zinc-900">
                <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-[280px]">{nomeEmpresa}</span>
              </div>
              <div className="text-xs text-zinc-600 mt-0.5 flex items-center gap-2">
                <span>Base: {cobertura.cidade}/{cobertura.estado}</span>
                <span>•</span>
                <span>~25 a 45 min de rota</span>
              </div>
            </div>
          </div>

          {/* Indicador Flutuante no Canto Inferior Direito */}
          <div className="absolute bottom-3 right-3 z-[400] pointer-events-none">
            <div className="bg-emerald-900/90 text-white backdrop-blur-xs text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-lg shadow-md flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Zona de Captação: {raioSelecionado} km</span>
            </div>
          </div>
        </div>

        {/* Cidades Vizinhas & Rota Operacional */}
        <div className="p-5 sm:p-6 bg-white border-t border-zinc-200">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-800 uppercase tracking-wider mb-3">
            <Navigation className="w-4 h-4 text-emerald-700" />
            <span>Cidades e regiões atendidas nesta rota:</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              {cobertura.cidade} (Sede)
            </span>
            {cobertura.cidadesVizinhas.map((vizinha, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium bg-zinc-50 text-zinc-800 border border-zinc-200 px-3 py-1.5 rounded-lg"
              >
                <span>🚗</span>
                {vizinha}
              </span>
            ))}
          </div>

          {/* Fechamento Factual do Bloco 01 */}
          <div className="border-l-4 border-emerald-600 bg-emerald-50/70 p-4 sm:p-5 rounded-r-xl">
            <p className="text-sm sm:text-base text-emerald-950 font-medium leading-relaxed">
              <strong>A pergunta-chave:</strong> Quando {cenario.fraseProblema} dentro desse raio de {raioSelecionado} km hoje, <strong>a sua empresa é a primeira que essa pessoa encontra no celular, ou a ordem de serviço vai pro concorrente?</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
