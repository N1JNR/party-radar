# 005 — Plano técnico

**Spec:** `spec.md` (aprovada em 2026-11-03)

## Abordagem

Três camadas, nesta ordem:

1. **Banco:** a temporada é calculada a partir de uma data inicial, então a seguinte começa sozinha. As
   horas saem das fotos diárias que já existem, com o limite de 8 horas por dia. Uma tarefa agendada
   transforma a patente final em troféu.
2. **Servidor:** a leitura da Steam passa a registrar o dia de cada leitura, porque o limite precisa
   saber há quantos dias foi a última.
3. **Front:** as metas e os textos novos nas patentes, a temporada e a carreira na trilha, a lista de
   troféus e a imagem da temporada. Os amigos saem das patentes.

## Arquivos afetados

| Arquivo                                                      | Mudança                                                        |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| `supabase/migrations/<data>_seasons.sql`                     | novo: data inicial e `season_at()`                             |
| `supabase/migrations/<data>_steam_reading_days.sql`          | novo: dias com leitura da Steam, com os dias antigos das fotos |
| `supabase/migrations/<data>_season_minutes.sql`              | novo: `season_minutes()`, `season_rank()` e `my_season()`      |
| `supabase/migrations/<data>_season_trophies.sql`             | novo: troféus, `private.close_seasons()` e agendamento         |
| `supabase/tests/seasons.test.sql` e `season_*.test.sql`      | novos: pgTAP                                                   |
| `supabase/functions/_shared/steam-link.ts`, `supabase.ts`    | alterados: a leitura registra o dia                            |
| `src/app/features/home/domain/patentes.ts`                   | alterado: metas, textos e ritmo; sem amigos                    |
| `src/app/features/home/domain/season.ts`                     | novo: temporada, dias restantes e troféus                      |
| `src/app/features/home/domain/player-card.ts`                | alterado: `stats` sai do card                                  |
| `src/app/features/home/data/home.source.ts` e as duas fontes | alterados: temporada e troféus nos dados da home               |
| `src/app/features/home/data/home.store.ts`                   | alterado: a patente vem das horas da temporada                 |
| `src/app/features/home/data/season-image.ts`                 | novo: imagem da temporada e do troféu                          |
| `src/app/features/home/ui/rank-track/*`                      | alterado: textos, temporada, carreira e compartilhar           |
| `src/app/features/home/ui/season-trophies/*`                 | novo: lista de troféus                                         |
| `src/app/features/home/pages/*`                              | alterado: liga a trilha, os troféus e a imagem                 |
| `DESIGN.md`, `docs/plano.md`                                 | alterados: troféus e estado da spec                            |

## Dados

### `season_config`

Uma linha só, com `first_day date`: o primeiro dia da Temporada 1. A migration grava o dia em que for
aplicada, no fuso de São Paulo. Assim, a Temporada 1 começa quando a entrega for ao ar na nuvem, sem
data escrita à mão. **No banco local, ela começa no dia em que a migration rodar.**

Quem está logado lê; ninguém grava pelo app.

`season_at(p_day date)` devolve `number`, `starts_on` e `ends_on`, com 60 dias cada e sem linha por
temporada. Assim, a seguinte existe mesmo se um agendamento falhar (CA10).

### `steam_reading_days`

`user_id` e `day`, com chave nas duas colunas. Cada pessoa lê os próprios dias; só as Edge Functions
gravam.

Sem esta tabela, o limite não distingue dois casos, porque as fotos só guardam os jogos que mudaram:

- três dias sem leitura, com 20h jogadas: vale até 24h;
- três dias com leitura e sem jogo, seguidos de 20h num dia só: vale só 8h.

A migration preenche os dias antigos a partir das fotos existentes.

### `season_minutes(p_user_id, p_starts_on, p_ends_on, p_today)`

`security invoker`: o RLS das fotos vale, então pedir os dados de outra pessoa devolve zero (CA17). A
tarefa agendada roda como dono das tabelas e lê todos, sem precisar de `security definer`.

Para cada dia da temporada:

1. **Tempo do dia:** soma, em todos os jogos, o que cada um cresceu desde a foto anterior dele. Fotos de
   antes da temporada servem só de base (CA3).
2. **Primeira foto de um jogo:**
   - na primeira foto da conta, conta zero (CA3 e CA9);
   - num jogo que apareceu depois, conta `least(minutes_2weeks, minutes_total)`, como no `my_card_stats`.
3. **Limite do dia:** 480 minutos × dias desde a leitura anterior, contados a partir do início da
   temporada (CA6, CA7 e CA8).

O resultado é a soma dos dias, cada um no máximo até o limite, e o jogo principal da temporada.

### `my_season(p_now)`

Devolve, para quem está logado, número, início, fim, minutos e jogo principal. Sem Steam conectada, não
devolve linha (CA16).

### `season_trophies`

| Coluna          | Tipo          | Regra                                     |
| --------------- | ------------- | ----------------------------------------- |
| `user_id`       | `uuid`        | PK com `season_number`, apaga com a conta |
| `season_number` | `integer`     | PK                                        |
| `rank_id`       | `text`        | uma das 6 patentes                        |
| `minutes`       | `integer`     | maior que 0                               |
| `top_game`      | `text`        | pode ser nulo                             |
| `awarded_at`    | `timestamptz` | agora                                     |

Cada pessoa lê os próprios troféus; ninguém grava pelo app (CA17). A patente fica gravada, então mudar
as metas depois não altera troféus antigos.

`private.close_seasons(p_now)` roda todo dia às 00h30 de São Paulo, depois da leitura das 23h55. Ela
fecha toda temporada terminada que ainda não tem troféu e pode rodar de novo sem duplicar. Quem jogou 0h
não ganha troféu (CA11). Quem jogou pouco e terminou em NPC ganha "Temporada 1: NPC".

### Metas em dois lugares

As metas ficam em `season_rank()` (SQL, para o troféu) e em `PATENTES` (front, para a trilha). Os testes
dos dois lados conferem a mesma tabela da spec. Ler as metas do banco exigiria outra chamada na home só
para evitar essa repetição.

## Front

- **Patentes:** `progressFor(hours)` recebe só as horas. Saem `PlayStats`, `hoursWithFriends` e
  `distinctFriends`.
- **Home:** `HomeData` ganha `season` e `trophies`. A fonte real chama `my_season` e lê
  `season_trophies` junto com `my_card_stats` e `my_games`. O `total_minutes` de `my_card_stats` deixa de
  ser usado pelo app, mas continua no banco.
- **Carreira (CA14):** a soma de `games`, que já está na tela. Não precisa de SQL novo.
- **Imagem:** segue `radar-image.ts` e o `ShareService`, com o @usuário, a temporada, a patente, as horas
  e o jogo principal.

## Integrações externas

Nenhuma nova. A Steam segue como está: se a leitura falhar, nada é gravado e a temporada mantém as
últimas horas (CA15).

## Estratégia de testes

| Critério                | Tipo de teste           | Onde                                      |
| ----------------------- | ----------------------- | ----------------------------------------- |
| CA2, CA5                | banco (pgTAP)           | `supabase/tests/seasons.test.sql`         |
| CA3, CA6, CA7, CA8, CA9 | banco (pgTAP)           | `supabase/tests/season_minutes.test.sql`  |
| CA7, CA8                | unitário (Deno)         | `_shared/steam-link.test.ts`              |
| CA10, CA11, CA17        | banco (pgTAP)           | `supabase/tests/season_trophies.test.sql` |
| CA4                     | unitário (domain, 100%) | `domain/patentes.spec.ts`                 |
| CA1, CA12               | unitário (domain, 100%) | `domain/season.spec.ts`                   |
| CA1, CA4, CA18          | componente              | `ui/rank-track`, `ui/season-trophies`     |
| CA13                    | unitário e componente   | `data/season-image.spec.ts`, página       |
| CA14, CA15, CA16        | componente, fonte falsa | `pages/home.page.spec.ts`                 |
| CA1, CA14, CA18 na tela | manual, com prints      | conta do Jorge, em 390, 768 e 1280 px     |

## Riscos

- **Leitura diária:** as 23h55 ainda não rodaram de ponta a ponta com a máquina ligada. Sem ela, as horas
  caem no dia em que a leitura voltar. Na virada da temporada, elas podem ir para a seguinte. Conferir o
  agendamento antes de publicar.
- **Intervalo que cruza o início da temporada:** com uma só foto não dá para separar o que foi jogado
  antes do primeiro dia, então esse tempo entra, até 8 horas por dia. Com a leitura diária, o intervalo
  não existe. Foi o que aconteceu no banco local na conferência: 8h no primeiro dia.
- **Fim da temporada:** tempo lido depois do fechamento não muda o troféu.
- **Trocar de conta Steam no meio da temporada:** a spec 003 apaga as fotos da conta anterior, então as
  horas da temporada recomeçam. Os troféus ficam.
- **Volta a NPC:** ao publicar, todos recomeçam do zero, inclusive quem hoje é Veterano. É o combinado na
  spec (CA2).
- **Custo por minuto:** a home relê os dados a cada minuto, e agora com mais uma consulta. Fica como está
  nesta entrega, porque o volume é pequeno; é o mesmo achado deixado de fora na spec 004.
- **Publicação:** a nuvem ainda precisa da chave da Steam e da `service_role_key` no Vault. Sem isso, as
  leituras não rodam e a temporada não anda.
