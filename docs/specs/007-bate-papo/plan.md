# 007 — Plano técnico

**Spec:** `spec.md` (aprovada em 2026-11-05)

## Abordagem

Três camadas, nesta ordem:

1. **Banco:** conversas, membros e mensagens, com RLS para quem participa. Toda escrita passa por funções que
   conferem as regras na mesma transação.
2. **Tempo real:** o Supabase Realtime avisa que chegou algo; o app então relê pelas funções. O aviso não é a fonte
   dos dados, então reconectar só precisa reler (CA8).
3. **Front:** a feature `bate-papo`, com domínio, fonte real e simulada, lojas e a tela `/conversas`.

## Arquivos afetados

| Arquivo                                        | Mudança                                                    |
| ---------------------------------------------- | ---------------------------------------------------------- |
| `supabase/migrations/<data>_chat.sql`          | novo: tabelas, RLS, funções e publicação do tempo real     |
| `supabase/tests/chat.test.sql`                 | novo: pgTAP                                                |
| `src/app/features/bate-papo/domain/chat.ts`    | novo: tipos, junção de mensagens, datas e limites          |
| `src/app/features/bate-papo/data/*`            | novo: contrato, fonte real, fonte simulada e lojas         |
| `src/app/features/bate-papo/ui/*`              | novo: lista, mensagens, caixa de texto e squad             |
| `src/app/features/bate-papo/pages/*`           | novo: tela de conversas                                    |
| `src/app/features/amigos/pages/friends.page.*` | alterado: botão "Conversar"                                |
| `src/app/layout/app-shell/*`                   | alterado: "Conversas" no lugar de "Squads" e "Seus squads" |
| `src/app/features/home/*`                      | alterado: squads reais e "Abrir conversa"                  |
| `src/app/features/auth/pages/login.page.html`  | alterado: texto sem "chame a galera"                       |
| `src/app/app.routes.ts`, `app.config.ts`       | alterados: rotas e fonte                                   |
| `DESIGN.md`, `docs/plano.md`                   | alterados: bate-papo                                       |

## Dados

| Tabela                 | Colunas principais                                                                               | Quem lê                            |
| ---------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| `conversations`        | `kind` (`direct` ou `squad`), `name`, `owner_id`, `direct_low`, `direct_high`, `last_message_at` | quem participa                     |
| `conversation_members` | `conversation_id`, `user_id`, `joined_at`, `last_read_at`                                        | quem participa, sem `last_read_at` |
| `messages`             | `conversation_id`, `sender_id`, `client_id`, `body`, `created_at`, `deleted_at`                  | quem participa                     |

- **Sem confirmação de leitura:** `last_read_at` fica fora do `grant`, para ninguém ver quando o outro leu.
- **Sem duplicar (CA9):** `client_id` nasce no app, e a mesma mensagem reenviada devolve a que já existe.
- **Apagar (CA5):** o texto sai do banco (`body` nulo), e a linha fica para mostrar "Mensagem apagada".
- **Conta apagada:** a mensagem fica, sem autor.

### Funções

Todas são `security definer`, com `search_path = ''`, `auth.uid()` e `execute` só para `authenticated`. Aqui é
inevitável: mostrar nome e foto de outros membros com os perfis privados (spec 006) e conferir amizade e bloqueio.

| Função                                                                                   | O que faz                                                        |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `is_conversation_member(p_conversation)`                                                 | usada pelas políticas de RLS; só responde sobre quem está logado |
| `open_direct(p_friend)`                                                                  | abre ou reaproveita a conversa com um amigo                      |
| `send_message(p_conversation, p_client_id, p_body)`                                      | confere tudo e grava; devolve o resultado                        |
| `delete_message(p_message)`                                                              | apaga a própria mensagem                                         |
| `mark_conversation_read(p_conversation)`                                                 | zera as não lidas                                                |
| `my_conversations()`                                                                     | lista, com título, última mensagem e não lidas                   |
| `conversation_messages(p_conversation, p_before_at, p_before_id)`                        | 50 mensagens por vez, com autor                                  |
| `create_squad`, `rename_squad`, `add_squad_member`, `remove_squad_member`, `leave_squad` | squads                                                           |
| `squad_members(p_conversation)`                                                          | membros, para quem participa                                     |
| `my_squads()`                                                                            | squads com os membros, para a "Oportunidade de squad" da home    |

### Limites

- Mensagem de 1 a 2.000 caracteres, sem contar espaços nas pontas (CA4).
- 20 mensagens por pessoa a cada 10 segundos (CA10).
- Nome do squad de 1 a 40 caracteres, até 50 pessoas (CA11, CA14).

## Tempo real

- `messages` entra na publicação `supabase_realtime`. O Realtime confere o RLS de quem assina (CA23).
- O app assina um canal só. Cada aviso relê a lista e a conversa aberta, juntando as mensagens por `id` (CA3, CA8).
- Ao reconectar, relê tudo. A tela também relê a cada minuto, como rede de segurança.

## Front

- **Rotas:** `/conversas` e `/conversas?id=`, na mesma tela. O id vai na query porque o `po-menu` só marca o item com o caminho exato. Acima de 768 px, lista e conversa ficam lado a lado; no
  celular, uma de cada vez (CA25).
- **Lojas:** `ChatStore` na raiz, para o menu saber das não lidas, limpa ao sair; `ConversationStore` por tela.
- **Envio:** a mensagem aparece na hora com "Enviando…"; se falhar, "Não enviada" e "Tentar de novo" com o mesmo
  `client_id` (CA9).
- **Texto puro:** interpolação do Angular, sem `innerHTML`, e os links não viram botão (CA7).
- **Menu:** Meu card, Amigos, Conversas, Perfil e Sair. O texto diz quantas conversas têm novidade (CA18).
- **Home:** "Oportunidade de squad" usa `my_squads`, e o botão vira "Abrir conversa".

## Integrações externas

Só o Supabase Realtime, que já faz parte do projeto. Se ele cair, as mensagens chegam na releitura de cada minuto.

## Estratégia de testes

| Critério                                   | Tipo de teste           | Onde                                          |
| ------------------------------------------ | ----------------------- | --------------------------------------------- |
| CA1, CA2, CA4, CA5, CA9 a CA17, CA20, CA23 | banco (pgTAP)           | `supabase/tests/chat.test.sql`                |
| CA6, CA8                                   | unitário e loja         | `domain/chat.spec.ts`, `data/*.store.spec.ts` |
| CA7, CA9, CA18 a CA22, CA24                | componente, fonte falsa | `ui/*`, `pages/*`                             |
| CA3, CA8, CA23 (tempo real)                | manual, com duas contas | conferência                                   |
| CA25                                       | manual, com prints      | 390, 768 e 1280 px                            |

## Riscos

- **Conferência:** tempo real de verdade pede duas pessoas. Sem outra conta do Discord, um perfil de teste no banco
  local manda mensagens pelo SQL, criado só com a sua autorização.
- **Sem moderação:** não há denúncia nesta entrega. Precisa existir antes de abrir o app para além dos amigos.
- **Privacidade:** as mensagens ficam legíveis para quem administra o banco. A tela avisa.
- **Sem aviso fora do app:** a mensagem só aparece com o app aberto.
- **Custo:** cada aviso gera uma releitura. Basta para grupos de amigos; com muito volume, o aviso precisa trazer a
  mensagem.
- **Mensagens sem prazo para sumir:** a tabela só cresce. Não é problema nesta escala.
