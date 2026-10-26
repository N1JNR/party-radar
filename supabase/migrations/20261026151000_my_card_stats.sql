-- Números do card de quem está logado, a partir da conta Steam e das fotos diárias (spec 003,
-- Parte 3b: CA8, CA9, CA12, CA14, CA21). Mês e dia no fuso de São Paulo (ajustes da Parte 3b).
--
-- Horas do mês, por jogo:
--   - com foto antes do mês começar: o que cresceu desde a última foto do mês anterior;
--   - sem ela (conta ou jogo novo no mês): o que cresceu desde a primeira foto do mês, mais as
--     "últimas 2 semanas" dessa primeira foto (estimativa do que foi jogado antes dela).
-- Horas desde a conexão (patente): o ponto de partida da conta (baseline_minutes) mais o que cada
-- jogo cresceu desde a primeira foto dele.
--
-- security invoker: roda com as permissões de quem chama, então o RLS das duas tabelas vale
-- (cada um só enxerga o seu, CA16). Sem conta Steam, não devolve nenhuma linha.

create function public.my_card_stats(p_now timestamptz default now())
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
    select a.*
    from public.steam_accounts a
    where a.user_id = (select auth.uid())
  ),
  per_game as (
    select
      s.app_id,
      (array_agg(s.game_name order by s.taken_on desc))[1] as game_name,
      (array_agg(s.minutes_total order by s.taken_on desc))[1] as latest,
      (array_agg(s.minutes_total order by s.taken_on))[1] as first_total,
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
      g.latest,
      g.first_total,
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
      + coalesce((select sum(greatest(x.latest - x.first_total, 0)) from games x), 0))::integer,
    (a.connected_at at time zone 'America/Sao_Paulo')::date >= p.month_start
  from account a
  cross join params p;
$$;

comment on function public.my_card_stats(timestamptz) is
  'Números do card de quem está logado: mês e patente a partir das fotos da Steam (CA8, CA9).';

revoke execute on function public.my_card_stats(timestamptz) from public, anon;
grant execute on function public.my_card_stats(timestamptz) to authenticated;
