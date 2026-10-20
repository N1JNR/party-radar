# 003 — Plano técnico

**Spec:** `spec.md` (aprovada em 2026-10-19)

## Entrega em duas partes

| Parte                        | Branch                      | O que entrega                                                                                          | Critérios          |
| ---------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------ |
| **3a — Conectar a Steam**    | `feat/003-conectar-steam`   | conta Steam ligada ao perfil, confirmação no servidor, primeira leitura, aviso de perfil privado real  | CA1–CA7, CA16–CA18 |
| **3b — Dados reais no card** | `feat/003-dados-steam-card` | leitura diária e do "jogando agora", horas do mês, patente e card com dados reais; vazios sem exemplos | CA8–CA15           |

A 3a já deixa o card com o passo "Conectar Steam" funcionando; a 3b troca os dados de exemplo pelos
reais. Cada parte tem PR próprio.

## Abordagem

A Steam não tem OAuth: o "Entrar pela Steam" é **OpenID 2.0**. O navegador vai à página da Steam
e volta ao app com uma resposta assinada; essa resposta só vale depois que o **servidor** a
confere com a própria Steam (`check_authentication`). Toda leitura de dados usa a **Steam Web API**
com a chave, que fica só no servidor. Por isso entra uma camada nova: **Edge Functions** do
Supabase, chamadas pelo app (com a sessão de quem está logado) e por agendamentos no banco.

```
Meu card ── "Conectar Steam" ──► steamcommunity.com/openid/login (a pessoa confirma)
   ▲                                              │
   │                                              ▼
   └── /steam/retorno?openid.* ──► Edge Function steam-connect
                                      1. confere a resposta com a Steam (check_authentication)
                                      2. tira o SteamID do claimed_id
                                      3. grava steam_accounts (uma conta Steam = um perfil)
                                      4. faz a primeira leitura (steam-sync)

pg_cron ── 1x por dia ──► steam-sync (todas as contas)  ──► steam_playtime_snapshots
pg_cron ── a cada 5 min ─► steam-presence (lote de 100) ──► steam_accounts.current_game
```

### Leituras da Steam Web API

| Chamada                               | Para quê                                                                      |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| `ISteamUser/GetPlayerSummaries/v0002` | perfil público (`communityvisibilitystate` 3) e jogo aberto (`gameextrainfo`) |
| `IPlayerService/GetOwnedGames/v0001`  | tempo total por jogo (`playtime_forever`) e das últimas 2 semanas, em minutos |

Perfil público com a lista de jogos vazia, ou resposta `{"response":{}}`, conta como **detalhes de
jogos privados** (CA6). Erro HTTP da Steam não apaga os dados anteriores (CA15).

### Horas do mês e patente

O banco guarda uma **foto diária** do tempo total de cada jogo. As horas do mês saem da diferença
entre a foto mais recente e a primeira foto do mês, somada por jogo. No mês da conexão, soma-se o
ponto de partida: as "últimas 2 semanas" lidas na conexão (decisão da spec), e o card mostra
"estimativa" nesse mês. A patente usa o total desde a conexão: ponto de partida + tudo o que
cresceu nas fotos. As contas são feitas por uma função SQL (`security invoker`), testada com pgTAP.

## Arquivos afetados

### Parte 3a

| Arquivo                                                        | Mudança                                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `supabase/migrations/<data>_steam_accounts.sql`                | novo: `steam_accounts` com RLS (cada um lê a sua)                                    |
| `supabase/tests/steam_accounts.test.sql`                       | novo: pgTAP das policies e da unicidade do SteamID                                   |
| `supabase/functions/_shared/steam-openid.ts`                   | novo: monta e confere a resposta OpenID (puro, testado com Deno)                     |
| `supabase/functions/_shared/steam-api.ts`                      | novo: chamadas e leitura das respostas da Steam Web API (testado com Deno, sem rede) |
| `supabase/functions/steam-connect/index.ts`                    | novo: confere com a Steam, grava a conta e faz a primeira leitura                    |
| `supabase/functions/steam-sync/index.ts`                       | novo: lê perfil e jogos de uma conta (quem está logado) ou de todas (agendamento)    |
| `supabase/functions/.env.example`                              | novo: `STEAM_WEB_API_KEY` para as funções locais                                     |
| `supabase/config.toml`                                         | alterado: `verify_jwt` das funções                                                   |
| `src/app/features/steam/domain/steam-connect.ts`               | novo: endereço de ida à Steam e mensagens da volta (puro, 100%)                      |
| `src/app/features/steam/data/steam.source.ts` (+ simulada)     | novo: estado da conta, conectar, verificar de novo (chama as Edge Functions)         |
| `src/app/features/steam/pages/steam-return.page.*`             | novo: rota `/steam/retorno`                                                          |
| `src/app/features/home/domain/strengthen.ts`                   | alterado: passo "Conectar Steam"                                                     |
| `src/app/features/home/ui/strengthen-card/*`, `steam-notice/*` | alterados: botão "Conectar Steam"; "Já deixei público" verifica de verdade (CA7)     |
| `src/app/core/platform/browser-navigation.ts`                  | novo: sair do app para um endereço externo (troca pelo Capacitor no futuro)          |
| `package.json`, `.github/workflows/ci.yml`                     | alterados: `npm run fn:test` (Deno) e o job de CI                                    |

### Parte 3b

| Arquivo                                              | Mudança                                                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `supabase/migrations/<data>_steam_playtime.sql`      | novo: `steam_playtime_snapshots`, função `my_card_stats()` e agendamentos (`pg_cron` + `pg_net`) |
| `supabase/tests/steam_playtime.test.sql`             | novo: pgTAP das contas do mês, da patente e das policies                                         |
| `supabase/functions/steam-presence/index.ts`         | novo: jogo aberto de todas as contas, em lotes de 100                                            |
| `src/app/features/home/domain/player-card.ts`        | alterado: horas do mês separadas das horas da patente; "estimativa"; "Atualizado há"             |
| `src/app/features/home/data/supabase-home.source.ts` | novo: fonte real da home (perfil, Steam, `my_card_stats`); amigos e squads vazios                |
| `src/app/features/home/data/home-source.provider.ts` | novo: fonte real por padrão; a simulada só com `?simular=` em desenvolvimento                    |
| `src/app/features/home/ui/player-card/*`             | alterado: horas do mês, "estimativa", "Atualizado há <tempo>"                                    |
| `src/app/features/home/pages/home.page.*`            | alterado: "Lendo seus dados da Steam…" e atualização do "jogando agora" a cada minuto            |

## Dados

### `steam_accounts` (3a)

| Coluna             | Tipo          | Regra                                                  |
| ------------------ | ------------- | ------------------------------------------------------ |
| `user_id`          | `uuid`        | PK, `references auth.users(id) on delete cascade`      |
| `steam_id`         | `text`        | não nulo, **único**, 17 dígitos (CA4)                  |
| `persona_name`     | `text`        | nome na Steam                                          |
| `visibility`       | `text`        | `public`, `private` ou nulo (ainda não lido)           |
| `current_game`     | `text`        | jogo aberto agora, ou nulo (3b)                        |
| `connected_at`     | `timestamptz` | `default now()`                                        |
| `last_synced_at`   | `timestamptz` | última leitura bem-sucedida (CA15)                     |
| `baseline_minutes` | `integer`     | "últimas 2 semanas" lidas na conexão (decisão da spec) |

**RLS:** `select` só da própria linha (`user_id = auth.uid()`), CA16. Sem `insert`, `update` ou
`delete` pela API: só as Edge Functions gravam, com a secret key.

Revisão 2 (CA20): coluna `sync_attempted_at` (`timestamptz`), a última vez que o `steam-sync`
tentou ler a Steam, com sucesso ou não. O `steam-sync` só lê se ela for nula ou tiver mais de 30 s,
reservando o horário num `update ... where` só (duas chamadas juntas não leem as duas).

### `steam_openid_nonces` (3a, revisão 2)

| Coluna    | Tipo          | Regra                                            |
| --------- | ------------- | ------------------------------------------------ |
| `nonce`   | `text`        | PK: o `response_nonce` assinado pela Steam (CA3) |
| `used_at` | `timestamptz` | `default now()`                                  |

O `steam-connect` grava o nonce depois de a Steam confirmar a volta; se ele já existe, a volta é
recusada. Nonces com mais de 10 minutos são apagados a cada conexão (a volta vale só 5 minutos).
**RLS** ligado e sem policies: só a secret key lê e grava.

### `steam_playtime_snapshots` (3b)

| Coluna          | Tipo      | Regra                                         |
| --------------- | --------- | --------------------------------------------- |
| `user_id`       | `uuid`    | `references auth.users(id) on delete cascade` |
| `app_id`        | `integer` | jogo na Steam                                 |
| `game_name`     | `text`    | nome do jogo                                  |
| `taken_on`      | `date`    | dia da foto                                   |
| `minutes_total` | `integer` | `playtime_forever` naquele dia                |

PK `(user_id, app_id, taken_on)`. **RLS:** `select` só das próprias fotos.

`public.my_card_stats()` (`security invoker`, `search_path` vazio) devolve, para quem está
logado: horas do mês, jogos com tempo no mês, jogo do mês, horas desde a conexão, se o mês é
estimativa, jogo aberto, visibilidade e `last_synced_at`.

## Integrações externas

- **Steam OpenID** (`https://steamcommunity.com/openid/login`): ida pelo navegador; conferência
  `check_authentication` feita pela Edge Function.
- **Steam Web API:** chave em `STEAM_WEB_API_KEY`, lida pelas Edge Functions
  (`supabase/functions/.env` no local; `supabase secrets` na nuvem). Limite da Steam: 100 mil
  chamadas por dia; com lotes de 100 contas no "jogando agora", sobra folga.
- **Agendamento:** `pg_cron` chama as funções por `pg_net`, com a secret key guardada no Vault do
  Supabase, nunca em migration.

## Estratégia de testes

| Critério                       | Tipo de teste                | Onde                                                   |
| ------------------------------ | ---------------------------- | ------------------------------------------------------ |
| CA3 (resposta OpenID)          | unitário (Deno)              | `supabase/functions/_shared/steam-openid.test.ts`      |
| CA6, CA15 (respostas da Steam) | unitário (Deno, sem rede)    | `supabase/functions/_shared/steam-api.test.ts`         |
| CA4, CA16 (contas e RLS)       | banco (pgTAP)                | `supabase/tests/steam_accounts.test.sql`               |
| CA8, CA9, CA14 (contas do mês) | banco (pgTAP)                | `supabase/tests/steam_playtime.test.sql`               |
| CA1, CA2, CA5, CA7 (front)     | unitário e componente        | `features/steam/**`, `features/home/**`                |
| CA8–CA13 (card real)           | componente com fonte falsa   | `features/home/**`                                     |
| CA17 (chave fora do front)     | revisão + busca no build     | `npm run build` sem `STEAM_WEB_API_KEY` no pacote      |
| de ponta a ponta               | manual, com a conta do Jorge | conectar, perfil privado, horas, jogando agora; prints |

## Riscos

- **Deno nos testes:** as Edge Functions rodam em Deno, fora do Vitest do Angular. Os testes delas
  usam `deno test` pelo pacote npm `deno`; se não der certo na CI, a lógica pura fica em `_shared`
  sem dependências e o teste roda no Vitest.
- **Resposta OpenID repetida:** a Steam confere a assinatura, não o reuso. A função exige que o
  `return_to` seja o endereço do app e que a resposta seja recente (`response_nonce` com menos de
  5 minutos).
- **Steam instável:** `GetOwnedGames` às vezes devolve vazio ou erro 500; a leitura com erro não
  sobrescreve a anterior e o card mostra "Atualizado há".
- **Primeiro mês estimado:** as "últimas 2 semanas" podem incluir dias do mês anterior; o card
  avisa que é estimativa.
- **Agendamento local:** `pg_cron` roda no Supabase local, mas o "jogando agora" a cada 5 minutos
  gasta chamadas mesmo sem ninguém olhando; na nuvem, revisar a frequência com o número de contas.
- **Chave da Steam:** sem ela, dá para fazer quase tudo com a fonte simulada; a conferência de
  ponta a ponta depende dela.
