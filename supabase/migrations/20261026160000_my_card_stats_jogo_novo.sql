-- my_card_stats: a patente passa a contar o que foi jogado num jogo novo antes da primeira foto
-- dele (spec 003, CA9; revisão de código da Parte 3b). Antes, um jogo comprado depois da conexão
-- entrava nas horas do mês com as "últimas 2 semanas" da primeira foto, mas não nas horas desde a
-- conexão, e o mês podia sair maior que o total.
--
-- Horas desde a conexão (patente): o ponto de partida da conta (baseline_minutes, as "últimas 2
-- semanas" de todos os jogos na primeira leitura) + o que cada jogo cresceu desde a primeira foto
-- dele + as "últimas 2 semanas" da primeira foto dos jogos que apareceram depois da primeira foto
-- da conta. A referência é a primeira foto, não o dia da conexão: o ponto de partida é gravado na
-- primeira leitura que deu certo, junto com as primeiras fotos, e ela pode ser depois da conexão.

create or replace function public.my_card_stats(p_now timestamptz default now())
returns table (
  steam_name text,
  visibility text,
  current_game text,
  last_synced_at timestamptz,
  month_minutes integer,
  month_games integer,
  game_of_month text,
  game_of_month_minutes integer,
  total_minutes integer,
  estimate boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  with params as (
    select
      (p_now at time zone 'America/Sao_Paulo')::date as today,
      date_trunc('month', p_now at time zone 'America/Sao_Paulo')::date as month_start
  ),
  account as (
    select a.*, (a.connected_at at time zone 'America/Sao_Paulo')::date as connected_on
    from public.steam_accounts a
    where a.user_id = (select auth.uid())
  ),
  per_game as (
    select
      s.app_id,
      min(s.taken_on) as first_taken_on,
      (array_agg(s.game_name order by s.taken_on desc))[1] as game_name,
      (array_agg(s.minutes_total order by s.taken_on desc))[1] as latest,
      (array_agg(s.minutes_total order by s.taken_on))[1] as first_total,
      (array_agg(s.minutes_2weeks order by s.taken_on))[1] as first_2weeks,
      (array_agg(s.minutes_total order by s.taken_on desc)
        filter (where s.taken_on < p.month_start))[1] as before_month,
      (array_agg(s.minutes_total order by s.taken_on)
        filter (where s.taken_on >= p.month_start))[1] as first_month_total,
      (array_agg(s.minutes_2weeks order by s.taken_on)
        filter (where s.taken_on >= p.month_start))[1] as first_month_2weeks
    from public.steam_playtime_snapshots s
    cross join params p
    where s.user_id = (select auth.uid())
      and s.taken_on <= p.today
    group by s.app_id
  ),
  games as (
    select
      g.game_name,
      greatest(g.latest - g.first_total, 0)
        + case
            -- Jogo que apareceu depois da primeira foto da conta: o que foi jogado antes da
            -- primeira foto dele não está no ponto de partida.
            when g.first_taken_on > (select min(f.first_taken_on) from per_game f)
              then least(g.first_2weeks, g.first_total)
            else 0
          end as since_connection,
      case
        when g.before_month is not null then greatest(g.latest - g.before_month, 0)
        when g.first_month_total is not null then
          greatest(g.latest - g.first_month_total, 0)
            + least(g.first_month_2weeks, g.first_month_total)
        else 0
      end as month_minutes
    from per_game g
  ),
  best as (
    select x.game_name, x.month_minutes
    from games x
    where x.month_minutes > 0
    order by x.month_minutes desc, x.game_name
    limit 1
  )
  select
    a.persona_name,
    a.visibility,
    a.current_game,
    a.last_synced_at,
    coalesce((select sum(x.month_minutes) from games x), 0)::integer,
    (select count(*) from games x where x.month_minutes > 0)::integer,
    (select b.game_name from best b),
    (select b.month_minutes from best b)::integer,
    (coalesce(a.baseline_minutes, 0)
      + coalesce((select sum(x.since_connection) from games x), 0))::integer,
    a.connected_on >= p.month_start
  from account a
  cross join params p;
$$;
