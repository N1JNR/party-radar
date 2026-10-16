# 002 — Home: meu card de jogador

**Status:** aguardando aprovação
**Relacionada a:** `001-login` (a home é para onde o login leva) · nova direção do produto
(conversa de 2026-10-16) · canvas "Party Radar — Telas do MVP", telas **10** e **11**.

## Problema

A Steam já mostra lista de amigos e horas jogadas de um jeito seco. O Party Radar quer
transformar os dados de jogo da pessoa em algo **divertido e que dá vontade de mostrar**: um card
de jogador com horas, jogo do mês, parceiro de jogatina, plataforma e uma patente que evolui.
A home é esse card. Hoje, depois do login, a pessoa cai numa tela provisória que só diz "Olá".

## Comportamento esperado

- Depois de entrar, a pessoa vê **"Meu card"**: a home do app.
- **Web primeiro:** no desktop há um **menu lateral fixo** (Meu card, Amigos, Squads, Perfil, a
  lista dos seus squads e Sair). Em telas estreitas, o menu vira uma **gaveta** que abre pelo
  botão de menu e fecha ao escolher um destino, tocar fora ou apertar Esc.
- **O card** mostra, do mês atual:
  - foto, nome e o que a pessoa está jogando agora (anel ciano quando está jogando);
  - **patente** atual e **título do mês** (ex.: "Veterano de lobby" e "Sofredor de Souls");
  - **horas jogadas** em destaque e em quantos jogos;
  - **jogo do mês** com as horas;
  - **parceiro de squad** (com quem mais jogou) e quantas partidas juntos; quando a parceria
    ainda é provável, o card mostra isso de forma discreta;
  - **onde joga**: a divisão entre plataformas (ex.: PC 70%, PS5 30%);
  - quanto falta para a **próxima patente**.
- **Primeiro acesso:** sem dados ainda, o card aparece "pobrinho" e engraçado: 0h, patente
  **NPC** e frases de efeito no lugar dos dados que faltam. Ao lado, **"Deixe seu card mais
  forte"** mostra o que já foi feito (Discord conectado) e o que falta (Steam pública, convidar
  amigos).
- **Steam privada:** um aviso explica por que a Steam pública deixa o card mais completo, dá o
  caminho exato na Steam e tem "Já deixei público".
- **Confirmação de parceria:** quando o app não tem certeza se a pessoa jogou junto com um
  amigo, a home pergunta ("Você jogou CS2 com o Rafa ontem, das 22h às 23h40?") com
  **Joguei** e **Não joguei**.
- **Jogando agora:** os amigos que estão jogando, com o jogo, há quanto tempo e a plataforma.
- **Oportunidade de squad:** quando dois ou mais de um squad estão no mesmo jogo, aparece um
  destaque ("3 do Squad da Sexta no Fortnite · Chamar o squad").
- **Compartilhar card** e **Ver patentes** aparecem na home; as telas deles são entregas
  próprias (veja Fora do escopo).
- A opção **Sair** passa da tela provisória para o menu.

## Entrega

Só **layout com dados simulados**, como na Parte 1 do login: nenhuma integração com Supabase,
Steam ou Discord nesta spec. Os dados vêm de uma fonte simulada no front, e em desenvolvimento
a URL escolhe o cenário (`?simular=`). A integração vem depois, numa spec própria, quando as
telas estiverem prontas.

## Fora do escopo

- Telas **Patente nova** (12) e **Compartilhar card** (13): specs próprias, uma de cada vez.
- Páginas de Amigos, Squads e Perfil: o menu leva a elas quando existirem.
- Qualquer dado real: Steam, Discord, sessões, cálculo de patentes, detecção de "jogaram
  juntos". As regras de patente e os textos ficam definidos aqui só como conteúdo do layout.
- Notificações.
- Versão para app de celular (Capacitor).

## Critérios de aceite

**Estrutura**

- **CA1** — Dado que entrei, quando a home abre, então vejo o título "Meu card", o menu com
  Meu card (marcado como página atual), Amigos, Squads, Perfil, a lista dos meus squads e Sair.
- **CA2** — Dado uma tela com 1024 px ou mais, então o menu fica fixo à esquerda; dado uma tela
  menor, então o menu fica escondido e abre como gaveta pelo botão de menu, e fecha ao escolher
  um destino, tocar fora ou apertar Esc, devolvendo o foco ao botão.
- **CA3** — Dado que toco em Sair, então a sessão termina e volto para o login (mesmo
  comportamento da tela provisória de hoje).

**Card cheio**

- **CA4** — Dado que tenho dados do mês, quando a home abre, então o card mostra nome, status
  de jogo, patente, título do mês, horas, número de jogos, jogo do mês com horas, parceiro de
  squad com partidas juntos, divisão por plataforma em porcentagem e quanto falta para a
  próxima patente.
- **CA5** — Dado que estou jogando agora, então meu avatar tem o anel na cor "jogando" e o texto
  "Jogando <jogo> agora"; dado que não estou, então não há anel nem esse texto.
- **CA6** — Dado que a parceria do mês ainda é só provável, então o card mostra o parceiro com
  um aviso discreto "provável".

**Primeiro acesso e Steam**

- **CA7 (vazio)** — Dado que ainda não tenho dados, quando a home abre, então o card mostra 0h,
  a patente NPC, frases engraçadas no lugar de jogo do mês, parceiro e plataforma, e
  "Deixe seu card mais forte" com Discord marcado como feito.
- **CA8** — Dado que minha Steam está privada, então vejo o aviso com o caminho na Steam e
  "Já deixei público"; quando toco nele, o aviso some (nesta entrega, o efeito é simulado).
- **CA9 (vazio)** — Dado que nenhum amigo está jogando, então a seção "Jogando agora" mostra
  "Ninguém jogando por aqui" e o botão "Copiar convite", que copia o link de convite.
- **CA10 (vazio)** — Dado que não tenho squads, então o menu e a home mostram
  "Nenhum squad ainda" e "Formar squad".

**Confirmação e squad**

- **CA11** — Dado que existe uma partida com parceria em dúvida, então vejo a pergunta com
  Joguei e Não joguei; quando respondo, a pergunta some e, se respondi Joguei, a parceria deixa
  de aparecer como "provável".
- **CA12** — Dado que dois ou mais de um squad estão no mesmo jogo, então vejo o destaque do
  squad com o jogo, os nomes e as plataformas, e o botão "Chamar o squad".
- **CA13** — Dado que toco em Compartilhar card, Ver patentes ou Chamar o squad, então, nesta
  entrega, vejo o aviso "Em breve" sem sair da home.

**Carregando e erro**

- **CA14 (carregando)** — Dado que os dados do card ainda não chegaram, então vejo um esqueleto
  do card e das seções, sem textos falsos piscando.
- **CA15 (erro)** — Dado que não foi possível carregar o card, então vejo "Não foi possível
  carregar seu card." e "Tentar de novo", que refaz o carregamento.

**Acessibilidade e tamanhos**

- **CA16** — Dado 390, 768, 1280 e 1440 px de largura, então tudo aparece sem rolagem horizontal
  e os elementos tocáveis têm pelo menos 44 px.
- **CA17** — Dado que navego só pelo teclado, então alcanço menu, botões e respostas em ordem
  lógica, com foco visível; avisos novos (como "Em breve") são lidos por leitor de tela; o card
  tem textos que não dependem só de cor (ex.: "Jogando", porcentagens escritas).

## Telas

Canvas "Party Radar — Telas do MVP": **10 · Web — Meu card (primeiro acesso)** e
**11 · Web — Meu card (home)**. As telas mostram a intenção; a implementação segue o
`DESIGN.md`.

### Conteúdo de referência (usado no layout simulado)

| Patente                  | Como chega (regra a validar na spec de integração) |
| ------------------------ | -------------------------------------------------- |
| NPC                      | acabou de chegar                                   |
| Recruta da fila          | 1h jogada                                          |
| Soldado do fim de semana | 10h                                                |
| Veterano de lobby        | 40h                                                |
| Lenda do squad           | 80h, sendo 20h com amigos                          |
| Sem vida social          | 200h, com 5 amigos diferentes                      |

Frases do primeiro acesso (exemplos): "Até a geladeira tem mais tempo de tela que você.",
"Nem o bot quer duo.", "Plataforma: um mistério."

## Decisões desta spec

- [x] A home é o **card do jogador**, não uma lista de amigos.
- [x] **Web primeiro**, com menu lateral fixo no desktop e gaveta em telas estreitas.
- [x] Esta entrega é **só layout**, com dados simulados.
- [x] Parcerias **prováveis contam** no card, marcadas como "provável" até a confirmação.

## Perguntas em aberto

- [ ] **Cores de presença:** ciano = jogando e verde = online (como no canvas e nas telas 10 e
      11)? Se sim, o `DESIGN.md` é atualizado nesta mesma entrega.
- [ ] **"Mobile primeiro" no AGENTS.md:** trocar por "web primeiro, funcional até 390 px"?
- [ ] **`docs/plano.md`:** atualizar já com a nova direção (card e patentes no centro do MVP,
      Discord obrigatório, Steam pública incentivada), num PR de documentação separado?
