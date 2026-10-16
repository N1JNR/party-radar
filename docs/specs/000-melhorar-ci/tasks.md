# 000 — Melhorar a esteira de CI (tarefas)

**Nível:** Pequena (CI e ferramentas, sem mudança de comportamento para o usuário).
**Objetivo:** checks separados e claros no PR, regras do AGENTS.md cobradas também na CI e
dependências revisadas automaticamente. Referência: a esteira do po-angular, adaptada ao projeto.

- [x] T1 — Action de setup reutilizável (Node do `.nvmrc`, npm do `packageManager`, `npm ci` com cache)
- [ ] T2 — CI em jobs paralelos (`lint`, `test`, `build`, `db-test`), com cancelamento de execuções
      antigas, permissões mínimas e commitlint nos commits do PR
- [ ] T3 — Revisão de dependências no PR (`dependency-review-action`, barra severidade alta)
- [ ] T4 — Dependabot semanal para npm e GitHub Actions, agrupado; commitlint aceita os commits dele
- [ ] T5 — README com os checks da CI; revisar diff, rodar `npm run verify` e abrir o PR
