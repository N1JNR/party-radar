-- Números do card a partir das fotos diárias: mês, patente, estimativa e fuso (spec 003, CA8,
-- CA9, CA12, CA14, CA16, CA21).
begin;

create extension if not exists pgtap with schema extensions;

select plan(15);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'ana.card@exemplo.test', '{"full_name": "Ana"}'),
  ('00000000-0000-0000-0000-0000000000b2', 'bia.card@exemplo.test', '{"full_name": "Bia"}'),
  ('00000000-0000-0000-0000-0000000000c3', 'caio.card@exemplo.test', '{"full_name": "Caio"}'),
  ('00000000-0000-0000-0000-0000000000d4', 'dani.card@exemplo.test', '{"full_name": "Dani"}');

-- Ana conectou em setembro; Bia em outubro (mês da estimativa); Caio está com a Steam privada;
-- Dani não conectou.
insert into public.steam_accounts
  (user_id, steam_id, persona_name, visibility, current_game, baseline_minutes, connected_at, last_synced_at)
values
  ('00000000-0000-0000-0000-0000000000a1', '76561198000000011', 'ana_steam', 'public', 'ELDEN RING',
   300, '2026-09-20 15:00-03', '2026-10-26 12:00-03'),
  ('00000000-0000-0000-0000-0000000000b2', '76561198000000012', 'bia_steam', 'public', null,
   90, '2026-10-03 15:00-03', '2026-10-26 12:00-03'),
  ('00000000-0000-0000-0000-0000000000c3', '76561198000000013', 'caio_steam', 'private', null,
   null, '2026-10-10 15:00-03', '2026-10-26 12:00-03');

insert into public.steam_playtime_snapshots
  (user_id, app_id, game_name, taken_on, minutes_total, minutes_2weeks)
values
  -- Ana, jogo A: a última foto de setembro é a base de outubro (1400 - 1100 = 300).
  ('00000000-0000-0000-0000-0000000000a1', 1, 'ELDEN RING', '2026-09-20', 1000, 300),
  ('00000000-0000-0000-0000-0000000000a1', 1, 'ELDEN RING', '2026-09-30', 1100, 200),
  ('00000000-0000-0000-0000-0000000000a1', 1, 'ELDEN RING', '2026-10-01', 1150, 150),
  ('00000000-0000-0000-0000-0000000000a1', 1, 'ELDEN RING', '2026-10-26', 1400, 250),
  -- Ana, jogo B: parado, não conta no mês.
  ('00000000-0000-0000-0000-0000000000a1', 2, 'Hades', '2026-09-20', 50, 0),
  ('00000000-0000-0000-0000-0000000000a1', 2, 'Hades', '2026-10-26', 50, 0),
  -- Ana, jogo C: comprado em outubro (240 - 120 + as 2 semanas da primeira foto, 120 = 240).
  ('00000000-0000-0000-0000-0000000000a1', 3, 'CS2', '2026-10-10', 120, 120),
  ('00000000-0000-0000-0000-0000000000a1', 3, 'CS2', '2026-10-26', 240, 60),
  -- Bia: conectou em 03/10, mas a primeira leitura (e as primeiras fotos) só deu certo em 05/10.
  -- Mês: 560 - 500 + 90 = 150. Patente: 90 + 60 = 150, sem somar as 2 semanas duas vezes.
  ('00000000-0000-0000-0000-0000000000b2', 7, 'Celeste', '2026-10-05', 500, 90),
  ('00000000-0000-0000-0000-0000000000b2', 7, 'Celeste', '2026-10-26', 560, 20);

set local role authenticated;

-- Ana, em 26/10 às 12h de São Paulo.
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}', true);

select results_eq(
  $$ select month_minutes, month_games, game_of_month, game_of_month_minutes, estimate
     from public.my_card_stats('2026-10-26 15:00Z') $$,
  $$ values (540, 2, 'ELDEN RING'::text, 300, false) $$,
  'mês: soma o que cada jogo cresceu, conta só os jogos jogados e pega o de mais horas (CA8)'
);

-- 300 (ponto de partida) + 400 (ELDEN RING) + 0 (Hades) + 120 (CS2 cresceu) + 120 (CS2 antes da
-- primeira foto, comprado depois da conexão).
select is(
  (select total_minutes from public.my_card_stats('2026-10-26 15:00Z')),
  940,
  'patente: ponto de partida + o que cada jogo cresceu + o jogo comprado depois da conexão (CA9)'
);

select results_eq(
  $$ select steam_name, visibility, current_game from public.my_card_stats('2026-10-26 15:00Z') $$,
  $$ values ('ana_steam'::text, 'public'::text, 'ELDEN RING'::text) $$,
  'traz o nome na Steam, a visibilidade e o jogo aberto (CA10, CA21)'
);

select is(
  (select month_minutes from public.my_card_stats('2026-11-01 02:00Z')),
  540,
  '31/10 às 23h em São Paulo ainda é outubro'
);

select results_eq(
  $$ select month_minutes, month_games, game_of_month from public.my_card_stats('2026-11-01 04:00Z') $$,
  $$ values (0, 0, null::text) $$,
  '1º/11 à 1h em São Paulo já é novembro: o mês começa do zero (CA12)'
);

-- Em 05/10 só existe a foto de 01/10 no mês (1150 - 1100 = 50); as de 10/10 e 26/10 não contam.
select results_eq(
  $$ select month_minutes, month_games from public.my_card_stats('2026-10-05 15:00Z') $$,
  $$ values (50, 1) $$,
  'fotos depois do dia pedido não contam'
);

select is(
  (select count(*)::integer from public.my_card_stats('2026-10-26 15:00Z')),
  1,
  'uma linha só, com os dados de quem está logado (CA16)'
);

select ok(
  (select month_minutes <= total_minutes from public.my_card_stats('2026-10-26 15:00Z')),
  'as horas do mês nunca passam das horas desde a conexão'
);

-- Bia: conectou no mês, então é estimativa.
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000b2", "role": "authenticated"}', true);

select results_eq(
  $$ select month_minutes, month_games, total_minutes, estimate
     from public.my_card_stats('2026-10-26 15:00Z') $$,
  $$ values (150, 1, 150, true) $$,
  'mês da conexão: soma as últimas 2 semanas e avisa que é estimativa (decisão da spec)'
);

-- Caio: Steam privada, sem fotos.
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000c3", "role": "authenticated"}', true);

select results_eq(
  $$ select month_minutes, month_games, game_of_month, total_minutes, visibility
     from public.my_card_stats('2026-10-26 15:00Z') $$,
  $$ values (0, 0, null::text, 0, 'private'::text) $$,
  'sem fotos: zeros e Steam privada (CA6, CA12)'
);

-- Dani: sem Steam conectada.
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000d4", "role": "authenticated"}', true);

select is(
  (select count(*)::integer from public.my_card_stats('2026-10-26 15:00Z')),
  0,
  'sem Steam conectada: nenhuma linha'
);

reset role;

-- Quem não está logado não chama a função.
set local role anon;

select throws_ok(
  $$ select * from public.my_card_stats() $$,
  '42501',
  null,
  'quem não está logado não lê números de ninguém (CA16)'
);

reset role;

select is(
  (select prosecdef from pg_proc where oid = 'public.my_card_stats(timestamptz)'::regprocedure),
  false,
  'roda com as permissões de quem chama (security invoker)'
);

select is(
  (select proconfig from pg_proc where oid = 'public.my_card_stats(timestamptz)'::regprocedure),
  array['search_path=""'],
  'search_path vazio'
);

select is(
  has_function_privilege('authenticated', 'public.my_card_stats(timestamptz)', 'execute'),
  true,
  'quem está logado chama a função'
);

select * from finish();

rollback;
