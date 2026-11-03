-- Temporadas de 60 dias, com as mesmas datas para todos (spec 005, CA2 e CA5). Só a data inicial é
-- guardada: as temporadas são calculadas a partir dela, então a seguinte começa sozinha, mesmo se
-- algum agendamento falhar (CA10).
--
-- A Temporada 1 começa no dia em que esta migration for aplicada, no fuso de São Paulo.

create table public.season_config (
  -- Uma linha só.
  id boolean primary key default true check (id),
  first_day date not null
);

comment on table public.season_config is
  'Primeiro dia da Temporada 1 (spec 005). Quem está logado lê; ninguém grava pelo app.';

alter table public.season_config enable row level security;

create policy "quem está logado lê a data das temporadas"
  on public.season_config
  for select
  to authenticated
  using (true);

revoke all on public.season_config from anon, authenticated;
grant select on public.season_config to authenticated;

insert into public.season_config (first_day)
values ((now() at time zone 'America/Sao_Paulo')::date);

-- Temporada de um dia. Antes do primeiro dia, vale a Temporada 1.
create function public.season_at(p_day date)
returns table (season_number integer, starts_on date, ends_on date)
language sql
stable
security invoker
set search_path = ''
as $$
  with progress as (
    select c.first_day, greatest(p_day - c.first_day, 0) / 60 as finished
    from public.season_config c
  )
  select
    p.finished + 1,
    p.first_day + p.finished * 60,
    p.first_day + p.finished * 60 + 59
  from progress p;
$$;

comment on function public.season_at(date) is
  'Número, início e fim da temporada de um dia, com 60 dias cada (spec 005, CA5).';

revoke execute on function public.season_at(date) from public, anon;
grant execute on function public.season_at(date) to authenticated;
