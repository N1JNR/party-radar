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
- [x] T12 — `/code-review`, `/security-review`, `npm run verify:all` e relatório final
  - `/code-review` (high) em 2026-10-20: 9 achados. 8 corrigidos nas tarefas T12a–T12e (revisão 2
    da spec), conferidos no navegador com a conta do Jorge (print 08 e o intervalo de 30 s); o
    `steamPublic` duplicado da home sai na 3b.
  - `/security-review`: nenhuma vulnerabilidade de confiança alta. Abaixo do limite, para depois:
    a volta da Steam não traz um `state` da sessão, então alguém poderia fazer uma pessoa logada
    abrir a volta da conta Steam dele em até 5 minutos e ligar a Steam errada ao perfil dela (sem
    ler nada da vítima; ela reconecta a dela).
  - `npm run verify:all` passou: lint, formatação, 391 testes do front, 47 das funções e 39 do
    banco. Fica o aviso de tamanho do pacote inicial (1,27 MB, limite de aviso 1,2 MB), já anotado
    na spec 001.
- [x] T12a — Volta da Steam usada uma vez só: tabela `steam_openid_nonces` (RLS, só o servidor
      grava, limpeza das antigas) com pgTAP; `steam-connect` recusa a volta repetida (CA3)
- [x] T12b — Ligar a conta: trocar de conta zera nome, visibilidade e jogo da anterior; reconectar a
      mesma conta mantém o ponto de partida (CA19)
- [x] T12c — Erro de banco na primeira leitura não desfaz "conectada" (leitura fica pendente) e
      cada chamada à Steam desiste em 10 s (CA19, CA20)
- [x] T12d — `steam-sync` lê a Steam no máximo a cada 30 s por pessoa; dentro do intervalo devolve
      a última leitura (CA20)
- [x] T12e — Card: quadro visível enquanto lê, com "Tentar de novo"; a volta da Steam usa
      `openIdFromSearch` (CA2, CA19)

## Parte 3b — Dados reais no card (`feat/003-dados-steam-card`)

Segue o `plan.md` (Parte 3b e "Ajustes da Parte 3b"). Banco e servidor primeiro, depois o front.

**Banco e servidor**

- [x] T13 — Migration `steam_playtime_snapshots` (foto diária por jogo: tempo total e das últimas
      2 semanas), RLS só das próprias fotos, pgTAP e `database.types.ts` (CA14, CA16)
- [x] T14 — Leitura grava a foto do dia: `syncAccount` guarda o tempo de cada jogo (uma foto por
      jogo e dia, a do dia é atualizada), testado com Deno (CA14, CA15)
- [x] T15 — Função `my_card_stats()` (`security invoker`, fuso de São Paulo): horas do mês, jogos
      no mês, jogo do mês, horas desde a conexão, se o mês é estimativa, jogo aberto, nome na
      Steam, visibilidade e última leitura; pgTAP com mês da conexão, mês seguinte, sem fotos,
      Steam privada e outra pessoa (CA8, CA9, CA12, CA14, CA16, CA21)
- [x] T16 — `steam-sync` agendado: chamado com a secret key, lê todas as contas em lotes, sem
      parar no erro de uma conta, testado com Deno (CA14, CA15)
- [x] T17 — Edge Function `steam-presence`: jogo aberto de todas as contas públicas, em lotes de
      100 por chamada à Steam, testada com Deno (CA10)
- [x] T18 — Agendamentos: migration liga `pg_cron` e `pg_net` e agenda a leitura diária e o
      "jogando agora" a cada 5 minutos, com endereço e chave lidos do Vault; `npm run
db:agendamentos` grava esses dois valores no Vault local; pgTAP dos agendamentos (CA10, CA14)

**Front**

- [x] T19 — Domínio do card: horas do mês separadas das horas da patente, "estimativa", "<nome>
      na Steam" e "Atualizado há <tempo>", 100% testado (CA8, CA9, CA15, CA21)
- [x] T20 — `SupabaseHomeSource`: perfil, `my_card_stats()`, "Onde joga" PC 100%, título
      escondido, amigos, squads e pergunta vazios, link de convite (CA8–CA13, CA21)
- [x] T21 — Fonte da home real por padrão (a simulada só com `?simular=` em desenvolvimento) e
      fim do `steamPublic` duplicado: o aviso de privada vem só da conta Steam (CA6, CA13)
- [x] T22 — Card e página: horas do mês, "estimativa", "<nome> na Steam", "Atualizado há"; o
      "jogando agora" é relido a cada minuto (CA8, CA10, CA12, CA15, CA21)
- [x] T23 — Conferência de ponta a ponta com a conta Steam do Jorge (horas, jogo do mês, patente,
      jogando agora, nome na Steam, leitura agendada), com prints (CA8–CA15, CA21)
  - Conferido em 2026-10-26 no Supabase local, com o Jorge logado pelo Discord e a chave real da
    Steam. O card trouxe "N1JNR na Steam", 45h no mês em 2 jogos com o aviso de estimativa (mês da
    conexão), ARC Raiders com 43h como jogo do mês, Veterano de lobby (46h desde a conexão), PC
    100% e os vazios de amigos e squads, iguais ao `my_card_stats()` no banco (CA8, CA9, CA11,
    CA13, CA21). Com o ARC Raiders aberto, o agendamento das 13h55 gravou o jogo e, sem recarregar,
    o card mostrou o anel e "Jogando ARC Raiders agora" (CA10). A leitura agendada (`steam-sync` com
    a secret key) gravou a foto do dia com 14 jogos (CA14); o horário das 23h55 fica para conferir
    no dia seguinte. A sessão no navegador segue sem os tokens do Discord. Prints 09 a 11 em
    `prints/`.
  - Limites: o "Atualizado há" (CA15) e a virada do mês (CA12) não acontecem num dia só; ficam
    cobertos pelos testes do domínio e do pgTAP (fuso de São Paulo, fotos antes e depois do mês).
- [x] T24 — `/code-review`, `/security-review`, `npm run verify:all` e relatório final
  - `/code-review` (high) em 2026-10-26: 8 achados, 7 corrigidos com testes:
    - fotos da conta anterior apagadas ao trocar de Steam;
    - leitura diária com as contas de cada lote em paralelo;
    - patente contando o jogo novo antes da primeira foto (migration
      `20261026160000_my_card_stats_jogo_novo`);
    - releitura de um minuto trazendo também a conta Steam;
    - foto só dos jogos que mudaram (`latest_playtime`);
    - home e Steam simuladas com o login simulado;
    - a chave que os agendamentos precisam na nuvem, registrada no `plan.md`.
      O tipo da linha de `my_card_stats` fica escrito à mão de propósito (o tipo gerado diz que as
      colunas nunca vêm nulas).
  - `/security-review`: nenhuma vulnerabilidade de confiança alta.
  - `npm run verify:all` passou: lint, formatação, 444 testes do front (linhas 99,76%), 70 das
    funções, 75 do banco e o build. Fica o aviso de tamanho do pacote inicial (1,27 MB), já
    anotado.
