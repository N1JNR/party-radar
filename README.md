# Party Radar

Veja quem do seu grupo está jogando agora, chame a galera e acompanhe o que vocês jogaram.

- **Stack:** Angular 21 · PO UI 21 · Supabase · Vitest · ESLint · Prettier
- **Regras do projeto (para pessoas e agentes de IA):** [`AGENTS.md`](AGENTS.md)
- **Branches, commits e PRs:** [`CONTRIBUTING.md`](CONTRIBUTING.md)
- **Design (visual, componentes, acessibilidade):** [`DESIGN.md`](DESIGN.md)
- **Plano do MVP:** [`docs/plano.md`](docs/plano.md)
- **Especificações:** [`docs/specs/`](docs/specs/)

## Primeiros passos

Requisitos: Node 24+ (versão em `.nvmrc`), npm 11, Git e Docker Desktop (Supabase local).

```bash
npm ci
npm start            # http://localhost:4200
```

## Scripts

| Comando                           | O que faz                                                    |
| --------------------------------- | ------------------------------------------------------------ |
| `npm start`                       | servidor de desenvolvimento                                  |
| `npm test`                        | testes em modo watch                                         |
| `npm run test:ci`                 | testes uma vez, com cobertura (falha abaixo das metas)       |
| `npm run lint`                    | ESLint (TypeScript + templates + acessibilidade)             |
| `npm run format` / `format:check` | Prettier                                                     |
| `npm run build`                   | build de produção com SSR                                    |
| `npm run verify`                  | lint + formatação + testes com cobertura + build             |
| `npm run verify:all`              | verify + testes do banco (precisa do Supabase local rodando) |
| `npm run db:start`                | Supabase local (precisa de Docker)                           |
| `npm run db:test`                 | testes do banco (RLS)                                        |
| `npm run db:types`                | gera os tipos TypeScript do banco local                      |

## Hooks do Git

O `npm ci` instala hooks (husky) que rodam ESLint e Prettier nos arquivos do commit e
validam a mensagem no formato Conventional Commits. Detalhes no [`AGENTS.md`](AGENTS.md).

## CI (GitHub Actions)

Todo PR roda estes checks, em paralelo:

| Check                   | O que valida                                                           |
| ----------------------- | ---------------------------------------------------------------------- |
| Lint e formatação       | ESLint, Prettier e as mensagens de commit do PR (Conventional Commits) |
| Testes e cobertura      | Vitest com as metas de cobertura; o relatório fica como artefato       |
| Build de produção       | `npm run build`, com os limites de tamanho do bundle                   |
| Testes do banco (RLS)   | Postgres local do Supabase + testes pgTAP                              |
| Revisão de dependências | Barra pacote novo ou atualizado com vulnerabilidade alta ou crítica    |

Um push novo cancela a execução anterior do mesmo PR. O Dependabot abre, toda segunda,
PRs agrupados de atualização de npm e GitHub Actions (versão maior de Angular e PO UI fica de fora).

## Configuração

- **Front:** preencha `src/environments/environment*.ts` com a URL e a publishable key (`sb_publishable_…`) do Supabase.
- **Segredos** (worker e Edge Functions): copie `.env.example` para `.env`. O `.env` não vai para o Git.

## Estrutura

```
src/app/
  core/       cliente Supabase, tema, serviços de plataforma
  shared/     componentes reutilizáveis
  features/   uma pasta por funcionalidade (data, domain, ui, pages)
src/theme/    tema do PO UI
supabase/     config, migrations e testes do banco
docs/         plano e especificações
```
