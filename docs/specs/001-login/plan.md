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
`?simular=` da URL **apenas em desenvolvimento** (`environment.production === false`). A partir da
Parte 2a, o parâmetro passa a ser `?simular-login=` (veja a seção da Parte 2a):

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
│        ◯  ◯  ◯   (anéis)       │  ← radar (revisto após a T11): 4 anéis, eixos e marcações
│      Ⓐ      ●       Ⓜ         │    de instrumento; 3 amigos com a inicial no anel de presença.
│        Party Radar             │    Ao abrir, a varredura dá uma volta e acende cada amigo.
│  Veja quem do seu grupo está   │  ← Manrope, texto secundário, até 2 linhas
│  jogando agora e chame a galera│
│                                │
│  ┌──────────────────────────┐  │
│  │ ◆ Continuar com Discord  │  │  ← 48 px de altura, largura total (máx. 360 px)
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ G Continuar com o Google │  │  ← mesmo tamanho e peso do Discord
│  └──────────────────────────┘  │
│  [aviso de erro, se houver]    │  ← aria-live, abaixo dos botões (não os empurra); ícone + texto
│  Usamos seu nome e foto do     │  ← texto de confiança, `--font-size-xs`
│  Discord ou do Google para     │
│  criar seu perfil.             │
└────────────────────────────────┘
```

- Coluna única centralizada (tela de uma ação só), largura máxima de 400 px.
- No desktop, o mesmo bloco centralizado; o radar cresce e ocupa o fundo, sem conteúdo extra.
- Com `prefers-reduced-motion`, a varredura não gira: o radar aparece direto no estado final.
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
| `src/app/features/auth/ui/radar-hero.component.ts`                     | novo: radar em SVG com anéis, marcações, amigos e a varredura de uma volta                 |
| `src/app/features/auth/pages/login.page.ts`                            | novo: tela Entrar, orquestra gateway + store + ui                                          |
| `src/app/features/home/pages/home.page.ts`                             | alterado: vira a tela inicial provisória ("Olá, {nome}", avatar, Sair)                     |
| `src/app/app.ts`                                                       | alterado: carregamento inicial (CA11) enquanto a sessão é verificada                       |
| `src/app/app.routes.ts`                                                | alterado: rotas `/login` e `/inicio`; `''` redireciona conforme a sessão                   |
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

| Critério                | Tipo de teste       | Onde                                                                 |
| ----------------------- | ------------------- | -------------------------------------------------------------------- |
| CA13–CA15 (mensagens)   | unitário (domain)   | `features/auth/domain/login-feedback.spec.ts`                        |
| CA12 (estado da tela)   | unitário (domain)   | `features/auth/domain/login-screen.spec.ts`                          |
| CA1, CA12 (botões)      | componente          | `features/auth/ui/provider-button.component.spec.ts`                 |
| CA1, CA12–CA15, CA20    | componente (página) | `features/auth/pages/login.page.spec.ts` com gateway falso por teste |
| CA11                    | componente (raiz)   | `app.spec.ts`                                                        |
| cenários do simulado    | unitário            | `core/auth/fake-auth.gateway.spec.ts`                                |
| sessão em signals       | unitário            | `core/auth/auth.store.spec.ts`                                       |
| tela inicial provisória | componente          | `features/home/pages/home.page.spec.ts`                              |
| CA19, CA20 (visual)     | manual, com prints  | navegador do app em 390, 768 e 1280 px; navegação só por teclado     |

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

## Parte 2a — Login com o Discord

**Spec:** `spec.md` (revisão 3, aprovada em 2026-10-19) · **Branch:** `feat/001-login-discord`
**Cobre:** CA2, CA4–CA10, CA13–CA18, CA22, CA23. O Google (CA3, CA21) fica para a Parte 2b.

### Abordagem

As telas continuam falando só com o contrato `AuthGateway`. Entra uma segunda implementação,
`SupabaseAuthGateway`, que usa o **Supabase Auth com o provedor Discord** (fluxo PKCE). O
`AuthStore` e as rotas ganham o que faltava para uma sessão real: esperar a sessão ser
restaurada antes de decidir a rota, voltar para o endereço pedido e reagir quando a sessão
termina.

Fluxo do login:

```
Entrar ── "Continuar com Discord" ──► Discord (autoriza) ──► Supabase /auth/v1/callback
   ▲                                                                  │
   │ cancelou / erro (CA13, CA14)                                     ▼
   └──────────────── /auth/retorno?next=/inicio&code=… ◄── troca o código pela sessão
                                     │
                                     └──► destino seguro (CA5, CA6): `next` ou /inicio
```

- **Permissões do Discord:** só `identify` e `email` (as padrão do Supabase), como decidido na
  spec. Servidores, presença e conexões (Steam) ficam para a spec da Steam.
- **Retorno:** o `redirectTo` aponta para uma rota própria, `/auth/retorno`, sem guard. Ela
  espera o cliente do Supabase trocar o código pela sessão, lê `error` da URL quando o login
  falhou e manda para o destino seguro.
- **Destino seguro (CA5, CA6):** o guard leva quem não está logado para `/login?next=<rota>`, e
  o `next` viaja até o retorno. Só vale caminho interno (começa com `/`, sem `//` nem `\`);
  qualquer outro vira `/inicio`.
- **Sessão sem tokens do provedor (CA17):** o Supabase guarda a sessão no `localStorage`, e ela
  traz `provider_token` e `provider_refresh_token`. A sessão passa a ser gravada por um
  armazenamento próprio em `core/platform/` que remove esses dois campos antes de gravar.
- **Restaurar antes de decidir (CA7, CA9):** o `AuthStore` expõe uma promessa de "pronto"; os
  guards e o redirect de `''` esperam por ela. Resolve a pendência da Parte 1 em que abrir
  `/inicio` direto mandava para `/login`.
- **Fim da sessão (CA8, CA10):** o gateway avisa o `AuthStore` quando a sessão termina
  (`onAuthStateChange`). Se ela termina sem a pessoa ter tocado em Sair (a renovação falhou), o
  store guarda o aviso "Sua sessão expirou" e o app leva para `/login`. O Sair usa
  `signOut({ scope: 'local' })`: encerra só neste aparelho.
- **Perfil e @usuário (CA4, CA16, CA18):** criados no banco por um gatilho em `auth.users`, na
  mesma transação do cadastro; o front só lê a linha do perfil. Assim o @usuário único não
  depende do navegador.
- **Google na 2a (CA23):** o gateway real devolve uma falha nova, `unavailable`, e a tela mostra
  "Login com o Google em breve.". A 2b troca isso pelo login de verdade.
- **Simulado só em desenvolvimento (CA22):** a escolha do gateway sai do `app.config.ts` e vira
  uma fábrica: no build de produção é sempre o Supabase; em desenvolvimento, também, a não ser
  que a URL tenha `?simular-login=`. O parâmetro do login muda de `?simular=` para
  `?simular-login=`, porque `?simular=erro` também é cenário da home; assim, com a sessão real
  guardada, `/inicio?simular=primeiro-acesso` passa a funcionar (pendência da spec 002).

### Arquivos afetados

| Arquivo                                                            | Mudança                                                                                      |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `supabase/config.toml`                                             | liga `[auth.external.discord]` com `env(DISCORD_CLIENT_ID)` e `env(DISCORD_CLIENT_SECRET)`   |
| `supabase/migrations/<data>_profiles.sql`                          | novo: tabela `profiles`, gatilho de criação, geração do @usuário e RLS                       |
| `supabase/tests/profiles.test.sql`                                 | novo: pgTAP do perfil, do @usuário e das policies                                            |
| `src/app/core/supabase/database.types.ts`                          | gerado de novo (`npm run db:types`)                                                          |
| `src/app/core/platform/session-storage.ts`                         | novo: armazenamento da sessão sem `provider_token` e `provider_refresh_token`                |
| `src/app/core/supabase/supabase.client.ts`                         | alterado: `flowType: 'pkce'` e o armazenamento acima                                         |
| `src/app/core/auth/auth.gateway.ts`                                | alterado: `signIn` recebe o destino; aviso de fim de sessão; falha `unavailable`             |
| `src/app/core/auth/supabase-auth.gateway.ts`                       | novo: login com o Discord, restaurar com o perfil, sair, fim de sessão                       |
| `src/app/core/auth/auth-gateway.provider.ts`                       | novo: fábrica que escolhe o gateway (CA22)                                                   |
| `src/app/core/auth/fake-auth.gateway.ts`                           | alterado: lê `?simular-login=`                                                               |
| `src/app/core/auth/auth.store.ts`                                  | alterado: promessa de "pronto", fim de sessão com aviso                                      |
| `src/app/core/auth/auth.guards.ts`                                 | alterado: guards esperam a sessão e levam o `next`                                           |
| `src/app/features/auth/domain/auth-return.ts`                      | novo: destino seguro e falha a partir da URL de retorno (puro, 100%)                         |
| `src/app/features/auth/domain/login-feedback.ts`                   | alterado: mensagem de `unavailable`                                                          |
| `src/app/features/auth/pages/auth-return.page.(ts,html,scss)`      | novo: rota `/auth/retorno` com o indicador de carregamento                                   |
| `src/app/features/auth/pages/login.page.ts`                        | alterado: repassa o `next` ao entrar                                                         |
| `src/app/app.ts`, `src/app/app.routes.ts`, `src/app/app.config.ts` | alterados: rota de retorno, redirect que espera a sessão, ida ao login quando a sessão acaba |
| `.github/workflows/ci.yml`                                         | alterado, se preciso: valores de exemplo de `DISCORD_CLIENT_ID/SECRET` para o banco da CI    |
| `.env.example`, `README.md`                                        | alterados: como criar o aplicativo no Discord e onde pôr as chaves                           |
| `*.spec.ts` ao lado de cada arquivo                                | novos e alterados                                                                            |

### Dados

Migration nova, `profiles`:

| Coluna         | Tipo          | Regra                                                                        |
| -------------- | ------------- | ---------------------------------------------------------------------------- |
| `id`           | `uuid`        | PK, `references auth.users(id) on delete cascade`                            |
| `display_name` | `text`        | não nulo; nome do Discord ou, sem nome, o e-mail antes do "@" (CA16)         |
| `username`     | `text`        | não nulo, único sem diferenciar maiúsculas; 3–20 de `a-z`, `0-9` e `_` (CA4) |
| `avatar_url`   | `text`        | pode ser nulo (o app mostra a inicial)                                       |
| `created_at`   | `timestamptz` | `default now()`                                                              |

- **Gatilho** `on_auth_user_created` (`after insert on auth.users`) chama
  `public.handle_new_user()`, `security definer` com `set search_path = ''` e nomes
  qualificados; `execute` revogado de `anon`, `authenticated` e `public`.
- **@usuário:** parte do nome sem acentos, em minúsculas, só `a-z0-9_`, até 20 caracteres; se
  sobrar menos de 3, usa `jogador`; se já existir, acrescenta 2, 3… (`ana`, `ana2`).
- **RLS:** ativado. `select` para `authenticated` em todas as linhas (perfil básico visível a
  quem está logado; a tabela não tem e-mail). Sem policies de `insert`, `update` nem `delete`:
  só o gatilho cria, e editar é da `006-perfil`. `anon` não lê nada (CA18).
- **E-mail** continua só em `auth.users`, que o front não lê de outros usuários.

### Integrações externas

- **Discord**, pelo Supabase Auth. Exige os pré-requisitos da spec (aplicativo, URL de retorno
  e chaves no `.env` da raiz, que é o arquivo que o `config.toml` lê com `env()`).
- **Segredos:** o Client Secret fica só no `.env` (ignorado pelo Git) e, na nuvem, no painel do
  Supabase. O front recebe só a publishable key, como hoje.

### Estratégia de testes

| Critério                            | Tipo de teste                | Onde                                                  |
| ----------------------------------- | ---------------------------- | ----------------------------------------------------- |
| CA4, CA16, CA18 (perfil, RLS)       | banco (pgTAP)                | `supabase/tests/profiles.test.sql`                    |
| CA5, CA6, CA13, CA14 (retorno)      | unitário (domain)            | `features/auth/domain/auth-return.spec.ts`            |
| CA17 (sem tokens do provedor)       | unitário                     | `core/platform/session-storage.spec.ts`               |
| CA2, CA7, CA8, CA10, CA15, CA23     | unitário com cliente falso   | `core/auth/supabase-auth.gateway.spec.ts`             |
| CA7, CA9, CA10 (store e guards)     | unitário                     | `core/auth/auth.store.spec.ts`, `auth.guards.spec.ts` |
| CA22 (escolha do gateway)           | unitário                     | `core/auth/auth-gateway.provider.spec.ts`             |
| CA5, CA6, CA13, CA14 (página)       | componente                   | `features/auth/pages/auth-return.page.spec.ts`        |
| CA2, CA4, CA7, CA8 de ponta a ponta | manual, com a conta do Jorge | Supabase local + aplicativo do Discord, com prints    |

O Supabase não é chamado nos testes do front: o gateway recebe um cliente falso.

### Riscos

- **Pré-requisitos:** sem o aplicativo do Discord e as chaves no `.env`, dá para fazer tudo,
  menos a conferência de ponta a ponta (T22).
- **CI do banco:** o `supabase db start` lê o `config.toml`; se o `env()` sem valor quebrar a
  leitura, a CI recebe valores de exemplo (não são segredos) na própria etapa.
- **Tokens do provedor:** a remoção depende do formato da sessão do `supabase-js`; o teste do
  armazenamento fixa esse formato e quebra se uma atualização mudar o nome dos campos.
- **Retorno do OAuth e SSR:** as rotas do app renderizam no navegador (`RenderMode.Client`),
  então a troca do código acontece só no navegador.
- **Nome do Discord:** o Supabase guarda `full_name` (nome de exibição) e `name` (usuário); o
  gatilho usa o primeiro que vier, nessa ordem, e cai no e-mail se nenhum vier.
