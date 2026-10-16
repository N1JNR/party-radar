# 001 — Plano técnico

## Parte 1 — Layout

**Spec:** `spec.md` (aprovada em 2026-10-16) · **Branch:** `feat/login-layout`
**Cobre:** CA1 (visual), CA11, CA12, CA13–CA15 (visual), CA19, CA20.
A Parte 2 (login real) entra neste mesmo arquivo, numa seção própria, antes de começar.

### Abordagem

A tela Entrar e a tela inicial provisória são construídas por completo, mas falando com um
**gateway de autenticação simulado**. As telas dependem só de uma interface (`AuthGateway`);
na Parte 2 a implementação simulada é trocada pela do Supabase sem mexer nas telas.

Para revisar todos os estados sem backend, o gateway simulado lê o parâmetro
`?simular=` da URL **apenas em desenvolvimento** (`environment.production === false`):

| `?simular=`       | O que acontece ao tocar em um botão de login              | Critério           |
| ----------------- | --------------------------------------------------------- | ------------------ |
| _(vazio)_         | 1,5 s em "Abrindo…" e entra como usuário de exemplo       | CA12               |
| `cancelado`       | volta com "Login cancelado. Tente de novo quando quiser." | CA13               |
| `erro`            | volta com "Não foi possível entrar agora…"                | CA14               |
| `sem-conexao`     | mostra "Sem conexão. Verifique sua internet."             | CA15               |
| `sessao-expirada` | abre a tela Entrar já com "Sua sessão expirou…"           | CA10 (só o visual) |
| `verificando`     | segura o carregamento inicial por 3 s                     | CA11               |

#### Direção visual da tela Entrar

Segue o `DESIGN.md`. A única ousadia é o **anel de radar**:

```
┌──────────── 390 px ────────────┐
│                                │
│        ◯  ◯  ◯   (anéis)       │  ← radar: 3 anéis concêntricos finos, violeta a 12–20%,
│      ·      ●       ·          │    com 3 "blips" nas cores de presença (jogando, online,
│        Party Radar             │    ausente). Uma onda única sai do centro ao abrir a tela.
│  Veja quem do seu grupo está   │  ← Manrope, texto secundário, até 2 linhas
│  jogando agora e chame a galera│
│                                │
│  [aviso de erro, se houver]    │  ← aria-live; ícone + texto; nunca só cor
│  ┌──────────────────────────┐  │
│  │ ◆ Continuar com Discord  │  │  ← 48 px de altura, largura total (máx. 360 px)
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ G Continuar com o Google │  │  ← mesmo tamanho e peso do Discord
│  └──────────────────────────┘  │
│  Usamos seu nome e foto do     │  ← texto de confiança, `--font-size-xs`
│  Discord ou do Google para     │
│  criar seu perfil.             │
└────────────────────────────────┘
```

- Coluna única centralizada (tela de uma ação só), largura máxima de 400 px.
- No desktop, o mesmo bloco centralizado; o radar cresce e ocupa o fundo, sem conteúdo extra.
- Com `prefers-reduced-motion`, a onda não anima.
- Revisão contra o padrão genérico: fundo quase preto com um acento único (violeta) é um
  clichê. Por isso a cor da tela vem dos **blips de presença** (verde, ciano, âmbar), e o
  violeta fica fraco, só nos anéis.

### Arquivos afetados

| Arquivo                                                                | Mudança                                                                                    |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/app/core/auth/auth.gateway.ts`                                    | novo: tipos (`AuthProvider`, `AuthUser`, `SignInResult`), interface e token `AUTH_GATEWAY` |
| `src/app/core/auth/fake-auth.gateway.ts`                               | novo: gateway simulado com os cenários de `?simular=`                                      |
| `src/app/core/auth/auth.store.ts`                                      | novo: estado da sessão em signals (`verificando`, `anonimo`, `autenticado`)                |
| `src/app/features/auth/domain/login-feedback.ts`                       | novo: falhas de login → mensagem e tipo de aviso (puro, 100%)                              |
| `src/app/features/auth/domain/login-screen.ts`                         | novo: estado da tela (pronto / abrindo provedor X / falhou) como funções puras             |
| `src/app/features/auth/ui/provider-button.component.ts`                | novo: botão de marca (Discord e Google), estados normal, abrindo e desabilitado            |
| `src/app/features/auth/ui/radar-hero.component.ts`                     | novo: radar em SVG com os anéis, blips e a onda única                                      |
| `src/app/features/auth/pages/entrar.page.ts`                           | novo: tela Entrar, orquestra gateway + store + ui                                          |
| `src/app/features/home/pages/home.page.ts`                             | alterado: vira a tela inicial provisória ("Olá, {nome}", avatar, Sair)                     |
| `src/app/app.ts`                                                       | alterado: carregamento inicial (CA11) enquanto a sessão é verificada                       |
| `src/app/app.routes.ts`                                                | alterado: rotas `/entrar` e `/inicio`; `''` redireciona conforme a sessão                  |
| `src/app/app.config.ts`                                                | alterado: fornece `AUTH_GATEWAY` com o gateway simulado                                    |
| `src/styles.scss`                                                      | alterado: Google Sans 500 e primeiros tokens `--pr-*`                                      |
| `public/brands/discord-symbol-white.svg`, `public/brands/google-g.svg` | novos: logos **oficiais** (ver Integrações)                                                |
| `*.spec.ts` ao lado de cada arquivo novo                               | novos                                                                                      |

Não usa PO UI nos botões de marca (as cores pertencem ao Discord e ao Google; ver
`DESIGN.md`). A tela inicial usa `po-avatar` e `po-button` (`secondary`) para Sair, e o
carregamento usa `po-loading-overlay`.

### Dados

Nenhuma migration nesta parte. O usuário de exemplo do gateway simulado fica só em memória.

### Integrações externas

- **Nenhuma chamada de rede**, além das fontes do Google Fonts (Google Sans 500 para o
  botão do Google, conforme as diretrizes; já confirmado que o Google Fonts serve a família).
- **Logos oficiais:** o "G" do Google e o símbolo do Discord precisam vir dos pacotes
  oficiais (as diretrizes proíbem desenhar ou alterar). Baixar esses arquivos pede a sua
  autorização na tarefa T2. Sem eles, a tela não pode ir para a `main`.

### Estratégia de testes

| Critério                | Tipo de teste       | Onde                                                                  |
| ----------------------- | ------------------- | --------------------------------------------------------------------- |
| CA13–CA15 (mensagens)   | unitário (domain)   | `features/auth/domain/login-feedback.spec.ts`                         |
| CA12 (estado da tela)   | unitário (domain)   | `features/auth/domain/login-screen.spec.ts`                           |
| CA1, CA12 (botões)      | componente          | `features/auth/ui/provider-button.component.spec.ts`                  |
| CA1, CA12–CA15, CA20    | componente (página) | `features/auth/pages/entrar.page.spec.ts` com gateway falso por teste |
| CA11                    | componente (raiz)   | `app.spec.ts`                                                         |
| cenários do simulado    | unitário            | `core/auth/fake-auth.gateway.spec.ts`                                 |
| sessão em signals       | unitário            | `core/auth/auth.store.spec.ts`                                        |
| tela inicial provisória | componente          | `features/home/pages/home.page.spec.ts`                               |
| CA19, CA20 (visual)     | manual, com prints  | navegador do app em 390, 768 e 1280 px; navegação só por teclado      |

Acessibilidade nos testes: o aviso de erro fica em região `aria-live`, os botões são
`<button>` reais com texto visível, e o foco volta para o botão tocado quando o login falha.

### Riscos

- **Gateway simulado na `main`:** até a Parte 2, a `main` "loga" qualquer pessoa como
  usuário de exemplo. Aceitável porque nada está publicado; a Parte 2 remove o simulado da
  configuração de produção.
- **Logos oficiais:** se não puderem ser baixados, a T2 fica bloqueada e os botões não vão
  para a `main` com logo improvisado.
- **Peso das fontes:** Google Sans 500 acrescenta um arquivo de fonte só para um botão.
- **Cor do botão primário** (`#8B6CFF`) segue em aberto no `DESIGN.md`; a Parte 1 não usa
  botão primário, então não bloqueia.
