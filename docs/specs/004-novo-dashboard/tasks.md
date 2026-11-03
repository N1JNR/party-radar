# 004 — Tarefas

Cada tarefa cabe em um commit, é testável sozinha e cita o critério de aceite que atende.
Marque `[x]` só depois que os testes da tarefa passarem.

**Banco e servidor**

- [x] T1 — Migration `game_categories` com RLS, lista inicial de jogos, pgTAP e tipos (CA6, CA8, CA25)
- [x] T2 — Função `my_games()`: jogos com tipo, total, mês e mês anterior, com pgTAP (CA9, CA11, CA25)
- [ ] T3 — Leitura classifica jogos sem tipo pela loja da Steam, no máximo 20 por vez, testada sem rede (CA7, CA8)

**Front**

- [ ] T4 — Domínio do radar: porcentagens, pontos, título e blocos, 100% testado (CA2, CA3, CA5, CA9, CA10)
- [ ] T5 — Fontes da home trazem jogos e mês anterior (CA9, CA11)
- [ ] T6 — Componente da trilha da patente (CA12, CA23)
- [ ] T7 — Componente do radar: SVG, varredura, período e tipos (CA1, CA3, CA4, CA23, CA24)
- [ ] T8 — Componente dos blocos de jogos (CA4, CA10)
- [ ] T9 — Página no layout novo, com mês, corrida do squad e todos os estados; sai o player-card (CA11, CA13, CA17–CA21)
- [ ] T10 — Compartilhar: imagem no canvas e serviço de compartilhar (CA14–CA16)
- [ ] T11 — `DESIGN.md` e `docs/plano.md` atualizados

**Fechamento**

- [ ] T12 — Conferência com a conta do Jorge em 390, 768 e 1280 px, com prints (CA1–CA24)
- [ ] T13 — `/code-review`, `/security-review`, `npm run verify:all` e relatório final
