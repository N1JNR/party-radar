-- O fechamento olha só as duas últimas temporadas terminadas (revisão de código da spec 005). Recalcular
-- todas, todo dia, custaria cada vez mais, e quem jogou 0h nunca ganha linha para sair da conta. Duas
-- bastam para se recuperar de um agendamento que falhou: uma temporada dura 60 dias.

create or replace function private.close_seasons(p_now timestamptz default now())
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  today date := (p_now at time zone 'America/Sao_Paulo')::date;
  awarded integer;
begin
  insert into public.season_trophies (user_id, season_number, rank_id, minutes, top_game)
  select a.user_id, s.season_number, public.season_rank(m.minutes), m.minutes, m.top_game
  from public.season_at(today) current_season
  cross join public.season_config c
  cross join lateral generate_series(
    greatest(current_season.season_number - 2, 1),
    current_season.season_number - 1
  ) finished
  cross join lateral public.season_at(c.first_day + (finished - 1) * 60) s
  cross join public.steam_accounts a
  cross join lateral public.season_minutes(a.user_id, s.starts_on, s.ends_on, today) m
  where m.minutes > 0
  on conflict (user_id, season_number) do nothing;
  get diagnostics awarded = row_count;
  return awarded;
end;
$$;
