# 002 — Tarefas

Cada tarefa cabe em um commit, é testável sozinha e cita o critério de aceite que atende.
Marque `[x]` só depois que os testes da tarefa passarem.

## Layout com dados simulados (`feat/002-home-layout`)

- [x] T1 — Tokens de presença trocados (ciano = jogando, verde = online) e conferência do radar do login (CA5)
- [x] T2 — Domain: tabela de patentes, patente atual e progresso para a próxima, 100% testado (CA4, CA7)
- [x] T3 — Domain: tipos do card, divisão por plataforma em %, horas e frases do primeiro acesso, 100% testado (CA4, CA6, CA7)
- [x] T4 — Domain: oportunidade de squad (2+ do mesmo squad no mesmo jogo), 100% testado (CA12)
- [x] T5 — Layout do app com `po-menu` (itens, squads, Sair) e prova da gaveta em tela estreita (CA1–CA3)
- [x] T6 — Contrato `HomeDataSource` e fonte simulada com os cenários de `?simular=` (CA4–CA15)
- [x] T7 — `HomeStore` em signals: carregando, erro, tentar de novo, confirmar parceria, Steam pública (CA8, CA11, CA14, CA15)
- [x] T8 — Componente do card: cheio, provável e primeiro acesso (CA4–CA7)
- [x] T9 — Componentes laterais: "Deixe seu card mais forte", aviso da Steam e pergunta de parceria (CA7, CA8, CA11)
- [ ] T10 — Componentes de jogando agora e oportunidade de squad, com estados vazios (CA9, CA10, CA12)
- [ ] T11 — Página "Meu card": monta tudo, esqueleto de carregamento, erro e avisos "Em breve" (CA13–CA15)
- [ ] T12 — Conferência visual em 390, 768, 1280 e 1440 px e só pelo teclado, com prints (CA16, CA17)
- [ ] T13 — `/code-review`, revisar diff, rodar `npm run verify` e escrever o relatório final

## Integração

Fica para uma spec própria, depois que as telas estiverem prontas.
