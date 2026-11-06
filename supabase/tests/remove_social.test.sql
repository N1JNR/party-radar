-- Spec 009, CA5: sem tabelas e funções de amigos e bate-papo, e sem mensagens no tempo real.
begin;

create extension if not exists pgtap with schema extensions;

select plan(3);

select is(
  (
    select coalesce(array_agg(c.relname::text order by c.relname), '{}')
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'friend_requests', 'friendships', 'user_blocks', 'conversations', 'conversation_members', 'messages'
      )
  ),
  '{}'::text[],
  'as tabelas de amigos e bate-papo não existem mais'
);

select is(
  (
    select coalesce(array_agg(n.nspname || '.' || p.proname order by n.nspname, p.proname), '{}')
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and p.proname in (
        'find_player', 'send_friend_request', 'answer_friend_request', 'cancel_friend_request',
        'remove_friend', 'block_user', 'unblock_user', 'my_friends', 'my_friend_requests', 'my_blocks',
        'friend_relation', 'are_friends', 'is_conversation_member', 'open_direct', 'send_message',
        'delete_message', 'mark_conversation_read', 'my_conversations', 'conversation_messages',
        'create_squad', 'rename_squad', 'add_squad_member', 'remove_squad_member', 'leave_squad',
        'squad_members', 'my_squads'
      )
  ),
  '{}'::text[],
  'as funções de amigos e bate-papo não existem mais'
);

select is(
  (
    select coalesce(array_agg(tablename::text order by tablename), '{}')
    from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
  ),
  '{}'::text[],
  'nenhuma tabela do app fica no tempo real'
);

select * from finish();
rollback;
