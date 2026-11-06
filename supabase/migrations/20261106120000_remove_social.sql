-- O app fica enxuto, sem amigos e sem bate-papo (spec 009, CA5). Apaga as funções e as tabelas criadas em
-- 20261105120000_friends.sql e 20261105150000_chat.sql, com os dados. As migrations antigas ficam no histórico,
-- porque já rodaram na nuvem. Os perfis e a policy "cada um lê o próprio perfil" ficam (CA6).

-- Bate-papo: funções.
drop function if exists public.my_squads();
drop function if exists public.squad_members(uuid);
drop function if exists public.leave_squad(uuid);
drop function if exists public.remove_squad_member(uuid, uuid);
drop function if exists public.add_squad_member(uuid, uuid);
drop function if exists public.rename_squad(uuid, text);
drop function if exists public.create_squad(text, uuid[]);
drop function if exists public.conversation_messages(uuid, timestamptz, uuid);
drop function if exists public.my_conversations();
drop function if exists public.mark_conversation_read(uuid);
drop function if exists public.delete_message(uuid);
drop function if exists public.send_message(uuid, uuid, text);
drop function if exists public.open_direct(uuid);
drop function if exists private.are_friends(uuid, uuid);

-- Bate-papo: tabelas. Apagar `messages` também a tira da publicação do tempo real. As policies das tabelas saem
-- junto; `is_conversation_member` sai depois, porque as policies dependem dela.
drop table if exists public.messages;
drop table if exists public.conversation_members;
drop table if exists public.conversations;
drop function if exists public.is_conversation_member(uuid);

-- Amigos: funções.
drop function if exists public.my_blocks();
drop function if exists public.my_friend_requests();
drop function if exists public.my_friends();
drop function if exists public.unblock_user(uuid);
drop function if exists public.block_user(uuid);
drop function if exists public.remove_friend(uuid);
drop function if exists public.cancel_friend_request(uuid);
drop function if exists public.answer_friend_request(uuid, boolean);
drop function if exists public.send_friend_request(uuid);
drop function if exists public.find_player(text);
drop function if exists private.friend_relation(uuid, uuid);

-- Amigos: tabelas.
drop table if exists public.user_blocks;
drop table if exists public.friendships;
drop table if exists public.friend_requests;
