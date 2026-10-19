# 001 — Login com o Discord

**Status:** revisão 4 aprovada em 2026-10-19: o login é só com o Discord (o Google sai; a Steam
entra como conta conectada na spec 003). Revisões anteriores: 3 (Parte 2 em duas entregas) e 2.
**Relacionada a:** `docs/plano.md` (escopo do MVP, item 1) · `002-home` (para onde o login leva).
Prepara a spec da Steam (dados reais no card) e a de amigos.

## Problema

Para ver quem do grupo está jogando, a pessoa precisa ter uma conta no Party Radar. Criar
mais uma senha afasta gente; quem joga já tem Discord e quer entrar com um toque.

## Comportamento esperado

- Quem abre o app sem estar logado vê a tela **Entrar**, com o nome e a proposta do app e
  o botão **Continuar com Discord**.
- Ao tocar no botão, a pessoa vai para a tela de autorização do Discord e, ao autorizar, volta
  para o app já logada.
- No primeiro acesso, o app cria um **perfil básico** com nome, foto e um **@usuário**
  gerado a partir do nome. A pessoa não precisa preencher nada para começar.
- O perfil básico (nome, foto e @usuário) é visível para **qualquer pessoa logada**, para
  que amigos possam se encontrar pela busca por nome ou @usuário (a busca em si é da `003`).
- Depois de entrar, a pessoa cai na tela inicial do app, o **Meu card** (spec 002). Se ela tinha aberto um link específico antes de entrar
  (por exemplo, um convite de amigo no futuro), volta para esse link.
- A sessão continua ativa ao fechar e reabrir o navegador, e se renova sozinha enquanto
  a pessoa usa o app.
- Existe a opção **Sair**, que encerra a sessão naquele aparelho e volta para a tela Entrar.
- Quem já está logado e abre a tela Entrar é levado direto para a tela inicial.
- Todas as telas do app, exceto Entrar, exigem login.

## Entrega em duas partes

Cada parte tem branch e PR próprios; o `plan.md` e o `tasks.md` seguem a mesma divisão.

| Parte            | O que entrega                                                                                                                                                                                          | Critérios                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| **1 — Layout**   | Tela Entrar e tela inicial provisória com todos os estados visuais (padrão, carregando, cancelado, erro, sem conexão, sessão expirada), ligadas a um serviço de login **simulado**. Sem Supabase Auth. | CA1 (visual), CA11, CA12, CA13–CA15 (visual), CA19, CA20 |
| **2a — Discord** | Login real com o Discord pelo Supabase, tabela de perfil com RLS, @usuário, sessão que sobrevive ao recarregar, proteção de rotas, Sair e o fim do login simulado no build de produção.                | CA2, CA4–CA10, CA13–CA18, CA22, CA23                     |
| **2b — Google**  | ~~Login real com o Google~~ — **cancelada na revisão 4**: o login é só com o Discord.                                                                                                                  | —                                                        |

A Parte 1 não depende das credenciais do Discord; a 2a depende delas. A revisão 4 tira o botão do
Google da tela Entrar.

### Pré-requisitos da Parte 2a (fora do código)

Feitos pelo dono do projeto, com a conta dele; o agente não cria contas nem manuseia segredos:

1. Criar um aplicativo no [Discord Developer Portal](https://discord.com/developers/applications)
   (nome "Party Radar").
2. Em **OAuth2 > Redirects**, cadastrar o retorno do Supabase local:
   `http://127.0.0.1:54321/auth/v1/callback` (e, quando houver projeto na nuvem,
   `https://<projeto>.supabase.co/auth/v1/callback`).
3. Copiar o **Client ID** e o **Client Secret** para o `.env` da raiz do projeto
   (`DISCORD_CLIENT_ID` e `DISCORD_CLIENT_SECRET`, já previstos no `.env.example`).

## Fora do escopo

- Login com e-mail e senha, link mágico, telefone ou Steam.
- Conectar Discord (servidores e presença) e Steam ao perfil — isso é a spec da Steam (a próxima).
- Buscar pessoas por nome ou @usuário — isso é a `003-amigos`.
- Editar @usuário, nome ou foto — fica para `006-perfil`.
- Aviso de termos de uso e política de privacidade (entra quando houver os textos).
- Excluir a conta e exportar dados.
- Login no app mobile (Capacitor), que exige outro fluxo de retorno.
- Páginas públicas com SSR (perfil público, card do Wrapped).

## Critérios de aceite

**Entrar**

- **CA1** — Dado que não estou logado, quando abro qualquer endereço do app, então vejo a
  tela Entrar com o botão "Continuar com Discord".
- **CA2** — Dado que estou na tela Entrar, quando toco em "Continuar com Discord" e autorizo
  no Discord, então volto ao app logado e vejo a tela inicial com o meu nome do Discord.
- ~~**CA3**~~ — Removido na revisão 4 (login com o Google).
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
- ~~**CA21**~~ — Removido na revisão 4 (mesma conta no Discord e no Google).

**Carregando, erro e vazio**

- **CA11 (carregando)** — Dado que abri o app, enquanto ele verifica se já existe sessão,
  então vejo um indicador de carregamento e não vejo a tela Entrar piscar.
- **CA12 (carregando)** — Dado que toquei em um botão de login, enquanto o app me
  redireciona, então o botão fica desabilitado e mostra "Abrindo Discord…".
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

- **CA17** — Dado que estou logado, então o navegador não guarda os tokens do Discord; só
  guarda a sessão do próprio Party Radar.
- **CA18** — Dado dois usuários logados A e B, quando A consulta o perfil de B, então vê só
  nome, foto e @usuário (nunca o e-mail); quando A tenta alterar ou apagar o perfil de B, a
  operação é recusada; quem não está logado não lê nem altera nenhum perfil.
- **CA22 (segurança)** — Dado o build de produção, então não existe login simulado: só entra
  quem autorizou no provedor; o `?simular-login=` só funciona em desenvolvimento.
- ~~**CA23**~~ — Removido na revisão 4 (aviso "Login com o Google em breve.").

**Acessibilidade e mobile**

- **CA19** — Dado um celular de 390 px de largura, quando abro a tela Entrar, então tudo
  aparece sem rolagem horizontal, os botões têm área de toque de pelo menos 44 px, e a
  tela funciona até o desktop.
- **CA20** — Dado que navego só pelo teclado ou com leitor de tela, quando chego aos botões
  de login, então consigo acioná-los, o foco é visível e os avisos de erro são lidos
  automaticamente.

## Telas

- **Entrar:** nome "Party Radar" em Chakra Petch (logo provisório), frase de proposta
  ("Veja quem do seu grupo está jogando agora"), botão do Discord, aviso de erro logo abaixo dos botões quando houver, para os botões não mudarem de lugar
  (decidido na conferência visual da Parte 1).
- **Tela inicial:** o Meu card da spec 002, com o Sair no menu.

### Botão do Discord (diretrizes de marca)

O botão segue as regras de marca do Discord, e não o botão primário do PO UI:

- **Discord** ([marca](https://discord.com/branding)): fundo blurple `#5865F2`, logo
  branco oficial sem alterações, texto branco (contraste 4,6:1). Não imitar a aparência
  do Discord no resto do app.

Artboard no canvas "Party Radar — Telas do MVP": link a adicionar.

## Decisões

- [x] @usuário → **gerado automaticamente** no primeiro login; editável na `006-perfil`.
- [x] Perfil básico (nome, foto, @usuário) → **visível para qualquer pessoa logada**, como
      na busca do Instagram; o e-mail nunca é exposto a outros usuários.
- [x] Permissões do Discord no login → **só identidade e e-mail**; servidores e presença
      ficam para a `002`.
- [x] Termos de uso → **fora do MVP** até existirem os textos.
- [x] Entrega → **duas partes**: layout (Parte 1) e funcionalidade (Parte 2).
- [x] Parte 2 → **duas entregas**: Discord (2a) e depois Google (2b) (aprovado em 2026-10-19).
- [x] Revisão 4 → **só Discord**: o Google sai do login e a Parte 2b é cancelada; a Steam entra
      como conta conectada na spec 003 (aprovado em 2026-10-19).
