-- Conta Steam ligada ao perfil (spec 003, CA4 e CA16). Só as Edge Functions gravam, com a secret
-- key, depois de conferir com a Steam qual conta foi conectada; o app só lê a própria linha.

create table public.steam_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- SteamID64: identificador público da conta. Uma conta Steam fica ligada a um perfil só (CA4).
  steam_id text not null unique check (steam_id ~ '^[0-9]{17}$'),
  persona_name text,
  -- Perfil e detalhes de jogos: 'public', 'private' ou nulo antes da primeira leitura (CA6).
  visibility text check (visibility in ('public', 'private')),
  -- Jogo aberto agora (preenchido na Parte 3b).
  current_game text,
  -- "Últimas 2 semanas" lidas na conexão: ponto de partida do primeiro mês (decisão da spec).
  baseline_minutes integer check (baseline_minutes >= 0),
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz
);

comment on table public.steam_accounts is
  'Conta Steam de cada perfil. Cada pessoa lê só a sua (CA16); gravação só pelas Edge Functions.';

alter table public.steam_accounts enable row level security;

create policy "cada um lê a própria conta Steam"
  on public.steam_accounts
  for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.steam_accounts from anon, authenticated;
grant select on public.steam_accounts to authenticated;
