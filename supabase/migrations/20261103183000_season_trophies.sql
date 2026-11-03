-- Troféus de temporada (spec 005, CA10, CA11, CA12 e CA17). A patente fica gravada, então mudar as metas
-- depois não altera troféus antigos. Cada pessoa lê os próprios; ninguém grava pelo app.

create table public.season_trophies (
  user_id uuid not null references auth.users (id) on delete cascade,
  season_number integer not null check (season_number > 0),
  rank_id text not null check (
    rank_id in ('npc', 'recruta', 'soldado', 'veterano', 'lenda', 'sem-vida-social')
  ),
  minutes integer not null check (minutes > 0),
  top_game text,
  awarded_at timestamptz not null default now(),
  primary key (user_id, season_number)
);

comment on table public.season_trophies is
  'Patente final de cada temporada (spec 005, CA10). Cada um lê os seus; só a tarefa agendada grava.';

alter table public.season_trophies enable row level security;

create policy "cada um lê os próprios troféus"
  on public.season_trophies
  for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.season_trophies from anon, authenticated;
grant select on public.season_trophies to authenticated;

-- Fecha toda temporada terminada que ainda não tem troféu. Rodar de novo não duplica, então ela se
-- recupera sozinha de um dia em que o agendamento falhou. Quem jogou 0h não ganha troféu (CA11).
create function private.close_seasons(p_now timestamptz default now())
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
  cross join lateral generate_series(1, current_season.season_number - 1) finished
  cross join lateral public.season_at(c.first_day + (finished - 1) * 60) s
  cross join public.steam_accounts a
  cross join lateral public.season_minutes(a.user_id, s.starts_on, s.ends_on, today) m
  where m.minutes > 0
  on conflict (user_id, season_number) do nothing;
  get diagnostics awarded = row_count;
  return awarded;
end;
$$;

comment on function private.close_seasons(timestamptz) is
  'Transforma a patente final de cada temporada terminada em troféu (spec 005, CA10).';

revoke execute on function private.close_seasons(timestamptz) from public, anon, authenticated;

-- Às 00h30 de São Paulo (03h30 UTC), depois da leitura das 23h55. O mesmo nome substitui o agendamento.
select cron.schedule(
  'season-close-diario',
  '30 3 * * *',
  $$ select private.close_seasons() $$
);
