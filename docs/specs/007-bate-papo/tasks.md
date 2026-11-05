# 007 — Tarefas

Cada tarefa cabe em um commit, é testável sozinha e cita o critério de aceite que atende.
Marque `[x]` só depois que os testes da tarefa passarem.

**Banco**

- [x] T1 — Conversas, membros e mensagens, com RLS, funções e tempo real (CA1, CA2, CA4, CA5, CA9 a CA17, CA20, CA23)

**Front**

- [x] T2 — Domínio do bate-papo: junção de mensagens, datas e limites (CA4, CA6, CA8)
- [x] T3 — Fontes real e simulada e as lojas (CA3, CA6, CA8, CA9, CA18)
- [x] T4 — Tela de conversas: lista, mensagens, caixa de texto e estados (CA3 a CA10, CA18 a CA22, CA24, CA25)
- [x] T5 — Squads: criar, renomear, adicionar, remover e sair (CA11 a CA17)
- [x] T6 — Menu, "Conversar" nos amigos e "Abrir conversa" na home (CA1, CA18)
- [x] T7 — Textos sem "chame", `DESIGN.md` e `docs/plano.md`

**Fechamento**

- [x] T8 — Conferência em 390, 768 e 1280 px, com duas contas e prints (CA1–CA25)
- [x] T9 — `/code-review`, `/security-review`, `npm run verify:all` e relatório final

## Conferência (T8)

Com a conta real do Jorge na tela, banco local e o perfil `bia_teste`, criado com autorização e apagado no fim. A
Bia agiu pelo SQL, como `authenticated`, pelas mesmas funções do app.

| Critério   | O que foi visto                                                                        |
| ---------- | -------------------------------------------------------------------------------------- |
| CA1        | "Conversar" duas vezes abriu a mesma conversa                                          |
| CA3        | Mensagem da Bia chegou em até 2 s, sem recarregar                                      |
| CA4, CA7   | Vazio explica e não envia; `<b>` e link aparecem como texto; Shift + Enter quebra      |
| CA5        | Vira "Mensagem apagada" e o corpo fica nulo no banco                                   |
| CA6        | Abre com 50, no fim; ao rolar, entram 13 e a posição se mantém                         |
| CA8        | Tempo real parado, Bia envia; ao voltar, a mensagem aparece uma vez em 3,6 s           |
| CA9, CA10  | Rajada de 25: 20 passam, 5 com aviso; "Tentar de novo" não duplica                     |
| CA11, CA13 | Criar só com teclado, renomear, remover com confirmação e adicionar de volta           |
| CA15, CA16 | Removida recebe `not_member` e lê 0; dono sai e a Bia vira dona; vazio apaga o squad   |
| CA18       | Com a conversa fechada, o menu diz "1 com novidade"; abrir zera a lista e o menu       |
| CA19, CA21 | Lista com nome, última mensagem e horário; sem conversas, convida e leva a Amigos      |
| CA20       | Com o bloqueio, a conversa fica só para leitura, com o texto neutro                    |
| CA25       | Sem transbordar em 390, 768 e 1280 px; no celular, lista e conversa em telas separadas |

**Não conferido na tela, só por testes:** CA2, CA12, CA14, CA17 e CA23 (`supabase/tests/chat.test.sql`); CA9 com a
rede caída; CA22 (componente). **Não conferido em lugar nenhum:** leitor de tela de verdade (CA24, só `role="log"`,
`aria-live` e teclado) e teclado de um celular de verdade (CA25, só o encolher da tela). "Abrir conversa" da home foi
conferido com dados simulados, porque pede amigos do squad jogando o mesmo jogo.

**Defeitos achados e corrigidos na conferência:** texto digitado sumia com o mouse sobre o campo e o nome do checkbox
não se lia (escala da marca no tema); o `po-menu` não marcava o item com `/conversas/:id` (o id foi para `?id=`), perdia
o destaque quando a novidade mudava e não mostrava o item marcado ao abrir o app; abrir a conversa não zerava a
contagem; "Criar squad" dizia que não havia amigos enquanto eles carregavam; o foco se perdia ao apagar.

Prints em `prints/`.

## Revisões (T9)

- `/code-review`: 10 achados, 9 corrigidos com teste. O décimo (squad sem dono quando a conta é apagada) depende de
  apagar contas, que o app ainda não faz, e está nos riscos do `plan.md`.
- `/security-review`: nenhuma vulnerabilidade com confiança suficiente para relatar.
