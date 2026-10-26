-- Último tempo total gravado de cada jogo de um perfil (spec 003, Parte 3b; revisão de código).
-- A leitura da Steam grava na foto do dia só os jogos cujo tempo mudou desde a última foto: sem
-- isso, a tabela ganharia uma linha por jogo, por pessoa e por dia, quase todas repetidas. As
-- contas de my_card_stats funcionam com fotos esparsas (usam a última foto de cada jogo).
--
-- Só as Edge Functions chamam, com a secret key.

create function public.latest_playtime(p_user_id uuid)
returns table (app_id integer, minutes_total integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select distinct on (s.app_id) s.app_id, s.minutes_total
  from public.steam_playtime_snapshots s
  where s.user_id = p_user_id
  order by s.app_id, s.taken_on desc;
$$;

comment on function public.latest_playtime(uuid) is
  'Último tempo total de cada jogo de um perfil, para gravar só o que mudou (spec 003).';

revoke execute on function public.latest_playtime(uuid) from public, anon, authenticated;
grant execute on function public.latest_playtime(uuid) to service_role;
