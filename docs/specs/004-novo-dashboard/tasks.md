# 004 — Tarefas

Cada tarefa cabe em um commit, é testável sozinha e cita o critério de aceite que atende.
Marque `[x]` só depois que os testes da tarefa passarem.

**Banco e servidor**

- [x] T1 — Migration `game_categories` com RLS, lista inicial de jogos, pgTAP e tipos (CA6, CA8, CA25)
- [x] T2 — Função `my_games()`: jogos com tipo, total, mês e mês anterior, com pgTAP (CA9, CA11, CA25)
- [x] T3 — Leitura classifica jogos sem tipo pela loja da Steam, no máximo 20 por vez, testada sem rede (CA7, CA8)

**Front**

- [x] T4 — Domínio do radar: porcentagens, pontos, título e blocos, 100% testado (CA2, CA3, CA5, CA9, CA10)
- [x] T5 — Fontes da home trazem jogos e mês anterior (CA9, CA11)
- [x] T6 — Componente da trilha da patente (CA12, CA23)
- [x] T7 — Componente do radar: SVG, varredura, período e tipos (CA1, CA3, CA4, CA23, CA24)
- [x] T8 — Componente dos blocos de jogos (CA4, CA10)
- [x] T9 — Página no layout novo, com mês, corrida do squad e todos os estados; sai o player-card (CA11, CA13, CA17–CA21)
- [x] T10 — Compartilhar: imagem no canvas e serviço de compartilhar (CA14–CA16)
- [x] T11 — `DESIGN.md` e `docs/plano.md` atualizados

**Fechamento**

- [x] T12a — Ajustes da conferência: a imagem mostra as mesmas horas da tela; tipo com horas e abaixo de 1% mostra "<1%" (CA2, CA14)
- [x] T12b — A trilha diz de onde vêm as horas, pedido do Jorge na conferência (CA12)
- [x] T12 — Conferência com a conta do Jorge em 390, 768 e 1280 px, com prints (CA1–CA24)
- [x] T13a — Achados da revisão: tipo no bloco somado acende esse bloco (CA4)
- [x] T13b — Achados da revisão: a trilha abre com a patente atual à vista no celular (CA12)
- [x] T13c — Achados da revisão: a estimativa do mês anterior segue a primeira leitura da conta (CA11)
- [x] T13d — Achados da revisão: sem radar na tela, sem "Compartilhar meu radar" (CA20)
- [x] T13e — Achados da revisão: leitor de tela anuncia os tipos abaixo de 1% (CA23)
- [x] T13f — Achados da revisão: a imagem carrega todas as fontes que usa (CA14)
- [x] T13g — Achados da revisão: sai o código sem uso depois do player-card
- [ ] T13 — `/code-review`, `/security-review`, `npm run verify:all` e relatório final
