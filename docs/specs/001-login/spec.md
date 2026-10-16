# 001 — Login com Discord e Google

**Status:** aguardando aprovação
**Relacionada a:** `docs/plano.md` (escopo do MVP, item 1). Prepara `002-conectar-contas` e `003-amigos`.

## Problema

Para ver quem do grupo está jogando, a pessoa precisa ter uma conta no Party Radar. Criar
mais uma senha afasta gente; quem joga já tem Discord ou Google e quer entrar com um toque.

## Comportamento esperado

- Quem abre o app sem estar logado vê a tela **Entrar**, com o nome e a proposta do app e
  dois botões: **Entrar com Discord** e **Entrar com Google**.
- Ao tocar em um botão, a pessoa vai para a tela de autorização do Discord ou do Google e,
  ao autorizar, volta para o app já logada.
- No primeiro acesso, o app cria um **perfil básico** com o nome e a foto vindos do Discord
  ou do Google. A pessoa não precisa preencher nada para começar.
- Depois de entrar, a pessoa cai na tela inicial do app (por enquanto, um Radar provisório
  que diz "Olá, {nome}"). Se ela tinha aberto um link específico antes de entrar
  (por exemplo, um convite de amigo no futuro), volta para esse link.
- A sessão continua ativa ao fechar e reabrir o navegador, e se renova sozinha enquanto
  a pessoa usa o app.
- Existe a opção **Sair**, que encerra a sessão naquele aparelho e volta para a tela Entrar.
- Quem já está logado e abre a tela Entrar é levado direto para a tela inicial.
- Todas as telas do app, exceto Entrar, exigem login.

## Fora do escopo

- Login com e-mail e senha, link mágico, telefone ou Steam.
- Conectar Discord (servidores e presença) e Steam ao perfil — isso é a `002-conectar-contas`.
- Escolher @usuário, editar nome ou foto — fica para `006-perfil` (ver perguntas em aberto).
- Excluir a conta e exportar dados.
- Login no app mobile (Capacitor), que exige outro fluxo de retorno.
- Páginas públicas com SSR (perfil público, card do Wrapped).

## Critérios de aceite

**Entrar**

- **CA1** — Dado que não estou logado, quando abro qualquer endereço do app, então vejo a
  tela Entrar com os botões "Entrar com Discord" e "Entrar com Google".
- **CA2** — Dado que estou na tela Entrar, quando toco em "Entrar com Discord" e autorizo no
  Discord, então volto ao app logado e vejo a tela inicial com o meu nome do Discord.
- **CA3** — Dado que estou na tela Entrar, quando toco em "Entrar com Google" e autorizo no
  Google, então volto ao app logado e vejo a tela inicial com o meu nome do Google.
- **CA4** — Dado que é o meu primeiro login, quando volto ao app, então existe um perfil meu
  com nome e foto do provedor; se o provedor não enviar foto, vejo um avatar com a inicial
  do meu nome.
- **CA5** — Dado que tentei abrir um endereço protegido sem estar logado, quando concluo o
  login, então sou levado de volta a esse endereço, e não à tela inicial.
- **CA6 (segurança)** — Dado o retorno do login, quando o endereço de destino aponta para
  fora do Party Radar, então o app ignora esse destino e me leva para a tela inicial.

**Sessão**

- **CA7** — Dado que estou logado, quando fecho e reabro o navegador, então continuo logado
  sem passar pela tela Entrar.
- **CA8** — Dado que estou logado, quando toco em "Sair", então a sessão termina naquele
  aparelho, volto para a tela Entrar, e o botão "voltar" do navegador não mostra telas
  com meus dados.
- **CA9** — Dado que já estou logado, quando abro a tela Entrar, então sou levado para a
  tela inicial.
- **CA10** — Dado que minha sessão expirou e não pôde ser renovada, quando uso o app, então
  volto para a tela Entrar com o aviso "Sua sessão expirou. Entre de novo."

**Carregando, erro e vazio**

- **CA11 (carregando)** — Dado que abri o app, enquanto ele verifica se já existe sessão,
  então vejo um indicador de carregamento e não vejo a tela Entrar piscar.
- **CA12 (carregando)** — Dado que toquei em um botão de login, enquanto o app me
  redireciona, então os dois botões ficam desabilitados e o botão tocado mostra
  "Abrindo Discord…" ou "Abrindo Google…".
- **CA13 (erro)** — Dado que cancelei ou neguei a autorização no provedor, quando volto ao
  app, então vejo a tela Entrar com o aviso "Login cancelado. Tente de novo quando quiser."
- **CA14 (erro)** — Dado que o login falhou por erro do provedor ou do servidor, quando
  volto ao app, então vejo "Não foi possível entrar agora. Tente de novo em instantes." e
  os botões voltam a funcionar.
- **CA15 (erro)** — Dado que estou sem internet, quando toco em um botão de login, então
  vejo "Sem conexão. Verifique sua internet." e continuo na tela Entrar.
- **CA16 (vazio)** — Dado que o provedor não enviou nome, quando o perfil é criado, então
  uso a parte do e-mail antes do "@" como nome provisório.

**Privacidade e segurança**

- **CA17** — Dado que estou logado, então o navegador não guarda os tokens do Discord ou do
  Google; só guarda a sessão do próprio Party Radar.
- **CA18** — Dado dois usuários A e B, quando A tenta alterar ou apagar o perfil de B, então
  a operação é recusada e o perfil de B continua igual; quem não está logado não lê nem
  altera nenhum perfil.

**Acessibilidade e mobile**

- **CA19** — Dado um celular de 390 px de largura, quando abro a tela Entrar, então tudo
  aparece sem rolagem horizontal, os botões têm área de toque de pelo menos 44 px, e a
  tela funciona até o desktop.
- **CA20** — Dado que navego só pelo teclado ou com leitor de tela, quando chego aos botões
  de login, então consigo acioná-los, o foco é visível e os avisos de erro são lidos
  automaticamente.

## Telas

- **Entrar:** logo, frase de proposta ("Veja quem do seu grupo está jogando agora"), botão
  do Discord (destaque, pois é o login recomendado para o Radar), botão do Google, aviso de
  erro acima dos botões quando houver.
- **Tela inicial provisória:** "Olá, {nome}", avatar e botão Sair. Será substituída pelo
  Radar na `004-radar`.

Artboard no canvas "Party Radar — Telas do MVP": link a adicionar.

## Perguntas em aberto

- [ ] **Mesmo e-mail no Discord e no Google:** a pessoa que entra pelos dois com o mesmo
      e-mail deve cair na **mesma conta** (proposta) ou em contas separadas?
- [ ] **@usuário:** criar agora, automático a partir do nome (ex.: `@jorge`, `@jorge2`), ou
      só na `006-perfil`? A `003-amigos` precisa dele para "adicionar por @usuário".
      Proposta: gerar automático agora e permitir editar na 006.
- [ ] **Quem pode ver o perfil básico:** só a própria pessoa até existir amizade (proposta),
      ou qualquer usuário logado (necessário para a busca por @usuário na 003)?
- [ ] **Permissões pedidas ao Discord no login:** só identidade e e-mail (proposta). Ver
      servidores e presença fica para a 002, pedindo permissão na hora certa.
- [ ] **Termos de uso e privacidade:** mostrar o aviso "Ao entrar, você concorda com…" já
      no MVP? Exige ter os textos.
