-- Bate-papo por texto, entre dois amigos e em squads (spec 007). Nada se grava direto pelo app: as funções abaixo
-- conferem as regras na mesma transação.
--
-- As funções são security definer porque é inevitável: mostrar nome e foto de outros membros com os perfis
-- privados (spec 006) e conferir amizade e bloqueio dos dois lados. Todas usam auth.uid() e nunca recebem de fora
-- quem é a pessoa logada.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('direct', 'squad')),
  name text,
  -- Dono do squad. Fica nulo só se a conta for apagada e não sobrar ninguém para assumir.
  owner_id uuid references auth.users (id) on delete set null,
  direct_low uuid references auth.users (id) on delete cascade,
  direct_high uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  -- Só uma conversa entre duas pessoas (CA1).
  unique (direct_low, direct_high),
  check (
    (kind = 'direct' and name is null and direct_low < direct_high)
    or (
      kind = 'squad'
      and char_length(name) between 1 and 40
      and direct_low is null
      and direct_high is null
    )
  )
);

comment on table public.conversations is
  'Conversas entre dois amigos e squads (spec 007). Só quem participa lê; só as funções gravam.';

create table public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  -- Fora do grant de leitura: ninguém vê quando o outro leu (fora do escopo, CA18).
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index conversation_members_user on public.conversation_members (user_id);

comment on table public.conversation_members is
  'Quem participa de cada conversa (spec 007). A hora de leitura fica fora do que os outros leem.';

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  -- Conta apagada: a mensagem fica, sem autor.
  sender_id uuid references auth.users (id) on delete set null,
  -- Gerado no app: reenviar a mesma mensagem não duplica (CA9).
  client_id uuid not null,
  body text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (conversation_id, sender_id, client_id),
  -- Apagar tira o texto do banco (CA5).
  check (
    (deleted_at is null and char_length(body) between 1 and 2000)
    or (deleted_at is not null and body is null)
  )
);

create index messages_conversation_recent on public.messages (conversation_id, created_at desc, id desc);
create index messages_sender_recent on public.messages (sender_id, created_at desc);

comment on table public.messages is
  'Mensagens de texto (spec 007). Só quem participa lê; não há criptografia de ponta a ponta.';

-- Usada pelas políticas de RLS. Só responde sobre quem está logado.
create function public.is_conversation_member(p_conversation uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversation_members m
    where m.conversation_id = p_conversation and m.user_id = auth.uid()
  );
$$;

comment on function public.is_conversation_member(uuid) is
  'Quem está logado participa desta conversa? Usada pelas políticas de RLS (spec 007, CA23).';

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

create policy "quem participa lê a conversa"
  on public.conversations
  for select
  to authenticated
  using (public.is_conversation_member(id));

create policy "quem participa vê os membros"
  on public.conversation_members
  for select
  to authenticated
  using (public.is_conversation_member(conversation_id));

create policy "quem participa lê as mensagens"
  on public.messages
  for select
  to authenticated
  using (public.is_conversation_member(conversation_id));

revoke all on public.conversations, public.conversation_members, public.messages from anon, authenticated;
grant select on public.conversations, public.messages to authenticated;
grant select (conversation_id, user_id, joined_at) on public.conversation_members to authenticated;

-- O Realtime confere o RLS de quem assina (CA23). O aviso só dispara a releitura no app.
alter publication supabase_realtime add table public.messages;

create function private.are_friends(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.friendships f
    where f.user_low = least(p_a, p_b) and f.user_high = greatest(p_a, p_b)
  );
$$;

revoke execute on function private.are_friends(uuid, uuid) from public, anon, authenticated;

-- Abre ou reaproveita a conversa com um amigo. Quem não é amigo não inicia conversa (CA1, CA2).
create function public.open_direct(p_friend uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  found uuid;
begin
  if me is null then
    raise exception 'sem sessão' using errcode = '42501';
  end if;
  if not private.are_friends(me, p_friend) then
    return null;
  end if;
  insert into public.conversations (kind, direct_low, direct_high)
  values ('direct', least(me, p_friend), greatest(me, p_friend))
  on conflict (direct_low, direct_high) do nothing
  returning id into found;
  if found is null then
    select c.id into found from public.conversations c
    where c.direct_low = least(me, p_friend) and c.direct_high = greatest(me, p_friend);
  end if;
  insert into public.conversation_members (conversation_id, user_id)
  values (found, me), (found, p_friend)
  on conflict do nothing;
  return found;
end;
$$;

comment on function public.open_direct(uuid) is
  'Abre ou reaproveita a conversa com um amigo; nulo se não forem amigos (spec 007, CA1 e CA2).';

-- Devolve o resultado em vez de lançar erro, para a tela explicar cada caso (CA4, CA9, CA10, CA20).
create function public.send_message(p_conversation uuid, p_client_id uuid, p_body text)
returns table (status text, message_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  clean text := btrim(p_body, E' \t\r\n');
  convo public.conversations;
  existing uuid;
  created uuid;
begin
  if me is null then
    raise exception 'sem sessão' using errcode = '42501';
  end if;
  if not public.is_conversation_member(p_conversation) then
    return query select 'not_member'::text, null::uuid;
    return;
  end if;
  if clean is null or char_length(clean) not between 1 and 2000 then
    return query select 'invalid'::text, null::uuid;
    return;
  end if;
  select * into convo from public.conversations c where c.id = p_conversation;
  if convo.kind = 'direct' and not private.are_friends(convo.direct_low, convo.direct_high) then
    return query select 'read_only'::text, null::uuid;
    return;
  end if;
  select m.id into existing from public.messages m
  where m.conversation_id = p_conversation and m.sender_id = me and m.client_id = p_client_id;
  if existing is not null then
    return query select 'sent'::text, existing;
    return;
  end if;
  if (
    select count(*) from public.messages m
    where m.sender_id = me and m.created_at > now() - interval '10 seconds'
  ) >= 20 then
    return query select 'rate_limited'::text, null::uuid;
    return;
  end if;
  insert into public.messages (conversation_id, sender_id, client_id, body)
  values (p_conversation, me, p_client_id, clean)
  on conflict (conversation_id, sender_id, client_id) do nothing
  returning id into created;
  if created is null then
    select m.id into created from public.messages m
    where m.conversation_id = p_conversation and m.sender_id = me and m.client_id = p_client_id;
  end if;
  update public.conversations c set last_message_at = now() where c.id = p_conversation;
  update public.conversation_members m set last_read_at = now()
  where m.conversation_id = p_conversation and m.user_id = me;
  return query select 'sent'::text, created;
end;
$$;

comment on function public.send_message(uuid, uuid, text) is
  'Confere as regras e grava a mensagem; reenviar o mesmo client_id não duplica (spec 007, CA3, CA4, CA9, CA10, CA20).';

-- Cada um apaga só a própria mensagem, e o texto sai do banco (CA5).
create function public.delete_message(p_message uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.messages m
  set body = null, deleted_at = now()
  where m.id = p_message
    and m.sender_id = auth.uid()
    and m.deleted_at is null
    and public.is_conversation_member(m.conversation_id);
  return found;
end;
$$;

comment on function public.delete_message(uuid) is 'Apaga a própria mensagem, tirando o texto do banco (spec 007, CA5).';

create function public.mark_conversation_read(p_conversation uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.conversation_members m
  set last_read_at = now()
  where m.conversation_id = p_conversation and m.user_id = auth.uid();
$$;

comment on function public.mark_conversation_read(uuid) is 'Zera as não lidas de quem está logado (spec 007, CA18).';

-- A lista da tela Conversas (CA18 a CA20): da mais recente para a mais antiga.
create function public.my_conversations()
returns table (
  conversation_id uuid,
  kind text,
  title text,
  avatar_url text,
  is_owner boolean,
  member_count integer,
  can_send boolean,
  last_body text,
  last_deleted boolean,
  last_sender_name text,
  last_at timestamptz,
  unread integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.kind,
    case when c.kind = 'squad' then c.name else coalesce(other.display_name, 'Conta removida') end,
    other.avatar_url,
    c.owner_id = auth.uid(),
    (select count(*)::integer from public.conversation_members x where x.conversation_id = c.id),
    c.kind = 'squad' or private.are_friends(c.direct_low, c.direct_high),
    last_message.body,
    last_message.deleted_at is not null,
    last_sender.display_name,
    c.last_message_at,
    (
      select count(*)::integer from public.messages u
      where u.conversation_id = c.id
        and u.deleted_at is null
        and u.created_at > me.last_read_at
        and u.sender_id is distinct from auth.uid()
    )
  from public.conversation_members me
  join public.conversations c on c.id = me.conversation_id
  left join public.profiles other
    on c.kind = 'direct'
    and other.id = case when c.direct_low = auth.uid() then c.direct_high else c.direct_low end
  left join lateral (
    select m.body, m.deleted_at, m.sender_id
    from public.messages m
    where m.conversation_id = c.id
    order by m.created_at desc, m.id desc
    limit 1
  ) last_message on true
  left join public.profiles last_sender on last_sender.id = last_message.sender_id
  where me.user_id = auth.uid()
  order by coalesce(c.last_message_at, c.created_at) desc, c.id;
$$;

comment on function public.my_conversations() is
  'Conversas de quem está logado, com título, última mensagem e não lidas (spec 007, CA18 e CA19).';

-- 50 mensagens por vez, da mais recente para a mais antiga (CA6). Só para quem participa (CA23).
create function public.conversation_messages(
  p_conversation uuid,
  p_before_at timestamptz default null,
  p_before_id uuid default null
)
returns table (
  message_id uuid,
  sender_id uuid,
  sender_name text,
  sender_avatar_url text,
  client_id uuid,
  body text,
  created_at timestamptz,
  deleted boolean,
  mine boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.sender_id, p.display_name, p.avatar_url, m.client_id, m.body, m.created_at, m.deleted_at is not null,
    m.sender_id is not distinct from auth.uid()
  from public.messages m
  left join public.profiles p on p.id = m.sender_id
  where m.conversation_id = p_conversation
    and public.is_conversation_member(p_conversation)
    and (p_before_at is null or (m.created_at, m.id) < (p_before_at, p_before_id))
  order by m.created_at desc, m.id desc
  limit 50;
$$;

comment on function public.conversation_messages(uuid, timestamptz, uuid) is
  'Mensagens de uma conversa, 50 por vez, com o autor; só para quem participa (spec 007, CA6 e CA23).';

-- Cria o squad com amigos de quem cria (CA11, CA14, CA17).
create function public.create_squad(p_name text, p_members uuid[])
returns table (status text, conversation_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  clean text := btrim(p_name);
  people uuid[];
  created uuid;
begin
  if me is null then
    raise exception 'sem sessão' using errcode = '42501';
  end if;
  if clean is null or char_length(clean) not between 1 and 40 then
    return query select 'invalid_name'::text, null::uuid;
    return;
  end if;
  select coalesce(array_agg(distinct person), '{}') into people
  from unnest(p_members) person
  where person is distinct from me;
  if cardinality(people) = 0 then
    return query select 'no_members'::text, null::uuid;
    return;
  end if;
  if cardinality(people) + 1 > 50 then
    return query select 'full'::text, null::uuid;
    return;
  end if;
  if exists (select 1 from unnest(people) person where not private.are_friends(me, person)) then
    return query select 'not_friends'::text, null::uuid;
    return;
  end if;
  insert into public.conversations (kind, name, owner_id, last_message_at)
  values ('squad', clean, me, now())
  returning id into created;
  insert into public.conversation_members (conversation_id, user_id)
  select created, person from unnest(people || me) person;
  return query select 'created'::text, created;
end;
$$;

comment on function public.create_squad(text, uuid[]) is
  'Cria um squad com quem está logado como dono e amigos dele (spec 007, CA11, CA14 e CA17).';

create function public.rename_squad(p_conversation uuid, p_name text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean text := btrim(p_name);
begin
  if clean is null or char_length(clean) not between 1 and 40 then
    return false;
  end if;
  update public.conversations c
  set name = clean
  where c.id = p_conversation and c.kind = 'squad' and c.owner_id = auth.uid();
  return found;
end;
$$;

comment on function public.rename_squad(uuid, text) is 'O dono renomeia o squad (spec 007, CA13).';

create function public.add_squad_member(p_conversation uuid, p_user uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null or not exists (
    select 1 from public.conversations c
    where c.id = p_conversation and c.kind = 'squad' and c.owner_id = me
  ) then
    return 'not_owner';
  end if;
  if not private.are_friends(me, p_user) then
    return 'not_friends';
  end if;
  if exists (
    select 1 from public.conversation_members m
    where m.conversation_id = p_conversation and m.user_id = p_user
  ) then
    return 'already';
  end if;
  if (
    select count(*) from public.conversation_members m where m.conversation_id = p_conversation
  ) >= 50 then
    return 'full';
  end if;
  insert into public.conversation_members (conversation_id, user_id) values (p_conversation, p_user);
  return 'added';
end;
$$;

comment on function public.add_squad_member(uuid, uuid) is
  'O dono adiciona um amigo dele, até 50 pessoas (spec 007, CA13, CA14 e CA17).';

create function public.remove_squad_member(p_conversation uuid, p_user uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user = auth.uid() or not exists (
    select 1 from public.conversations c
    where c.id = p_conversation and c.kind = 'squad' and c.owner_id = auth.uid()
  ) then
    return false;
  end if;
  delete from public.conversation_members m
  where m.conversation_id = p_conversation and m.user_id = p_user;
  return found;
end;
$$;

comment on function public.remove_squad_member(uuid, uuid) is 'O dono remove outra pessoa do squad (spec 007, CA13 e CA15).';

-- Sair: quem está há mais tempo vira dono; sem ninguém, o squad e as mensagens são apagados (CA15, CA16).
create function public.leave_squad(p_conversation uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  next_owner uuid;
begin
  delete from public.conversation_members m
  using public.conversations c
  where m.conversation_id = p_conversation
    and m.user_id = me
    and c.id = m.conversation_id
    and c.kind = 'squad';
  if not found then
    return;
  end if;
  select m.user_id into next_owner
  from public.conversation_members m
  where m.conversation_id = p_conversation
  order by m.joined_at, m.user_id
  limit 1;
  if next_owner is null then
    delete from public.conversations c where c.id = p_conversation;
    return;
  end if;
  update public.conversations c
  set owner_id = next_owner
  where c.id = p_conversation and c.owner_id is not distinct from me;
end;
$$;

comment on function public.leave_squad(uuid) is
  'Sai do squad; passa a posse a quem está há mais tempo e apaga se não sobrar ninguém (spec 007, CA15 e CA16).';

create function public.squad_members(p_conversation uuid)
returns table (
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  is_owner boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name, p.username, p.avatar_url, c.owner_id = p.id
  from public.conversation_members m
  join public.conversations c on c.id = m.conversation_id
  join public.profiles p on p.id = m.user_id
  where m.conversation_id = p_conversation
    and c.kind = 'squad'
    and public.is_conversation_member(p_conversation);
$$;

comment on function public.squad_members(uuid) is 'Membros de um squad, só para quem participa (spec 007, CA13).';

-- Squads com os outros membros, para a "Oportunidade de squad" da home.
create function public.my_squads()
returns table (conversation_id uuid, name text, member_ids uuid[])
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.name,
    (
      select coalesce(array_agg(x.user_id), '{}')
      from public.conversation_members x
      where x.conversation_id = c.id and x.user_id <> auth.uid()
    )
  from public.conversation_members me
  join public.conversations c on c.id = me.conversation_id
  where me.user_id = auth.uid() and c.kind = 'squad';
$$;

comment on function public.my_squads() is 'Squads de quem está logado, com os outros membros (spec 007).';

revoke execute on function public.is_conversation_member(uuid) from public, anon;
revoke execute on function public.open_direct(uuid) from public, anon;
revoke execute on function public.send_message(uuid, uuid, text) from public, anon;
revoke execute on function public.delete_message(uuid) from public, anon;
revoke execute on function public.mark_conversation_read(uuid) from public, anon;
revoke execute on function public.my_conversations() from public, anon;
revoke execute on function public.conversation_messages(uuid, timestamptz, uuid) from public, anon;
revoke execute on function public.create_squad(text, uuid[]) from public, anon;
revoke execute on function public.rename_squad(uuid, text) from public, anon;
revoke execute on function public.add_squad_member(uuid, uuid) from public, anon;
revoke execute on function public.remove_squad_member(uuid, uuid) from public, anon;
revoke execute on function public.leave_squad(uuid) from public, anon;
revoke execute on function public.squad_members(uuid) from public, anon;
revoke execute on function public.my_squads() from public, anon;

grant execute on function public.is_conversation_member(uuid) to authenticated;
grant execute on function public.open_direct(uuid) to authenticated;
grant execute on function public.send_message(uuid, uuid, text) to authenticated;
grant execute on function public.delete_message(uuid) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.my_conversations() to authenticated;
grant execute on function public.conversation_messages(uuid, timestamptz, uuid) to authenticated;
grant execute on function public.create_squad(text, uuid[]) to authenticated;
grant execute on function public.rename_squad(uuid, text) to authenticated;
grant execute on function public.add_squad_member(uuid, uuid) to authenticated;
grant execute on function public.remove_squad_member(uuid, uuid) to authenticated;
grant execute on function public.leave_squad(uuid) to authenticated;
grant execute on function public.squad_members(uuid) to authenticated;
grant execute on function public.my_squads() to authenticated;
