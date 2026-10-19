# Party Radar — plano do MVP

Resumo das decisões de produto. O plano completo (negócio, arquitetura, roadmap) está no
documento "Party Radar + Gamer Wrapped — Plano" e as telas no canvas "Party Radar — Telas do MVP".

## Escopo do MVP

1. **Login** com o Discord. Conectar a Steam depois do login.
2. **Amigos:** adicionar por link de convite, por @usuário ou por sugestão da Steam;
   aceitar, recusar, remover e bloquear. A amizade é do app (o Discord não libera a lista de amigos).
3. **Radar:** amigos jogando agora, online e offline, atualizado em tempo real.
4. **Chamar pra jogar:** agora ou agendado, com squad opcional.
   O chamado vai para o Discord (canal do servidor vinculado ou DM), com botões "Tô dentro" / "Agora não".
   No app fica só o card "Chamado ativo" no Radar.
5. **Perfil** simples com as contas conectadas.

**Fora do MVP:** Wrapped e patentes (versão 2), troféus PSN, Xbox, app nas lojas (Capacitor).
As sessões de jogo são gravadas desde o primeiro dia para o Wrapped nascer com dados.

## Decisões técnicas

| Decisão          | Escolha                                                           |
| ---------------- | ----------------------------------------------------------------- |
| Front            | Angular 21, standalone, signals, SSR nas rotas públicas           |
| UI               | PO UI 21 com tema escuro próprio (`src/theme/`)                   |
| Backend          | Supabase: Auth, Postgres + RLS, Realtime, Edge Functions, pg_cron |
| Presença ao vivo | Bot do Discord (worker Node sempre ligado) + Steam Web API        |
| Notificações     | Discord (canal vinculado ou DM). Push web/nativo fica para depois |
| Mobile           | Mesmo projeto empacotado com Capacitor quando houver tração       |
| Monetização      | Fora do escopo agora                                              |

## Ordem sugerida das specs

1. `001-login` — login com o Discord e sessão
2. `002-conectar-contas` — vincular Discord (connections) e Steam
3. `003-amigos` — pedidos, aceite, remoção e bloqueio
4. `004-radar` — presença em tempo real
5. `005-chamados` — chamar, squad e integração com o Discord
6. `006-perfil`
