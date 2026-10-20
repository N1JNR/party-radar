-- Volta da Steam usada uma vez só (spec 003, revisão 2, CA3). O `steam-connect` grava aqui o
-- `response_nonce` de cada volta que a Steam confirmou; uma volta repetida cai na chave primária e
-- é recusada. Só as Edge Functions leem e gravam, com a secret key.

create table public.steam_openid_nonces (
  -- `response_nonce` assinado pela Steam: horário da resposta seguido de caracteres únicos.
  nonce text primary key check (length(nonce) between 20 and 255),
  used_at timestamptz not null default now()
);

comment on table public.steam_openid_nonces is
  'Voltas da Steam já usadas (CA3). Sem acesso pela API: só as Edge Functions gravam.';

-- Para apagar as antigas (a volta vale 5 minutos; guardamos 10).
create index steam_openid_nonces_used_at on public.steam_openid_nonces (used_at);

alter table public.steam_openid_nonces enable row level security;

revoke all on public.steam_openid_nonces from anon, authenticated;
