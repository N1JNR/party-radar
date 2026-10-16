<!--
Título do PR no padrão Conventional Commits: tipo(escopo): descrição curta
Ex.: feat(amigos): adiciona aceite de pedido de amizade · fix(radar): corrige status duplicado
Apague as seções que não se aplicam e os comentários como este.
-->

## O que muda

<!-- 2–3 frases: o problema e a solução. Em correção de bug, diga a causa raiz. -->

## Spec

- **Spec:** `docs/specs/NNN-nome/` <!-- ou docs/specs/000-nome/ para manutenção -->
- **Nível:** Funcionalidade | Pequena | Trivial
- **Tarefas:** T\_\_ a T\_\_ do `tasks.md`

## Qual o comportamento atual?

<!-- O que acontece hoje (ou "não existe", se for funcionalidade nova). -->

## Qual o novo comportamento?

<!-- O que passa a acontecer, do ponto de vista de quem usa o app. -->

## Critérios de aceite atendidos

- [ ] CA\_\_ —

## Como testar

<!--
Passo a passo para quem revisa. Ex.:
1. npm start e abrir http://localhost:4200/login?simular=erro
2. Tocar em "Continuar com o Google"
3. Ver o aviso abaixo dos botões
-->

## Checklist do autor

Definição de pronto do [`AGENTS.md`](https://github.com/N1JNR/party-radar/blob/main/AGENTS.md#6-definição-de-pronto). Marque só o que fez de verdade.

- [ ] Branch criada a partir da `main` atualizada
- [ ] `npm run verify` passou (ou `npm run verify:all`, se mexeu em `supabase/`)
- [ ] Testes cobrem sucesso, falha e casos-limite; bug corrigido tem teste de regressão
- [ ] Tela: estados de carregando, vazio e erro; conferida em 390, 768 e 1280 px e só pelo teclado ([`DESIGN.md`](https://github.com/N1JNR/party-radar/blob/main/DESIGN.md#7-critérios-de-qualidade))
- [ ] Banco: migration com RLS, teste pgTAP e `database.types.ts` atualizado
- [ ] `/code-review` feito; `/security-review` também, se tocou em login, RLS, Edge Functions ou segredos
- [ ] Diff sem segredos, `console.log` ou teste pulado
- [ ] `tasks.md` e documentação atualizados

## Checklist do revisor

- [ ] Commits coesos, um propósito cada, no padrão Conventional Commits
- [ ] Código segue o `AGENTS.md` (standalone, OnPush, signals, sem `any`, `.ts`/`.html`/`.scss`)
- [ ] Interface segue o `DESIGN.md` (tokens, PO UI primeiro, contraste e foco visível)
- [ ] Testes cobrem o que mudou e a cobertura se manteve
- [ ] Testado em Chrome, Firefox e Safari (se mexeu em tela)

## Prints

<!-- Obrigatório se mexeu em tela. Mobile (390 px) e desktop; antes e depois em mudanças visuais. -->

| Antes | Depois |
| ----- | ------ |
|       |        |

## Riscos e pendências

<!-- O que não foi testado, o que fica para depois e por quê. "Nenhum" se for o caso. -->
