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
- [x] T10 — Componentes de jogando agora e oportunidade de squad, com estados vazios (CA9, CA10, CA12)
- [x] T11 — Página "Meu card": monta tudo, esqueleto de carregamento, erro e avisos "Em breve" (CA13–CA15)
- [x] T12 — Conferência visual em 390, 768, 1280 e 1440 px e só pelo teclado, com prints (CA16, CA17)
  - Conferido em 2026-10-19: sem rolagem horizontal em 390, 768, 1280 e 1440 px; nenhum alvo
    clicável com menos de 44 px; ordem de foco lógica e foco visível; gaveta abre com Enter e fecha
    com Esc devolvendo o foco. Estados conferidos: cheio, primeiro acesso, sem squads, erro e
    carregando.
  - Ajustes: "Onde joga" ocupa a linha inteira no card; divisor do título do mês só a partir de
    768 px; frase do jogo do mês trocada por "Nenhum. Ainda." (repetia o rótulo).
  - Para decidir: botão próprio da gaveta (o do `po-menu` é uma `div` sem teclado), corte do
    `po-menu` em 1201 px e não 1200, item atual sem `aria-current`, e os cenários de `?simular=`
    da home somem no login simulado (a sessão não sobrevive ao recarregar).
- [x] T13 — `/code-review`, revisar diff, rodar `npm run verify` e escrever o relatório final
  - `/code-review` (high) em 2026-10-19: 10 achados. Corrigidos 6 (dados de quem saiu, "Nenhum
    squad ainda" ao carregar, menu recriado à toa, parceria por nome, resposta sobre dados
    recarregados, gaveta ao redimensionar), com testes.
  - Ficam para depois: o card lê as frases por um `computed` porque, na suíte inteira, a constante
    chegava `undefined` no construtor (causa não achada; `import type` não resolveu); o aviso
    "Em breve" montado em dois lugares; estilos de painel repetidos em cinco componentes; e o
    "há X min" que não anda com a página aberta (resolver junto com o Realtime, na integração).

## Integração

Fica para uma spec própria, depois que as telas estiverem prontas.
