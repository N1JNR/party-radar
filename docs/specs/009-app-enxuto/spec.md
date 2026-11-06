# 009 — App enxuto: sem amigos e sem bate-papo

**Status:** aprovada em 2026-11-06
**Relacionada a:** remove `006-amigos` e `007-bate-papo`, e abandona `008-convites-e-avisos` · muda `002-home`

## Problema

O Jorge decidiu, em 06/11/2026, deixar o Party Radar mais enxuto: o app passa a ser **o card do jogador, o perfil e
os dados dos jogos**. Amigos, conversas e squads saem por completo, inclusive os dados guardados.

## Comportamento esperado

- **Menu:** fica com "Meu card", "Perfil" e "Sair". Somem "Amigos" e "Conversas".
- **Home "Meu card":** continua com o cabeçalho, a patente e a trilha da temporada, o radar e os blocos de jogos, o
  resumo do mês, os troféus, o aviso da Steam e "Fortalecer seu card". Somem "Jogando agora", "Oportunidade de
  squad", "Corrida do squad", a pergunta "Jogaram juntos?" e o passo "Convidar amigos".
- **Endereços antigos:** `/amigos`, `/conversas` e os links de convite (`/convite/...`) levam à home, sem tela em
  branco nem erro.
- **Banco:** as tabelas e funções de amigos, pedidos, bloqueios, conversas, mensagens e squads são apagadas, com os
  dados, na nuvem e no local. Não há como desfazer.
- **Perfis:** continuam privados: cada pessoa lê só o próprio.
- **Textos:** o app deixa de falar em grupo, galera e conversa. A frase do login passa a ser "Seu card gamer: horas,
  jogos e a patente da temporada, direto da Steam."
- **Spec 008:** a branch `feat/008-convites-e-avisos` fica guardada no computador do Jorge, sem merge.

O resto não muda: login com o Discord, conexão com a Steam, leituras agendadas, temporadas, patentes, troféus e as
imagens de compartilhar.

## Fora do escopo

- A tela "Perfil", que continua "Em breve" e ganha spec própria.
- Novos dados ou gráficos de jogos.
- Mudar o visual da home além de tirar as seções sociais.

## Critérios de aceite

- **CA1** — Dado o menu, então vejo "Meu card", "Perfil" e "Sair", e não há "Amigos" nem "Conversas".
- **CA2** — Dado `/amigos`, `/conversas`, `/conversas?id=...` ou `/convite/alguem`, quando abro o endereço, então vou
  para a home, ou para o login se não estiver logado.
- **CA3** — Dado a home, então não aparecem "Jogando agora", "Oportunidade de squad", "Corrida do squad", "Jogaram
  juntos?" nem "Convidar amigos" em "Fortalecer seu card".
- **CA4** — Dado a home carregando, então ela não chama nenhuma função de amigos ou squads; um erro nelas não
  existe mais para derrubar a home.
- **CA5** — Dado o banco, na nuvem e no local, então não existem mais as tabelas, funções e dados de amigos, pedidos,
  bloqueios, conversas, membros, mensagens e squads, e a tabela de mensagens sai do tempo real.
- **CA6 (segurança)** — Dado dois usuários, então cada um continua lendo só o próprio perfil, e o RLS segue
  obrigatório em todas as tabelas de `public`.
- **CA7** — Dado o resto do app, então login, Steam, leituras agendadas, temporadas, patentes, troféus e as imagens de
  compartilhar funcionam como antes, com os testes passando.
- **CA8** — Dado os textos do app, então nenhum fala em amigos, galera, grupo, squad ou conversa.
- **CA9 (responsivo)** — Dado 390, 768 e 1280 px, então a home e o menu cabem sem transbordar.

## Decisões a aprovar

- [x] **Apagar os dados de vez**, na nuvem e no local, sem backup: amizades, mensagens e o squad das duas contas de teste.
- [x] **Tirar todas as partes sociais da home**, inclusive o link de convite.
- [x] **Abandonar a spec 008 sem merge**, guardando a branch.
- [x] **Frase nova do login:** "Seu card gamer: horas, jogos e a patente da temporada, direto da Steam."
- [x] **Specs 006, 007 e 008 ficam como histórico**, marcadas como removidas por esta.
- [x] **O plano do MVP** (`docs/plano.md`), o `AGENTS.md` e o `DESIGN.md` passam a descrever o app sem a parte social;
      "Corrida do squad" sai das próximas, e "Perfil" vira a próxima.
- [x] **Perfis seguem privados**, como a spec 006 deixou.

## Perguntas em aberto

- [ ] Nenhuma.
