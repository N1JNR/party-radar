# 000 — Contraste dos avisos (toasts) (tarefas)

**Nível:** Pequena (correção de bug visual no tema, com teste de regressão).
**Problema:** os avisos do PO UI (toasts de erro, sucesso, informação e aviso) apareciam com texto
claro sobre fundo claro, quase ilegíveis (contraste perto de 1,02:1). Achado na conferência da
spec 003 (T11).
**Causa raiz:** o tema escuro (`src/theme/party-radar.theme.ts`) definia só o `base` de cada cor
de feedback. O fundo do toast usa o `lightest`, que ficava no rosa, verde, amarelo ou azul claro
padrão do PO UI, enquanto o texto usa o `neutral.dark.90` do tema, que é claro (`#E6EDF3`).

- [x] T1 — Teste de regressão em `core/theme/theme.spec.ts`: escala inteira de cada feedback no
      tema, texto do toast sobre o fundo dele, texto de tag (`darker`) sobre o fundo e ícone
      sobre o `base`, todos com no mínimo 4,5:1 (falhou com 12 casos antes da correção)
- [x] T2 — Escala inteira de `positive`, `warning`, `negative` e `info`, invertida para o modo
      escuro: `lightest` escuro (fundo) e `darker`/`darkest` claros (texto), no tema, sem
      sobrescrever o componente (DESIGN.md)
- [x] T3 — Conferido no navegador: erro e informação legíveis (texto `#E6EDF3` sobre
      `#2A1215` e `#082A31`, cerca de 14:1 e 13:1). Prints `antes-erro.jpg` e
      `depois-erro-e-info.jpg` em `prints/`
