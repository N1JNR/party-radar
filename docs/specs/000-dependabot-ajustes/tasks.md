# 000 — Ajustes do Dependabot (tarefas)

**Nível:** Pequena (configuração de CI, sem mudança de comportamento para o usuário).
**Objetivo:** o Dependabot só propor atualizações que o projeto aceita, agrupadas de forma que
instalem sem conflito.

Contexto (primeira rodada, 2026-10-16): os 6 PRs falharam no commitlint (corrigido no PR #13) e
3 deles também no `npm ci`. Faixas de versão aceitas, lidas do `node_modules`:

| Dependência | Faixa aceita                      | PR do Dependabot | Situação                        |
| ----------- | --------------------------------- | ---------------- | ------------------------------- |
| `zone.js`   | `~0.15` (`@po-ui/ng-components`)  | #8 (0.16)        | incompatível com o PO UI        |
| `vitest`    | `^4` (`@angular/build`)           | #10 e #12 (v5)   | incompatível e em PRs separados |
| `eslint`    | `^10` aceito por `angular-eslint` | #9 (v10)         | compatível, avaliar             |
| `jsdom`     | sem restrição                     | #11 (v30)        | avaliar                         |

- [ ] T1 — Pausar `zone.js` acima de 0.15 e versão maior de `vitest`/`@vitest/*`; agrupar
      `vitest` com `@vitest/*`
- [ ] T2 — Revisar diff, rodar `npm run verify` e abrir o PR
- [ ] T3 — Depois do merge: fechar #8, #10 e #12 com o motivo e pedir ao Dependabot para
      atualizar #7, #9 e #11; relatar o resultado dos checks deles
