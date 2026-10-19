# 003 — Tarefas

Cada tarefa cabe em um commit, é testável sozinha e cita o critério de aceite que atende.
Marque `[x]` só depois que os testes da tarefa passarem.

Antes da conferência de ponta a ponta de cada parte, o dono do projeto cria a chave da Steam Web API
e a guarda no `.env` (pré-requisito da spec).

## Parte 3a — Conectar a Steam (`feat/003-conectar-steam`)

- [x] T1 — Testes das Edge Functions com Deno: `npm run fn:test` e job na CI (base para CA3, CA6)
- [x] T2 — Migration `steam_accounts`: SteamID único, RLS só da própria conta, pgTAP e `database.types.ts` (CA4, CA16)
- [x] T3 — `_shared/steam-openid.ts`: monta a ida e confere a volta (`return_to`, `claimed_id`, `response_nonce`), testado (CA3)
- [x] T4 — `_shared/steam-api.ts`: lê perfil, visibilidade, jogos e jogo aberto das respostas da Steam, testado sem rede (CA6, CA15)
- [ ] T5 — Edge Function `steam-connect`: confere com a Steam, grava a conta (ou "já ligada a outro perfil") e faz a primeira leitura (CA2–CA5)
- [ ] T6 — Edge Function `steam-sync`: lê uma conta (quem está logado) e guarda visibilidade e ponto de partida (CA6, CA7)
- [ ] T7 — Domain do front: endereço de ida à Steam e mensagens da volta, 100% testado (CA1, CA5)
- [ ] T8 — `SteamSource` (real e simulada) e serviço de navegação externa em `core/platform/` (CA2, CA7)
- [ ] T9 — Rota `/steam/retorno`: chama `steam-connect` e volta ao Meu card com o aviso certo (CA2, CA4, CA5)
- [ ] T10 — Card: passo e botão "Conectar Steam"; "Já deixei público" verifica de verdade (CA1, CA6, CA7, CA18)
- [ ] T11 — Conferência de ponta a ponta com a conta Steam do Jorge, com prints (CA1–CA7)
- [ ] T12 — `/code-review`, `/security-review`, `npm run verify:all` e relatório final

## Parte 3b — Dados reais no card (`feat/003-dados-steam-card`)

Será detalhada aqui depois do merge da 3a, seguindo o `plan.md`.
