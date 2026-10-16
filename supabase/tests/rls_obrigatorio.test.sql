-- Regra do AGENTS.md: toda tabela nova nasce com RLS ativado.
-- Este teste falha se qualquer tabela do schema public estiver sem RLS e lista quais são.
begin;

create extension if not exists pgtap with schema extensions;

select plan(1);

select is(
  (
    select coalesce(array_agg(c.relname::text order by c.relname), '{}')
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p') -- tabelas comuns e particionadas
      and not c.relrowsecurity
  ),
  '{}'::text[],
  'toda tabela do schema public tem RLS ativado'
);

select * from finish();

rollback;
