# NNN — Plano técnico

## Abordagem

Como a spec será implementada, em poucas frases.

## Arquivos afetados

| Arquivo                    | Mudança         |
| -------------------------- | --------------- |
| `src/app/features/.../...` | novo / alterado |

## Dados

- Migrations: `supabase/migrations/AAAAMMDDHHMM_nome.sql`
- Tabelas e colunas novas:
- Policies de RLS (quem lê, quem escreve):

## Integrações externas

APIs chamadas (Discord, Steam...), limites e o que acontece quando falham.

## Estratégia de testes

| Critério de aceite | Tipo de teste     | Onde                        |
| ------------------ | ----------------- | --------------------------- |
| CA1                | unitário (domain) | `.../domain/x.spec.ts`      |
| CA2                | componente        | `.../pages/y.spec.ts`       |
| CA3                | RLS               | `supabase/tests/z.test.sql` |

## Riscos

- ...
