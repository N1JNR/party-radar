-- Jogos de quem está logado: tipo, total, mês e mês anterior (spec 004, CA6, CA8, CA9, CA11, CA25).
begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'ana.jogos@exemplo.test', '{"full_name": "Ana"}'),
  ('00000000-0000-0000-0000-0000000000b2', 'bia.jogos@exemplo.test', '{"full_name": "Bia"}'),
  ('00000000-0000-0000-0000-0000000000c3', 'caio.jogos@exemplo.test', '{"full_name": "Caio"}');

-- Ana conectou em setembro; Bia, em outubro (o mês anterior dela é estimativa).
insert into public.steam_accounts (user_id, steam_id, visibility, baseline_minutes, connected_at) values
  ('00000000-0000-0000-0000-0000000000a1', '76561198000000021', 'public', 300, '2026-09-20 15:00-03'),
  ('00000000-0000-0000-0000-0000000000b2', '76561198000000022', 'public', 90, '2026-10-05 15:00-03'),
  -- Caio conectou no fim de setembro, mas a primeira leitura só veio em outubro.
  ('00000000-0000-0000-0000-0000000000c3', '76561198000000023', 'public', 90, '2026-09-30 23:50-03');

insert into public.steam_playtime_snapshots
  (user_id, app_id, game_name, taken_on, minutes_total, minutes_2weeks)
values
  -- Ana, tiro (lista curada): setembro fecha em 1100, outubro em 1400, novembro vai a 1460.
  ('00000000-0000-0000-0000-0000000000a1', 1808500, 'ARC Raiders', '2026-09-20', 1000, 300),
  ('00000000-0000-0000-0000-0000000000a1', 1808500, 'ARC Raiders', '2026-09-30', 1100, 200),
  ('00000000-0000-0000-0000-0000000000a1', 1808500, 'ARC Raiders', '2026-10-31', 1400, 100),
  ('00000000-0000-0000-0000-0000000000a1', 1808500, 'ARC Raiders', '2026-11-03', 1460, 90),
  -- Ana, jogo fora da lista: conta em "Outros" (CA8).
  ('00000000-0000-0000-0000-0000000000a1', 99999903, 'Jogo Novo', '2026-10-10', 50, 50),
  -- Ana, nunca jogado: não entra (CA9).
  ('00000000-0000-0000-0000-0000000000a1', 99999904, 'Nunca Abri', '2026-09-20', 0, 0),
  -- Caio: primeira foto em outubro, um dia depois da conexão.
  ('00000000-0000-0000-0000-0000000000c3', 730, 'Counter-Strike 2', '2026-10-01', 500, 90),
  ('00000000-0000-0000-0000-0000000000c3', 730, 'Counter-Strike 2', '2026-10-31', 560, 60),
  -- Bia: primeira foto em outubro.
  ('00000000-0000-0000-0000-0000000000b2', 730, 'Counter-Strike 2', '2026-10-05', 500, 90),
  ('00000000-0000-0000-0000-0000000000b2', 730, 'Counter-Strike 2', '2026-10-30', 560, 20);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}', true);

select results_eq(
  $$ select app_id, game_name, category, total_minutes from public.my_games('2026-11-03 15:00Z') $$,
  $$ values (1808500, 'ARC Raiders'::text, 'tiro'::text, 1460), (99999903, 'Jogo Novo'::text, 'outros'::text, 50) $$,
  'jogos com tempo jogado, do mais jogado ao menos, com o tipo; sem tipo vira "Outros" (CA6, CA8, CA9)'
);

select is(
  (select month_minutes from public.my_games('2026-11-03 15:00Z') where app_id = 1808500),
  60,
  'mês atual: desde a última foto de outubro'
);

select is(
  (select previous_month_minutes from public.my_games('2026-11-03 15:00Z') where app_id = 1808500),
  300,
  'mês anterior: da última foto de setembro à última de outubro (CA11)'
);

select is(
  (select previous_month_minutes from public.my_games('2026-11-03 15:00Z') where app_id = 99999903),
  50,
  'jogo novo no mês anterior: conta as 2 semanas da primeira foto'
);

select is(
  (select month_minutes from public.my_games('2026-11-03 15:00Z') where app_id = 99999903),
  0,
  'jogo parado não conta no mês atual'
);

select is(
  (select bool_or(previous_is_estimate) from public.my_games('2026-11-03 15:00Z')),
  false,
  'mês anterior de quem conectou antes não é estimativa'
);

select is(
  (select count(*)::integer from public.my_games('2026-11-03 15:00Z') where game_name = 'Counter-Strike 2'),
  0,
  'não vê os jogos de outra pessoa (CA25)'
);

-- Bia: o mês anterior é o da conexão.
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000b2", "role": "authenticated"}', true);

select results_eq(
  $$ select previous_month_minutes, previous_is_estimate from public.my_games('2026-11-03 15:00Z') $$,
  $$ values (150, true) $$,
  'mês anterior da conexão: soma as 2 semanas e avisa que é estimativa (CA11)'
);

-- Caio: conectou em setembro, mas outubro também parte das 2 semanas.
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000c3", "role": "authenticated"}', true);

select results_eq(
  $$ select previous_month_minutes, previous_is_estimate from public.my_games('2026-11-03 15:00Z') $$,
  $$ values (150, true) $$,
  'primeira leitura no mês anterior é estimativa, mesmo com a conexão antes dele (CA11)'
);

reset role;
set local role anon;

select throws_ok(
  $$ select * from public.my_games() $$,
  '42501',
  null,
  'quem não está logado não lê jogos'
);

reset role;

select * from finish();

rollback;
