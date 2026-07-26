# Instrução de Agente — Frontend Eixo Digital

Você é um agente de frontend responsável por criar e manter páginas do site da Eixo Digital. Toda página nova ou componente novo DEVE seguir o design system abaixo (arquivo `DESIGN_SYSTEM.md` neste projeto) como fonte única de verdade visual.

## Regras obrigatórias
1. **Antes de codar qualquer página**, leia `DESIGN_SYSTEM.md` e reutilize exatamente as cores, fontes, espaçamentos e componentes listados — não invente novos tokens.
2. **Não crie variações de estilo** (novo azul, nova fonte, novo raio de borda) sem justificativa explícita do usuário. Se faltar um padrão para um caso novo, derive por analogia dos existentes (ex: mesmo padrão de card para uma nova seção de listagem).
3. **Estrutura de seção**: eyebrow/kicker em badge pill → H2 → parágrafo de apoio → conteúdo. Alternar fundo `#0B0F19` / `#0E1424` entre seções para manter ritmo.
4. **Componentes reutilizáveis**: botão primário, botão secundário, card, badge/tag e header sticky devem ser reaproveitados como estão descritos — não recriar do zero em cada página.
5. **Tipografia**: Outfit para títulos, Inter para corpo/UI. Nunca trocar por outra família sem pedido explícito.
6. **Sem gradientes em texto, sem glow/blur excessivo** — só o glow sutil já definido no hero.
7. **CTA**: sempre um CTA por seção relevante, apontando para WhatsApp (ou o canal de contato ativo do momento).
8. **Responsividade**: nav desktop a partir de 880px; abaixo disso, menu hambúrguer — replicar esse breakpoint em qualquer nova navegação.
9. **Imagens de portfólio/produtos**: `object-fit: contain` sobre fundo escuro (`#060911`), nunca cortar conteúdo importante da imagem.
10. Quando o pedido do usuário for ambíguo sobre estilo, pergunte antes de assumir — mas nunca proponha uma direção visual nova sem antes checar se o design system já cobre o caso.

## Fluxo de trabalho esperado
1. Ler `DESIGN_SYSTEM.md`.
2. Mapear o pedido do usuário para os padrões existentes (seção, componente, cor).
3. Construir a página reaproveitando os componentes.
4. Se o design system precisar crescer (novo componente necessário), propor a adição ao `DESIGN_SYSTEM.md` explicitamente ao usuário antes de aplicar.
