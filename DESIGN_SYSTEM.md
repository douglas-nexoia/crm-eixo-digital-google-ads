# Eixo Digital — Design System

## Cores
- Fundo principal: `#0B0F19` (variante navy: `#0B1220`)
- Fundo alternado (seções secundárias): `#0E1424`
- Acento (marca): `#10B981` (verde-esmeralda). Alternativas: `#22C55E`, `#14B8A6`
- Texto principal: `#F1F5F9`
- Texto secundário: `#94A3B8`
- Texto terciário/desabilitado: `#64748B`
- Bordas: `rgba(255,255,255,0.08)` a `rgba(255,255,255,0.12)`
- Superfícies elevadas: `rgba(255,255,255,0.03)` a `rgba(255,255,255,0.05)`

## Tipografia
- Títulos: **Outfit** (600–800), letter-spacing negativo (-0.3px a -1px)
- Corpo/UI: **Inter** (400–600)
- Escala: H1 `clamp(34px,5.5vw,58px)`, H2 `clamp(28px,4vw,40px)`, H3 19–22px, body 15–18px

## Componentes
- **Botão primário**: fundo `accent`, texto `#08130F`, `border-radius:10px`, padding `16px 30px`, box-shadow com glow da cor de acento
- **Botão secundário**: transparente, borda `rgba(255,255,255,0.16)`, hover muda borda para `accent`
- **Cards**: `background: rgba(255,255,255,0.03)`, `border:1px solid rgba(255,255,255,0.08)`, `border-radius:16–20px`, padding generoso (26–34px)
- **Badges/tags**: `border-radius:999px`, fundo sutil, borda 1px, fonte 13–14px
- **Header**: sticky, `backdrop-filter:blur(12px)`, fundo `rgba(11,15,25,0.85)`, altura 76px
- Nav desktop ≥880px; abaixo disso, menu hambúrguer

## Padrões de seção
- Eyebrow/kicker: badge pill acima de cada H2 (ex: "A SOLUÇÃO", "SEJAMOS SINCEROS")
- Seções alternam fundo `#0B0F19` / `#0E1424` para criar ritmo visual
- Espaçamento vertical entre seções: 100–110px
- Largura de conteúdo: `max-width:1100–1200px`, centralizado

## Fontes (carregar no `<helmet>`)
```html
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
```

## Regras de uso
- Nunca usar gradiente em texto ou blobs/glow excessivos — só um glow sutil (blur 100px, opacity 0.12) no hero
- Um CTA por seção, sempre linkando pro WhatsApp
- Ícones: emoji simples (não substituir por libs de ícone), usados com moderação
- Imagens de portfólio: `object-fit: contain` sobre fundo `#060911` (nunca cortar o site mostrado)

## Como aplicar a novas páginas
Reusar exatamente estes valores de cor/fonte/espaçamento/componentes em qualquer nova página (Sobre, Serviços detalhado, Blog, etc.) para manter consistência com a Home.
