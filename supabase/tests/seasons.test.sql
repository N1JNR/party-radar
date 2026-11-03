-- Temporadas: datas e virada (spec 005, CA2 e CA5).
begin;

create extension if not exists pgtap with schema extensions;

select plan(7);

update public.season_config set first_day = '2026-11-10';

select results_eq(
  $$ select * from public.season_at('2026-11-10') $$,
  $$ values (1, '2026-11-10'::date, '2027-01-08'::date) $$,
  'o primeiro dia abre a Temporada 1, com 60 dias'
);

select results_eq(
  $$ select season_number from public.season_at('2027-01-08') $$,
  $$ values (1) $$,
  'o último dia ainda é da Temporada 1'
);

select results_eq(
  $$ select * from public.season_at('2027-01-09') $$,
  $$ values (2, '2027-01-09'::date, '2027-03-09'::date) $$,
  'o dia seguinte abre a Temporada 2, sem ação de ninguém (CA10)'
);

select results_eq(
  $$ select * from public.season_at('2026-11-01') $$,
  $$ values (1, '2026-11-10'::date, '2027-01-08'::date) $$,
  'antes do primeiro dia, vale a Temporada 1'
);

select throws_ok(
  $$ insert into public.season_config (id, first_day) values (false, '2026-01-01') $$,
  '23514',
  null,
  'só existe uma linha de configuração'
);

set local role authenticated;

select throws_ok(
  $$ update public.season_config set first_day = '2020-01-01' $$,
  '42501',
  null,
  'ninguém muda a data pelo app (CA17)'
);

reset role;
set local role anon;

select throws_ok(
  $$ select * from public.season_at('2026-11-10') $$,
  '42501',
  null,
  'quem não está logado não lê as temporadas'
);

reset role;

select * from finish();

rollback;
