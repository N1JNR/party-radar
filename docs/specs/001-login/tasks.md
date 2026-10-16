# 001 — Tarefas

Cada tarefa cabe em um commit, é testável sozinha e cita o critério de aceite que atende.
Marque `[x]` só depois que os testes da tarefa passarem.

## Parte 1 — Layout (`feat/login-layout`)

- [x] T1 — Tokens `--pr-*` (superfícies, texto, presença) e Google Sans 500 em `src/styles.scss` (CA1)
- [x] T2 — Logos oficiais do Discord e do Google em `public/brands/` (**pede autorização para baixar**) (CA1)
- [x] T3 — Contrato `AuthGateway`, token `AUTH_GATEWAY` e tipos em `core/auth/` (base de CA1–CA15)
- [x] T4 — Domain: falhas de login → mensagens e estado da tela, 100% testado (CA12–CA15)
- [x] T5 — Gateway simulado com os cenários de `?simular=` só em desenvolvimento (CA11–CA15)
- [ ] T6 — `AuthStore` em signals e carregamento inicial na raiz do app (CA11)
- [ ] T7 — Componente `provider-button` (Discord e Google: normal, abrindo, desabilitado, foco) (CA1, CA12, CA20)
- [ ] T8 — Componente `radar-hero` (anéis, blips, onda única, `prefers-reduced-motion`) (CA1)
- [ ] T9 — Página Entrar com aviso `aria-live` e todos os estados (CA1, CA12–CA15, CA19, CA20)
- [ ] T10 — Tela inicial provisória ("Olá, {nome}", avatar, Sair) e rotas `/entrar` e `/inicio` (CA1)
- [ ] T11 — Conferência visual em 390, 768 e 1280 px e navegação por teclado, com prints para o PR (CA19, CA20)
- [ ] T12 — `/code-review`, revisar diff, rodar `npm run verify` e escrever o relatório final

## Parte 2 — Funcionalidade

Será detalhada no `plan.md` antes de começar, depois do merge da Parte 1.
