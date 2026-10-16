# 000 — Guia de contribuição (tarefas)

**Nível:** Pequena (processo e documentação, sem mudança de comportamento para o usuário).
**Objetivo:** registrar como criar branches, commits e PRs, adaptando o `CONTRIBUTING.md` do
po-angular ao fluxo SDD do projeto, e cobrar por ferramenta o que for possível.

- [x] T1 — `CONTRIBUTING.md`: branch nova da `main` atualizada por atividade, nomes
      `<tipo>/<NNN>-<nome>`, formato de commit (tipo, escopo, descrição, corpo, rodapé,
      breaking change) e regras de PR
- [x] T2 — commitlint com as regras do guia (título até 72 caracteres, corpo e rodapé quebrados
      em 72), testado com exemplos válidos e inválidos
- [x] T3 — AGENTS.md e template de PR apontam para o guia; campo "Área" no template
- [x] T4 — Revisar diff, rodar `npm run verify` e abrir o PR
