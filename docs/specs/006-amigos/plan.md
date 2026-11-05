# 006 — Plano técnico

**Spec:** `spec.md` (aprovada em 2026-11-05)

## Abordagem

Três camadas, nesta ordem:

1. **Banco:** tabelas de pedidos, amizades e bloqueios. As ações passam por funções que conferem as regras dos
   dois lados na mesma transação.
2. **Front:** uma feature `amigos` com domínio, fonte (real e simulada), loja e as telas `/amigos` e
   `/convite/:username`.
3. **Home:** "Jogando agora" e o passo "Convidar amigos" passam a usar os amigos reais.

## Arquivos afetados

| Arquivo                                                               | Mudança                                             |
| --------------------------------------------------------------------- | --------------------------------------------------- |
| `supabase/migrations/<data>_friends.sql`                              | novo: tabelas, RLS e funções de amizade             |
| `supabase/migrations/<data>_profiles_privados.sql`                    | novo: cada um lê só o próprio perfil                |
| `supabase/tests/friends.test.sql`, `profiles.test.sql`                | novo e alterado: pgTAP                              |
| `src/app/features/amigos/domain/friends.ts`                           | novo: tipos, ordem da lista, @usuário e mensagens   |
| `src/app/features/amigos/data/*`                                      | novo: contrato, fonte real, fonte simulada e loja   |
| `src/app/features/amigos/ui/*`                                        | novo: adicionar amigo e linha de pessoa             |
| `src/app/features/amigos/pages/*`                                     | novo: telas de amigos e de convite                  |
| `src/app/app.routes.ts`, `app.config.ts`                              | alterados: rotas e fontes                           |
| `src/app/layout/app-shell/app-menu.ts`                                | alterado: "Amigos" abre a tela                      |
| `src/app/features/home/data/supabase-home.source.ts`                  | alterado: amigos reais                              |
| `src/app/features/home/domain/friend-presence.ts`, `ui/playing-now/*` | alterados: a Steam não informa desde quando se joga |
| `DESIGN.md`, `docs/plano.md`, `AGENTS.md`                             | alterados: bate-papo no lugar de chamados           |

## Dados

### Tabelas

| Tabela            | Colunas                                                           | Quem lê                                       |
| ----------------- | ----------------------------------------------------------------- | --------------------------------------------- |
| `friend_requests` | `from_id`, `to_id`, `created_at`, `declined_at`                   | os dois lados; recusado sai para quem recebeu |
| `friendships`     | `user_low`, `user_high`, `created_at`, com `user_low < user_high` | os dois amigos                                |
| `user_blocks`     | `blocker_id`, `blocked_id`, `created_at`                          | só quem bloqueou                              |

Todas têm RLS e nenhuma aceita escrita direta pelo app. O `declined_at` fica de fora do `grant` de leitura, para
quem pediu não descobrir a recusa (CA9).

### Funções

Todas são `security definer`, com `search_path = ''` e `execute` só para `authenticated`. Aqui é inevitável:

- saber que alguém me bloqueou sem poder ler os bloqueios dessa pessoa (CA4);
- criar a amizade e apagar os pedidos dos dois lados na mesma transação (CA7, CA8);
- mostrar o jogo aberto do amigo sem expor o SteamID, que está na mesma tabela (CA13, CA20).

Cada uma usa `auth.uid()` e nunca recebe de fora quem é a pessoa logada.

| Função                                       | O que faz                                                              |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| `find_player(p_username)`                    | acha pelo @usuário exato e diz a relação; quem me bloqueou não aparece |
| `send_friend_request(p_user)`                | pede amizade, ou cria a amizade se o outro já pediu                    |
| `answer_friend_request(p_from, p_accept)`    | aceita ou recusa um pedido recebido                                    |
| `cancel_friend_request(p_to)`                | cancela um pedido enviado                                              |
| `remove_friend(p_friend)`                    | desfaz a amizade                                                       |
| `block_user(p_user)`, `unblock_user(p_user)` | bloqueia, apagando amizade e pedidos, e desbloqueia                    |
| `my_friends()`                               | amigos com nome, @usuário, foto e jogo aberto                          |
| `my_friend_requests()`                       | pedidos recebidos e enviados, sem dizer se houve recusa                |
| `my_blocks()`                                | quem eu bloqueei                                                       |

### Perfis ficam privados

Hoje a política de `profiles` deixa qualquer pessoa logada listar todos os perfis, o que contraria o "ninguém varre
quem está no app". A política passa a ser **só o próprio perfil**, e os outros chegam pelas funções acima. Isso
substitui o CA18 da spec 001 ("quem está logado vê todos os perfis"), e os dois testes dele mudam junto. É uma regra
mais restrita, não mais permissiva.

## Front

- **`features/amigos`:** segue `data/`, `domain/`, `ui/` e `pages/`. O contrato `FRIENDS_SOURCE` tem fonte real e
  simulada, escolhidas como a da home (`?simular=` ou login simulado).
- **Rotas:** `/amigos` e `/convite/:username`, com `authenticatedOnly`. O `?next=` do login já traz a pessoa de volta
  ao convite (CA2).
- **Atualização:** a tela relê a cada minuto, como a home (CA13). O servidor lê a Steam a cada 5 minutos. Não há
  tempo real nesta entrega; ele entra com o bate-papo.
- **Confirmação:** remover e bloquear usam `po-modal` (DESIGN.md).
- **Desde quando joga:** a Steam não informa. Na conta real, "Jogando agora" mostra o jogo sem o "há 5 min".

## Integrações externas

Nenhuma nova. O jogo aberto continua vindo da leitura da Steam, a cada 5 minutos.

## Estratégia de testes

| Critério                | Tipo de teste           | Onde                                    |
| ----------------------- | ----------------------- | --------------------------------------- |
| CA3 a CA11, CA15 a CA17 | banco (pgTAP)           | `supabase/tests/friends.test.sql`       |
| CA20                    | banco (pgTAP)           | `friends.test.sql`, `profiles.test.sql` |
| CA12                    | unitário (domain, 100%) | `amigos/domain/friends.spec.ts`         |
| CA1, CA2                | componente, fonte falsa | `amigos/pages/invite.page.spec.ts`      |
| CA8 a CA19, CA21        | componente, fonte falsa | `amigos/pages/friends.page.spec.ts`     |
| CA14                    | componente e fonte      | home                                    |
| Tudo na tela            | manual, com prints      | 390, 768 e 1280 px, com duas contas     |

## Riscos

- **Conferência com duas contas:** amizade de verdade pede uma segunda pessoa. Sem outra conta do Discord, a
  conferência usa um perfil de teste no banco local, criado só com a sua autorização.
- **Perfil privado:** quem depender de ler outro perfil direto na tabela para de funcionar. Hoje só o próprio perfil é
  lido; os testes cobrem isso.
- **Pedidos recusados:** seguem aparecendo como enviados para quem pediu e contam no limite de 20, até serem cancelados.
- **Custo por minuto:** a home ganha mais uma consulta na releitura de cada minuto, somada ao achado já em aberto das
  specs 004 e 005.
- **Corrida do squad:** continua só explicando o que virá, mesmo com amigos reais.
- **Quem desconfia do bloqueio:** com uma segunda conta, dá para comparar as respostas e perceber que foi bloqueado.
  Sem uma lista pública, não há como evitar isso por completo.
