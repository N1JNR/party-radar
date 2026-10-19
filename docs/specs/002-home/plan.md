# 002 — Plano técnico

**Spec:** `spec.md` (aprovada em 2026-10-16) · **Branch do código:** `feat/002-home-layout`
**Cobre:** CA1–CA17, só com dados simulados (sem Supabase, Steam ou Discord).

## Abordagem

A home troca a tela provisória de `/inicio`. As rotas autenticadas passam a ficar dentro de um
**layout do app** (menu + área de conteúdo), e a home é a primeira página dentro dele.

Como no login, as telas dependem só de **contratos**: os dados do card vêm de uma fonte
(`HomeDataSource`) que nesta entrega é **simulada**, com cenários escolhidos por `?simular=` em
desenvolvimento. A integração real troca só a implementação da fonte.

| `?simular=`       | Cenário                                                | Critério            |
| ----------------- | ------------------------------------------------------ | ------------------- |
| _(vazio)_         | card cheio, amigos jogando, squad com oportunidade     | CA4–CA6, CA11, CA12 |
| `primeiro-acesso` | 0h, NPC, frases engraçadas, checklist                  | CA7                 |
| `steam-privada`   | card cheio com o aviso da Steam privada                | CA8                 |
| `sem-amigos`      | ninguém jogando                                        | CA9                 |
| `sem-squads`      | nenhum squad                                           | CA10                |
| `carregando`      | segura o carregamento por 3 s                          | CA14                |
| `erro`            | falha no carregamento; "Tentar de novo" carrega o card | CA15                |

## Menu: `po-menu` do PO UI

O `DESIGN.md` pede PO UI primeiro, e o `po-menu` já tem o que o menu precisa: itens com ícone
e badge (Amigos), subitens (Seus squads, com quantos estão jogando), item com ação (Sair) e
versão para tela estreita com botão de menu.

**Corte confirmado (2026-10-16):** o `po-menu` fica fixo a partir de **1200 px** e vira gaveta
abaixo disso; a spec (CA2) e o `DESIGN.md` foram atualizados. Se o `po-menu` não atender ao
comportamento de teclado do CA2 (Esc, devolver o foco), isso aparece na T5 e volta para decisão.

**Decisões da conferência visual (2026-10-19, T12):**

- O corte real do `po-menu` é **1201 px** (a gaveta vai até 1200 px). A spec (CA2), o `DESIGN.md`
  e o `AGENTS.md` passam a dizer "acima de 1200 px".
- A gaveta do `po-menu` abre por uma `div` sem teclado e não fecha com Esc. **Exceção aceita** à
  regra de não sobrescrever o PO UI: o layout usa um botão próprio, esconde a `div` com CSS, fecha
  com Esc e devolve o foco (`app-shell.component`).
- O `po-menu` não marca o item atual com `aria-current`; o destaque é só visual. Limitação do PO UI,
  registrada aqui.
- Os cenários de `?simular=` da home se perdem no login simulado (a sessão não sobrevive ao
  recarregar). Fica para a Parte 2 do login (`001-login/tasks.md`).

## Arquivos afetados

| Arquivo                                                       | Mudança                                                                                                    |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/styles.scss`                                             | troca `--pr-presence-playing` (ciano) e `--pr-presence-online` (verde); novos tokens só se a home pedir    |
| `src/app/features/home/domain/patentes.ts`                    | novo: tabela de patentes, patente atual e progresso para a próxima (puro, 100%)                            |
| `src/app/features/home/domain/player-card.ts`                 | novo: tipos do card, divisão por plataforma em %, horas formatadas, frases do primeiro acesso (puro, 100%) |
| `src/app/features/home/domain/squad-opportunity.ts`           | novo: detecta 2+ do mesmo squad no mesmo jogo (puro, 100%)                                                 |
| `src/app/features/home/data/home.source.ts`                   | novo: contrato `HomeDataSource` e token                                                                    |
| `src/app/features/home/data/fake-home.source.ts`              | novo: fonte simulada com os cenários de `?simular=`                                                        |
| `src/app/features/home/data/home.store.ts`                    | novo: estado da home em signals (carregando, erro, pronto, ações)                                          |
| `src/app/layout/app-shell/app-shell.component.(ts,html,scss)` | novo: `po-menu` + área de conteúdo com `<router-outlet>`                                                   |
| `src/app/features/home/ui/player-card/*`                      | novo: o card (cheio e primeiro acesso)                                                                     |
| `src/app/features/home/ui/strengthen-card/*`                  | novo: "Deixe seu card mais forte" e aviso da Steam privada                                                 |
| `src/app/features/home/ui/partnership-question/*`             | novo: "Você jogou … com …?"                                                                                |
| `src/app/features/home/ui/playing-now/*`                      | novo: amigos jogando agora e vazio                                                                         |
| `src/app/features/home/ui/squad-opportunity/*`                | novo: destaque do squad                                                                                    |
| `src/app/features/home/pages/home.page.(ts,html,scss)`        | reescrito: orquestra store + ui; carregando, erro, "Em breve"                                              |
| `src/app/app.routes.ts`                                       | `/inicio` dentro do layout do app; título "Meu card"                                                       |
| `DESIGN.md`                                                   | corte do menu (se o ajuste acima for aprovado)                                                             |
| `*.spec.ts` ao lado de cada arquivo                           | novos                                                                                                      |

O layout fica em `src/app/layout/`, e não em `core/`, porque monta o app a partir das
features (menu com os squads); `core/` continua sem depender de features.

## Dados

Nenhuma migration. Os dados simulados vivem em memória na fonte simulada.

## Integrações externas

Nenhuma. Os avisos "Em breve" usam o `PoNotificationService` (toast do PO UI, lido por leitor de
tela). "Copiar convite" usa a área de transferência pelo serviço de plataforma em
`core/platform/` (regra do AGENTS.md), com fallback silencioso se o navegador negar.

## Estratégia de testes

| Critério                  | Tipo de teste       | Onde                                                     |
| ------------------------- | ------------------- | -------------------------------------------------------- |
| patentes e progresso      | unitário (domain)   | `features/home/domain/patentes.spec.ts`                  |
| plataforma, horas, frases | unitário (domain)   | `features/home/domain/player-card.spec.ts`               |
| CA12 (oportunidade)       | unitário (domain)   | `features/home/domain/squad-opportunity.spec.ts`         |
| cenários simulados        | unitário            | `features/home/data/fake-home.source.spec.ts`            |
| CA11, CA14, CA15 (estado) | unitário            | `features/home/data/home.store.spec.ts`                  |
| CA1–CA3 (menu)            | componente          | `layout/app-shell/app-shell.component.spec.ts`           |
| CA4–CA8 (card, Steam)     | componente          | `features/home/ui/**.spec.ts`                            |
| CA9–CA15 (página)         | componente (página) | `features/home/pages/home.page.spec.ts`                  |
| CA16, CA17                | manual, com prints  | navegador do app em 390, 768, 1280 e 1440 px; só teclado |

## Riscos

- **`po-menu` e acessibilidade:** o comportamento de teclado da versão estreita é do PO UI. Se não
  cumprir o CA2, decidir entre ajustar o requisito ou fazer um menu próprio.
- **Peso do PO UI:** a home é a primeira tela com vários componentes do PO UI juntos; acompanhar
  o tamanho do pacote da rota no build.
- **Cores de presença trocadas:** o radar do login usa os mesmos tokens e passa a mostrar
  "jogando" em ciano automaticamente; conferir na tela de login.
- **Dados simulados na `main`:** como no login, até a integração a home mostra dados de exemplo.
