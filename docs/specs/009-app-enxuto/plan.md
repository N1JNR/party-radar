# 009 — Plano

## Visão geral

1. **Banco:** uma migration apaga as funções e as tabelas de amigos e bate-papo, com os dados. As migrations antigas
   ficam no histórico, porque já rodaram na nuvem.
2. **Front:** saem as features `amigos` e `bate-papo`, as rotas, os itens do menu e o tempo real do bate-papo.
3. **Home:** saem as seções sociais, os dados que só elas usavam e o passo "Convidar amigos".
4. **Textos e documentação:** login, `AGENTS.md`, `DESIGN.md`, `docs/plano.md` e um aviso nas specs 006 a 008.

## Arquivos

| Arquivo                                            | O que muda                                                          |
| -------------------------------------------------- | ------------------------------------------------------------------- |
| `supabase/migrations/<data>_remove_social.sql`     | novo: apaga funções e tabelas de amigos e bate-papo                 |
| `supabase/tests/friends.test.sql`, `chat.test.sql` | saem                                                                |
| `src/app/features/amigos/`, `bate-papo/`           | saem                                                                |
| `src/app/app.routes.ts`, `app.config.ts`           | sem as rotas e as fontes; endereço desconhecido já vai para a home  |
| `src/app/layout/app-shell/*`                       | menu com "Meu card", "Perfil" e "Sair", sem o tempo real            |
| `src/app/features/home/**`                         | sem amigos, squads, pergunta de parceria, convite e "Jogando agora" |
| `src/app/features/auth/pages/login.page.html`      | frase nova                                                          |
| `AGENTS.md`, `DESIGN.md`, `docs/plano.md`          | o app sem a parte social                                            |

## Modelo de dados

Saem, com `drop ... if exists`: as funções de amigos (`find_player`, pedidos, amizade, bloqueio e listas), as de
bate-papo (conversas, mensagens, squads e `my_squads`), `public.is_conversation_member`, `private.are_friends`,
`private.friend_relation`, e as tabelas `messages`, `conversation_members`, `conversations`, `friend_requests`,
`friendships` e `user_blocks`. Apagar `messages` tira a tabela da publicação do tempo real. Os perfis e a policy
"cada um lê o próprio perfil" ficam.

## Ordem da publicação

Primeiro o merge, que publica o front sem a parte social; **depois** o `npx supabase db push`. Ao contrário, o front
publicado ainda chamaria `my_friends` e `my_squads`, e a home cairia no erro até o deploy.

## Riscos

- **Dados apagados de vez:** amizades, mensagens e o squad das contas de teste somem da nuvem, sem backup (decisão
  aprovada).
- **Volta atrás:** refazer a parte social seria trabalho novo; as specs 006 a 008 e a branch da 008 servem de
  referência.

## Estratégia de testes

| Critério      | Tipo               | Onde                                                      |
| ------------- | ------------------ | --------------------------------------------------------- |
| CA1, CA2      | unitário           | `app-menu.spec.ts`, `app-shell.component.spec.ts`         |
| CA3, CA4, CA8 | componente e fonte | `home.page.spec.ts`, `supabase-home.source.spec.ts`       |
| CA5, CA6      | pgTAP              | `rls_obrigatorio`, `profiles.test.sql`, consulta na nuvem |
| CA7           | suíte inteira      | `npm run verify:all`                                      |
| CA9           | manual, com prints | 390, 768 e 1280 px                                        |
