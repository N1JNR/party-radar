-- Fotos diárias do tempo de jogo: uma por jogo e dia, e cada um lê só as suas (spec 003, CA14, CA16).
begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'ana.fotos@exemplo.test', '{"full_name": "Ana"}'),
  ('00000000-0000-0000-0000-0000000000b2', 'bia.fotos@exemplo.test', '{"full_name": "Bia"}');

-- Como as Edge Functions, com a secret key (papel com acesso total).
insert into public.steam_playtime_snapshots
  (user_id, app_id, game_name, taken_on, minutes_total, minutes_2weeks) values
  ('00000000-0000-0000-0000-0000000000a1', 1245620, 'ELDEN RING', '2026-10-25', 1200, 300),
  ('00000000-0000-0000-0000-0000000000a1', 1245620, 'ELDEN RING', '2026-10-26', 1260, 330),
  ('00000000-0000-0000-0000-0000000000b2', 730, 'Counter-Strike 2', '2026-10-26', 90, 30);

select throws_ok(
  $$ insert into public.steam_playtime_snapshots (user_id, app_id, game_name, taken_on, minutes_total)
     values ('00000000-0000-0000-0000-0000000000a1', 1245620, 'ELDEN RING', '2026-10-26', 1300) $$,
  '23505',
  null,
  'uma foto por jogo e dia'
);

select throws_ok(
  $$ insert into public.steam_playtime_snapshots (user_id, app_id, game_name, taken_on, minutes_total)
     values ('00000000-0000-0000-0000-0000000000a1', 10, 'X', '2026-10-26', -1) $$,
  '23514',
  null,
  'tempo total não é negativo'
);

select throws_ok(
  $$ insert into public.steam_playtime_snapshots (user_id, app_id, game_name, taken_on, minutes_total)
     values ('00000000-0000-0000-0000-0000000000a1', 0, 'X', '2026-10-26', 1) $$,
  '23514',
  null,
  'o jogo tem um appid válido'
);

select is(
  (select minutes_2weeks from public.steam_playtime_snapshots
   where user_id = '00000000-0000-0000-0000-0000000000b2' and app_id = 730),
  30,
  'guarda as últimas 2 semanas de cada jogo'
);

-- CA16: Ana logada.
select set_config('teste.fotos', (select count(*)::text from public.steam_playtime_snapshots), true);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}', true);

select results_eq(
  $$ select app_id, taken_on, minutes_total from public.steam_playtime_snapshots order by taken_on $$,
  $$ values (1245620, '2026-10-25'::date, 1200), (1245620, '2026-10-26'::date, 1260) $$,
  'cada um lê só as próprias fotos'
);

select throws_ok(
  $$ insert into public.steam_playtime_snapshots (user_id, app_id, game_name, taken_on, minutes_total)
     values ('00000000-0000-0000-0000-0000000000a1', 10, 'X', '2026-10-27', 1) $$,
  '42501',
  null,
  'não grava fotos pela API (só as Edge Functions)'
);

select throws_ok(
  $$ update public.steam_playtime_snapshots set minutes_total = 99999
     where user_id = '00000000-0000-0000-0000-0000000000a1' $$,
  '42501',
  null,
  'não muda o próprio tempo de jogo pela API'
);

reset role;
set local role anon;

select throws_ok(
  $$ select * from public.steam_playtime_snapshots $$,
  '42501',
  null,
  'quem não está logado não lê fotos'
);

reset role;

-- Apagar o usuário apaga as fotos dele.
delete from auth.users where id = '00000000-0000-0000-0000-0000000000b2';

select is(
  (select count(*)::integer from public.steam_playtime_snapshots
   where user_id = '00000000-0000-0000-0000-0000000000b2'),
  0,
  'apagar o usuário apaga as fotos'
);

select is(
  (select count(*)::integer from public.steam_playtime_snapshots),
  current_setting('teste.fotos')::integer - 1,
  'as outras fotos continuam'
);

select * from finish();

rollback;
