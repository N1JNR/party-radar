# 004 — Plano técnico

**Spec:** `spec.md` (aprovada em 2026-11-03)

## Abordagem

Três camadas, nesta ordem:

1. **Banco:** uma lista de tipos de jogo (`game_categories`) e uma função `my_games()` que devolve,
   para quem está logado, cada jogo com tipo, total, mês atual e mês anterior. As contas seguem as
   mesmas regras do `my_card_stats` (spec 003).
2. **Servidor:** na leitura da Steam, jogos jogados ainda sem tipo são consultados uma vez na loja da
   Steam, e o resultado fica na lista.
3. **Front:** regras puras do radar em `domain/`; a home passa a ser montada por componentes novos
   (trilha, radar, blocos, mês, corrida) e o botão de compartilhar desenha a imagem num canvas.

## Arquivos afetados

| Arquivo                                                        | Mudança                                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `supabase/migrations/<data>_game_categories.sql`               | novo: tabela, RLS e lista inicial de jogos                               |
| `supabase/migrations/<data>_my_games.sql`                      | novo: função `my_games()`                                                |
| `supabase/tests/game_categories.test.sql`, `my_games.test.sql` | novos: pgTAP                                                             |
| `supabase/functions/_shared/steam-store.ts`                    | novo: lê os gêneros da loja e escolhe o tipo (puro, testado)             |
| `supabase/functions/_shared/steam-link.ts`, `supabase.ts`      | alterados: a leitura classifica os jogos sem tipo                        |
| `src/app/features/home/domain/player-radar.ts`                 | novo: tipos, porcentagens, pontos do radar, título, blocos               |
| `src/app/features/home/data/home.source.ts` e as duas fontes   | alterados: jogos e mês anterior nos dados da home                        |
| `src/app/features/home/ui/rank-track/*`                        | novo: trilha da patente                                                  |
| `src/app/features/home/ui/player-radar/*`                      | novo: radar em SVG, período e tipos                                      |
| `src/app/features/home/ui/game-blocks/*`                       | novo: blocos de jogos                                                    |
| `src/app/features/home/ui/squad-race/*`                        | novo: "Corrida do squad" vazia, com convite                              |
| `src/app/features/home/pages/home.page.*`                      | alterado: layout novo e estados                                          |
| `src/app/features/home/ui/player-card/*`                       | removido: dá lugar aos componentes novos                                 |
| `src/app/features/home/data/radar-image.ts`                    | novo: desenha a imagem de compartilhar num canvas                        |
| `src/app/core/platform/share.service.ts`                       | novo: compartilhar pelo aparelho ou baixar (troca pelo Capacitor depois) |
| `DESIGN.md`, `docs/plano.md`                                   | alterados: radar como peça de destaque; ordem das specs                  |

As seções de amigos (`squad-opportunity`, `playing-now`, `partnership-question`) continuam no código,
mas só aparecem com dados: na fonte real, hoje, nunca; voltam com a spec de amigos. "Onde joga" e
"Parceiro de squad" saem da tela nesta entrega, o que substitui o CA11 e parte do CA13 da spec 003.

## Dados

### `game_categories`

| Coluna     | Tipo      | Regra                                                                              |
| ---------- | --------- | ---------------------------------------------------------------------------------- |
| `app_id`   | `integer` | PK                                                                                 |
| `category` | `text`    | `tiro`, `esporte`, `corrida`, `simulacao`, `arcade`, `rpg`, `aventura` ou `outros` |
| `source`   | `text`    | `curada` (lista nossa) ou `loja` (gênero da loja da Steam)                         |

**RLS:** `select` para quem está logado (não há dado pessoal); escrita só com a secret key. Um jogo
sem linha conta em "Outros". O resultado `outros` também fica gravado, para a loja ser consultada
uma vez só; só uma resposta da loja grava: falha não grava, e a próxima leitura tenta de novo (CA8).

### `public.my_games(p_now)`

`security invoker`, `search_path` vazio, só para `authenticated`. Uma linha por jogo com tempo
jogado: `app_id`, `game_name`, `category`, `total_minutes`, `month_minutes`,
`previous_month_minutes` e `previous_is_estimate`. Mês anterior com a mesma regra do mês atual, um
mês antes.

### Do gênero da loja para o tipo

Prioridade: Racing → Corrida; Sports → Esporte; RPG → RPG; Simulation → Simulação; Adventure →
Aventura. "Action" não decide nada (a loja chama quase tudo de ação), então jogo só de ação fica em
"Outros" até entrar na lista curada. Consulta em inglês (`l=english`), para os nomes não mudarem.

## Integrações externas

- **Loja da Steam** (`store.steampowered.com/api/appdetails?appids=<id>&filters=genres`): sem chave,
  sem contrato oficial e com limite informal de cerca de 200 pedidos a cada 5 minutos. No máximo **20
  jogos por leitura**, os de mais horas primeiro, com o limite de 10 segundos da spec 003; o resto fica
  para a leitura seguinte. Falha nunca derruba a leitura da Steam.

## Compartilhar

A imagem (1080 × 1350) é desenhada num `<canvas>` com os dados que já estão na tela, sem ida ao
servidor. O `ShareService` usa `navigator.share` com arquivo quando o aparelho permite; senão, baixa.

## Estratégia de testes

| Critério                  | Tipo de teste              | Onde                                                 |
| ------------------------- | -------------------------- | ---------------------------------------------------- |
| CA2, CA3, CA5, CA9, CA10  | unitário (domain, 100%)    | `domain/player-radar.spec.ts`                        |
| CA6, CA8, CA25            | banco (pgTAP)              | `supabase/tests/game_categories.test.sql`            |
| CA9, CA11, CA25           | banco (pgTAP)              | `supabase/tests/my_games.test.sql`                   |
| CA7, CA8                  | unitário (Deno, sem rede)  | `_shared/steam-store.test.ts`, `steam-link.test.ts`  |
| CA1, CA3, CA4, CA12, CA23 | componente                 | `ui/player-radar`, `ui/rank-track`, `ui/game-blocks` |
| CA13, CA17–CA21           | componente com fonte falsa | `pages/home.page.spec.ts`                            |
| CA14–CA16                 | unitário e componente      | `data/radar-image.spec.ts`, `share.service.spec.ts`  |
| CA22, CA24                | manual, com prints         | 390, 768 e 1280 px; `prefers-reduced-motion`         |

## Riscos

- **Loja da Steam sem contrato:** pode mudar ou bloquear. A lista curada e "Outros" seguram a tela.
- **Lista curada é trabalho manual:** começa pelos jogos populares; jogo novo só de ação cai em
  "Outros" até alguém incluir.
- **Canvas e fontes:** a imagem espera a fonte carregar; se não carregar, sai com a fonte reserva.
- **`navigator.share` com arquivo** não existe em todo navegador: nesses, baixa a imagem.
