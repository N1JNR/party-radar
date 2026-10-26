-- Agendamentos da Steam: leitura diária e "jogando agora", sem segredo no banco fora do Vault e sem
-- acesso pela API (spec 003, CA10, CA14).
begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

select results_eq(
  $$ select schedule from cron.job where jobname = 'steam-sync-diario' $$,
  $$ values ('55 2 * * *'::text) $$,
  'leitura diária às 23h55 de São Paulo (02h55 UTC) (CA14)'
);

select results_eq(
  $$ select schedule from cron.job where jobname = 'steam-presence-5min' $$,
  $$ values ('*/5 * * * *'::text) $$,
  '"jogando agora" a cada 5 minutos (CA10)'
);

select is(
  (select count(*)::integer from cron.job
   where jobname in ('steam-sync-diario', 'steam-presence-5min')
     and command !~* '(bearer|eyJ|sb_secret)'),
  2,
  'os agendamentos não trazem chave: ela vem do Vault'
);

select is(
  has_function_privilege('anon', 'private.call_steam_function(text, integer)', 'execute'),
  false,
  'quem não está logado não chama as funções da Steam pelo banco'
);

select is(
  has_function_privilege('authenticated', 'private.call_steam_function(text, integer)', 'execute'),
  false,
  'quem está logado também não'
);

select is(
  has_schema_privilege('authenticated', 'private', 'usage'),
  false,
  'o esquema private fica fora da API'
);

select throws_ok(
  $$ select private.call_steam_function('outra-coisa', 1000) $$,
  'P0001',
  'função desconhecida: outra-coisa',
  'só chama as duas funções da Steam'
);

select is(
  (select proconfig from pg_proc where oid = 'private.call_steam_function(text, integer)'::regprocedure),
  array['search_path=""'],
  'search_path vazio'
);

select * from finish();

rollback;
