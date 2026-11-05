-- Amigos (spec 006). A amizade é do app e precisa dos dois lados. Nada se grava direto pelo app: as funções
-- abaixo conferem as regras dos dois lados na mesma transação.
--
-- As funções são security definer porque é inevitável: saber que alguém me bloqueou sem ler os bloqueios
-- dessa pessoa (CA4), mexer nos pedidos dos dois lados (CA7, CA8) e mostrar o jogo aberto de um amigo sem
-- expor o SteamID, que está na mesma tabela (CA13, CA20). Todas usam auth.uid() e nunca recebem de fora quem
-- é a pessoa logada.

create table public.friend_requests (
  from_id uuid not null references auth.users (id) on delete cascade,
  to_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Quem recebeu recusou: some para ele, e quem pediu não fica sabendo (CA9).
  declined_at timestamptz,
  primary key (from_id, to_id),
  check (from_id <> to_id)
);

create index friend_requests_to on public.friend_requests (to_id);

comment on table public.friend_requests is
  'Pedidos de amizade (spec 006). A recusa fica fora do grant de leitura, para quem pediu não saber (CA9).';

create table public.friendships (
  user_low uuid not null references auth.users (id) on delete cascade,
  user_high uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_low, user_high),
  -- Uma linha só por amizade, seja quem for o primeiro.
  check (user_low < user_high)
);

create index friendships_high on public.friendships (user_high);

comment on table public.friendships is 'Amizades aceitas (spec 006). Só os dois amigos leem.';

create table public.user_blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index user_blocks_blocked on public.user_blocks (blocked_id);

comment on table public.user_blocks is 'Bloqueios (spec 006). Só quem bloqueou lê: o bloqueado não é avisado.';

alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.user_blocks enable row level security;

create policy "cada lado lê os próprios pedidos"
  on public.friend_requests
  for select
  to authenticated
  using (
    from_id = (select auth.uid())
    or (to_id = (select auth.uid()) and declined_at is null)
  );

create policy "cada amigo lê as próprias amizades"
  on public.friendships
  for select
  to authenticated
  using ((select auth.uid()) in (user_low, user_high));

create policy "cada um lê os próprios bloqueios"
  on public.user_blocks
  for select
  to authenticated
  using (blocker_id = (select auth.uid()));

revoke all on public.friend_requests, public.friendships, public.user_blocks from anon, authenticated;
grant select (from_id, to_id, created_at) on public.friend_requests to authenticated;
grant select on public.friendships, public.user_blocks to authenticated;

-- A relação entre quem está logado e outra pessoa. Só para uso interno das funções abaixo.
create function private.friend_relation(p_me uuid, p_other uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_me = p_other then 'self'
    when exists (
      select 1 from public.user_blocks b where b.blocker_id = p_me and b.blocked_id = p_other
    ) then 'blocked'
    when exists (
      select 1 from public.friendships f
      where f.user_low = least(p_me, p_other) and f.user_high = greatest(p_me, p_other)
    ) then 'friend'
    when exists (
      select 1 from public.friend_requests r where r.from_id = p_me and r.to_id = p_other
    ) then 'sent'
    when exists (
      select 1 from public.friend_requests r
      where r.from_id = p_other and r.to_id = p_me and r.declined_at is null
    ) then 'received'
    else 'none'
  end;
$$;

revoke execute on function private.friend_relation(uuid, uuid) from public, anon, authenticated;

-- Acha pelo @usuário exato (CA3). Quem me bloqueou não aparece, igual a quem não existe (CA4).
create function public.find_player(p_username text)
returns table (
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  relation text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name, p.username, p.avatar_url, private.friend_relation(auth.uid(), p.id)
  from public.profiles p
  where auth.uid() is not null
    and p.username = ltrim(lower(trim(p_username)), '@')
    and not exists (
      select 1 from public.user_blocks b
      where b.blocker_id = p.id and b.blocked_id = auth.uid()
    );
$$;

comment on function public.find_player(text) is
  'Pessoa pelo @usuário exato, com a relação com quem está logado (spec 006, CA3 a CA6).';

-- Pede amizade. Se o outro já pediu, mesmo que eu tenha recusado antes, vira amizade (CA7).
create function public.send_friend_request(p_user uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  relation text;
begin
  if me is null then
    raise exception 'sem sessão' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles p where p.id = p_user) or exists (
    select 1 from public.user_blocks b where b.blocker_id = p_user and b.blocked_id = me
  ) then
    return 'not_found';
  end if;
  relation := private.friend_relation(me, p_user);
  if relation in ('self', 'blocked') then
    return relation;
  end if;
  if relation = 'friend' then
    return 'already_friends';
  end if;
  if relation = 'sent' then
    return 'already_sent';
  end if;
  if exists (select 1 from public.friend_requests r where r.from_id = p_user and r.to_id = me) then
    insert into public.friendships (user_low, user_high)
    values (least(me, p_user), greatest(me, p_user))
    on conflict do nothing;
    delete from public.friend_requests r
    where (r.from_id = p_user and r.to_id = me) or (r.from_id = me and r.to_id = p_user);
    return 'friends';
  end if;
  if (select count(*) from public.friend_requests r where r.from_id = me) >= 20 then
    return 'limit';
  end if;
  insert into public.friend_requests (from_id, to_id) values (me, p_user) on conflict do nothing;
  return 'sent';
end;
$$;

comment on function public.send_friend_request(uuid) is
  'Pede amizade, ou cria a amizade se o outro já pediu (spec 006, CA3 a CA7 e CA11).';

-- Aceita ou recusa um pedido recebido. Devolve false se não havia pedido aberto (CA8, CA9, CA20).
create function public.answer_friend_request(p_from uuid, p_accept boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'sem sessão' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.friend_requests r
    where r.from_id = p_from and r.to_id = me and r.declined_at is null
  ) then
    return false;
  end if;
  if not p_accept then
    update public.friend_requests r
    set declined_at = now()
    where r.from_id = p_from and r.to_id = me;
    return true;
  end if;
  insert into public.friendships (user_low, user_high)
  values (least(me, p_from), greatest(me, p_from))
  on conflict do nothing;
  delete from public.friend_requests r
  where (r.from_id = p_from and r.to_id = me) or (r.from_id = me and r.to_id = p_from);
  return true;
end;
$$;

comment on function public.answer_friend_request(uuid, boolean) is
  'Aceita ou recusa um pedido recebido por quem está logado (spec 006, CA8 e CA9).';

create function public.cancel_friend_request(p_to uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.friend_requests r where r.from_id = auth.uid() and r.to_id = p_to;
$$;

comment on function public.cancel_friend_request(uuid) is
  'Cancela um pedido enviado por quem está logado (spec 006, CA10).';

create function public.remove_friend(p_friend uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.friendships f
  where f.user_low = least(auth.uid(), p_friend)
    and f.user_high = greatest(auth.uid(), p_friend);
$$;

comment on function public.remove_friend(uuid) is
  'Desfaz uma amizade de quem está logado, dos dois lados (spec 006, CA15).';

-- Bloquear apaga a amizade e os pedidos entre os dois (CA16).
create function public.block_user(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'sem sessão' using errcode = '42501';
  end if;
  if me = p_user then
    return;
  end if;
  insert into public.user_blocks (blocker_id, blocked_id) values (me, p_user) on conflict do nothing;
  delete from public.friendships f
  where f.user_low = least(me, p_user) and f.user_high = greatest(me, p_user);
  delete from public.friend_requests r
  where (r.from_id = me and r.to_id = p_user) or (r.from_id = p_user and r.to_id = me);
end;
$$;

comment on function public.block_user(uuid) is
  'Bloqueia uma pessoa, apagando a amizade e os pedidos entre os dois (spec 006, CA16).';

create function public.unblock_user(p_user uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.user_blocks b where b.blocker_id = auth.uid() and b.blocked_id = p_user;
$$;

comment on function public.unblock_user(uuid) is
  'Desbloqueia uma pessoa, sem refazer a amizade (spec 006, CA17).';

-- Amigos com o jogo aberto. Nada de SteamID, horas ou patente (CA13, CA20).
create function public.my_friends()
returns table (
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  current_game text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name, p.username, p.avatar_url, a.current_game
  from public.friendships f
  join public.profiles p
    on p.id = case when f.user_low = auth.uid() then f.user_high else f.user_low end
  left join public.steam_accounts a on a.user_id = p.id
  where auth.uid() in (f.user_low, f.user_high);
$$;

comment on function public.my_friends() is
  'Amigos de quem está logado, com nome, @usuário, foto e jogo aberto (spec 006, CA12 e CA13).';

-- Pedidos abertos. O pedido recusado continua como enviado para quem pediu (CA9).
create function public.my_friend_requests()
returns table (
  direction text,
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select 'sent', p.id, p.display_name, p.username, p.avatar_url, r.created_at
  from public.friend_requests r
  join public.profiles p on p.id = r.to_id
  where r.from_id = auth.uid()
  union all
  select 'received', p.id, p.display_name, p.username, p.avatar_url, r.created_at
  from public.friend_requests r
  join public.profiles p on p.id = r.from_id
  where r.to_id = auth.uid() and r.declined_at is null;
$$;

comment on function public.my_friend_requests() is
  'Pedidos recebidos e enviados de quem está logado, sem dizer se houve recusa (spec 006, CA9 e CA12).';

create function public.my_blocks()
returns table (user_id uuid, display_name text, username text, avatar_url text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name, p.username, p.avatar_url
  from public.user_blocks b
  join public.profiles p on p.id = b.blocked_id
  where b.blocker_id = auth.uid();
$$;

comment on function public.my_blocks() is 'Quem está logado bloqueou estas pessoas (spec 006, CA17).';

revoke execute on function public.find_player(text) from public, anon;
revoke execute on function public.send_friend_request(uuid) from public, anon;
revoke execute on function public.answer_friend_request(uuid, boolean) from public, anon;
revoke execute on function public.cancel_friend_request(uuid) from public, anon;
revoke execute on function public.remove_friend(uuid) from public, anon;
revoke execute on function public.block_user(uuid) from public, anon;
revoke execute on function public.unblock_user(uuid) from public, anon;
revoke execute on function public.my_friends() from public, anon;
revoke execute on function public.my_friend_requests() from public, anon;
revoke execute on function public.my_blocks() from public, anon;

grant execute on function public.find_player(text) to authenticated;
grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.answer_friend_request(uuid, boolean) to authenticated;
grant execute on function public.cancel_friend_request(uuid) to authenticated;
grant execute on function public.remove_friend(uuid) to authenticated;
grant execute on function public.block_user(uuid) to authenticated;
grant execute on function public.unblock_user(uuid) to authenticated;
grant execute on function public.my_friends() to authenticated;
grant execute on function public.my_friend_requests() to authenticated;
grant execute on function public.my_blocks() to authenticated;
