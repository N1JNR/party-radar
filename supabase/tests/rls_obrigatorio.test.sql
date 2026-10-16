-- Regra do AGENTS.md: toda tabela nova nasce com RLS ativado.
-- Estes testes falham se algo no schema public escapar do RLS e listam o que é.
begin;

create extension if not exists pgtap with schema extensions;

select plan(2);

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

-- Uma view comum roda com as permissões de quem a criou e ignora o RLS de quem consulta.
-- Com security_invoker, o RLS das tabelas de origem vale para o usuário logado.
select is(
  (
    select coalesce(array_agg(c.relname::text order by c.relname), '{}')
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'v'
      and not coalesce(c.reloptions @> array['security_invoker=true'], false)
      and not coalesce(c.reloptions @> array['security_invoker=on'], false)
  ),
  '{}'::text[],
  'toda view do schema public usa security_invoker'
);

select * from finish();

rollback;
