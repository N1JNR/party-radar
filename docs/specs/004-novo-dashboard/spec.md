# 004 — Novo dashboard: radar do jogador

**Status:** aprovada em 2026-11-03
**Relacionada a:** `002-home` (a tela que muda) · `003-steam` (os dados reais) · `005-temporadas`
(a patente por temporada, que entra depois) · artboard **D — Temporada com radar** do canvas
"Party Radar — Novo Meu card".

## Problema

Os dados do card agora são reais, mas a tela ainda parece amadora: blocos parecidos, números soltos
e nada que dê vontade de mostrar. O jogador não vê que tipo de jogador ele é, nem as horas da vida
dele na Steam, e não consegue compartilhar nada.

## Comportamento esperado

A tela "Meu card" é redesenhada, de cima para baixo:

- **Quem é:** foto e nome do Discord, "<nome> na Steam" e o botão "Compartilhar meu radar".
- **Trilha da patente:** a patente atual em destaque e a trilha com todas as patentes, a que já
  passou, a atual e as próximas, com o quanto falta. Nesta entrega, a patente segue as regras de
  hoje; a `005-temporadas` troca as regras, não o desenho.
- **Radar do jogador:** a peça principal da tela. Um gráfico em teia com um eixo por tipo de jogo,
  cuja forma muda de pessoa para pessoa. Ao abrir, uma varredura passa uma vez sobre ele. Ao lado
  fica o título do jogador ("Atirador nato"), tirado do tipo de jogo que ele mais joga.
- **Período:** "Desde sempre" e "Este mês" trocam o radar, as horas e os jogos juntos.
- **Tipos de jogo:** cada tipo aparece com a porcentagem. Tocar num deles acende no radar e nos
  blocos o que é daquele tipo.
- **Blocos de jogos:** os jogos aparecem em blocos do tamanho das horas de cada um, para se ver de
  relance onde o tempo foi.
- **Mês:** as horas do mês atual, comparadas às do mês anterior.
- **Corrida do squad:** o espaço do placar entre amigos, por enquanto só com o convite.
- **Compartilhar:** gera uma imagem com título, radar, horas totais e jogo principal, para mandar
  no grupo.

**Tipos de jogo:** Tiro, Esporte, Corrida, Simulação, Arcade, RPG e Aventura. A loja da Steam é
genérica demais para isso (chama quase todo jogo de tiro de "Ação"), então o Party Radar mantém a
própria lista de jogos e tipos, começando pelos jogos populares. Jogo fora da lista usa o gênero da
loja da Steam, quando ele corresponder a um tipo; sem isso, entra em "Outros", que aparece nos
blocos e na lista, mas não vira eixo do radar.

**Título do jogador:** vem do tipo com pelo menos 40% das horas do período; abaixo disso, a pessoa é
"Jogador versátil".

| Tipo com mais horas | Título                |
| ------------------- | --------------------- |
| Tiro                | Atirador nato         |
| Esporte             | Craque de sofá        |
| Corrida             | Pé no fundo           |
| Simulação           | Mestre da simulação   |
| Arcade              | Rei do fliperama      |
| RPG                 | Viciado em side quest |
| Aventura            | Explorador sem mapa   |

## Fora do escopo

- Patente por temporada, troféus e carreira: `005-temporadas`.
- Placar real entre amigos e comparação de radares: dependem da spec de amigos.
- Capas dos jogos nos blocos, conquistas, nível e insígnias da Steam.
- Link público do radar (página aberta com prévia): entra com o Wrapped.
- Correção manual do tipo de um jogo pelo jogador.
- O desenho "carta de jogador" (direção B): descartado por lembrar o Ultimate Team do FC.

## Critérios de aceite

**Radar**

- **CA1** — Dado que tenho horas na Steam, quando abro o Meu card, então vejo o radar com um eixo
  para cada um dos 7 tipos de jogo e o título do jogador ao lado.
- **CA2** — Dado as minhas horas por tipo, então a porcentagem mostrada em cada tipo é a real (a soma
  das porcentagens dá 100%, contando "Outros"), mesmo que o desenho do radar use uma escala que
  deixa os tipos pequenos visíveis.
- **CA3** — Dado o radar na tela, quando troco entre "Desde sempre" e "Este mês", então o radar, as
  porcentagens, as horas, os blocos e o título passam a ser os do período escolhido.
- **CA4** — Dado a lista de tipos, quando toco num tipo, então o eixo dele acende no radar, os blocos
  dos jogos daquele tipo ficam em destaque e os outros ficam apagados.
- **CA5** — Dado que nenhum tipo chega a 40% das horas do período, então o título é "Jogador
  versátil"; com um tipo em 40% ou mais, é o título da tabela. Empate: vale o tipo que vem primeiro
  na tabela.

**Tipos de jogo**

- **CA6** — Dado um jogo da lista do Party Radar, então ele conta no tipo da lista.
- **CA7** — Dado um jogo fora da lista cujo gênero na loja da Steam corresponde a um tipo, então ele
  conta nesse tipo; a loja só é consultada uma vez por jogo.
- **CA8** — Dado um jogo sem tipo definido, ou a loja da Steam fora do ar, então ele conta em
  "Outros" e a tela continua funcionando.

**Horas e jogos**

- **CA9** — Dado "Desde sempre", então vejo as horas totais da minha vida na Steam e o número de
  jogos com tempo jogado (jogos nunca abertos não contam).
- **CA10** — Dado os meus jogos, então os blocos mostram nome e horas dos 7 mais jogados do período,
  com área proporcional às horas, e os demais somados em "Outros N jogos".
- **CA11** — Dado o Meu card, então vejo as horas do mês atual e as do mês anterior; se o mês anterior
  foi o da conexão, ele vem marcado como estimativa; sem dados do mês anterior, só o mês atual.

**Patente e corrida**

- **CA12** — Dado a minha patente, então a trilha mostra as 6 patentes em ordem, destaca a atual, mostra
  o progresso até a próxima e diz o que falta em texto, não só na cor.
- **CA13 (vazio)** — Dado que ainda não existe a spec de amigos, então a "Corrida do squad" explica
  o que virá e mostra "Copiar convite", sem nenhum nome ou número de exemplo.

**Compartilhar**

- **CA14** — Dado que tenho horas na Steam, quando toco em "Compartilhar meu radar", então uma
  imagem é gerada com título, radar, horas totais, número de jogos e jogo principal; onde o aparelho
  permite, abre o compartilhamento do aparelho; nos outros casos, a imagem é baixada.
- **CA15 (privacidade)** — Dado a imagem gerada, então ela traz só o @usuário e os dados de jogo:
  nunca SteamID, e-mail nem nome de login da Steam.
- **CA16 (erro)** — Dado que a imagem não pôde ser gerada, então vejo "Não foi possível gerar a
  imagem. Tente de novo." e continuo na tela.

**Estados**

- **CA17 (carregando)** — Dado que os dados estão carregando, então vejo o esqueleto da tela nova, sem
  mudança brusca de layout quando eles chegam.
- **CA18 (vazio)** — Dado que não conectei a Steam, então o radar aparece vazio com o botão "Conectar
  Steam"; sem título e sem "Compartilhar meu radar".
- **CA19 (vazio)** — Dado que conectei a Steam, ela foi lida e não joguei nada no período, então o
  radar aparece vazio com uma frase do primeiro acesso e "Este mês" continua disponível.
- **CA20** — Dado que a minha Steam está privada ou ainda em leitura, então continuo vendo o aviso e o
  "Tentar de novo" da spec 003, no lugar do radar.
- **CA21 (erro)** — Dado que os dados não puderam ser carregados, então vejo o erro da home com
  "Tentar de novo".

**Qualidade**

- **CA22** — Dado a tela em 390, 768 e 1280 px, então nada transborda na horizontal (a trilha pode
  rolar dentro do próprio espaço) e o radar continua legível.
- **CA23 (acessibilidade)** — Dado um leitor de tela ou só o teclado, então tudo funciona: o radar
  tem descrição em texto com as porcentagens, período e tipos são botões com o estado anunciado e o
  foco é visível; nenhum dado depende só de cor.
- **CA24 (movimento)** — Dado `prefers-reduced-motion`, então o radar aparece direto no estado final,
  sem varredura.
- **CA25 (segurança)** — Dado dois usuários, então nenhum lê os jogos e horas do outro por este
  dashboard; a lista de tipos de jogo pode ser lida por quem está logado, mas não alterada pelo app.

## Telas

Canvas "Party Radar — Novo Meu card", artboard **D — Temporada com radar**. Muda o `DESIGN.md`: o
radar do jogador passa a ser uma peça de destaque ao lado do anel de radar, e a varredura passa a
valer também nele (uma vez ao abrir).

## Decisões a aprovar

- [x] Direção visual: **D** (estrutura da Temporada com o radar).
- [x] 7 tipos de jogo e a tabela de títulos acima (nomes sugeridos por mim).
- [x] Título a partir de 40% das horas; abaixo disso, "Jogador versátil".
- [x] Compartilhar é uma imagem baixada ou enviada pelo aparelho; sem link público por enquanto.
