# 007 — Bate-papo

**Status:** aguardando aprovação
**Relacionada a:** `006-amigos` (vem antes: só amigos conversam) · `002-home` (o menu e os squads)

## Problema

Os amigos precisam sair do app para combinar uma partida. O Party Radar passa a ter o próprio bate-papo por
texto, entre duas pessoas e em grupo. **Não há chamada de voz ou vídeo, nem "Chamar pra jogar".**

## Comportamento esperado

- **Conversa com um amigo:** na lista de amigos, "Conversar" abre a conversa entre os dois.
- **Squad:** é o grupo de bate-papo. Quem cria dá um nome e escolhe amigos para entrar. Cada amigo escolhido já
  entra e pode sair quando quiser.
- **Mensagens:** só texto, até 2.000 caracteres, que chegam em tempo real, sem recarregar. As mais antigas
  aparecem ao rolar para cima. Cada um pode apagar a própria mensagem, que vira "Mensagem apagada" para todos.
  Não há edição.
- **Não lidas:** o menu e a lista de conversas mostram quantas mensagens faltam ler, em texto.
- **Tela "Conversas":** reúne as conversas e os squads, da mensagem mais recente para a mais antiga, com o botão
  "Criar squad". Ela substitui "Squads" e "Seus squads" no menu.

**Quem manda no squad:** quem criou é o dono. Ele pode renomear, adicionar amigos dele e remover pessoas. Se o
dono sair, quem está há mais tempo no squad vira dono. Se todos saírem, o squad e as mensagens são apagados.

**Amizade desfeita ou bloqueio:** a conversa entre os dois continua visível, só para leitura. Nos squads nada
muda: quem não quiser conviver com alguém pode sair.

**Privacidade:** as mensagens ficam guardadas no banco sem criptografia de ponta a ponta. O RLS impede outros
usuários de lê-las, mas quem administra o banco consegue. A tela de conversas diz isso em uma frase.

## Fora do escopo

- **Chamadas de voz ou vídeo e "Chamar pra jogar".**
- Imagens, arquivos, figurinhas e áudio.
- Prévia de links: um link aparece como texto, sem virar botão.
- Reações, respostas a uma mensagem, menções, "digitando…" e confirmação de quem leu.
- Busca nas mensagens.
- Avisos por e-mail, Discord ou notificação do aparelho.
- Denunciar mensagens e moderação. **Isto precisa existir antes de abrir o app para além dos amigos do Jorge.**
- Corrida do squad e placar.

## Critérios de aceite

**Conversa**

- **CA1** — Dado um amigo, quando toco em "Conversar", então abre a conversa entre nós; se já existir, é a mesma.
- **CA2** — Dado alguém que não é meu amigo, então não consigo iniciar uma conversa com essa pessoa.
- **CA3** — Dado a conversa aberta dos dois lados, quando envio uma mensagem, então a outra pessoa a vê sem
  recarregar.
- **CA4** — Dado uma mensagem vazia, só com espaços ou com mais de 2.000 caracteres, então ela não é enviada, e o
  limite é explicado.
- **CA5** — Dado que apaguei uma mensagem minha, então todos veem "Mensagem apagada", e o texto sai do banco; não
  consigo apagar a de outra pessoa.
- **CA6** — Dado mais de 50 mensagens, então vejo as 50 mais recentes, e as anteriores carregam ao rolar para cima,
  sem pular a posição.
- **CA7** — Dado uma mensagem com HTML ou um link, então ela aparece como texto puro.
- **CA8** — Dado que perdi a conexão, quando ela volta, então as mensagens que faltam aparecem, sem repetir nenhuma.
- **CA9 (falha)** — Dado que o envio falhou, então a mensagem fica na tela com "Não enviada" e "Tentar de novo", e
  tentar de novo não a duplica.
- **CA10** — Dado que enviei mais de 20 mensagens em 10 segundos, então as seguintes são recusadas por um
  instante, com aviso.

**Squads**

- **CA11** — Dado "Criar squad", quando dou um nome de 1 a 40 caracteres e escolho amigos, então o squad é criado
  comigo como dono e aparece para todos os escolhidos.
- **CA12** — Dado um squad, então só seus membros leem e enviam mensagens, e quem entrou depois também vê as
  mensagens antigas.
- **CA13** — Dado que sou o dono, então posso renomear, adicionar amigos meus e remover pessoas; quem não é dono não
  pode.
- **CA14** — Dado um squad com 50 pessoas, quando tento adicionar mais uma, então vejo que ele está cheio.
- **CA15** — Dado que saí de um squad ou fui removido, então ele some da minha lista, e não leio nem envio mais
  nada nele.
- **CA16** — Dado que o dono saiu, então quem está há mais tempo vira dono; dado que todos saíram, o squad e as
  mensagens são apagados.
- **CA17** — Dado alguém que me bloqueou ou que eu bloqueei, então não consigo adicionar essa pessoa a um squad,
  nem ela a mim.

**Não lidas e lista**

- **CA18** — Dado mensagens que não li, então o menu diz quantas conversas têm novidade, e a lista mostra a
  quantidade em cada uma; ao abrir a conversa, a contagem zera.
- **CA19** — Dado a tela "Conversas", então vejo cada conversa com o nome, a foto, a última mensagem e o horário, da
  mais recente para a mais antiga.
- **CA20** — Dado a amizade desfeita ou um bloqueio, então a conversa entre os dois fica só para leitura, com o
  motivo neutro: "Não é possível enviar mensagens nesta conversa."

**Estados e segurança**

- **CA21 (vazio)** — Dado que não tenho conversas, então a tela convida a falar com um amigo ou criar um squad; sem
  amigos, leva à tela "Amigos".
- **CA22 (carregando e erro)** — Dado a lista ou a conversa carregando ou com erro, então vejo o esqueleto ou o
  erro com "Tentar de novo".
- **CA23 (segurança)** — Dado dois usuários, então ninguém lê conversas de que não participa, envia mensagem em nome
  de outra pessoa nem altera mensagem alheia; o tempo real obedece às mesmas regras.
- **CA24 (acessibilidade)** — Dado um leitor de tela ou só o teclado, então a conversa funciona: mensagens novas são
  anunciadas, e Enter envia.
- **CA25 (responsivo)** — Dado 390, 768 e 1280 px, então nada transborda; no celular, lista e conversa são telas
  separadas, e a caixa de texto continua visível com o teclado aberto.

## Decisões a aprovar

- [ ] **Sem chamadas de nenhum tipo:** nem voz, nem vídeo, nem "Chamar pra jogar". Sai também o bot do Discord para
      chamados.
- [ ] **O grupo se chama "squad":** a palavra que o app já usa. A tela "Conversas" reúne tudo, e saem "Squads" e
      "Seus squads" do menu.
- [ ] O botão "Chamar o squad" da home vira "Abrir conversa".
- [ ] Amigo escolhido já entra no squad, sem convite para aceitar.
- [ ] Só o dono adiciona e remove pessoas; o limite é de 50 por squad.
- [ ] Quem entra depois vê as mensagens antigas do squad.
- [ ] Só texto, com apagar e sem editar.
- [ ] Mensagens sem prazo para sumir, sem criptografia de ponta a ponta, com o aviso na tela.
- [ ] Sem denúncia nesta entrega, com o app restrito a grupos de amigos até ela existir.
