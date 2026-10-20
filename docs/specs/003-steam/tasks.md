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
- [x] T5 — Edge Function `steam-connect`: confere com a Steam, grava a conta (ou "já ligada a outro perfil") e faz a primeira leitura (CA2–CA5)
- [x] T6 — Edge Function `steam-sync`: lê uma conta (quem está logado) e guarda visibilidade e ponto de partida (CA6, CA7)
- [x] T7 — Domain do front: endereço de ida à Steam e mensagens da volta, 100% testado (CA1, CA5)
- [x] T8 — `SteamSource` (real e simulada) e serviço de navegação externa em `core/platform/` (CA2, CA7)
- [x] T9 — Rota `/steam/retorno`: chama `steam-connect` e volta ao Meu card com o aviso certo (CA2, CA4, CA5)
- [x] T10 — Card: passo e botão "Conectar Steam"; "Já deixei público" verifica de verdade (CA1, CA6, CA7, CA18)
- [x] T11 — Conferência de ponta a ponta com a conta Steam do Jorge, com prints (CA1–CA7)
  - Conferido em 2026-10-20 com a conta do Jorge no Supabase local e a chave real da Steam Web API.
    CA1: sem Steam, o card mostra o passo pendente e o botão. CA2: a ida abre o login da própria
    Steam, a volta é confirmada com a Steam e grava a conta lida (nome, visibilidade e ponto de
    partida). CA3: uma volta forjada é recusada pelo servidor (400) e nada é gravado. CA5: cancelar
    na Steam mostra "Não foi possível conectar a Steam. Tente de novo.". CA6: com a conta marcada
    como privada, o card mostra o aviso com o caminho. CA7: "Já deixei público" lê a Steam de novo,
    o aviso some e aparece "Steam pública. Seus dados vão aparecer no card.". Prints 01 a 07 em
    `prints/`.
  - Limites da conferência: a Steam entrega os jogos à dona da chave mesmo com o perfil privado,
    então a conta do Jorge sempre é lida como pública pela chave dele. Para o CA6 e o CA7, a conta
    foi marcada como privada só no banco local; o caso "continua privado" e o CA4 (conta de outro
    perfil) ficam cobertos pelos testes das funções e do banco.
  - Achados: os avisos (toasts) de erro e de sucesso têm texto claro sobre fundo claro (contraste
    perto de 1,1:1, ilegível), um ajuste de tema a corrigir à parte. Depois de conectar, o quadro
    "Deixe seu card mais forte" some (só aparece enquanto falta a Steam ou no primeiro acesso), a
    decidir se deve continuar com tudo marcado como feito.
- [ ] T12 — `/code-review`, `/security-review`, `npm run verify:all` e relatório final
  - `/code-review` (high) em 2026-10-20: 9 achados. 7 viram as tarefas T12a–T12e (revisão 2 da
    spec); o `steamPublic` duplicado da home sai na 3b.
- [ ] T12a — Volta da Steam usada uma vez só: tabela `steam_openid_nonces` (RLS, só o servidor
      grava, limpeza das antigas) com pgTAP; `steam-connect` recusa a volta repetida (CA3)
- [ ] T12b — Ligar a conta: trocar de conta zera nome, visibilidade e jogo da anterior; reconectar a
      mesma conta mantém o ponto de partida (CA19)
- [ ] T12c — Erro de banco na primeira leitura não desfaz "conectada" (leitura fica pendente) e
      cada chamada à Steam desiste em 10 s (CA19, CA20)
- [ ] T12d — `steam-sync` lê a Steam no máximo a cada 30 s por pessoa; dentro do intervalo devolve
      a última leitura (CA20)
- [ ] T12e — Card: quadro visível enquanto lê, com "Tentar de novo"; a volta da Steam usa
      `openIdFromSearch` (CA2, CA19)

## Parte 3b — Dados reais no card (`feat/003-dados-steam-card`)

Será detalhada aqui depois do merge da 3a, seguindo o `plan.md`.
