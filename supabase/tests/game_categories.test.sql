-- Tipos de jogo do radar: lista inicial, valores válidos e escrita só pelo servidor (spec 004, CA6, CA8, CA25).
begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

select is(
  (select category from public.game_categories where app_id = 1808500),
  'tiro',
  'ARC Raiders é tiro: a lista corrige o "Ação" genérico da loja (CA6)'
);

select is(
  (select category from public.game_categories where app_id = 3405690),
  'esporte',
  'EA SPORTS FC 26 é esporte'
);

select is(
  (select source from public.game_categories where app_id = 730),
  'curada',
  'a lista inicial é curada'
);

-- Como as Edge Functions, com a secret key.
select lives_ok(
  $$ insert into public.game_categories (app_id, category, source) values (99999901, 'outros', 'loja') $$,
  'jogo sem tipo na loja fica em "Outros", para não consultar de novo (CA7, CA8)'
);

select throws_ok(
  $$ insert into public.game_categories (app_id, category) values (99999902, 'fps') $$,
  '23514',
  null,
  'só valem os tipos do radar'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}', true);

select ok(
  (select count(*) > 0 from public.game_categories),
  'quem está logado lê a lista'
);

select throws_ok(
  $$ update public.game_categories set category = 'rpg' where app_id = 730 $$,
  '42501',
  null,
  'ninguém muda o tipo de um jogo pela API (CA25)'
);

reset role;
set local role anon;

select throws_ok(
  $$ select * from public.game_categories $$,
  '42501',
  null,
  'quem não está logado não lê'
);

reset role;

select * from finish();

rollback;
