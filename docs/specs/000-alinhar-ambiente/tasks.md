# 000 — Alinhar ambiente (tarefas)

**Nível:** Pequena (configuração, sem mudança de comportamento para o usuário).
**Objetivo:** deixar Node, npm, Supabase local e testes do banco iguais no PC e na CI
antes da primeira funcionalidade (`001-login`).

- [x] T1 — Node 24 e npm 11 em `package.json`, CI e README
- [x] T2 — Decidir explicitamente os scripts de instalação bloqueados pelo npm 11 (`allowScripts`)
- [x] T3 — Supabase local: `site_url` e redirects na porta 4200, `seed.sql` vazio, analytics desligado
- [x] T4 — Front usa a publishable key do Supabase (`sb_publishable_…`) em vez da anon key
- [ ] T5 — Teste pgTAP: toda tabela do schema `public` tem RLS ativado
- [ ] T6 — Revisar diff, rodar `npm run verify` e `npm run db:test` e escrever o relatório final
