-- Foto diária do tempo de jogo de cada conta Steam (spec 003, Parte 3b, CA14). As horas do mês e
-- da patente saem da diferença entre as fotos (função my_card_stats). Só as Edge Functions gravam,
-- com a secret key; cada pessoa lê só as próprias fotos (CA16).

create table public.steam_playtime_snapshots (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Jogo na Steam (appid).
  app_id integer not null check (app_id > 0),
  game_name text not null,
  -- Dia da foto, no fuso de São Paulo (ajustes da Parte 3b).
  taken_on date not null,
  -- Tempo total jogado até o dia (`playtime_forever`), em minutos.
  minutes_total integer not null check (minutes_total >= 0),
  -- Tempo das últimas 2 semanas (`playtime_2weeks`), em minutos: estimativa do mês da conexão.
  minutes_2weeks integer not null default 0 check (minutes_2weeks >= 0),
  primary key (user_id, app_id, taken_on)
);

comment on table public.steam_playtime_snapshots is
  'Foto diária do tempo de cada jogo (CA14). Cada um lê a sua (CA16); só as Edge Functions gravam.';

-- Para as contas por pessoa e dia (my_card_stats).
create index steam_playtime_snapshots_user_day
  on public.steam_playtime_snapshots (user_id, taken_on);

alter table public.steam_playtime_snapshots enable row level security;

create policy "cada um lê as próprias fotos de tempo de jogo"
  on public.steam_playtime_snapshots
  for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.steam_playtime_snapshots from anon, authenticated;
grant select on public.steam_playtime_snapshots to authenticated;
