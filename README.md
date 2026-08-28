# ramme.dev — landing page (POC 2)

Landing page de página única da **Ramme Tech**. Site estático puro: HTML + CSS + um
arquivo JS. Sem build step, sem framework, sem dependências de runtime.

---

## Direção de design

**Conceito: sala de controle / blueprint.**
A empresa entrega software que conecta o chão de fábrica à nuvem — a interface adota
a linguagem visual desse domínio: malha técnica de fundo, rótulos em monoespaçada,
seções numeradas (00–04) e um "console" escuro como elemento âncora.

**O tema escuro é o padrão.** Toda primeira visita abre em escuro, qualquer que seja a
configuração do sistema operacional; o claro só aparece se o visitante trocar no botão
do cabeçalho, e a escolha fica no `localStorage`.

| Tema | Leitura conceitual | Fundo | Quando |
| --- | --- | --- | --- |
| Escuro | sala de controle | `#060b10` | padrão |
| Claro | blueprint | `#f4f7fa` | só por escolha explícita |

Como isso é montado — em três lugares que precisam concordar:

```css
:root                            { /* claro */ }
:root:not([data-theme="light"])  { /* escuro — vence por especificidade */ }
```

```html
<meta name="color-scheme" content="dark light">
<meta name="theme-color" content="#060b10">
<script>r.setAttribute('data-theme', localStorage.getItem('ramme-theme') || 'dark')</script>
```

O CSS sozinho já entrega escuro: sem JS, `data-theme` nunca é definido e o seletor
`:not([data-theme="light"])` casa. O script inline no `<head>` existe só para aplicar a
escolha salva antes da primeira pintura.

Consequência assumida: **o site deixou de respeitar `prefers-color-scheme`.** Era o
comportamento anterior e é a boa prática usual; foi trocado de propósito, porque o
escuro é a identidade da marca e a primeira impressão precisa ser estável. Para voltar
atrás, basta reenvolver o bloco escuro em `@media (prefers-color-scheme: dark)` e
devolver o `matchMedia` ao script inline.

### Decisões principais da primeira seção

1. **A representação visual é o diagrama da arquitetura real**, não um mockup genérico
   de dashboard. Três camadas — chão de fábrica → VectorHub (agente local) → nuvem
   (SysColect) — com conectores animados nos dois sentidos: eventos sobem, comandos
   descem. Comunica o diferencial técnico da empresa em um relance.
2. **Construído em HTML + CSS**, não em imagem. Consequências: nítido em qualquer
   densidade de tela, texto real (acessível, selecionável, traduzível, indexável),
   zero requisições e nenhum impacto no LCP.
3. **A dobra é resolvida inteira**: cabeçalho, mensagem, apresentação, CTA, visual e
   uma régua inferior com produtos e convite à rolagem. `100svb` evita o salto causado
   pela barra de endereço no mobile.
4. **Navegação numerada** (01–04) reforça a leitura de "página única" e serve de
   scrollspy (`aria-current`).

---

## Estrutura de arquivos

```
poc-site2/
├── index.html                    # página única: hero + cascas das seções + rodapé
├── robots.txt
├── sitemap.xml
└── assets/
    ├── css/
    │   ├── tokens.css            # design tokens + ordem das @layer (carregar 1º)
    │   ├── base.css              # reset, tipografia, foco, utilitários
    │   ├── layout.css            # container, header/nav, casca das seções, rodapé
    │   ├── components.css        # botões, chips, eyebrow, pista de rolagem
    │   └── sections/
    │       ├── hero.css          # seção 00
    │       ├── solucoes.css      # seção 01
    │       ├── processo.css      # seção 02
    │       ├── sobre.css         # seção 03
    │       └── contato.css       # seção 04
    ├── js/
    │   └── main.js               # tema, menu, scrollspy, reveal
    └── img/
        ├── favicon.svg
        └── og-cover.png          # 1200×630, gerado a partir do próprio hero
```

### Por que CSS em vários arquivos

A ordem da cascata é declarada uma única vez em `tokens.css`:

```css
@layer reset, tokens, base, layout, components, sections, utilities;
```

Com isso a ordem dos `<link>` deixa de importar e cada seção futura vira um arquivo
isolado — sem risco de uma regra nova sobrescrever outra por acidente. Os arquivos são
pequenos (poucos KB cada) e o Firebase Hosting serve por HTTP/2, então o custo de
requisições paralelas é irrelevante. Se em algum momento o número de arquivos crescer
demais, basta concatená-los no deploy — nenhuma mudança de código é necessária.

---

## Seção 01 — Soluções

As três frentes são apresentadas como **estações numeradas de um eixo horizontal**:
cada coluna abre com `[nó] ──── [etiqueta]`, seguida de título, descrição, ficha
técnica (`O que entra`) e link. É continuidade deliberada com o console do hero — lá as
três camadas aparecem empilhadas e conectadas; aqui a mesma gramática se repete na
horizontal.

O formato foi escolhido por altura: em linhas empilhadas a seção passava de 1.500 px e
consumia mais de uma tela inteira. Em colunas, cabe em pouco mais de uma dobra.

Dois detalhes de implementação:

- `repeat(auto-fit, minmax(min(100%, 17rem), 1fr))` resolve os três breakpoints sem
  nenhuma media query — 3 colunas no desktop, 2 no tablet, 1 no celular.
- `.solucao` é flex em coluna e o link recebe `margin-block-start: auto`, o que alinha
  os três links na mesma base mesmo com fichas de tamanhos diferentes. Com `display:
  grid` + `align-content: start` isso não funcionaria: não sobraria espaço livre para
  a margem automática consumir.

## Seção 02 — Processo

Substituiu a antiga seção "Projetos". Motivo: a empresa ainda não tem entregas
concluídas — o SysColect está em construção junto a um cliente-parceiro —, e uma
lista de casos seria propaganda enganosa. Processo previsível é argumento honesto e,
para comprador industrial, vale tanto quanto case.

**O processo é desenhado como ciclo, não como reta.** Duas razões:

1. É mais verdadeiro — a etapa 04 (evolução contínua) volta para a 01, e uma sequência
   `01 → 02 → 03 → 04` não consegue dizer isso.
2. É a única geometria circular da página. A primeira versão desta seção usava colunas
   numeradas com nó e linha, exatamente como a seção 01, e as duas ficaram parecidas
   demais em sequência.

O anel é SVG puro: trilho, quatro nós nos pontos cardeais e um pulso que orbita via
`stroke-dasharray` + `stroke-dashoffset` animado. O pulso é o que indica o **sentido**
do ciclo — por isso não há setas. `prefers-reduced-motion` congela a órbita.

O texto é mínimo de propósito: cada etapa tem apenas número, nome e a entrega concreta
daquele passo em monoespaçada. O desenho carrega o resto.

**Layout em duas colunas** a partir de 75rem: texto (índice, título, chamada, fecho e
CTA) à esquerda, ciclo à direita. Antes a composição era centrada em largura total e a
seção passava de 1.100 px — não cabia em uma tela sem rolagem. Lado a lado ela fica em
704 px.

**O anel só aparece a partir de 1290px.** Abaixo disso não sobra largura para o arranjo
cardeal sem espremer os rótulos em três linhas — então ele é ocultado e ficam apenas as
quatro etapas. O bloco `@media (width < 80.625rem)` fica **depois** do `@container` no
arquivo: mesma especificidade, quem vem por último vence.

O número de colunas das etapas vem de **container query**, não de media query, porque a
largura disponível muda conforme o bloco esteja na coluna da direita ou ocupando a
largura inteira. São quatro etapas, e os únicos arranjos equilibrados são 1×4, 2×2 e
4×1 — nunca 3+1, que era o que o `auto-fit` produzia em 820px:

| Largura | Anel | Etapas |
| --- | --- | --- |
| 1440 / 1300 | visível | ao redor do anel |
| 1289 / 1200 | oculto | 2×2, na coluna direita |
| 1024 | oculto | 4×1, largura inteira |
| 820 | oculto | 2×2 |
| 390 | oculto | 1×4 |

Sem suporte a container query, as etapas caem em coluna única — degradação aceitável.

A seção usa o modificador `.section--tela` (em `layout.css`), reutilizável:

```css
min-block-size: min(44rem, calc(100svb - var(--header-h)));
padding-block: clamp(2.5rem, 6vh, 5rem);
```

O `min()` segura as duas pontas — nunca passa da altura da janela (não exige rolagem) e
nunca estica além de 44rem (não vira vazio em monitor alto). Medido em 1920×1080,
1536×864, 1440×900, 1366×768 e 1280×800: cabe em todos.

A âncora mudou de `#projetos` para `#processo` e o rótulo da navegação, de "Projetos"
para "Processo". Se um dia houver casos reais, o formato de mini-console (barra com id
+ etiqueta, fio de luz no topo, superfície escura nos dois temas) pode ser reconstruído
como uma seção nova.

## Seção 03 — A empresa

Depois de duas seções diagramáticas (eixo horizontal na 01, anel na 02), esta **muda de
registro: o visual é a própria tipografia**. Repetir diagrama pela terceira vez seria
monótono; aqui a declaração ocupa o lugar do desenho.

Único momento da página em que o **monograma da marca aparece em escala grande** — como
marca d'água a 6% de opacidade, sangrando pela direita. Entrou no sprite como
`i-brand-glyph`: é o símbolo sem o quadrado de fundo, com `viewBox` recortado na caixa
do glifo, para poder ser tingido por `currentColor`.

A "ficha" no rodapé da seção é um `<dl>` — semântica correta para pares rótulo/valor —
apresentado como placa de identificação: três campos separados por filete. A coordenada
`29°41′S · 51°08′W` é a de Novo Hamburgo: ancora a base geograficamente sem precisar de
mapa, na mesma linguagem de instrumento do resto do site.

> **Confirmar antes de publicar:** os nomes (Bruno e Artur) e os endereços dos perfis
> vieram do site atual em `../website`. A expressão "time enxuto" também assume equipe
> pequena como posicionamento — se a leitura desejada for outra, é uma linha para trocar.

Altura: 704 px em todas as resoluções testadas, via `.section--tela`.

## Seção 04 — Contato

O formulário mora dentro de um **painel escuro — o mesmo console que abre a página no
hero**. A última seção fecha o arco visual da primeira: a conversa começa e termina na
mesma superfície.

Campos: **Nome** e **E-mail** obrigatórios, **Telefone** e **Observação** opcionais. A
coluna da esquerda oferece o caminho alternativo (e-mail direto com botão de copiar),
porque parte dos visitantes não preenche formulário.

### Envio — precisa ser configurado

O site é estático e não tem back-end. O formulário lê o atributo `data-endpoint` do
`<form data-formulario>`:

- **Com `data-endpoint`** — envia `POST` com JSON (`nome`, `email`, `telefone`,
  `observacao`) e trata os estados de enviando / sucesso / erro.
- **Sem `data-endpoint`** (estado atual) — cai para o cliente de e-mail do visitante,
  com assunto e corpo já preenchidos. Funciona, mas depende de o visitante ter cliente
  de e-mail configurado.

Para ligar um envio de verdade, o caminho natural é uma Cloud Function no projeto
Firebase que já hospeda o site (`syscolect-ramme-2`), gravando em Firestore e/ou
disparando e-mail. Basta então:

```html
<form class="formulario" data-formulario data-endpoint="https://.../contato" novalidate>
```

### Detalhes de implementação

- `novalidate` no form e **validação própria em JS**: mensagens em português, no visual
  do site, e controle de quando aparecem — só ao sair do campo, e a partir daí corrigem
  ao vivo. Sem isso, o balão nativo do navegador quebra o visual e a linguagem.
- Cada erro vive em `.campo__erro`, referenciado por `aria-describedby`, e o campo
  recebe `aria-invalid`. No envio inválido o foco vai para o primeiro campo com erro.
- O retorno do envio fica em um `role="status"`, para leitor de tela anunciar sozinho.
- **Campo-armadilha** (`name="setor"`, em `.sr-only` e fora da ordem de tabulação):
  preenchido, o envio é descartado em silêncio. Custo zero, pega robô simples.
- O botão de copiar usa a Clipboard API e cai para `execCommand` **tanto quando a API
  não existe quanto quando ela recusa** — o segundo caso acontece fora de contexto
  seguro e foi o que apareceu no teste.

Comportamentos verificados por automação: envio vazio marca os dois obrigatórios e foca
o primeiro; e-mail incompleto e telefone curto são recusados; formulário válido zera os
erros; armadilha preenchida não envia; botão de copiar confirma.

## Como adicionar novas seções

As quatro seções previstas estão prontas. Para acrescentar outra, o padrão é o mesmo:

1. **HTML** — `<section class="section" id="…" aria-labelledby="…-titulo">` com
   `.section__head` (índice + título + lead) e, se couber, `.section__foot`.
2. **CSS** — criar `assets/css/sections/<nome>.css` com as regras dentro de
   `@layer sections { … }` e adicionar o `<link>` no `<head>`.
3. **JS** — normalmente nenhum. A animação de entrada é declarativa (`.reveal`, com
   `--reveal-delay` opcional) e o scrollspy cobre toda seção com link na navegação.

Peças prontas: `.section--tela` (seção que cabe em uma tela), `.section--sunk` (fundo
alternado), `.section--defer` (adia render de seções pesadas), `.wrap`,
`.wrap--narrow`, `.mono`, `.sr-only`, `.reveal`, `.btn` (`--primary`, `--ghost`,
`--sm`), `.chip` / `.chip__logo`, `.chip-row`, `.eyebrow`, `.pulse-dot`, `.link-arrow`
(`--external`).

Atenção a uma armadilha da cascata: `.mono` vive na camada `utilities`, que vence as
camadas `components` e `sections`. Se um componente precisar da fonte monoespaçada com
corpo ou entreletras próprios, declare `font-family: var(--font-mono)` direto no
componente em vez de aplicar a classe `.mono` no HTML.

Outra: `--font-body` é o padrão herdado do `body`. Esquecer `font-family` num bloco de
texto narrativo produz silenciosamente Inter no lugar de Space Grotesk — sem sintoma no
código, só na tela.

Ícones: adicionar um `<symbol id="i-nome">` ao sprite no topo do `<body>` e usar
`<svg><use href="#i-nome" /></svg>`. Traço e preenchimento vêm do CSS.

**Marcas dos produtos.** SysColect e VectorHub estão no sprite como
`i-logo-syscolect` / `i-logo-vectorhub` e aparecem dentro do `.chip`, no lugar da
etiqueta textual. São formas preenchidas, não ícones de contorno: `.chip__logo`
sobrescreve o padrão global `svg { fill: none; stroke: currentColor }`. A cor vem de
`--logo-syscolect` / `--logo-vectorhub`, que trocam por tema.

---

## Uma seção por tela

Todas as seções usam `.section--tela`: `min-block-size: calc(100svb - var(--header-h))`,
conteúdo centrado. Fazer isso sem estragar as proporções exigiu que as medidas internas
**dependessem da altura da janela**, não só da largura — é o ponto principal:

```css
/* respiro que encolhe em janela baixa e cresce em janela alta */
--section-pad: clamp(1.5rem, 5svb, 5rem);
gap: clamp(0.4rem, 1.4svb, 0.75rem);
inline-size: clamp(9rem, min(42cqi, 34svb), 23rem);   /* anel do ciclo */
```

E dois degraus tipográficos, porque a escala `--step-*` só enxerga `vw`: numa janela
alta o texto já está no teto do `clamp` e sobra altura; numa janela baixa acontece o
inverso.

```css
@media (height <  46rem) { /* título e lead descem um degrau */ }
@media (height >= 58rem) { /* título, lead e conteúdo sobem um degrau */ }
```

**Armadilha:** os blocos `@media (height >= 58rem)` precisam ficar **no fim** de cada
arquivo de seção. Media query não altera especificidade — colocados antes, perdiam para
as regras seguintes de mesmo peso e simplesmente não aplicavam.

Folga (espaço vazio) medida por resolução:

| Resolução | Início | Soluções | Processo | Sobre | Contato |
| --- | --- | --- | --- | --- | --- |
| 1920×1080 | 78 | 147 | 324 | 350 | 287 |
| 1440×900 | 78 | 114 | 251 | 271 | 192 |
| 1366×768 | 78 | 15 | 184 | 162 | 91 |
| 1280×720 | 78 | 33 | 159 | 215 | 55 |

Nada estoura no desktop. **No celular as seções não cabem em uma tela** — e não devem:
com tudo empilhado, forçar isso exigiria corpo de texto pequeno demais. Lá o
`min-block-size` age apenas como piso e a seção cresce com o conteúdo.

## Posicionamento das âncoras

Ao clicar em um item do menu (ou no "Explorar" do hero), o offset é composto por duas
peças que **se somam** — foi a origem de um bug em que as seções paravam 107 px abaixo
do header:

```css
html    { scroll-padding-top: var(--header-h); }          /* só o header */
.section{ scroll-margin-block-start:
            calc(var(--space-l) - var(--section-pad)); }  /* alinha o conteúdo */
.section--tela,
.hero   { scroll-margin-block-start: 0; }                 /* alinha a borda */
```

A regra: **`scroll-padding-top` compensa apenas o header; o ajuste fino é `scroll-margin`
na própria seção.** Nunca colocar o recuo da seção nos dois lugares.

Por que duas estratégias diferentes:

- **Seção normal** — o `padding-block` generoso (até 9rem) faria a âncora parar numa
  tela quase vazia. O `calc()` cancela o padding da própria seção e devolve um respiro
  fixo, então continua correto se o padding mudar. Resultado: o índice `01 — SOLUÇÕES`
  pousa ~32 px abaixo do header.
- **`.section--tela`** — a seção já cabe inteira na tela e centra o próprio conteúdo;
  chegar pela borda superior é o alinhamento certo. Pousa colada no header.

Medido em 1440×900 e 390×844, nas quatro âncoras e no "Explorar".

## Acessibilidade

- Link "pular para o conteúdo" como primeiro elemento tabulável.
- Marcos semânticos (`header`, `nav`, `main`, `section[aria-labelledby]`, `footer`) e
  hierarquia de headings correta (um `h1`, um `h2` por seção).
- Foco visível padronizado (`:focus-visible`) com contraste garantido nos dois temas
  e dentro do console escuro.
- Menu mobile com `aria-expanded` / `aria-controls`, fechamento por `Esc`, clique fora
  e clique em link; o foco retorna ao botão.
- Alvos de toque de no mínimo 44 px nos botões e itens de navegação.
- `prefers-reduced-motion` desliga animações, rolagem suave e o reveal.
- Diagrama do hero descrito por `<figcaption class="sr-only">`; partes decorativas
  marcadas com `aria-hidden`.
- Paleta verificada para contraste AA (texto secundário ≥ 5:1 nos dois temas).

## SEO

- `lang="pt-BR"`, `title`, `meta description`, `canonical`, `robots`.
- Open Graph + Twitter Card com imagem 1200×630.
- JSON-LD `Organization` com endereço, e-mail e os dois produtos.
- `robots.txt` + `sitemap.xml`.
- Conteúdo do hero é texto real no HTML — inclusive o diagrama.

## Performance

- Sem bibliotecas. JS total: ~5 KB não minificado, `defer`.
- Nenhuma imagem acima da dobra: fundo, auras e diagrama são CSS/SVG inline.
- Sprite de ícones inline: zero requisições extras.
- Fontes: 3 famílias com poucos pesos, `preconnect` + `display=swap`.
- Script inline no `<head>` resolve o tema antes da primeira pintura (sem flash).

---

## Rodar localmente

```bash
python -m http.server 8080
# ou
npx serve .
```

## Publicar

O site atual (`../website`) usa Firebase Hosting no site `rammetec-site`
(projeto `syscolect-ramme-2`). Para promover esta POC, copiar `firebase.json`,
`.firebaserc` e o workflow de deploy do repositório `website`.

## Pendências conhecidas

- Ícones PNG (`apple-touch-icon`, 180×180) — hoje só existe o favicon SVG.
- Endpoint de envio do formulário de contato (hoje cai para o cliente de e-mail).
- Formulário de contato na seção 04 (hoje o CTA aponta para a âncora).
