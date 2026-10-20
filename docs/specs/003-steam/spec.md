# 003 — Steam: conectar a conta e dados reais no card

**Status:** revisão 2 aprovada em 2026-10-20: correções da revisão de código da Parte 3a (volta da
Steam usada uma vez só, leitura com intervalo mínimo e limite de tempo, "Lendo…" com "Tentar de
novo"). Revisão anterior: 1, aprovada em 2026-10-19.
**Relacionada a:** `001-login` (entrar com o Discord; o Google sai na revisão 4, em atividade
própria) · `002-home` (o card que passa a ter dados reais) · `docs/plano.md` (escopo do MVP).

## Problema

O card "Meu card" já existe, mas mostra dados de exemplo. Para ele valer a pena mostrar, as horas,
os jogos, o jogo do mês e o "jogando agora" precisam vir da Steam de quem joga. O login é pelo
Discord; a Steam entra como uma **conta conectada**, depois do login.

## Comportamento esperado

- Quem entrou e ainda não conectou a Steam vê no card o passo **"Conectar Steam"**, junto do
  "Deixe seu card mais forte".
- Ao tocar em **Conectar Steam**, a pessoa vai para a página de login da própria Steam (o Party
  Radar nunca vê a senha), confirma e volta ao app com a Steam conectada.
- O Party Radar confirma com a Steam, no servidor, qual conta foi conectada, e guarda só o
  identificador público dela (SteamID).
- Se o perfil ou os detalhes de jogos da Steam estiverem privados, aparece o aviso da Steam
  privada (spec 002, CA8), com o caminho na Steam. "Já deixei público" passa a verificar de
  verdade.
- O app lê da Steam, sozinho, o tempo jogado em cada jogo uma vez por dia (e logo ao conectar), e
  o jogo aberto agora a cada poucos minutos, para quem conectou.
- O card passa a mostrar dados reais do mês: **horas**, **número de jogos**, **jogo do mês**,
  **patente**, **"Jogando <jogo> agora"** e **onde joga**.
- O que depende de amigos (parceiro de squad, pergunta de parceria, amigos jogando agora,
  squads) mostra os estados vazios da home, e não mais os dados de exemplo, até a spec de amigos.
- O título do mês fica escondido até existir uma regra para ele.

## Pré-requisitos (fora do código)

Feitos pelo dono do projeto, com a conta dele:

1. Criar a chave da Steam Web API em <https://steamcommunity.com/dev/apikey> (pede um nome de
   domínio; para desenvolvimento, `localhost` serve).
2. Guardar a chave em `STEAM_WEB_API_KEY` no `.env` da raiz (já previsto no `.env.example`).
   A chave fica só no servidor: nunca vai para o front.

## Fora do escopo

- Entrar no app com a Steam (o login é pelo Discord).
- Desconectar a Steam e apagar os dados de jogo: ficam para a `006-perfil`.
- Descobrir a Steam pelas conexões do Discord, sem clique (veja Perguntas em aberto).
- Amigos da Steam, sugestões de amizade e o que os amigos estão jogando: spec de amigos.
- Parceiro de squad e pergunta de parceria com dados reais: dependem de amigos.
- Título do mês, Wrapped, PSN, Xbox e outras plataformas.
- Horas jogadas antes da conexão (a Steam só informa o total de sempre e o das últimas 2 semanas).

## Critérios de aceite

**Conectar**

- **CA1** — Dado que entrei e não conectei a Steam, quando abro o Meu card, então vejo o passo
  "Conectar Steam" como pendente e o botão "Conectar Steam".
- **CA2** — Dado que toquei em "Conectar Steam", quando confirmo na página da Steam, então volto
  ao Meu card com a Steam marcada como feita e vejo "Lendo seus dados da Steam…" até a primeira
  leitura terminar. O quadro "Deixe seu card mais forte" fica visível enquanto a leitura não
  terminar, mesmo fora do primeiro acesso.
- **CA3 (segurança)** — Dado uma volta da Steam alterada, forjada ou já usada antes, quando o app
  recebe, então nenhuma conta é conectada: só vale a conta que a própria Steam confirmar ao
  servidor, e cada volta vale uma vez só.
- **CA4** — Dado que uma conta Steam já está ligada a outra pessoa no Party Radar, quando tento
  conectá-la, então vejo "Essa conta Steam já está ligada a outro perfil." e nada muda.
- **CA5 (erro)** — Dado que cancelei na Steam ou a confirmação falhou, quando volto ao app, então
  vejo "Não foi possível conectar a Steam. Tente de novo." e o passo continua pendente.
- **CA19 (erro)** — Dado que a Steam foi conectada, mas a primeira leitura não terminou (Steam
  fora do ar ou lenta), quando abro o Meu card, então vejo "Lendo seus dados da Steam…" e o botão
  "Tentar de novo", que lê a Steam outra vez. Se a Steam continuar fora, vejo "Não foi possível
  verificar a Steam agora. Tente de novo.". Trocar a conta Steam não mostra dados da conta
  anterior, e reconectar a mesma conta não muda o ponto de partida das horas.

**Perfil da Steam**

- **CA6** — Dado que meu perfil ou os detalhes de jogos estão privados, quando a Steam é lida,
  então vejo o aviso da Steam privada com o caminho para deixar público.
- **CA7** — Dado o aviso da Steam privada, quando toco em "Já deixei público", então o app lê a
  Steam de novo: se ficou público, o aviso some e os dados aparecem; se continua privado, vejo
  "Ainda está privado. Confira os dois itens na Steam e tente de novo."

**Dados no card**

- **CA8** — Dado que a Steam está conectada e pública, quando abro o Meu card, então vejo as horas
  jogadas no mês, o número de jogos com tempo no mês e o jogo do mês (o de mais horas), com as
  horas dele.
- **CA9** — Dado as horas acumuladas desde que conectei a Steam, então a patente e o "quanto falta
  para a próxima" seguem a tabela da spec 002 (horas com amigos e amigos diferentes contam zero
  até a spec de amigos).
- **CA10** — Dado que estou com um jogo aberto na Steam, então em até 5 minutos o card mostra o
  anel e "Jogando <jogo> agora"; quando fecho o jogo, em até 5 minutos isso some.
- **CA11** — Dado que a Steam é a única fonte, então "Onde joga" mostra PC com 100%.
- **CA12 (vazio)** — Dado que conectei a Steam e não joguei nada no mês, então o card mostra 0h e
  as frases do primeiro acesso, e o passo "Conectar Steam" aparece como feito.
- **CA13 (vazio)** — Dado que ainda não existe a spec de amigos, então parceiro de squad, pergunta
  de parceria, amigos jogando agora e squads mostram os estados vazios da home, sem dados de
  exemplo.

**Leitura automática e falhas**

- **CA14** — Dado que conectei a Steam, então o app lê o tempo de jogo uma vez por dia sem eu
  abrir nada, e as horas do mês fecham com o que joguei desde a conexão.
- **CA15 (erro)** — Dado que a Steam está fora do ar ou a leitura falhou, então o card mostra os
  últimos dados lidos com "Atualizado há <tempo>"; se nunca houve leitura, vejo o erro da home com
  "Tentar de novo".

**Privacidade e segurança**

- **CA16** — Dado dois usuários A e B, quando A consulta os dados de jogo ou o SteamID de B, então
  não vê nada (até a spec de amigos definir o que amigos veem); quem não está logado não lê nada.
- **CA17** — Dado o app no navegador, então a chave da Steam Web API nunca aparece no front: as
  leituras da Steam acontecem só no servidor.
- **CA20 (segurança)** — Dado alguém pedindo a leitura da Steam sem parar, então o servidor lê a
  Steam no máximo uma vez a cada 30 segundos por pessoa (dentro do intervalo, devolve a última
  leitura), e cada chamada à Steam desiste em 10 segundos, para a cota da chave e as funções não
  ficarem presas.

**Acessibilidade**

- **CA18** — Dado o botão "Conectar Steam" e os avisos novos, então eles funcionam pelo teclado,
  têm foco visível e os avisos são lidos pelo leitor de tela.

## Telas

As do Meu card (spec 002). Mudam só os textos e estados acima; o canvas "Party Radar — Telas do
MVP" não precisa de artboard novo.

## Decisões (aprovadas com a spec)

- [x] **Horas no primeiro mês:** no mês da conexão, o card parte das "últimas 2 semanas" da Steam
      e soma o que for jogado depois; o card avisa que o primeiro mês é uma estimativa.
- [x] **Base da patente:** horas desde que a Steam foi conectada (incluindo o ponto de partida
      acima), para a patente evoluir junto com o app.
- [x] **Steam pelas conexões do Discord:** fica para depois; esta spec usa o botão
      "Conectar Steam".
- [x] **Revisão 2:** a revisão de código da Parte 3a vira critérios (CA2, CA3, CA19, CA20),
      corrigidos ainda na 3a; o campo `steamPublic` duplicado da home sai na 3b (aprovado em
      2026-10-20).
