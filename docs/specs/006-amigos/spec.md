# 006 — Amigos

**Status:** aprovada em 2026-11-05 · retirada em 2026-11-06
**Relacionada a:** `007-bate-papo` (só amigos conversam) · `002-home` (a seção "Jogando agora" e o menu) ·
`003-steam` (o jogo aberto) · `001-login` (o perfil e o @usuário)

> **Retirada em 2026-11-06 pela spec `009-app-enxuto`:** o app deixou de ter amigos e bate-papo. O código, as
> tabelas e os dados saíram; esta spec fica só como histórico.

## Problema

O app ainda não tem amigos de verdade: o link de convite não leva a lugar nenhum, a tela "Amigos" só avisa
"Em breve" e a seção "Jogando agora" nunca aparece na conta real. Sem amigos, também não há com quem
conversar.

## Comportamento esperado

A amizade é do app, e os dois lados precisam concordar.

- **Adicionar:** pelo link de convite ou digitando o @usuário exato. Não há lista nem busca por parte do nome,
  para ninguém varrer quem está no app.
- **Pedido:** quem recebe aceita ou recusa. Quem pediu pode cancelar enquanto o pedido estiver aberto.
- **Lista:** a tela "Amigos" mostra os amigos, com a foto, o nome, o @usuário e o jogo aberto; os pedidos
  recebidos e os enviados.
- **Remover:** cada um pode desfazer a amizade a qualquer momento, sem aviso ao outro.
- **Bloquear:** quem foi bloqueado não consegue pedir amizade nem falar com quem bloqueou, e não é avisado.
- **Home:** "Jogando agora" passa a mostrar amigos de verdade, e o passo "Convidar amigos" é marcado quando há
  um amigo.

**O que um amigo vê de outro:** nome, @usuário, foto e o jogo aberto. Horas, patente, troféus e jogos continuam
privados. Mostrar isso é da corrida do squad, em outra spec.

## Fora do escopo

- Sugestão de amigos pela Steam.
- Corrida do squad com dados reais: continua explicando o que virá.
- Ver o card de um amigo.
- Horas jogadas juntos e a pergunta "Jogaram juntos?".
- Avisos por e-mail, Discord ou notificação do aparelho.
- Denunciar uma pessoa.

## Critérios de aceite

**Adicionar**

- **CA1** — Dado o meu link de convite, quando outra pessoa logada o abre, então ela vê meu nome e minha foto e
  pode enviar o pedido.
- **CA2** — Dado o link de convite aberto sem login, quando a pessoa entra com o Discord, então ela volta ao
  convite.
- **CA3** — Dado um @usuário exato, quando o digito em "Adicionar amigo", então vejo a pessoa e posso enviar o
  pedido.
- **CA4** — Dado um @usuário que não existe, ou de quem me bloqueou, então vejo a mesma mensagem: "Não
  encontramos esse @usuário."
- **CA5** — Dado o meu próprio @usuário ou link, então não há como me adicionar.
- **CA6** — Dado alguém que já é meu amigo ou tem pedido aberto comigo, então vejo esse estado, sem criar um
  pedido novo.
- **CA7** — Dado que a outra pessoa já me pediu amizade, quando eu peço a ela, então viramos amigos.

**Pedidos**

- **CA8** — Dado um pedido recebido, quando aceito, então viramos amigos e ele sai da lista de pedidos.
- **CA9** — Dado um pedido recebido, quando recuso, então ele some e quem pediu não é avisado; o pedido dele
  continua aparecendo como enviado até ele cancelar.
- **CA10** — Dado um pedido enviado, quando cancelo, então ele some dos dois lados.
- **CA11** — Dado que já enviei 20 pedidos abertos, quando tento enviar outro, então vejo que preciso esperar uma
  resposta ou cancelar algum.

**Lista**

- **CA12** — Dado a tela "Amigos", então vejo os amigos em ordem de nome, com quem está jogando primeiro, e os
  pedidos recebidos e enviados.
- **CA13** — Dado um amigo jogando, então vejo "Jogando <jogo> agora" em até 5 minutos, sem recarregar.
- **CA14** — Dado a seção "Jogando agora" da home, então ela mostra os meus amigos com jogo aberto; sem nenhum,
  ela não aparece.

**Remover e bloquear**

- **CA15** — Dado um amigo, quando removo e confirmo, então a amizade acaba dos dois lados, e nenhum vê mais o
  jogo aberto do outro.
- **CA16** — Dado uma pessoa, quando bloqueio e confirmo, então a amizade e os pedidos entre nós acabam, e ela não
  consegue me encontrar pelo @usuário nem enviar pedido.
- **CA17** — Dado a lista de bloqueados, quando desbloqueio, então a pessoa volta a poder me encontrar, sem virar
  amiga de novo.

**Estados e segurança**

- **CA18 (vazio)** — Dado que não tenho amigos, então a tela explica como convidar, com "Copiar convite" e o
  campo do @usuário.
- **CA19 (carregando e erro)** — Dado a tela carregando ou com erro, então vejo o esqueleto ou o erro com "Tentar
  de novo"; uma ação que falhar avisa e não muda a lista.
- **CA20 (segurança)** — Dado dois usuários, então ninguém cria amizade em nome de outra pessoa, aceita um pedido
  que não recebeu nem lê amigos, pedidos ou bloqueios alheios; o jogo aberto só chega a amigos.
- **CA21 (acessibilidade)** — Dado um leitor de tela ou só o teclado, então tudo funciona, e o estado de cada
  pessoa está em texto.

## Decisões a aprovar

- [x] Adicionar só pelo link ou pelo @usuário exato, sem busca por parte do nome.
- [x] Recusar não avisa quem pediu.
- [x] Amigos veem só nome, @usuário, foto e jogo aberto; horas e patente ficam privadas.
- [x] Sugestão pela Steam sai desta entrega.
