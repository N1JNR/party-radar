-- Dias com leitura da Steam (spec 005, CA7 e CA8). O limite de 8 horas por dia precisa saber há quantos
-- dias foi a leitura anterior, e as fotos não dizem isso, porque só guardam os jogos que mudaram:
-- três dias sem jogar, com leitura, são diferentes de três dias sem leitura.
--
-- Só as Edge Functions gravam, com a secret key; cada pessoa lê só os próprios dias (CA17).

create table public.steam_reading_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  primary key (user_id, day)
);

comment on table public.steam_reading_days is
  'Dias com leitura pública da Steam, para o limite diário da temporada (spec 005, CA7).';

alter table public.steam_reading_days enable row level security;

create policy "cada um lê os próprios dias de leitura"
  on public.steam_reading_days
  for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.steam_reading_days from anon, authenticated;
grant select on public.steam_reading_days to authenticated;

-- Os dias de antes desta migration, a partir das fotos existentes.
insert into public.steam_reading_days (user_id, day)
select distinct s.user_id, s.taken_on
from public.steam_playtime_snapshots s;
