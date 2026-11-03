-- Horas da temporada e patente (spec 005, CA1, CA3, CA4, CA6 a CA9, CA16 e CA17).
--
-- season_minutes é security invoker: o RLS vale, então pedir os dados de outra pessoa devolve zero. A
-- tarefa agendada dos troféus roda como dona das tabelas e lê todos, sem security definer.
--
-- Para cada dia da temporada:
-- 1. o tempo do dia é o que cada jogo cresceu desde a foto anterior dele; fotos de antes da temporada
--    servem só de base (CA3);
-- 2. a primeira foto da conta conta zero (CA3 e CA9); um jogo que apareceu depois conta as "últimas 2
--    semanas" da primeira foto dele, como em my_card_stats;
-- 3. o dia vale no máximo 8 horas por dia passado desde a leitura anterior, a partir do início da
--    temporada (CA6, CA7 e CA8).

create function public.season_minutes(
  p_user_id uuid,
  p_starts_on date,
  p_ends_on date,
  p_today date
)
returns table (minutes integer, top_game text)
language sql
stable
security invoker
set search_path = ''
as $$
  with snapshots as (
    select
      s.app_id,
      s.game_name,
      s.taken_on,
      s.minutes_total,
      s.minutes_2weeks,
      lag(s.minutes_total) over (partition by s.app_id order by s.taken_on) as previous,
      min(s.taken_on) over () as account_first_day
    from public.steam_playtime_snapshots s
    where s.user_id = p_user_id
      and s.taken_on <= least(p_ends_on, p_today)
  ),
  game_days as (
    select
      s.app_id,
      s.taken_on,
      case
        when s.previous is not null then greatest(s.minutes_total - s.previous, 0)
        when s.taken_on = s.account_first_day then 0
        else least(s.minutes_2weeks, s.minutes_total)
      end as played
    from snapshots s
    where s.taken_on >= p_starts_on
  ),
  days as (
    select g.taken_on, sum(g.played) as played
    from game_days g
    group by g.taken_on
  ),
  readings as (
    select r.day, lag(r.day) over (order by r.day) as previous_day
    from public.steam_reading_days r
    where r.user_id = p_user_id
  ),
  counted as (
    select
      least(
        d.played,
        480 * greatest(
          1,
          d.taken_on - greatest(coalesce(r.previous_day, d.taken_on - 1), p_starts_on - 1)
        )
      ) as played
    from days d
    left join readings r on r.day = d.taken_on
  ),
  best as (
    select g.app_id
    from game_days g
    group by g.app_id
    having sum(g.played) > 0
    order by sum(g.played) desc, g.app_id
    limit 1
  )
  select
    coalesce((select sum(c.played) from counted c), 0)::integer,
    (
      select s.game_name
      from snapshots s
      join best b on b.app_id = s.app_id
      order by s.taken_on desc
      limit 1
    );
$$;

comment on function public.season_minutes(uuid, date, date, date) is
  'Minutos de uma pessoa numa temporada, com o limite de 8 horas por dia (spec 005). Respeita o RLS.';

revoke execute on function public.season_minutes(uuid, date, date, date) from public, anon;
grant execute on function public.season_minutes(uuid, date, date, date) to authenticated;

-- Metas da spec 005. A mesma tabela está em PATENTES, no front: os testes dos dois lados a conferem.
create function public.season_rank(p_minutes integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_minutes >= 200 * 60 then 'sem-vida-social'
    when p_minutes >= 120 * 60 then 'lenda'
    when p_minutes >= 40 * 60 then 'veterano'
    when p_minutes >= 15 * 60 then 'soldado'
    when p_minutes >= 5 * 60 then 'recruta'
    else 'npc'
  end;
$$;

comment on function public.season_rank(integer) is
  'Patente pelos minutos da temporada (spec 005, CA4).';

revoke execute on function public.season_rank(integer) from public, anon;
grant execute on function public.season_rank(integer) to authenticated;

-- A temporada de quem está logado. Sem Steam conectada, não devolve linha (CA16).
create function public.my_season(p_now timestamptz default now())
returns table (
  season_number integer,
  starts_on date,
  ends_on date,
  days_left integer,
  minutes integer,
  top_game text
)
language sql
stable
security invoker
set search_path = ''
as $$
  with today as (
    select (p_now at time zone 'America/Sao_Paulo')::date as day
  )
  select
    s.season_number,
    s.starts_on,
    s.ends_on,
    s.ends_on - t.day,
    m.minutes,
    m.top_game
  from public.steam_accounts a
  cross join today t
  cross join lateral public.season_at(t.day) s
  cross join lateral public.season_minutes(a.user_id, s.starts_on, s.ends_on, t.day) m
  where a.user_id = (select auth.uid());
$$;

comment on function public.my_season(timestamptz) is
  'Temporada, dias restantes, minutos e jogo principal de quem está logado (spec 005, CA1).';

revoke execute on function public.my_season(timestamptz) from public, anon;
grant execute on function public.my_season(timestamptz) to authenticated;
