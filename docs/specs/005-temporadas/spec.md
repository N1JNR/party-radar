# 005 — Temporadas: patente que recomeça

**Status:** aprovada em 2026-11-03; textos da trilha aprovados no mesmo dia, na conferência da spec 004; a patente do topo virou "Lenda" na spec 009
**Relacionada a:** `004-novo-dashboard` (a trilha onde a patente aparece) · `003-steam` (as fotos
diárias de tempo de jogo) · spec de amigos (o placar do squad, que vem depois).

## Problema

Hoje a patente só acumula: quem tem muitas horas fica no topo para sempre, e não há disputa nem
motivo para voltar. Jogos como Call of Duty resolvem isso com temporadas: uma parte do progresso
recomeça para todos, e outra fica para sempre.

## Comportamento esperado

O jogador passa a ter duas trilhas:

- **Carreira (nunca zera):** todas as horas da vida dele na Steam. É o histórico, sem patente nem
  disputa.
- **Temporada (recomeça):** um período de **60 dias**, com as mesmas datas para todos. Todo mundo
  começa do zero, e a patente sobe com as horas jogadas **na temporada**. As metas são fixas, então
  todos podem alcançar todas as patentes.

**Metas de uma temporada de 60 dias:**

| Patente                  | Horas na temporada | Ritmo aproximado  |
| ------------------------ | ------------------ | ----------------- |
| NPC                      | 0h                 | acabou de chegar  |
| Recruta da fila          | 5h                 | 35 min por semana |
| Soldado do fim de semana | 15h                | 2h por semana     |
| Veterano de lobby        | 40h                | 5h por semana     |
| Lenda                    | 120h               | 2h por dia        |
| Sem vida social          | 200h               | 3h20 por dia      |

**Limite diário:** contam no máximo **8 horas por dia** para a temporada, porque a Steam conta o
tempo com o jogo aberto, mesmo parado. As horas além disso continuam valendo na carreira.

**Fim da temporada:** a patente final vira um **troféu permanente** no perfil ("Temporada 1: Veterano
de lobby"), a pessoa pode compartilhar a imagem da temporada e a seguinte começa no dia seguinte, do
zero.

As exigências de horas com amigos e de amigos diferentes saem das patentes por enquanto: sem a spec
de amigos, ninguém conseguiria cumpri-las. Elas podem voltar como outro tipo de conquista depois.

**Textos da trilha:** a trilha deixa claro que as horas são da temporada e somam todos os jogos.

> **Sua patente: Veterano de lobby**
> Temporada 1: faltam 52 dias.
> 42h nesta temporada, somando todos os seus jogos. Faltam 78h para Lenda.

| Patente                  | Texto da meta       | Ritmo                      |
| ------------------------ | ------------------- | -------------------------- |
| NPC                      | Início da temporada | sem ritmo                  |
| Recruta da fila          | 5h                  | cerca de 35 min por semana |
| Soldado do fim de semana | 15h                 | cerca de 2h por semana     |
| Veterano de lobby        | 40h                 | cerca de 5h por semana     |
| Lenda                    | 120h                | cerca de 2h por dia        |
| Sem vida social          | 200h                | cerca de 3h20 por dia      |

## Fora do escopo

- Placar do squad e coroa de campeão: entram com a spec de amigos.
- Metas de semana e desafios (como os Trials do ARC Raiders).
- Recompensas além do troféu.
- Temporadas por jogo ou com regras diferentes entre si.
- Patente na carreira.

## Critérios de aceite

**Temporada**

- **CA1** — Dado uma temporada em andamento, quando abro o Meu card, então vejo o nome dela, quantos
  dias faltam, as minhas horas nela e a minha patente na temporada.
- **CA2** — Dado o início da temporada, então todos começam com 0h e NPC, mesmo com milhares de horas
  na carreira.
- **CA3** — Dado que joguei durante a temporada, então só o tempo jogado dentro dela conta; o que foi
  jogado antes do primeiro dia não conta, e o primeiro mês estimado (spec 003) também não.
- **CA4** — Dado as horas na temporada, então a patente e o "quanto falta" seguem a tabela de metas, e
  ao bater uma meta a patente sobe na leitura seguinte. A trilha usa os textos desta spec e não fala em
  amigos.
- **CA5** — Dado as datas, então início, fim e o dia de cada jogo seguem o fuso de São Paulo, e a
  temporada dura 60 dias.

**Limite diário**

- **CA6** — Dado um dia em que joguei mais de 8 horas, então só 8 horas contam para a temporada e todas
  contam na carreira.
- **CA7** — Dado dias sem leitura da Steam (computador ou serviço fora do ar), quando a leitura volta,
  então o limite é de 8 horas por dia passado desde a última leitura, para ninguém perder horas jogadas
  por uma falha do Party Radar.
- **CA8 (privada)** — Dado que deixei a Steam privada por um tempo, quando ela volta a ser pública, então o
  tempo jogado nesse intervalo conta como no CA7, respeitando o início da temporada.

**Entrada e fim**

- **CA9** — Dado que conectei a Steam no meio da temporada, então entro na temporada em andamento a partir
  daquele dia, do zero, com os dias que faltam.
- **CA10** — Dado o último dia da temporada, quando ela termina, então a patente final vira um troféu no
  meu perfil e a temporada seguinte começa no dia seguinte, sem ação de ninguém.
- **CA11** — Dado que não joguei nada na temporada ou não estava nela, então não ganho troféu.
- **CA12** — Dado os meus troféus, então eu os vejo no Meu card, em ordem da mais recente para a mais antiga.
- **CA13** — Dado um troféu ou a temporada em andamento, quando toco em compartilhar, então a imagem traz a
  temporada, a patente, as horas e o jogo principal dela, com as mesmas regras da `004-novo-dashboard`
  (CA14 a CA16).

**Carreira**

- **CA14** — Dado o Meu card, então a carreira mostra as horas totais na Steam, que não zeram quando a
  temporada termina.

**Falhas e estados**

- **CA15 (erro)** — Dado que a leitura da Steam falhou, então a temporada mantém as últimas horas lidas,
  com "Atualizado há <tempo>" (spec 003, CA15).
- **CA16 (vazio)** — Dado que não conectei a Steam, então a trilha aparece em NPC com "Conectar Steam" e sem
  troféus.
- **CA17 (segurança)** — Dado dois usuários, então nenhum lê as horas de temporada nem os troféus do outro (até a
  spec de amigos definir o que amigos veem) e ninguém altera temporada, horas ou troféus pelo app.
- **CA18 (acessibilidade)** — Dado a trilha e os troféus, então eles são lidos pelo leitor de tela, com a
  patente e o progresso em texto. Só a patente seguinte é "Próxima"; as depois dela são "A conquistar".

## Telas

Canvas "Party Radar — Novo Meu card", artboard **D — Temporada com radar**: a trilha já está lá; entram o
nome da temporada, os dias restantes, a carreira e os troféus.

## Referências

- Call of Duty: temporadas de cerca de 60 a 65 dias, segundo um site de acompanhamento; rank da temporada
  zera, e no MW2 o nível geral continuava.
- ARC Raiders: desafios semanais com placar que recomeça (ideia para depois).
- Valorant: reset parcial a cada ato, e reclamações quando ele parece duro; por isso o troféu guarda o que foi
  conquistado.

## Decisões a aprovar

- [x] Temporada de **60 dias**, com as mesmas datas para todos.
- [x] Tabela de metas acima (chute inicial, a calibrar depois da primeira temporada).
- [x] Limite de **8 horas por dia** para a temporada.
- [x] Sair a exigência de amigos das patentes por enquanto.
- [x] Temporada 1 começa no dia em que esta entrega for ao ar.
- [x] Carreira sem patente: só as horas totais.
