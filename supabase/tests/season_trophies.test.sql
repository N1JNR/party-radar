-- Troféus de temporada (spec 005, CA10, CA11, CA12 e CA17).
begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

update public.season_config set first_day = '2026-09-01';

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000006a1', 'ana.trofeu@exemplo.test', '{"full_name": "Ana"}'),
  ('00000000-0000-0000-0000-0000000006b2', 'bia.trofeu@exemplo.test', '{"full_name": "Bia"}');

insert into public.steam_accounts (user_id, steam_id, visibility, baseline_minutes, connected_at) values
  ('00000000-0000-0000-0000-0000000006a1', '76561198000000061', 'public', 0, '2026-08-01 12:00-03'),
  ('00000000-0000-0000-0000-0000000006b2', '76561198000000062', 'public', 0, '2026-08-01 12:00-03');

-- Ana jogou 360 min na Temporada 1 (1/9 a 30/10). Bia ficou parada nela.
insert into public.steam_playtime_snapshots
  (user_id, app_id, game_name, taken_on, minutes_total, minutes_2weeks)
values
  ('00000000-0000-0000-0000-0000000006a1', 730, 'Counter-Strike 2', '2026-08-20', 100, 0),
  ('00000000-0000-0000-0000-0000000006a1', 730, 'Counter-Strike 2', '2026-09-10', 460, 360),
  ('00000000-0000-0000-0000-0000000006b2', 730, 'Counter-Strike 2', '2026-08-20', 100, 0);

insert into public.steam_reading_days (user_id, day) values
  ('00000000-0000-0000-0000-0000000006a1', '2026-08-20'),
  ('00000000-0000-0000-0000-0000000006a1', '2026-09-10'),
  ('00000000-0000-0000-0000-0000000006b2', '2026-08-20');

select is(private.close_seasons('2026-10-20 15:00Z'), 0, 'temporada em andamento não vira troféu');

select is(private.close_seasons('2026-10-31 15:00Z'), 1, 'temporada terminada vira troféu (CA10)');

select results_eq(
  $$ select season_number, rank_id, minutes, top_game from public.season_trophies
     where user_id = '00000000-0000-0000-0000-0000000006a1' $$,
  $$ values (1, 'recruta'::text, 360, 'Counter-Strike 2'::text) $$,
  'o troféu guarda a patente final, as horas e o jogo principal (CA10)'
);

select is(
  (select count(*)::integer from public.season_trophies
   where user_id = '00000000-0000-0000-0000-0000000006b2'),
  0,
  'quem não jogou na temporada não ganha troféu (CA11)'
);

select is(private.close_seasons('2026-11-01 15:00Z'), 0, 'rodar de novo não duplica');

select is(
  (select count(*)::integer from cron.job where jobname = 'season-close-diario'),
  1,
  'o fechamento está agendado (CA10)'
);

select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000006b2", "role": "authenticated"}', true);
set local role authenticated;

select is(
  (select count(*)::integer from public.season_trophies),
  0,
  'ninguém lê os troféus de outra pessoa (CA17)'
);

select throws_ok(
  $$ insert into public.season_trophies (user_id, season_number, rank_id, minutes)
     values ('00000000-0000-0000-0000-0000000006b2', 1, 'lenda', 100) $$,
  '42501',
  null,
  'ninguém ganha troféu pelo app (CA17)'
);

select throws_ok(
  $$ select private.close_seasons() $$,
  '42501',
  null,
  'ninguém fecha temporada pelo app (CA17)'
);

reset role;

select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000006a1", "role": "authenticated"}', true);
set local role authenticated;

select is(
  (select count(*)::integer from public.season_trophies),
  1,
  'cada um lê os próprios troféus (CA12)'
);

reset role;

select * from finish();

rollback;
