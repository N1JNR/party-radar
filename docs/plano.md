# Party Radar — plano do MVP

Resumo das decisões de produto. O plano completo (negócio, arquitetura, roadmap) está no
documento "Party Radar + Gamer Wrapped — Plano" e as telas no canvas "Party Radar — Telas do MVP".

## Escopo do MVP

1. **Login** com o Discord. Conectar a Steam depois do login.
2. **Meu card:** patente da temporada, radar do jogador, jogos e horas do mês, o jogo aberto agora e as
   imagens de compartilhar, tudo lido da Steam (specs 002 a 005).
3. **Perfil** simples com as contas conectadas.

**Saiu do produto (spec 009):** amigos, bate-papo e squads. O app fica enxuto, focado no card de cada
pessoa e nos dados dos jogos. As specs 006 e 007 ficam como histórico.

**Fora do MVP:** Wrapped (versão 2), troféus PSN, Xbox, app nas lojas (Capacitor).
As leituras da Steam são gravadas desde a conexão para o Wrapped nascer com dados.

## Decisões técnicas

| Decisão      | Escolha                                                     |
| ------------ | ----------------------------------------------------------- |
| Front        | Angular 21, standalone, signals, SSR nas rotas públicas     |
| UI           | PO UI 21 com tema escuro próprio (`src/theme/`)             |
| Backend      | Supabase: Auth, Postgres + RLS, Edge Functions, pg_cron     |
| Jogo aberto  | Steam Web API, lida pelo servidor a cada 5 minutos          |
| Notificações | Só dentro do app. Push web/nativo fica para depois          |
| Mobile       | Mesmo projeto empacotado com Capacitor quando houver tração |
| Monetização  | Fora do escopo agora                                        |

## Ordem das specs

Feitas, em andamento ou já aprovadas (a pasta de cada uma está em `docs/specs/`):

1. `001-login` — login com o Discord e sessão
2. `002-home` — a home "Meu card"
3. `003-steam` — conectar a Steam e trazer os dados reais
4. `004-novo-dashboard` — radar do jogador, trilha da patente e imagem de compartilhar
5. `005-temporadas` — patente por temporada de 60 dias
6. `006-amigos` — retirada pela spec 009
7. `007-bate-papo` — retirada pela spec 009
8. `008-convites-e-avisos` — abandonada pela spec 009 antes do merge; fica só na branch local `feat/008-convites-e-avisos`
9. `009-app-enxuto` — tira amigos e bate-papo e deixa o app focado no card

Próxima (o número sai quando a spec for criada):

- Perfil
