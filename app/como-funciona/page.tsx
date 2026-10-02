export const runtime = 'edge';

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Smartphone, Zap, MessageSquare, ShieldCheck, CheckCircle2,
  XCircle, Clock, ArrowRight, HelpCircle, ArrowUpRight, Flame,
  TrendingDown, Check, MousePointerClick
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Como Funcionam os Anúncios no Google para Assistências Técnicas • Eixo Digital',
  description: 'Guia visual prático: como captar clientes com urgência no Google e por que 90% das empresas perdem dinheiro com sites lentos.',
};

export default function ComoFuncionaPage() {
  const MEU_NUMERO_WHATSAPP = '5511944530448';
  const SITE_EIXO = 'https://eixodigitalbr.com.br';

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800 antialiased font-inter">
      <div className="max-w-[880px] mx-auto bg-white sm:my-8 shadow-sm sm:rounded-xl overflow-hidden">

        {/* ── Topo / Header ────────────────────────────────────────────── */}
        <header className="px-5 sm:px-10 pt-8 sm:pt-12 pb-6 border-b border-zinc-200">
          <div className="flex items-center justify-between gap-4 mb-6">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <div className="w-8 h-8 rounded bg-emerald-800 text-white flex items-center justify-center font-black text-sm shrink-0">
                E
              </div>
              <div>
                <span className="text-sm font-bold text-zinc-900 block leading-tight">Eixo Digital</span>
                <span className="text-[10px] text-zinc-500 block leading-tight">Presença &amp; Captação de Serviços Locais</span>
              </div>
            </Link>

            <a
              href={`https://wa.me/${MEU_NUMERO_WHATSAPP}?text=${encodeURIComponent('Olá Douglas! Li o guia de como funciona o Google Ads e queria tirar umas dúvidas.')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md px-3 py-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
              <span>Falar no WhatsApp</span>
            </a>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold mb-3">
            <Zap className="w-3.5 h-3.5 text-emerald-700" />
            <span>Guia Visual Prático · Leitura de 3 Minutos</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-zinc-900 leading-tight tracking-tight mb-3">
            Como funcionam os anúncios no Google e onde 90% das assistências erram
          </h1>

          <p className="text-sm sm:text-base text-zinc-650 leading-relaxed max-w-[65ch]">
            O passo a passo transparente para quem nunca anunciou ou já tentou e não teve retorno: entenda por que o Google no celular é a maior fonte de clientes urgentes do mercado local.
          </p>
        </header>

        <main className="px-5 sm:px-10 py-8 sm:py-10 space-y-10 sm:space-y-12">

          {/* ── ETAPA 1: A Anatomia do Anúncio de Urgência no Smartphone ── */}
          <section className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-5 sm:p-6 border-b border-zinc-200 bg-zinc-50/70">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800 block mb-1">
                Etapa 01 · A Decisão no Celular
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight leading-snug">
                O que o cliente vê quando precisa de conserto urgente
              </h2>
              <p className="text-sm text-zinc-650 mt-1 max-w-[65ch]">
                Ninguém acorda com vontade de contratar conserto de geladeira ou máquina de lavar. A pessoa só pesquisa quando tem um problema urgente. Veja o que acontece na tela do smartphone:
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              {/* Mockup da Busca do Google */}
              <div className="max-w-md mx-auto bg-zinc-50 border-2 border-zinc-300 rounded-2xl p-4 shadow-sm">
                {/* Barra de Busca Google */}
                <div className="bg-white rounded-full px-4 py-2.5 border border-zinc-200 flex items-center gap-2 mb-4 shadow-xs">
                  <span className="text-zinc-400">🔍</span>
                  <span className="text-xs text-zinc-800 font-medium">conserto de lava e seca urgente</span>
                </div>

                {/* Resultado Patrocinado 1 (O Vencedor) */}
                <div className="bg-white rounded-xl p-3.5 border-2 border-emerald-600/80 mb-3 shadow-xs relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                      Patrocinado · 1º Lugar
                    </span>
                    <span className="text-[10px] text-zinc-400">www.suaassistencia.com.br</span>
                  </div>

                  <h4 className="text-sm font-bold text-blue-700 hover:underline leading-tight mb-1">
                    Conserto de Máquinas de Lavar e Lava e Seca | Atendimento Hoje
                  </h4>

                  <p className="text-[11px] text-zinc-650 leading-relaxed mb-2.5">
                    Técnicos a domicílio na sua região. Peças originais com garantia por escrito. Atendimento rápido pelo WhatsApp sem espera.
                  </p>

                  <div className="flex items-center gap-2 pt-1 border-t border-zinc-100">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                      💬 Chamar no WhatsApp
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-650 bg-zinc-50 px-2 py-1 rounded border border-zinc-200">
                      📞 Ligar Agora
                    </span>
                  </div>

                  {/* Indicador de impacto */}
                  <div className="absolute -top-2.5 -right-2 bg-emerald-800 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                    Mais de 70% dos cliques
                  </div>
                </div>

                {/* Resultado 2 */}
                <div className="bg-white/80 rounded-xl p-3 border border-zinc-200 opacity-60">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded block mb-1 w-fit">
                    Patrocinado · 2º Lugar
                  </span>
                  <div className="h-3 w-3/4 bg-zinc-200 rounded mb-1.5" />
                  <div className="h-2.5 w-full bg-zinc-100 rounded" />
                </div>
              </div>

              {/* Conclusão Factual da Etapa 1 */}
              <div className="border-l-3 border-emerald-700 bg-emerald-50/50 p-4 rounded-r-lg">
                <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
                  <strong>O segredo do Google:</strong> Diferente do Instagram (onde as pessoas estão se distraindo e vendo fotos), no Google o cliente está com a <strong>intenção de compra no pico máximo</strong>. Quem aparece no topo com botão direto de WhatsApp fica com os melhores serviços do dia.
                </p>
              </div>
            </div>
          </section>

          {/* ── ETAPA 2: O Cemitério dos Sites Lentos no Celular ── */}
          <section className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-5 sm:p-6 border-b border-zinc-200 bg-zinc-50/70">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800 block mb-1">
                Etapa 02 · Onde Quase Todos Erram
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight leading-snug">
                Por que 90% das pessoas perdem dinheiro com sites lentos no 4G
              </h2>
              <p className="text-sm text-zinc-650 mt-1 max-w-[65ch]">
                Muitos empresários pagam anúncio no Google e reclamam que não tiveram retorno. Na grande maioria das vezes, a culpa não é do Google: é do site que demora para abrir no celular.
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lado A: O Erro Comum */}
                <div className="border border-rose-200 rounded-xl p-4 bg-rose-50/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-rose-100">
                      <span className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Site Comum / Tradicional</span>
                      </span>
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
                        Perde Dinheiro
                      </span>
                    </div>

                    <div className="space-y-3 text-xs text-zinc-700">
                      <div>
                        <strong className="block text-zinc-900">Tempo de Carga no Celular:</strong>
                        <span className="text-rose-700 font-bold text-sm">5 a 8 segundos</span> no 4G.
                      </div>

                      <div>
                        <strong className="block text-zinc-900">O que acontece com o cliente:</strong>
                        <p className="text-zinc-600 mt-0.5">
                          A pessoa não espera: fecha a aba e clica no próximo anúncio da lista.
                        </p>
                      </div>

                      <div>
                        <strong className="block text-zinc-900">Resultado Comercial:</strong>
                        <p className="text-rose-800 font-semibold bg-rose-100/70 p-2 rounded">
                          Mais de 55% dos clientes desistem antes de ver o seu telefone. Você paga pelo clique no Google, mas o telefone não toca.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lado B: O Padrão Eixo Digital */}
                <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/40 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-100">
                      <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Página Ultra-Rápida Eixo</span>
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                        Máxima Conversão
                      </span>
                    </div>

                    <div className="space-y-3 text-xs text-zinc-700">
                      <div>
                        <strong className="block text-zinc-900">Tempo de Carga no Celular:</strong>
                        <span className="text-emerald-800 font-bold text-sm">Menos de 1 segundo (&lt; 1s)</span>.
                      </div>

                      <div>
                        <strong className="block text-zinc-900">O que acontece com o cliente:</strong>
                        <p className="text-zinc-600 mt-0.5">
                          Abre instantaneamente com botão grande de WhatsApp bem na frente dos olhos.
                        </p>
                      </div>

                      <div>
                        <strong className="block text-zinc-900">Resultado Comercial:</strong>
                        <p className="text-emerald-950 font-semibold bg-emerald-100/80 p-2 rounded">
                          Praticamente zero perda de cliques. A pessoa já cai conversando com a sua assistência para passar o endereço.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conclusão Factual da Etapa 2 */}
              <div className="border-l-3 border-emerald-700 bg-emerald-50/50 p-4 rounded-r-lg">
                <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
                  <strong>A regra de ouro:</strong> Nós não criamos sites pesados com 20 páginas que ninguém lê. Criamos <strong>páginas comerciais diretas para celular</strong>, feitas exclusivamente para transformar quem clica no Google em conversa iniciada no seu WhatsApp.
                </p>
              </div>
            </div>
          </section>

          {/* ── ETAPA 3: O Ciclo do Rastreamento Inteligente ── */}
          <section className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-5 sm:p-6 border-b border-zinc-200 bg-zinc-50/70">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800 block mb-1">
                Etapa 03 · Inteligência de Otimização
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight leading-snug">
                Como a inteligência do Google aprende a trazer clientes mais baratos
              </h2>
              <p className="text-sm text-zinc-650 mt-1 max-w-[65ch]">
                Não basta colocar anúncio e torcer: instalamos um rastreamento que avisa o Google toda vez que alguém clica para conversar no seu WhatsApp.
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              {/* Infográfico dos 4 Passos do Rastreamento */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-center">
                  <div className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold text-xs mx-auto flex items-center justify-center mb-1.5">
                    1
                  </div>
                  <strong className="block text-zinc-900 mb-0.5">O Cliente Clica</strong>
                  <p className="text-[11px] text-zinc-500">Busca no Google e clica no seu anúncio.</p>
                </div>

                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-center">
                  <div className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold text-xs mx-auto flex items-center justify-center mb-1.5">
                    2
                  </div>
                  <strong className="block text-zinc-900 mb-0.5">Abre em 1s</strong>
                  <p className="text-[11px] text-zinc-500">Página carrega direto no celular.</p>
                </div>

                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-center">
                  <div className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold text-xs mx-auto flex items-center justify-center mb-1.5">
                    3
                  </div>
                  <strong className="block text-zinc-900 mb-0.5">Chama no Zap</strong>
                  <p className="text-[11px] text-zinc-500">Clica para pedir o orçamento.</p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                  <div className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold text-xs mx-auto flex items-center justify-center mb-1.5">
                    4
                  </div>
                  <strong className="block text-emerald-950 mb-0.5">Aviso ao Google</strong>
                  <p className="text-[11px] text-emerald-800 font-medium">A tag registra a conversão real.</p>
                </div>
              </div>

              {/* Conclusão Factual da Etapa 3 */}
              <div className="border-l-3 border-emerald-700 bg-emerald-50/50 p-4 rounded-r-lg">
                <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
                  <strong>O que você ganha com isso:</strong> O Google entende quais palavras e horários realmente trazem dinheiro para a sua empresa e para de gastar com quem é apenas curioso. Com as semanas, <strong>o seu custo por orçamento fica cada vez mais barato</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* ── ETAPA 4: As 5 Dúvidas Mais Comuns de Quem Nunca Anunciou ── */}
          <section className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-5 sm:p-6 border-b border-zinc-200 bg-zinc-50/70">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800 block mb-1">
                Etapa 04 · Dúvidas Frequentes
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight leading-snug">
                Perguntas e respostas de quem nunca anunciou no Google
              </h2>
            </div>

            <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
              <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50/50">
                <h4 className="font-bold text-zinc-900 text-sm mb-1">
                  1. Quanto eu preciso investir no Google?
                </h4>
                <p className="text-zinc-650 leading-relaxed">
                  Você tem controle total do caixa. Recomendamos começar com um teste de <strong>R$ 25 a R$ 35 por dia</strong>. O saldo é pago diretamente para o Google (via boleto ou cartão) e você só é cobrado quando alguém de fato clica para solicitar orçamento.
                </p>
              </div>

              <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50/50">
                <h4 className="font-bold text-zinc-900 text-sm mb-1">
                  2. Tem fidelidade ou contrato que me prende por 1 ano?
                </h4>
                <p className="text-zinc-650 leading-relaxed">
                  <strong>Não. Zero fidelidade.</strong> Acreditamos em parceria por resultado prático, não por amarras contratuais. Você tem total liberdade para pausar, ajustar ou parar quando quiser.
                </p>
              </div>

              <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50/50">
                <h4 className="font-bold text-zinc-900 text-sm mb-1">
                  3. Em quanto tempo os anúncios começam a rodar?
                </h4>
                <p className="text-zinc-650 leading-relaxed">
                  Colocamos toda a sua estrutura no ar (campanha no Google Ads + página ultra-rápida de WhatsApp + tags de rastreamento) em até <strong>48 horas úteis</strong>, sem reuniões demoradas.
                </p>
              </div>

              <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50/50">
                <h4 className="font-bold text-zinc-900 text-sm mb-1">
                  4. Eu preciso ter loja física ou ponto comercial aberto?
                </h4>
                <p className="text-zinc-650 leading-relaxed">
                  Não. A grande maioria das assistências atende a domicílio no raio de 35 km. Os anúncios são configurados para quem pesquisa conserto na sua cidade e redondezas.
                </p>
              </div>

              <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50/50">
                <h4 className="font-bold text-zinc-900 text-sm mb-1">
                  5. E se a minha cidade já tiver concorrentes anunciando?
                </h4>
                <p className="text-zinc-650 leading-relaxed">
                  Isso é excelente: prova que tem muita gente quebrando aparelho e chamando técnico todos os dias. Com a nossa página ultra-rápida, você ganha nota máxima de qualidade no Google, o que faz você <strong>aparecer no topo pagando menos por clique</strong> do que os concorrentes com sites lentos.
                </p>
              </div>
            </div>
          </section>

          {/* ── Box de Ação & CTA Final ── */}
          <section className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-6 sm:p-8 text-center space-y-4">
            <h3 className="text-xl sm:text-2xl font-black text-zinc-900">
              Quer estruturar a sua assistência técnica no Google?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-650 max-w-lg mx-auto leading-relaxed">
              Mapeamos o raio da sua cidade, ativamos seus anúncios e colocamos sua página rápida no ar em 48 horas úteis.
            </p>

            <a
              href={`https://wa.me/${MEU_NUMERO_WHATSAPP}?text=${encodeURIComponent('Olá Douglas! Li o guia de como funciona o Google Ads e páginas rápidas. Quero ver como funciona para a minha assistência.')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold px-8 py-4 rounded-xl transition-all text-sm cursor-pointer shadow-sm hover:shadow-md"
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>Conversar com o Douglas no WhatsApp</span>
            </a>

            <div className="pt-2">
              <a
                href={SITE_EIXO}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-emerald-800 underline underline-offset-4 decoration-zinc-300 font-medium"
              >
                <span>Conhecer o site oficial da Eixo Digital</span>
                <ArrowUpRight className="w-3 h-3 text-zinc-400" />
              </a>
            </div>
          </section>

        </main>

        {/* ── Rodapé ────────────────────────────────────────────── */}
        <footer className="px-5 sm:px-10 py-5 border-t border-zinc-200 text-xs text-zinc-500 flex flex-wrap items-center justify-between gap-2 bg-zinc-50">
          <span>© Eixo Digital · Presença &amp; Captação de Serviços Locais</span>
          <Link href="/" className="hover:underline">Voltar para o início</Link>
        </footer>

      </div>
    </div>
  );
}
