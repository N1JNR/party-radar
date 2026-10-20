-- Intervalo mínimo entre leituras da Steam pedidas pelo app (spec 003, revisão 2, CA20). O
-- `steam-sync` só lê a Steam se a última tentativa (com sucesso ou não) tiver mais de 30 segundos,
-- para ninguém gastar a cota da chave chamando a função sem parar.

alter table public.steam_accounts
  add column sync_attempted_at timestamptz;

comment on column public.steam_accounts.sync_attempted_at is
  'Última vez que o steam-sync tentou ler a Steam (CA20). Gravado só pelas Edge Functions.';
