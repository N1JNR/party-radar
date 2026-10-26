-- Agendamentos da Steam (spec 003, Parte 3b: CA10 e CA14). O banco chama as Edge Functions sozinho:
-- - steam-sync: leitura diária de todas as contas, às 23h55 de São Paulo (02h55 UTC), para a foto
--   do dia fechar o dia e o mês no fuso do card;
-- - steam-presence: "jogando agora" de todas as contas, a cada 5 minutos.
--
-- Sem segredo nesta migration: o endereço das funções (`project_url`) e a secret key
-- (`service_role_key`) ficam no Vault. No local, `npm run db:agendamentos` grava os dois; na nuvem,
-- entram uma vez pelo painel. Sem eles, o agendamento não chama nada (só avisa no log).

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Esquema fora da API (o PostgREST só expõe `public`): ninguém chama isto pelo app.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create function private.call_steam_function(function_name text, timeout_ms integer)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  base_url text;
  service_key text;
begin
  if function_name not in ('steam-sync', 'steam-presence') then
    raise exception 'função desconhecida: %', function_name;
  end if;
  select decrypted_secret into base_url
    from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into service_key
    from vault.decrypted_secrets where name = 'service_role_key';
  if base_url is null or service_key is null then
    raise notice 'agendamento da Steam sem project_url ou service_role_key no Vault: nada chamado';
    return null;
  end if;
  return net.http_post(
    url := rtrim(base_url, '/') || '/functions/v1/' || function_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := timeout_ms
  );
end;
$$;

comment on function private.call_steam_function(text, integer) is
  'Chama uma Edge Function da Steam com a secret key do Vault (agendamentos da spec 003).';

revoke execute on function private.call_steam_function(text, integer) from public, anon, authenticated;

-- cron.schedule com o mesmo nome substitui o agendamento: rodar de novo não duplica.
select cron.schedule(
  'steam-sync-diario',
  '55 2 * * *',
  $$ select private.call_steam_function('steam-sync', 300000) $$
);

select cron.schedule(
  'steam-presence-5min',
  '*/5 * * * *',
  $$ select private.call_steam_function('steam-presence', 60000) $$
);
