# Contribuindo com o Party Radar

Como criar **branches**, **commits** e **pull requests** neste repositório. Vale para pessoas e
agentes de IA. Adaptado do [guia do PO UI](https://github.com/po-ui/po-angular/blob/master/CONTRIBUTING.md)
ao nosso fluxo de Spec-Driven Development, descrito no [`AGENTS.md`](AGENTS.md).

## Conteúdo

- [Fluxo de uma atividade](#fluxo-de-uma-atividade)
- [Branches](#branches)
- [Commits](#commits)
- [Pull requests](#pull-requests)
- [Revisão e merge](#revisão-e-merge)
- [O que não adotamos do PO UI](#o-que-não-adotamos-do-po-ui)

## Fluxo de uma atividade

**Toda atividade começa numa branch nova, criada da `main` atualizada.** Isso vale também para um
ajuste pedido depois que um PR foi mergeado: nunca continue numa branch antiga.

1. Classifique o nível (Trivial, Pequena ou Funcionalidade) e prepare os documentos da spec em
   `docs/specs/` (veja o `AGENTS.md`, seção 2).
2. Atualize a `main` e crie a branch (abaixo).
3. Uma tarefa do `tasks.md` por commit; marque `[x]` quando os testes dela passarem.
4. Rode `npm run verify` (ou `npm run verify:all` se mexeu em `supabase/`).
5. Abra o PR com o template preenchido. A `main` é protegida: o merge só acontece com os checks
   verdes e a branch atualizada.

## Branches

Antes de criar a branch, garanta que a `main` local está igual à do GitHub:

```bash
git switch main
git pull --ff-only
```

Se o `git pull` não der erro, crie a branch:

```bash
git switch -c <tipo>/<NNN>-<nome-curto>
```

- `<tipo>`: `feat`, `fix`, `refactor`, `test`, `docs` ou `chore` (o mesmo tipo principal dos commits).
- `<NNN>`: número da spec em `docs/specs/` (`000` para manutenção sem spec de funcionalidade).
- `<nome-curto>`: kebab-case, sem acento, descrevendo a atividade.

| Exemplo                          | Quando                                        |
| -------------------------------- | --------------------------------------------- |
| `feat/001-login-funcionalidade`  | Parte 2 da spec 001                           |
| `fix/004-radar-status-duplicado` | correção de bug na funcionalidade da spec 004 |
| `chore/000-melhorar-ci`          | manutenção sem spec de funcionalidade         |
| `docs/000-guia-de-contribuicao`  | este guia                                     |

Confirme a base com `git log -1 --oneline`: deve ser o último commit de `origin/main`.

## Commits

Commits pequenos e frequentes, **um propósito por commit**, em português. O formato segue o
[Conventional Commits](https://www.conventionalcommits.org/pt-br/) e é validado pelo commitlint
no hook `commit-msg` e de novo na CI:

```
<tipo>(<escopo>): <descrição curta>
<linha em branco>
<corpo>
<linha em branco>
<rodapé>
```

### Tipo

| Tipo       | Quando usar                                                 |
| ---------- | ----------------------------------------------------------- |
| `feat`     | funcionalidade nova ou melhoria visível para quem usa o app |
| `fix`      | correção de bug                                             |
| `refactor` | mudança de código sem mudar comportamento                   |
| `test`     | testes novos ou ajustados                                   |
| `docs`     | documentação (specs, README, AGENTS.md, DESIGN.md)          |
| `style`    | formatação, sem mudar lógica                                |
| `perf`     | melhoria de desempenho                                      |
| `build`    | build, dependências e configuração do Angular               |
| `ci`       | GitHub Actions e Dependabot                                 |
| `chore`    | tarefas de manutenção que não entram nos outros tipos       |

Nunca coloque espaço entre o tipo e o parêntese do escopo.

### Escopo

A área ou funcionalidade principal afetada, em minúsculas e sem prefixo: `(login)`, `(auth)`,
`(radar)`, `(theme)`, `(supabase)`. Use `(login)`, e não `(app-login)` ou `(login-page)`. Se
várias áreas mudarem, escolha a principal. O escopo pode ser omitido quando não houver uma área
clara (`docs: ...`).

### Descrição curta

- Começa com letra minúscula e não termina com ponto.
- No presente, dizendo o que o commit faz: `adiciona`, `corrige`, `remove`.
- Até **72 caracteres** somando tipo, escopo e descrição.

| Certo                                            | Errado                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `feat(login): adiciona aviso de sessão expirada` | `feat(login): Adicionado aviso de sessão expirada.`                                     |
| `fix(radar): corrige status duplicado`           | `fix: corrigido bug no componente radar-hero que duplicava o status dos amigos na tela` |

### Corpo

- Explica **por que** a mudança foi feita e o que muda em relação ao comportamento anterior.
- Quebre as linhas em até **72 caracteres** (linhas com links podem passar).
- Opcional em commits óbvios.

### Rodapé

- `Fixes #12` quando o commit resolve uma issue do GitHub (fecha a issue no merge).
- `Refs: docs/specs/001-login` para ligar o commit a uma spec, quando ajudar.
- `Co-Authored-By: ...` quando outra pessoa ou um agente de IA participou.
- Mudança que quebra compatibilidade: `BREAKING CHANGE: <descrição em minúscula>`, seguida de
  uma linha em branco e do que precisa ser migrado.

### Exemplos completos

Sem quebra de compatibilidade:

```
fix(login): mostra o aviso abaixo dos botões sem mudá-los de lugar

O aviso empurrava os botões cerca de 56 px e um segundo toque rápido
acertava o outro provedor. O conteúdo com os botões fica centralizado
sozinho e o aviso aparece no rodapé.

Refs: docs/specs/001-login
```

Com quebra de compatibilidade:

```
refactor(auth): renomeia supabaseAnonKey para supabasePublishableKey

O Supabase passou a gerar chaves sb_publishable_ para o front.

BREAKING CHANGE: environment.supabaseAnonKey não existe mais

Troque nos arquivos src/environments/*.ts:
Antes:  supabaseAnonKey: '...'
Depois: supabasePublishableKey: 'sb_publishable_...'
```

## Pull requests

Antes de abrir o PR, confira:

- Não existe outro PR aberto resolvendo a mesma coisa.
- O PR atende à spec e aos critérios de aceite aprovados.
- Os commits seguem o padrão acima (a CI recusa os que não seguem).
- `npm run verify` passou na sua máquina.

O título do PR segue o mesmo formato do commit. A descrição já vem com o template
[`.github/pull_request_template.md`](.github/pull_request_template.md); preencha cada parte:

| Parte                           | O que escrever                                                     |
| ------------------------------- | ------------------------------------------------------------------ |
| **O que muda**                  | 2–3 frases; em bug, a causa raiz                                   |
| **Spec**                        | pasta da spec, nível, área e tarefas atendidas                     |
| **Qual o comportamento atual?** | o que acontece hoje e por que precisa mudar                        |
| **Qual o novo comportamento?**  | o que passa a acontecer e como foi resolvido                       |
| **Como testar**                 | passos para validar, com URLs (ex.: `?simular=erro`)               |
| **Checklists**                  | marque `[x]` só no que fez de verdade                              |
| **Prints**                      | obrigatórios quando mexe em tela: mobile e desktop, antes e depois |
| **Riscos e pendências**         | o que não foi testado e o que fica para depois                     |

Se usar `gh pr create --body-file`, o template não é carregado sozinho: copie-o e preencha.

## Revisão e merge

- A `main` exige os checks **Lint e formatação**, **Testes e cobertura**, **Build de produção**,
  **Testes do banco (RLS)** e **Revisão de dependências** verdes, e a branch atualizada.
- Se a `main` andou, use **Update branch** no GitHub (ou `git merge origin/main` na branch) e
  rode `npm run verify` de novo.
- Ajuste pedido na revisão vira commit novo na mesma branch, enquanto o PR estiver aberto.
- O merge é feito com **merge commit** (mantém os commits pequenos no histórico) e a branch é
  apagada em seguida.
- Push, merge, abertura de PR e deploy só com autorização explícita (`AGENTS.md`, seção 3).

## O que não adotamos do PO UI

| No PO UI                                          | Aqui                                     | Por quê                                                                               |
| ------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------- |
| Juntar tudo em **um commit** (squash) antes do PR | commits pequenos, um por tarefa          | cada tarefa do `tasks.md` fica rastreável e testável sozinha                          |
| `rebase` e novo push depois da revisão            | commit novo ou merge da `main` na branch | o `AGENTS.md` proíbe reescrever histórico já enviado (`push --force`)                 |
| Branch `<componente>/<issue>`                     | `<tipo>/<NNN>-<nome>`                    | não usamos Jira; o número da spec cumpre o papel da issue                             |
| Campo "Componente" no PR                          | campo "Área" na seção Spec do template   | o app é organizado por funcionalidade (`features/`), não por componente de biblioteca |
