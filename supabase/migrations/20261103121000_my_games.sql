-- Jogos de quem está logado, com tipo e horas, para o radar e os blocos (spec 004, CA9 a CA11). As
-- contas do mês seguem as de my_card_stats (spec 003), no fuso de São Paulo; o mês anterior usa a
-- mesma regra, um mês antes. Só entram jogos com tempo jogado (CA9).
--
-- security invoker: o RLS das fotos vale, e cada um só enxerga as suas (CA25).

create function public.my_games(p_now timestamptz default now())
returns table (
  app_id integer,
  game_name text,
  category text,
  total_minutes integer,
  month_minutes integer,
  previous_month_minutes integer,
  previous_is_estimate boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  with params as (
    select
      (p_now at time zone 'America/Sao_Paulo')::date as today,
      date_trunc('month', p_now at time zone 'America/Sao_Paulo')::date as month_start,
      (date_trunc('month', p_now at time zone 'America/Sao_Paulo') - interval '1 month')::date as previous_start
  ),
  per_game as (
    select
      s.app_id,
      (array_agg(s.game_name order by s.taken_on desc))[1] as game_name,
      (array_agg(s.minutes_total order by s.taken_on desc))[1] as latest,
      -- Última foto antes do mês atual: fim do mês anterior e base do mês atual.
      (array_agg(s.minutes_total order by s.taken_on desc)
        filter (where s.taken_on < p.month_start))[1] as before_month,
      (array_agg(s.minutes_total order by s.taken_on)
        filter (where s.taken_on >= p.month_start))[1] as first_month_total,
      (array_agg(s.minutes_2weeks order by s.taken_on)
        filter (where s.taken_on >= p.month_start))[1] as first_month_2weeks,
      -- Última foto antes do mês anterior: base do mês anterior.
      (array_agg(s.minutes_total order by s.taken_on desc)
        filter (where s.taken_on < p.previous_start))[1] as before_previous,
      (array_agg(s.minutes_total order by s.taken_on)
        filter (where s.taken_on >= p.previous_start and s.taken_on < p.month_start))[1] as first_previous_total,
      (array_agg(s.minutes_2weeks order by s.taken_on)
        filter (where s.taken_on >= p.previous_start and s.taken_on < p.month_start))[1] as first_previous_2weeks
    from public.steam_playtime_snapshots s
    cross join params p
    where s.user_id = (select auth.uid())
      and s.taken_on <= p.today
    group by s.app_id
  )
  select
    g.app_id,
    g.game_name,
    coalesce(c.category, 'outros'),
    g.latest,
    case
      when g.before_month is not null then greatest(g.latest - g.before_month, 0)
      when g.first_month_total is not null then
        greatest(g.latest - g.first_month_total, 0)
          + least(g.first_month_2weeks, g.first_month_total)
      else 0
    end,
    case
      when g.before_month is null then 0
      when g.before_previous is not null then greatest(g.before_month - g.before_previous, 0)
      when g.first_previous_total is not null then
        greatest(g.before_month - g.first_previous_total, 0)
          + least(g.first_previous_2weeks, g.first_previous_total)
      else 0
    end,
    coalesce(
      (select (a.connected_at at time zone 'America/Sao_Paulo')::date >= p.previous_start
          and (a.connected_at at time zone 'America/Sao_Paulo')::date < p.month_start
       from public.steam_accounts a
       where a.user_id = (select auth.uid())),
      false
    )
  from per_game g
  cross join params p
  left join public.game_categories c on c.app_id = g.app_id
  where g.latest > 0
  order by g.latest desc, g.game_name;
$$;

comment on function public.my_games(timestamptz) is
  'Jogos de quem está logado, com tipo, total, mês e mês anterior (spec 004).';

revoke execute on function public.my_games(timestamptz) from public, anon;
grant execute on function public.my_games(timestamptz) to authenticated;
