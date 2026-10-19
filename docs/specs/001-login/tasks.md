# 001 — Tarefas

Cada tarefa cabe em um commit, é testável sozinha e cita o critério de aceite que atende.
Marque `[x]` só depois que os testes da tarefa passarem.

## Parte 1 — Layout (`feat/login-layout`)

- [x] T1 — Tokens `--pr-*` (superfícies, texto, presença) e Google Sans 500 em `src/styles.scss` (CA1)
- [x] T2 — Logos oficiais do Discord e do Google em `public/brands/` (**pede autorização para baixar**) (CA1)
- [x] T3 — Contrato `AuthGateway`, token `AUTH_GATEWAY` e tipos em `core/auth/` (base de CA1–CA15)
- [x] T4 — Domain: falhas de login → mensagens e estado da tela, 100% testado (CA12–CA15)
- [x] T5 — Gateway simulado com os cenários de `?simular=` só em desenvolvimento (CA11–CA15)
- [x] T6 — `AuthStore` em signals e carregamento inicial na raiz do app (CA11)
- [x] T7 — Componente `provider-button` (Discord e Google: normal, abrindo, desabilitado, foco) (CA1, CA12, CA20)
- [x] T8 — Componente `radar-hero` (anéis, marcações, amigos, varredura de uma volta, `prefers-reduced-motion`) (CA1)
- [x] T9 — Página Entrar com aviso `aria-live` e todos os estados (CA1, CA12–CA15, CA19, CA20)
- [x] T10 — Tela inicial provisória ("Olá, {nome}", avatar, Sair) e rotas `/login` e `/inicio` (CA1)
- [x] T11 — Conferência visual em 390, 768 e 1280 px e navegação por teclado, com prints para o PR (CA19, CA20)
- [x] T11a — Contraste do botão secundário "Sair": texto `#6E4BFF` sobre o fundo dá 3,7:1 (mínimo 4,5:1). Depende de aprovar `action` `#8B6CFF` no tema (DESIGN.md, seção 8)
- [x] T11b — O aviso de erro empurra os botões cerca de 56 px para baixo; um segundo toque rápido pode acertar o outro provedor. Depende de escolher a correção
- [x] T12 — `/code-review`, revisar diff, rodar `npm run verify` e escrever o relatório final

## Parte 2 — Funcionalidade

Dividida em **2a — Discord** e **2b — Google** (spec, revisão 3).

Pendências vindas da revisão da Parte 1 (onde cada uma é resolvida):

- Guards e o redirect de `''` decidem antes de a sessão ser restaurada (status `checking`); com sessão real, abrir `/inicio` direto mandaria para `/login` (CA7). **T18.**
- Trocar o gateway simulado pelo do Supabase também no build de produção; hoje a `main` "loga" qualquer pessoa. **T21.**
- Telas protegidas devem reagir ao fim da sessão (ir para `/login`), em vez de depender da navegação do botão Sair. **T20.**
- Manter a sessão simulada ao recarregar em desenvolvimento (ou levar o `?simular=` pelo login), para os cenários de `?simular=` da home (spec 002) funcionarem pela URL. **T21** (sessão real + `?simular-login=`).
- Conferir o "G" do Google no Safari (**Parte 2b**) (o SVG oficial usa `foreignObject`); se falhar, usar o PNG do mesmo pacote.

### Parte 2a — Discord (`feat/001-login-discord`)

Antes da T22, o dono do projeto cumpre os pré-requisitos da spec (aplicativo no Discord, URL de
retorno e chaves no `.env`). As tarefas T13 a T21 não dependem disso.

- [ ] T13 — Supabase local com o provedor Discord (`config.toml` com `env()`), `.env.example`, README e CI do banco funcionando sem as chaves (CA2)
- [ ] T14 — Migration `profiles`: gatilho de criação, @usuário único, RLS, pgTAP e `database.types.ts` (CA4, CA16, CA18)
- [ ] T15 — Domain: destino seguro e falha a partir da URL de retorno, 100% testado (CA5, CA6, CA13, CA14)
- [ ] T16 — Armazenamento da sessão em `core/platform/` sem os tokens do provedor, e cliente do Supabase com PKCE (CA17)
- [ ] T17 — `SupabaseAuthGateway`: entrar com o Discord, restaurar com o perfil, sair só neste aparelho, aviso de fim de sessão e Google "em breve" (CA2, CA7, CA8, CA10, CA15, CA23)
- [ ] T18 — `AuthStore` com promessa de "pronto" e fim de sessão; guards e redirect de `''` esperam a sessão e levam o `next` (CA5, CA7, CA9, CA10)
- [ ] T19 — Página `/auth/retorno`: espera a sessão, trata cancelado e erro, vai ao destino seguro; login repassa o `next` (CA2, CA5, CA6, CA13, CA14)
- [ ] T20 — App leva ao login quando a sessão termina, com o aviso de sessão expirada (CA8, CA10)
- [ ] T21 — Fábrica do gateway: produção sempre Supabase; simulado só com `?simular-login=` em desenvolvimento (CA22)
- [ ] T22 — Conferência de ponta a ponta com a conta do Discord do Jorge: entrar, perfil criado, recarregar, Sair, cancelar; com prints (CA2, CA4, CA7, CA8, CA13)
- [ ] T23 — `/code-review`, `/security-review` (toca login e RLS), `npm run verify:all` e relatório final

### Parte 2b — Google

Será detalhada no `plan.md` e aqui depois do merge da 2a.
