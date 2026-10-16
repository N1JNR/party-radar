# 001 — Login com Discord e Google

**Status:** aprovada em 2026-10-16 (revisão 2: decisões registradas e entrega em duas partes)
**Relacionada a:** `docs/plano.md` (escopo do MVP, item 1). Prepara `002-conectar-contas` e `003-amigos`.

## Problema

Para ver quem do grupo está jogando, a pessoa precisa ter uma conta no Party Radar. Criar
mais uma senha afasta gente; quem joga já tem Discord ou Google e quer entrar com um toque.

## Comportamento esperado

- Quem abre o app sem estar logado vê a tela **Entrar**, com o nome e a proposta do app e
  dois botões: **Continuar com Discord** e **Continuar com o Google**.
- Ao tocar em um botão, a pessoa vai para a tela de autorização do Discord ou do Google e,
  ao autorizar, volta para o app já logada.
- No primeiro acesso, o app cria um **perfil básico** com nome, foto e um **@usuário**
  gerado a partir do nome. A pessoa não precisa preencher nada para começar.
- O perfil básico (nome, foto e @usuário) é visível para **qualquer pessoa logada**, para
  que amigos possam se encontrar pela busca por nome ou @usuário (a busca em si é da `003`).
- Quem entra pelo Discord e pelo Google com o **mesmo e-mail** cai na **mesma conta**.
- Depois de entrar, a pessoa cai na tela inicial do app (por enquanto, um Radar provisório
  que diz "Olá, {nome}"). Se ela tinha aberto um link específico antes de entrar
  (por exemplo, um convite de amigo no futuro), volta para esse link.
- A sessão continua ativa ao fechar e reabrir o navegador, e se renova sozinha enquanto
  a pessoa usa o app.
- Existe a opção **Sair**, que encerra a sessão naquele aparelho e volta para a tela Entrar.
- Quem já está logado e abre a tela Entrar é levado direto para a tela inicial.
- Todas as telas do app, exceto Entrar, exigem login.

## Entrega em duas partes

Cada parte tem branch e PR próprios; o `plan.md` e o `tasks.md` seguem a mesma divisão.

| Parte                  | O que entrega                                                                                                                                                                                          | Critérios                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| **1 — Layout**         | Tela Entrar e tela inicial provisória com todos os estados visuais (padrão, carregando, cancelado, erro, sem conexão, sessão expirada), ligadas a um serviço de login **simulado**. Sem Supabase Auth. | CA1 (visual), CA11, CA12, CA13–CA15 (visual), CA19, CA20 |
| **2 — Funcionalidade** | Login real com Discord e Google pelo Supabase, tabela de perfil com RLS, @usuário, sessão, proteção de rotas e Sair.                                                                                   | CA1–CA10, CA13–CA18, CA21                                |

A Parte 1 não depende das credenciais do Discord e do Google; a Parte 2 depende.

## Fora do escopo

- Login com e-mail e senha, link mágico, telefone ou Steam.
- Conectar Discord (servidores e presença) e Steam ao perfil — isso é a `002-conectar-contas`.
- Buscar pessoas por nome ou @usuário — isso é a `003-amigos`.
- Editar @usuário, nome ou foto — fica para `006-perfil`.
- Aviso de termos de uso e política de privacidade (entra quando houver os textos).
- Excluir a conta e exportar dados.
- Login no app mobile (Capacitor), que exige outro fluxo de retorno.
- Páginas públicas com SSR (perfil público, card do Wrapped).

## Critérios de aceite

**Entrar**

- **CA1** — Dado que não estou logado, quando abro qualquer endereço do app, então vejo a
  tela Entrar com os botões "Continuar com Discord" e "Continuar com o Google", do mesmo
  tamanho e com o mesmo destaque visual.
- **CA2** — Dado que estou na tela Entrar, quando toco em "Continuar com Discord" e autorizo
  no Discord, então volto ao app logado e vejo a tela inicial com o meu nome do Discord.
- **CA3** — Dado que estou na tela Entrar, quando toco em "Continuar com o Google" e autorizo
  no Google, então volto ao app logado e vejo a tela inicial com o meu nome do Google.
- **CA4** — Dado que é o meu primeiro login, quando volto ao app, então existe um perfil meu
  com nome, foto do provedor e um @usuário único gerado a partir do nome (ex.: `@ana`; se
  já existir, `@ana2`); se o provedor não enviar foto, vejo um avatar com a inicial do meu nome.
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
- **CA21** — Dado que já entrei com o Discord usando um e-mail, quando entro com o Google
  usando o mesmo e-mail, então caio na mesma conta e no mesmo perfil.

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
  uso a parte do e-mail antes do "@" como nome provisório e como base do @usuário.

**Privacidade e segurança**

- **CA17** — Dado que estou logado, então o navegador não guarda os tokens do Discord ou do
  Google; só guarda a sessão do próprio Party Radar.
- **CA18** — Dado dois usuários logados A e B, quando A consulta o perfil de B, então vê só
  nome, foto e @usuário (nunca o e-mail); quando A tenta alterar ou apagar o perfil de B, a
  operação é recusada; quem não está logado não lê nem altera nenhum perfil.

**Acessibilidade e mobile**

- **CA19** — Dado um celular de 390 px de largura, quando abro a tela Entrar, então tudo
  aparece sem rolagem horizontal, os botões têm área de toque de pelo menos 44 px, e a
  tela funciona até o desktop.
- **CA20** — Dado que navego só pelo teclado ou com leitor de tela, quando chego aos botões
  de login, então consigo acioná-los, o foco é visível e os avisos de erro são lidos
  automaticamente.

## Telas

- **Entrar:** nome "Party Radar" em Chakra Petch (logo provisório), frase de proposta
  ("Veja quem do seu grupo está jogando agora"), botão do Discord e botão do Google com o
  mesmo tamanho e destaque (Discord primeiro), aviso de erro logo abaixo dos botões quando houver, para os botões não mudarem de lugar
  (decidido na conferência visual da Parte 1).
- **Tela inicial provisória:** "Olá, {nome}", avatar e botão Sair. Será substituída pelo
  Radar na `004-radar`.

### Botões dos provedores (diretrizes de marca)

Os dois botões seguem as regras de marca de cada empresa, e não o botão primário do PO UI:

- **Google** ([diretrizes](https://developers.google.com/identity/branding-guidelines)):
  versão escura — fundo `#131314`, borda interna de 1 px `#8E918F`, texto `#E3E3E3` em
  Google Sans Medium 14/20, logo "G" colorido oficial sem alterações. Texto localizado de
  "Continue with Google". Precisa ter tamanho e peso visual iguais aos de outras opções.
- **Discord** ([marca](https://discord.com/branding)): fundo blurple `#5865F2`, logo
  branco oficial sem alterações, texto branco (contraste 4,6:1). Não imitar a aparência
  do Discord no resto do app.

Artboard no canvas "Party Radar — Telas do MVP": link a adicionar.

## Decisões

- [x] Mesmo e-mail no Discord e no Google → **mesma conta**.
- [x] @usuário → **gerado automaticamente** no primeiro login; editável na `006-perfil`.
- [x] Perfil básico (nome, foto, @usuário) → **visível para qualquer pessoa logada**, como
      na busca do Instagram; o e-mail nunca é exposto a outros usuários.
- [x] Permissões do Discord no login → **só identidade e e-mail**; servidores e presença
      ficam para a `002`.
- [x] Termos de uso → **fora do MVP** até existirem os textos.
- [x] Entrega → **duas partes**: layout (Parte 1) e funcionalidade (Parte 2).
