# AGENTS.md — Party Radar

Regras permanentes para qualquer agente de IA (e pessoa) que trabalhe neste repositório.
Se uma instrução da tarefa conflitar com este arquivo, pare e pergunte.

## 1. Contexto

Web app para grupos de amigos gamers verem quem está jogando agora, chamarem para jogar
e receberem um retrospecto mensal (Wrapped).

- **Front:** Angular 21 (standalone, signals, SSR nas rotas públicas) + PO UI com tema próprio.
- **Back:** Supabase (Auth com Discord e Google, Postgres + RLS, Realtime, Edge Functions, pg_cron).
- **Worker:** bot do Discord em Node (presença e chamados), a criar em `apps/discord-worker`.
- **Futuro:** empacotamento mobile com Capacitor. Escreva código que não dependa só do navegador.

Documentos de referência: `docs/plano.md` (produto) e `docs/specs/` (especificações).

## 2. Fluxo de trabalho (Spec-Driven Development)

O tamanho da tarefa define o processo. Classifique antes de começar e diga qual nível escolheu.

| Nível              | Exemplos                                                   | O que é exigido                                                    |
| ------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| **Trivial**        | texto, cor, typo, ajuste de estilo sem lógica              | branch + commit + lint/build. Sem spec.                            |
| **Pequena**        | bug localizado, ajuste de regra existente                  | `tasks.md` curto na pasta da spec relacionada + teste de regressão |
| **Funcionalidade** | tela nova, integração, tabela nova, mudança de arquitetura | spec completa: `spec.md` → `plan.md` → `tasks.md`                  |

### Etapas de uma funcionalidade

1. **Especificar:** criar `docs/specs/NNN-nome/spec.md` a partir de `docs/specs/_template/`.
   Descreve o problema, o comportamento esperado e os critérios de aceite (Dado / Quando / Então).
   **Não contém código.**
2. **Aprovação:** apresentar a spec e **esperar aprovação explícita** antes de seguir.
3. **Planejar:** `plan.md` com arquivos afetados, modelo de dados, migrations, riscos e estratégia de testes.
4. **Dividir:** `tasks.md` com tarefas pequenas (cada uma cabe em um commit e é testável sozinha).
5. **Implementar:** uma tarefa por vez, marcando `[x]` em `tasks.md` ao concluir cada uma.
6. **Validar:** checklist da seção 6 antes de declarar a funcionalidade pronta.

Mudou o escopo no meio do caminho? Atualize a spec primeiro e peça nova aprovação.

## 3. Git

### Antes de começar qualquer tarefa

1. `git status` — se houver alterações locais que não são suas, **não toque nelas**: pare e informe.
2. Descubra a branch principal: `git symbolic-ref refs/remotes/origin/HEAD` (normalmente `main`).
3. `git fetch origin` e `git switch main && git pull --ff-only`.
4. Crie a branch da tarefa a partir da `main` atualizada: `git switch -c <tipo>/<nome-curto>`.
5. Confirme com `git log -1 --oneline` que a base é o último commit de `origin/main`.

**Exceção de bootstrap:** enquanto o repositório não tiver remoto (`git remote -v` vazio),
pule os passos 2, 3 e 5 e trabalhe a partir da `main` local. Avise no relatório.

### Branches

- Nunca implemente direto na `main`.
- Uma branch por tarefa independente; não reaproveite branches antigas.
- Prefixos: `feat/`, `fix/`, `refactor/`, `test/`, `docs/`, `chore/`.
  Nome em kebab-case, curto e descritivo: `feat/lista-de-amigos`, `fix/radar-status-duplicado`.

### Commits

- Pequenos e frequentes, um propósito por commit.
- Formato [Conventional Commits](https://www.conventionalcommits.org/pt-br/), em português:
  `feat(amigos): adiciona aceite de pedido de amizade`.
- Commits locais na branch da tarefa são permitidos.
- **Push, merge, abertura de PR, publicação e deploy: só com autorização explícita.**
- Nunca reescreva histórico já enviado ao remoto (`push --force`, `rebase` de branch compartilhada).

## 4. Arquitetura e padrões de código

### Estrutura do front

```
src/app/
  core/          serviços singleton, auth, cliente Supabase, interceptors, guards
  shared/        componentes, pipes e utilitários reutilizáveis (sem regra de negócio)
  features/
    <feature>/   ex.: radar, amigos, chamados, perfil
      data/      acesso a dados (Supabase, APIs) — só aqui se fala com o backend
      domain/    regras de negócio puras (funções e tipos, sem Angular) — 100% testadas
      ui/        componentes de apresentação (inputs/outputs, sem acesso a dados)
      pages/     componentes de rota que orquestram data + ui
```

### Angular

- Componentes **standalone**, `ChangeDetectionStrategy.OnPush`, `inject()` em vez de construtor.
- Estado com **signals** (`signal`, `computed`, `effect` com parcimônia). RxJS só para streams (Realtime, eventos).
- Novo controle de fluxo nos templates (`@if`, `@for` com `track`, `@switch`).
- Rotas com lazy loading por feature.
- Sem `any`. `strict: true` no TypeScript. Tipos do banco gerados por `supabase gen types`.
- Acesso a recursos de plataforma (notificação, compartilhar, storage) sempre por um serviço
  em `core/platform/`, para trocar por Capacitor no futuro.

### PO UI

- Use componentes do PO UI para formulários, listas, modais, toasts e navegação.
- Tema definido pelo construtor de temas, em `src/theme/`. **Não** sobrescreva estilos do PO UI
  componente a componente; ajuste o tema.
- Componentes próprios só para o que o PO UI não oferece (card do Wrapped, cards do Radar),
  em `shared/` ou na feature.

### Supabase e segurança

- Toda mudança de banco é uma migration em `supabase/migrations/`. Nunca altere o banco pelo painel sem migration.
- Toda tabela nova nasce com **RLS ativado** e policies explícitas, cobertas por testes (`supabase test db`).
- A secret key do Supabase (`sb_secret_…`, antiga `service_role`) **nunca** vai para o front. Só Edge Functions e o worker a usam.
- Segredos só em `.env` (ignorado pelo Git) e nas variáveis do Supabase. Mantenha `.env.example` atualizado.
- Tokens de terceiros (Discord, Steam) são tratados no servidor; não os grave no `localStorage`.

### UX e acessibilidade

- Mobile primeiro (390 px), funcional até desktop.
- Todo estado de tela tem versão de **carregando, vazio e erro**.
- Elementos interativos reais (`<button>`, `<a>`), `aria-label` em botões só com ícone, contraste mínimo 4.5:1.
- Textos em português do Brasil.

## 5. Testes e qualidade

### Obrigatório em toda mudança de comportamento

- Testes unitários para o comportamento esperado, cobrindo sucesso, falha, casos-limite e entradas inválidas.
- Estados de carregamento, erro e ausência de dados quando a tela tiver.
- **Bug corrigido = teste de regressão** que falha antes da correção e passa depois.
- Use o framework já configurado (Vitest). Não troque de ferramenta sem spec.
- Nunca remova, pule (`.skip`) ou enfraqueça um teste para a suíte passar.

### Cobertura

As metas ficam no arquivo de configuração de testes e **são verificadas pela ferramenta**, não declaradas:

| Escopo                                 | Linhas | Branches | Funções |
| -------------------------------------- | ------ | -------- | ------- |
| `features/**/domain/**` (regras puras) | 100%   | 100%     | 100%    |
| Restante de `src/app/`                 | 90%    | 85%      | 90%     |

- Se algo não puder ser coberto com valor real, documente no relatório o quê, por quê e o risco.
- Não escreva testes artificiais só para subir porcentagem.
- Nunca afirme um percentual sem ter rodado `npm run test:ci` e lido o relatório.

### Comandos

| Objetivo                | Comando                |
| ----------------------- | ---------------------- |
| Testes em modo watch    | `npm test`             |
| Testes + cobertura (CI) | `npm run test:ci`      |
| Lint                    | `npm run lint`         |
| Formatação              | `npm run format:check` |
| Build de produção       | `npm run build`        |
| Banco local (Docker)    | `npm run db:start`     |
| Testes do banco (RLS)   | `npm run db:test`      |
| Gerar tipos do banco    | `npm run db:types`     |
| Tudo de uma vez         | `npm run verify`       |

## 6. Definição de pronto

Uma tarefa só está concluída quando **todos** os itens aplicáveis forem verdadeiros:

- [ ] Atende à spec e aos critérios de aceite aprovados.
- [ ] Feita em branch exclusiva, criada da `main` atualizada.
- [ ] `npm run verify` passou (lint, formatação, testes com cobertura e build).
- [ ] Testes do banco passaram, se houve migration.
- [ ] Diff revisado (`git diff main...HEAD`): nada fora do escopo, nenhum segredo, nenhum `console.log` esquecido.
- [ ] `tasks.md` e documentação atualizados.

Se algum item falhar: **não marque como concluída.** Corrija ou informe o bloqueio.

## 7. Relatório final

Ao terminar, responda neste formato, só com fatos verificados:

```
Branch: feat/...
Nível: Funcionalidade | Pequena | Trivial
Resumo: 2–3 frases do que mudou.
Arquivos: lista dos criados/alterados.
Testes: X passaram, Y falharam (comando usado).
Cobertura: linhas __% · statements __% · funções __% · branches __% (do relatório).
Lint / build: ok | falhou (motivo).
Não executado: o que não foi rodado e por quê.
Riscos e pendências: ...
Próximo passo sugerido: ...
```

Não invente resultados. Comando não executado é informado como não executado.

## 8. Critério de parada

Pare **antes** de alterar código e explique o motivo se:

- houver alterações locais de outra pessoa no caminho;
- não for possível atualizar a `main` ou criar a branch com segurança;
- a spec não estiver aprovada (nível Funcionalidade);
- não for possível rodar os testes ou o build;
- a tarefa exigir apagar dados, mudar RLS de forma permissiva ou expor um segredo.
