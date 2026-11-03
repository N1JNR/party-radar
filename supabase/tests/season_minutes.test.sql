-- Horas da temporada: limite diário, base e entrada no meio (spec 005, CA1, CA3, CA4, CA6 a CA9, CA16, CA17).
begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

update public.season_config set first_day = '2026-11-01';

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000005a1', 'ana.temporada@exemplo.test', '{"full_name": "Ana"}'),
  ('00000000-0000-0000-0000-0000000005b2', 'bia.temporada@exemplo.test', '{"full_name": "Bia"}'),
  ('00000000-0000-0000-0000-0000000005c3', 'caio.temporada@exemplo.test', '{"full_name": "Caio"}'),
  ('00000000-0000-0000-0000-0000000005d4', 'duda.temporada@exemplo.test', '{"full_name": "Duda"}'),
  ('00000000-0000-0000-0000-0000000005e5', 'edu.temporada@exemplo.test', '{"full_name": "Edu"}');

insert into public.steam_accounts (user_id, steam_id, visibility, baseline_minutes, connected_at) values
  ('00000000-0000-0000-0000-0000000005a1', '76561198000000051', 'public', 0, '2026-09-01 12:00-03'),
  ('00000000-0000-0000-0000-0000000005b2', '76561198000000052', 'public', 0, '2026-09-01 12:00-03'),
  ('00000000-0000-0000-0000-0000000005c3', '76561198000000053', 'public', 0, '2026-09-01 12:00-03'),
  ('00000000-0000-0000-0000-0000000005d4', '76561198000000054', 'public', 90, '2026-11-20 12:00-03');

-- Ana: 1000 min antes da temporada; 60 min no dia 2; 700 min no dia 3, que passam do limite.
-- Um jogo novo no dia 3 soma 30 min nas "últimas 2 semanas" dele.
insert into public.steam_playtime_snapshots
  (user_id, app_id, game_name, taken_on, minutes_total, minutes_2weeks)
values
  ('00000000-0000-0000-0000-0000000005a1', 730, 'Counter-Strike 2', '2026-10-20', 1000, 500),
  ('00000000-0000-0000-0000-0000000005a1', 730, 'Counter-Strike 2', '2026-11-02', 1060, 60),
  ('00000000-0000-0000-0000-0000000005a1', 730, 'Counter-Strike 2', '2026-11-03', 1760, 700),
  ('00000000-0000-0000-0000-0000000005a1', 570, 'Dota 2', '2026-11-03', 30, 30),
  -- Bia: três dias sem leitura e 1200 min: valem até 3 × 480.
  ('00000000-0000-0000-0000-0000000005b2', 730, 'Counter-Strike 2', '2026-10-20', 100, 0),
  ('00000000-0000-0000-0000-0000000005b2', 730, 'Counter-Strike 2', '2026-11-05', 1300, 1200),
  -- Caio: leu todo dia sem jogar e jogou 1200 min num dia só: vale 480.
  ('00000000-0000-0000-0000-0000000005c3', 730, 'Counter-Strike 2', '2026-10-20', 100, 0),
  ('00000000-0000-0000-0000-0000000005c3', 730, 'Counter-Strike 2', '2026-11-05', 1300, 1200),
  -- Duda: conectou no meio da temporada, com muitas horas de antes; depois jogou 50 min.
  ('00000000-0000-0000-0000-0000000005d4', 730, 'Counter-Strike 2', '2026-11-20', 9000, 300),
  ('00000000-0000-0000-0000-0000000005d4', 730, 'Counter-Strike 2', '2026-11-21', 9050, 350);

insert into public.steam_reading_days (user_id, day) values
  ('00000000-0000-0000-0000-0000000005a1', '2026-10-20'),
  ('00000000-0000-0000-0000-0000000005a1', '2026-11-02'),
  ('00000000-0000-0000-0000-0000000005a1', '2026-11-03'),
  ('00000000-0000-0000-0000-0000000005b2', '2026-11-02'),
  ('00000000-0000-0000-0000-0000000005b2', '2026-11-05'),
  ('00000000-0000-0000-0000-0000000005c3', '2026-11-03'),
  ('00000000-0000-0000-0000-0000000005c3', '2026-11-04'),
  ('00000000-0000-0000-0000-0000000005c3', '2026-11-05'),
  ('00000000-0000-0000-0000-0000000005d4', '2026-11-20'),
  ('00000000-0000-0000-0000-0000000005d4', '2026-11-21');

-- Como dona das tabelas, para as contas de cada pessoa.
select is(
  (select minutes from public.season_minutes('00000000-0000-0000-0000-0000000005a1', '2026-11-01', '2026-12-30', '2026-11-02')),
  60,
  'só o tempo de dentro da temporada conta (CA3)'
);

select is(
  (select minutes from public.season_minutes('00000000-0000-0000-0000-0000000005a1', '2026-11-01', '2026-12-30', '2026-11-03')),
  540,
  'um dia acima do limite vale 8 horas, com jogo novo no mesmo dia (CA6)'
);

select is(
  (select top_game from public.season_minutes('00000000-0000-0000-0000-0000000005a1', '2026-11-01', '2026-12-30', '2026-11-03')),
  'Counter-Strike 2',
  'o jogo principal é o mais jogado na temporada (CA13)'
);

select is(
  (select minutes from public.season_minutes('00000000-0000-0000-0000-0000000005b2', '2026-11-01', '2026-12-30', '2026-11-05')),
  1200,
  'dias sem leitura somam o limite de cada dia, e 1200 min cabem em 3 dias (CA7)'
);

select is(
  (select minutes from public.season_minutes('00000000-0000-0000-0000-0000000005c3', '2026-11-01', '2026-12-30', '2026-11-05')),
  480,
  'com leitura todo dia, 1200 min num dia só valem 8 horas (CA6)'
);

select is(
  (select minutes from public.season_minutes('00000000-0000-0000-0000-0000000005d4', '2026-11-01', '2026-12-30', '2026-11-21')),
  50,
  'quem conecta no meio entra do zero: a primeira foto não conta (CA9)'
);

select is(
  (select minutes from public.season_minutes('00000000-0000-0000-0000-0000000005a1', '2027-01-01', '2027-03-01', '2027-01-02')),
  0,
  'a temporada seguinte começa do zero, mesmo com muitas horas (CA2)'
);

select is(
  (select minutes from public.season_minutes('00000000-0000-0000-0000-0000000005b2', '2026-11-05', '2027-01-03', '2026-11-05')),
  480,
  'a volta depois de um intervalo respeita o início da temporada (CA8)'
);

select is(public.season_rank(4 * 60 + 59), 'npc', 'abaixo de 5h é NPC (CA4)');
select is(public.season_rank(5 * 60), 'recruta', '5h é Recruta (CA4)');
select is(public.season_rank(15 * 60), 'soldado', '15h é Soldado (CA4)');
select is(public.season_rank(40 * 60), 'veterano', '40h é Veterano (CA4)');
select is(public.season_rank(120 * 60), 'lenda', '120h é Lenda (CA4)');
select is(public.season_rank(200 * 60), 'sem-vida-social', '200h é Sem vida social (CA4)');

-- Como Ana logada.
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000005a1", "role": "authenticated"}', true);
set local role authenticated;

select results_eq(
  $$ select season_number, days_left, minutes, top_game from public.my_season('2026-11-03 15:00Z') $$,
  $$ values (1, 57, 540, 'Counter-Strike 2'::text) $$,
  'minha temporada: número, dias restantes, minutos e jogo principal (CA1)'
);

select is(
  (select minutes from public.season_minutes('00000000-0000-0000-0000-0000000005b2', '2026-11-01', '2026-12-30', '2026-11-05')),
  0,
  'ninguém lê as horas de outra pessoa (CA17)'
);

reset role;

-- Edu não conectou a Steam.
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000005e5", "role": "authenticated"}', true);
set local role authenticated;

select is_empty(
  $$ select * from public.my_season('2026-11-03 15:00Z') $$,
  'sem Steam conectada, não há temporada (CA16)'
);

reset role;

select * from finish();

rollback;
