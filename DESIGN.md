# DESIGN.md — Party Radar

Como o Party Radar parece, fala e se comporta. Vale para pessoas e agentes de IA, junto com o
[`AGENTS.md`](AGENTS.md). Se uma tela pedir algo que contradiz este arquivo, pare e pergunte.

**Fontes da verdade, nesta ordem:**

1. `src/theme/party-radar.theme.ts`: cores do PO UI (tema escuro).
2. `src/styles.scss`: fontes, fundo e tokens próprios do Party Radar (`--pr-*`).
3. Este arquivo: o porquê, as regras de uso e o que ainda está em aberto.

Os valores abaixo copiam os arquivos de código para facilitar a leitura. Se divergirem,
**o código vale** e este arquivo deve ser corrigido no mesmo commit.

## 1. Identidade visual

### Personalidade

O Party Radar é o lugar onde o grupo vê **quem está online agora** e se junta. A interface
é um **painel de sinais**: escura como uma sala com o monitor ligado, com cor só onde há
alguém ativo. Ela soa como um amigo do grupo, não como um console técnico nem como uma
loja gamer cheia de neon.

- **Vivo, não barulhento:** a cor vem da presença dos amigos, não da decoração.
- **Direto:** uma ação principal por tela ("Chamar pra jogar", "Continuar com Discord").
- **Do grupo:** nomes, fotos e jogos dos amigos são o conteúdo; o app fica em segundo plano.

**O elemento memorável é o anel de radar**: um anel em volta do avatar, na cor do estado
de presença, que emite **uma onda** (como o eco de um radar) quando um amigo começa a jogar.
Toda a ousadia visual fica nele; o resto da interface é calmo e disciplinado.

Não use o ponto colorido no canto do avatar: ele é a marca registrada do Discord, e as
[diretrizes do Discord](https://discord.com/branding) proíbem copiar seus ícones de presença.

### Paleta

Tema único **escuro** no MVP (`PoThemeTypeEnum.dark`). Não existe modo claro por enquanto.

| Papel                    | Token PO UI                      | Valor     | Uso                                                  |
| ------------------------ | -------------------------------- | --------- | ---------------------------------------------------- |
| Fundo da página          | `--color-neutral-light-00`       | `#0E1117` | fundo de todas as telas                              |
| Superfície 1             | `--color-neutral-light-05`       | `#121722` | faixas, cabeçalho                                    |
| Superfície 2             | `--color-neutral-light-10`       | `#161B22` | cards, listas, modais                                |
| Superfície 3 / divisória | `--color-neutral-light-20`       | `#21262D` | hover de linha, divisórias                           |
| Borda / disabled         | `--color-neutral-light-30`       | `#30363D` | bordas decorativas, fundo de botão desabilitado      |
| Texto terciário          | `--color-neutral-mid-40`         | `#6E7681` | bordas de campo, ícones inativos (não use em texto)  |
| Texto secundário         | `--color-neutral-mid-60`         | `#8B949E` | legendas, horários, "jogando há 20 min"              |
| Texto principal          | `--color-neutral-dark-90`        | `#E6EDF3` | títulos e corpo                                      |
| Marca (violeta)          | `--color-brand-01-base`          | `#6E4BFF` | logo, grandes áreas de destaque sem texto            |
| Marca clara              | `--color-brand-01-light`         | `#A996FF` | foco, texto e ícone em violeta                       |
| Ação                     | `--color-action-default`         | `#8B6CFF` | botões do PO UI (hover `#A996FF`, pressed `#9A82FF`) |
| Ciano                    | `--color-brand-02-base`          | `#22D3EE` | links do PO UI, informação                           |
| Âmbar                    | `--color-brand-03-base`          | `#FBBF24` | conquistas e destaques do Wrapped                    |
| Positivo                 | `--color-feedback-positive-base` | `#22C55E` | sucesso, "jogando"                                   |
| Alerta                   | `--color-feedback-warning-base`  | `#F59E0B` | alerta, "ausente"                                    |
| Negativo                 | `--color-feedback-negative-base` | `#EF4444` | erro, ação destrutiva                                |

**Contraste medido** (WCAG, sobre `#0E1117`): texto principal 16:1 · secundário 6,1:1 ·
ciano 10,5:1 · âmbar 11,3:1 · positivo 8,3:1 · alerta 8,8:1 · negativo 5,0:1 (4,6:1 sobre card) ·
marca clara 7,6:1 · ação 5,1:1 (hover 7,6:1, pressed 6,3:1). **Reprovados:** marca base como
texto (3,7:1) e `mid-40` como texto (4,1:1).

> **Decisão (2026-10-16): cor de ação separada da marca.** O PO UI escreve o texto do botão
> primário em `--color-neutral-light-00` (`#0E1117`) sobre a cor de ação, e o texto do
> secundário na cor de ação sobre o fundo. Com a marca `#6E4BFF` isso dava 3,7:1 (2,7:1 no
> hover), abaixo de 4,5:1. A ação passou a `#8B6CFF` e, no tema escuro, o hover clareia em vez
> de escurecer. A marca `#6E4BFF` continua no logo e nas áreas sem texto. O teste
> `theme.spec.ts` mede esse contraste e falha se ele cair abaixo de 4,5:1.

### Tipografia

| Papel             | Fonte            | Pesos    | Onde                                              |
| ----------------- | ---------------- | -------- | ------------------------------------------------- |
| Títulos e números | **Chakra Petch** | 600, 700 | títulos de tela, nome do jogo, números do Wrapped |
| Texto e interface | **Manrope**      | 400–700  | todo o resto, inclusive componentes PO UI         |

- Carregadas do Google Fonts em `src/styles.scss`. As variáveis `--font-family-theme`,
  `--font-family-theme-bold` e `--font-family-heading` substituem a Roboto do PO UI.
- Chakra Petch tem cortes angulares de interface de jogo; use-a só em títulos curtos e
  números, nunca em parágrafos.
- **Escala** (tokens do PO UI, base 16 px):

| Token                 | Tamanho | Uso                                   |
| --------------------- | ------- | ------------------------------------- |
| `--font-size-xs`      | 12 px   | legenda mínima (nunca menor que isso) |
| `--font-size-sm`      | 14 px   | texto secundário, botões              |
| `--font-size-default` | 16 px   | corpo                                 |
| `--font-size-md`      | 20 px   | título de seção                       |
| `--font-size-lg`      | 24 px   | título de tela no mobile              |
| `--font-size-xl`      | 32 px   | título de tela no desktop             |
| `--font-size-2xl`     | 40 px   | número de destaque do Wrapped         |

- Altura de linha: corpo `--line-height-md` (150%), títulos `--line-height-xs` (130%).
- Linhas de texto corrido com até 70 caracteres (`max-width: 70ch`).

### Logo e ícones

- Logo: **provisório** — o nome "Party Radar" em Chakra Petch 700. O logo definitivo é
  pergunta em aberto (seção 8).
- Ícones: os do próprio PO UI (`p-icon`). Não misture bibliotecas de ícones.
- Logos de Discord, Google e Steam só nos botões e cards de conexão, seguindo as regras de
  marca de cada empresa (abaixo). Nunca recolorir, distorcer ou redesenhar esses logos.

### Botões de login de terceiros

Seguem as regras de marca dos provedores, **não** o botão primário do PO UI. Ficam com o
mesmo tamanho e peso visual entre si (exigência do Google), Discord primeiro.

| Botão                  | Fundo     | Borda                  | Texto                                   | Logo                    | Contraste |
| ---------------------- | --------- | ---------------------- | --------------------------------------- | ----------------------- | --------- |
| Continuar com Discord  | `#5865F2` | —                      | `#FFFFFF`, Manrope 600                  | símbolo oficial, branco | 4,6:1     |
| Continuar com o Google | `#131314` | 1 px interna `#8E918F` | `#E3E3E3`, **Google Sans Medium 14/20** | "G" oficial colorido    | 14,5:1    |

- Textos: o Google aceita só "Sign in / Sign up / Continue with Google" e suas traduções.
- Os logos vêm dos pacotes oficiais (Google: [diretrizes](https://developers.google.com/identity/branding-guidelines);
  Discord: [marca](https://discord.com/branding)) e ficam em `public/brands/`.
- Esses hex existem só no componente dos botões de login; é a única exceção à regra de
  "sem hex solto" (seção 6), porque as cores pertencem às marcas, não ao tema.

### Referência visual

As telas do MVP ficam no canvas "Party Radar — Telas do MVP". O canvas mostra a intenção;
este arquivo e o tema definem os valores.

## 2. Design tokens

### Cores semânticas

Use sempre o **papel**, nunca o hex. Os papéis próprios do Party Radar ficam em
`src/styles.scss`, com prefixo `--pr-`, e apontam para tokens do PO UI.

| Token (proposto)        | Aponta para                      | Significado        |
| ----------------------- | -------------------------------- | ------------------ |
| `--pr-surface-page`     | `--color-neutral-light-00`       | fundo da tela      |
| `--pr-surface-raised`   | `--color-neutral-light-10`       | card, modal        |
| `--pr-text`             | `--color-neutral-dark-90`        | texto principal    |
| `--pr-text-muted`       | `--color-neutral-mid-60`         | texto secundário   |
| `--pr-presence-playing` | `--color-feedback-positive-base` | jogando agora      |
| `--pr-presence-online`  | `--color-brand-02-base`          | online, sem jogo   |
| `--pr-presence-away`    | `--color-feedback-warning-base`  | ausente            |
| `--pr-presence-offline` | `--color-neutral-mid-40`         | offline            |
| `--pr-highlight`        | `--color-brand-03-base`          | conquista, Wrapped |

Os tokens `--pr-*` são criados na primeira tela que precisar deles, não antes.

### Espaçamento

Escala do PO UI. Não use valores soltos em px.

| Token           | Valor | Uso típico                             |
| --------------- | ----- | -------------------------------------- |
| `--spacing-xxs` | 4 px  | ícone ↔ texto                          |
| `--spacing-xs`  | 8 px  | itens dentro de um card                |
| `--spacing-sm`  | 16 px | padding de card, margem lateral mobile |
| `--spacing-md`  | 24 px | entre blocos                           |
| `--spacing-lg`  | 32 px | entre seções; margem lateral desktop   |
| `--spacing-xl`  | 40 px | respiro de tela vazia                  |

### Bordas e raios

O raio comunica hierarquia; não use o mesmo em tudo.

| Token                  | Valor  | Uso                               |
| ---------------------- | ------ | --------------------------------- |
| `--border-radius-md`   | 4 px   | botões e campos (padrão do PO UI) |
| `--border-radius-lg`   | 8 px   | cards e modais                    |
| `--border-radius-pill` | 400 px | chips de status e de jogo         |
| círculo (`50%`)        | —      | avatares e ponto de presença      |

Espessuras: `--border-width-sm` (1 px) em divisórias, `--border-width-md` (2 px) no foco.

### Elevação

No tema escuro, **a elevação vem da cor da superfície**, não da sombra: página `00` →
faixa `05` → card `10` → hover `20`. As sombras do PO UI usam `--color-neutral-dark-95`,
que no nosso tema é quase branco (`#F5F8FA`); por isso não adicione sombras próprias.
Modais e menus usam o overlay do próprio PO UI. Não crie `z-index` próprio.

### Breakpoints

| Nome    | Largura         | Base de teste |
| ------- | --------------- | ------------- |
| Mobile  | até 767 px      | **390 px**    |
| Tablet  | 768–1199 px     | 768 px        |
| Desktop | 1200 px ou mais | 1280 px       |

Os cortes seguem os que o PO UI já usa (768 e 1200). Escreva o CSS a partir do mobile
(`min-width`).

### Movimento

- Duração curta (150–250 ms) e só como resposta a uma ação: abrir, expandir, confirmar.
- Movimento espontâneo existe em um só lugar: a **onda única** do anel de radar quando
  um amigo passa a jogar. Nada de animações de entrada em cada card.
- Com `prefers-reduced-motion: reduce`, a onda vira troca de cor sem animação.

## 3. Componentes de interface

**Regra:** primeiro o PO UI. Componente próprio só quando o PO UI não tem equivalente.

| Necessidade            | Use                                                 | Observação                                                                                            |
| ---------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Botões                 | `po-button`                                         | `primary` = uma ação por tela; `secondary` e `tertiary` para o resto; `danger` para ações destrutivas |
| Campos, formulários    | `po-input`, `po-select`, `po-checkbox`, `po-switch` | `p-label` sempre preenchido                                                                           |
| Feedback rápido        | `PoNotificationService` (toast)                     | sucesso e erro de ações                                                                               |
| Confirmação            | `po-modal`                                          | só para ações destrutivas ou irreversíveis                                                            |
| Carregando             | `po-loading-overlay` (tela) ou `p-loading` do botão | nunca tela em branco                                                                                  |
| Avatar                 | `po-avatar`                                         | com o anel de radar em volta (próprio)                                                                |
| Chips (jogo, status)   | `po-tag`                                            |                                                                                                       |
| Abas, menus, navegação | `po-tabs`, `po-menu`, `po-toolbar`                  |                                                                                                       |
| Listas longas          | `po-list-view`                                      | evite `po-table` no mobile                                                                            |

**Componentes próprios previstos** (em `shared/` ou na feature):

- **Anel de radar:** anel de 2–3 px em volta do avatar, na cor do estado, sempre com o texto
  do estado ao lado ("Jogando Valorant"). Offline = sem anel.
- **Botões de login de terceiros:** Discord e Google, conforme a seção 1.
- **Card do amigo no Radar:** avatar, nome, estado e jogo atual, ação "Chamar".
- **Card "Chamado ativo":** quem chamou, jogo, horário e respostas.
- **Card do Wrapped:** precisa renderizar no servidor (SSR) **sem PO UI**, para a prévia do link.

### Estados obrigatórios

Toda tela e todo componente que carrega dados tem quatro versões: **carregando**, **vazio**,
**erro** e **com dados**.

- **Carregando:** esqueleto ou `po-loading-overlay`; botões em `p-loading` durante a ação.
  Exceção: o carregamento inicial do app (verificando a sessão) usa o indicador próprio de
  `app.ts`, para o PO UI continuar fora do bundle inicial.
- **Vazio:** diz o que fazer, com a ação ali mesmo: "Nenhum amigo ainda. Convide a galera
  pelo link." + botão "Copiar convite".
- **Erro:** diz o que aconteceu e como resolver, sem pedir desculpas: "Não foi possível
  carregar seus amigos. Verifique sua conexão." + "Tentar de novo".

## 4. Layout e responsividade

- **Mobile primeiro** (390 px): uma coluna, margem lateral `--spacing-sm`, conteúdo
  alinhado à esquerda. Centralizado só em telas de uma ação (Entrar, vazio).
- **Navegação (proposta):** no mobile, barra inferior fixa com quatro destinos (Radar,
  Amigos, Chamados, Perfil), cada um com ícone **e** texto. A partir do tablet, `po-menu`
  lateral. Respeite a área segura do celular (`env(safe-area-inset-bottom)`) por causa do
  Capacitor.
- **Cabeçalho:** título da tela à esquerda e no máximo uma ação à direita.
- **Container:** largura máxima de 1200 px no desktop, centralizado; Radar em grade de cards
  (1 coluna no mobile, 2 no tablet, 3 no desktop).
- Sem rolagem horizontal em nenhuma largura entre 320 px e 1920 px.
- Área de toque mínima de **44 × 44 px** em tudo que é clicável.

## 5. Acessibilidade e interação

- **Contraste:** 4,5:1 para texto e 3:1 para ícones e bordas de campos (veja a tabela da
  seção 1). `mid-40` e `light-30` nunca carregam texto.
- **Cor nunca sozinha:** estado de presença sempre com cor **e** texto ("Jogando Valorant").
- **Teclado:** tudo funciona com Tab, Enter, Espaço e Esc; a ordem do foco segue a leitura.
- **Foco visível:** o anel de foco do PO UI (`--color-action-focus`); não remova `outline`.
- **Elementos reais:** `<button>` para ação, `<a>` para navegação; `aria-label` em botão
  só com ícone; `alt` em avatares ("Foto de Ana").
- **Avisos:** erros de formulário ficam junto do campo; avisos de tela usam `aria-live`
  para leitores de tela.
- **Disabled:** explique por que está desabilitado quando não for óbvio, ao lado do botão.
- **Hover** é bônus: nada pode depender só dele, porque no celular ele não existe.
- **Feedback:** toda ação responde em até 100 ms (loading no botão ou mudança visível).

### Voz e textos

- Português do Brasil, frases curtas, sentença com só a primeira letra maiúscula.
- O botão diz o que acontece: "Chamar pra jogar", não "Enviar". A mesma ação mantém o nome
  do começo ao fim ("Chamar" → toast "Chamado enviado").
- Tom de amigo, sem gírias forçadas e sem pedir desculpas em erro.
- **Evite:** rótulos em CAIXA ALTA, seta "→" no fim de botões, textos genéricos como
  "Algo deu errado".

## 6. Regras de implementação

- **PO UI primeiro**; componente próprio só para o que ele não oferece (seção 3).
- **Cores só no tema:** mudanças de cor vão em `src/theme/party-radar.theme.ts`. Não
  sobrescreva estilos do PO UI componente a componente; não use `::ng-deep` nem `!important`.
- **Sem valores soltos:** em `styles` de componente, use `var(--spacing-*)`,
  `var(--font-size-*)`, `var(--border-radius-*)` e tokens de cor. Hex e px soltos só no tema
  e em `src/styles.scss`.
- **Estilos curtos:** o orçamento por componente é de 4 kB (aviso) / 8 kB (erro) no
  `angular.json`. Passou disso, extraia um componente ou use utilitários do PO UI.
- **Nomes de classe:** BEM simples, prefixado pelo componente (`.radar-card__nome`).
- **Arquivos:** os estilos de cada componente ficam no `.scss` dele, ao lado do `.ts` e do
  `.html` (ex.: `login.page.ts`, `login.page.html`, `login.page.scss`).
- **Reutilização:** antes de criar, procure em `shared/` e na feature. Repetiu em duas
  features, mova para `shared/`.
- **SSR:** componentes de páginas públicas (perfil público, card do Wrapped) não usam PO UI
  nem `document`/`window` direto.
- **Plataforma:** compartilhar, notificar e vibrar passam por `core/platform/` (Capacitor no futuro).

## 7. Critérios de qualidade

Antes de declarar uma tela pronta (soma-se à seção 6 do `AGENTS.md`):

- [ ] Usa componentes do PO UI onde existe equivalente; nenhum estilo do PO UI sobrescrito.
- [ ] Nenhuma cor, espaçamento ou fonte fora dos tokens.
- [ ] Testada em 390 px, 768 px e 1280 px, sem rolagem horizontal.
- [ ] Estados de carregando, vazio, erro e com dados implementados e testados.
- [ ] Contraste conferido: texto ≥ 4,5:1, ícones e bordas de campo ≥ 3:1.
- [ ] Navegável só pelo teclado, com foco visível e ordem lógica.
- [ ] Botões só com ícone têm `aria-label`; imagens têm `alt`.
- [ ] Cor nunca é a única forma de informar um estado.
- [ ] Movimento só como resposta a ação, respeitando `prefers-reduced-motion`.
- [ ] Textos em português, com verbos de ação nos botões e erros que dizem como resolver.
- [ ] Print da tela no mobile e no desktop anexado ao PR.

## 8. Perguntas em aberto

- [x] **Botão primário:** ação `#8B6CFF` / `#A996FF` / `#9A82FF` (aprovado em 2026-10-16)
      (seção 1)?
- [ ] **Neutros:** a escala atual (`#0E1117`, `#161B22`, `#30363D`…) é praticamente a do tema
      escuro do GitHub. Manter, ou puxar os neutros levemente para o violeta da marca para
      ter identidade própria?
- [ ] **Logo:** quem cria e em que formato (SVG para o app, PNG 512 px para o Capacitor)?
- [ ] **Navegação:** confirmar barra inferior no mobile e menu lateral no desktop.
- [ ] **Modo claro:** fica fora do MVP?
