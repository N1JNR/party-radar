# 009 — Tarefas

Cada tarefa cabe em um commit, é testável sozinha e cita o critério de aceite que atende.
Marque `[x]` só depois que os testes da tarefa passarem.

- [x] T1 — Home sem as seções sociais e sem os dados que só elas usavam (CA3, CA4)
- [x] T2 — Sem as features de amigos e bate-papo, as rotas e os itens do menu (CA1, CA2)
- [x] T3 — Migration que apaga funções e tabelas de amigos e bate-papo, e os testes do banco (CA5, CA6)
- [x] T4 — Frase do login, `AGENTS.md`, `DESIGN.md`, `docs/plano.md` e aviso nas specs 006 a 008 (CA8)
- [x] T5 — Conferência em 390, 768 e 1280 px, com prints (CA9)
- [ ] T6 — `/code-review`, `/security-review`, `npm run verify:all` e relatório final (CA7)
- [ ] T7 — Depois do merge: `npx supabase db push` e conferir na nuvem (CA5)

## Conferência (06/11/2026)

Com o login e a home simulados, em `localhost:4200`. Prints em [`prints/`](prints/).

| Verificação                                              | Resultado                                      |
| -------------------------------------------------------- | ---------------------------------------------- |
| Menu com Meu card, Perfil e Sair (CA1)                   | ok, no menu fixo e na gaveta                   |
| `/amigos`, `/conversas?id=c1` e `/convite/bia` (CA2)     | ok, navegando dentro do app vão para `/inicio` |
| Home sem seções sociais e sem os textos delas (CA3, CA8) | ok                                             |
| Página sem transbordar em 390, 768 e 1280 px (CA9)       | ok; a trilha rola dentro do próprio bloco      |

Notas:

- T4: a spec 008 nunca chegou à `main`, então o aviso foi só nas specs 006 e 007; o plano diz onde a 008 ficou.
- T4: "Lenda do squad" virou "Lenda", decisão registrada na spec.
- O radar decorativo do login (sem texto, `aria-hidden`) continua com seus pontos acendendo.
