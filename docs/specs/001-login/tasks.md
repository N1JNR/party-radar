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
- [x] T8 — Componente `radar-hero` (anéis, blips, onda única, `prefers-reduced-motion`) (CA1)
- [x] T9 — Página Entrar com aviso `aria-live` e todos os estados (CA1, CA12–CA15, CA19, CA20)
- [x] T10 — Tela inicial provisória ("Olá, {nome}", avatar, Sair) e rotas `/login` e `/inicio` (CA1)
- [x] T11 — Conferência visual em 390, 768 e 1280 px e navegação por teclado, com prints para o PR (CA19, CA20)
- [x] T11a — Contraste do botão secundário "Sair": texto `#6E4BFF` sobre o fundo dá 3,7:1 (mínimo 4,5:1). Depende de aprovar `action` `#8B6CFF` no tema (DESIGN.md, seção 8)
- [x] T11b — O aviso de erro empurra os botões cerca de 56 px para baixo; um segundo toque rápido pode acertar o outro provedor. Depende de escolher a correção
- [ ] T12 — `/code-review`, revisar diff, rodar `npm run verify` e escrever o relatório final

## Parte 2 — Funcionalidade

Será detalhada no `plan.md` antes de começar, depois do merge da Parte 1.

Pendências que a Parte 2 precisa resolver (vindas da revisão da Parte 1):

- Guards e o redirect de `''` decidem antes de a sessão ser restaurada (status `checking`); com sessão real, abrir `/inicio` direto mandaria para `/login` (CA7).
- Trocar o gateway simulado pelo do Supabase também no build de produção; hoje a `main` "loga" qualquer pessoa.
- Telas protegidas devem reagir ao fim da sessão (ir para `/login`), em vez de depender da navegação do botão Sair.
- Conferir o "G" do Google no Safari (o SVG oficial usa `foreignObject`); se falhar, usar o PNG do mesmo pacote.
