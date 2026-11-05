-- Bate-papo: conversas, squads, limites e quem lê o quê (spec 007).
begin;

create extension if not exists pgtap with schema extensions;

select plan(49);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000008a1', 'ana.chat@exemplo.test', '{"full_name": "Ana Chat"}'),
  ('00000000-0000-0000-0000-0000000008b2', 'bia.chat@exemplo.test', '{"full_name": "Bia Chat"}'),
  ('00000000-0000-0000-0000-0000000008c3', 'caio.chat@exemplo.test', '{"full_name": "Caio Chat"}'),
  ('00000000-0000-0000-0000-0000000008d4', 'duda.chat@exemplo.test', '{"full_name": "Duda Chat"}');

-- Ana é amiga de Bia e Caio. Duda não é amiga de ninguém.
insert into public.friendships (user_low, user_high) values
  ('00000000-0000-0000-0000-0000000008a1', '00000000-0000-0000-0000-0000000008b2'),
  ('00000000-0000-0000-0000-0000000008a1', '00000000-0000-0000-0000-0000000008c3');

create function pg_temp.as_user(p_id uuid) returns void language plpgsql as $f$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
end;
$f$;

-- Guarda ids entre os testes.
create temporary table ids (name text primary key, id uuid);
grant select, insert, update on ids to authenticated;
grant execute on function pg_temp.as_user(uuid) to authenticated;

set local role authenticated;

-- Ana abre a conversa com Bia.
select pg_temp.as_user('00000000-0000-0000-0000-0000000008a1');

insert into ids values ('direct', public.open_direct('00000000-0000-0000-0000-0000000008b2'));

select isnt((select id from ids where name = 'direct'), null, 'abre a conversa com um amigo (CA1)');

select is(
  public.open_direct('00000000-0000-0000-0000-0000000008b2'),
  (select id from ids where name = 'direct'),
  'abrir de novo é a mesma conversa (CA1)'
);

select is(
  public.open_direct('00000000-0000-0000-0000-0000000008d4'),
  null,
  'quem não é amigo não inicia conversa (CA2)'
);

select throws_ok(
  $$ insert into public.conversations (kind, name) values ('squad', 'Hack') $$,
  '42501',
  null,
  'ninguém cria conversa direto na tabela (CA23)'
);

-- Mensagens.
select results_eq(
  $$ select status from public.send_message(
       (select id from ids where name = 'direct'), '00000000-0000-0000-0000-000000000001', '  oi, Bia  ') $$,
  $$ values ('sent'::text) $$,
  'envia a mensagem (CA3)'
);

select results_eq(
  $$ select status from public.send_message(
       (select id from ids where name = 'direct'), '00000000-0000-0000-0000-000000000001', 'oi, Bia') $$,
  $$ values ('sent'::text) $$,
  'reenviar o mesmo client_id responde sem erro (CA9)'
);

select is(
  (select count(*)::integer from public.conversation_messages((select id from ids where name = 'direct'))),
  1,
  'reenviar não duplica (CA9)'
);

select is(
  (select body from public.conversation_messages((select id from ids where name = 'direct'))),
  'oi, Bia',
  'guarda sem os espaços das pontas (CA4)'
);

select results_eq(
  $$ select status from public.send_message(
       (select id from ids where name = 'direct'), gen_random_uuid(), '    ') $$,
  $$ values ('invalid'::text) $$,
  'mensagem só com espaços não é enviada (CA4)'
);

select results_eq(
  $$ select status from public.send_message(
       (select id from ids where name = 'direct'), gen_random_uuid(), repeat('a', 2001)) $$,
  $$ values ('invalid'::text) $$,
  'mensagem com mais de 2.000 caracteres não é enviada (CA4)'
);

select results_eq(
  $$ select status from public.send_message(
       (select id from ids where name = 'direct'), '00000000-0000-0000-0000-000000000002', repeat('a', 2000)) $$,
  $$ values ('sent'::text) $$,
  'mensagem com 2.000 caracteres é enviada (CA4)'
);

-- Bia lê e tem não lidas. Na transação do teste, now() não muda: a leitura dela precisa ficar no passado.
reset role;
update public.conversation_members set last_read_at = '2026-01-01'
where user_id = '00000000-0000-0000-0000-0000000008b2';
set local role authenticated;

select pg_temp.as_user('00000000-0000-0000-0000-0000000008b2');

select results_eq(
  $$ select kind, title, unread, can_send from public.my_conversations() $$,
  $$ values ('direct'::text, 'Ana Chat'::text, 2, true) $$,
  'a lista mostra quem é, as não lidas e se dá para enviar (CA18, CA19)'
);

select lives_ok(
  $$ select public.mark_conversation_read((select id from ids where name = 'direct')) $$,
  'marca como lida (CA18)'
);

select is((select unread from public.my_conversations()), 0, 'abrir a conversa zera a contagem (CA18)');

select throws_ok(
  $$ select last_read_at from public.conversation_members $$,
  '42501',
  null,
  'ninguém lê a hora em que o outro leu'
);

insert into ids values (
  'bia_msg',
  (select message_id from public.send_message(
    (select id from ids where name = 'direct'), '00000000-0000-0000-0000-000000000003', 'oi, Ana'))
);

-- Ana tenta apagar a mensagem de Bia.
select pg_temp.as_user('00000000-0000-0000-0000-0000000008a1');

select is(
  public.delete_message((select id from ids where name = 'bia_msg')),
  false,
  'não apaga a mensagem de outra pessoa (CA5)'
);

select pg_temp.as_user('00000000-0000-0000-0000-0000000008b2');

select is(public.delete_message((select id from ids where name = 'bia_msg')), true, 'apaga a própria mensagem (CA5)');

select results_eq(
  $$ select deleted, body, mine from public.conversation_messages((select id from ids where name = 'direct'))
     where message_id = (select id from ids where name = 'bia_msg') $$,
  $$ values (true, null::text, true) $$,
  'o texto apagado sai do banco, e a mensagem continua marcada como minha (CA5)'
);

-- Quem não participa.
select pg_temp.as_user('00000000-0000-0000-0000-0000000008c3');

select is_empty(
  $$ select * from public.conversation_messages((select id from ids where name = 'direct')) $$,
  'quem não participa não lê pela função (CA23)'
);

select is_empty($$ select id from public.messages $$, 'quem não participa não lê a tabela (CA23)');
select is_empty($$ select id from public.conversations $$, 'quem não participa não vê a conversa (CA23)');

select results_eq(
  $$ select status from public.send_message(
       (select id from ids where name = 'direct'), gen_random_uuid(), 'invadi') $$,
  $$ values ('not_member'::text) $$,
  'quem não participa não envia (CA23)'
);

select throws_ok(
  $$ update public.messages set body = 'alterado' $$,
  '42501',
  null,
  'ninguém altera mensagem direto na tabela (CA23)'
);

-- Squads: Ana cria com Bia e Caio.
select pg_temp.as_user('00000000-0000-0000-0000-0000000008a1');

select results_eq(
  $$ select status from public.create_squad('   ', array['00000000-0000-0000-0000-0000000008b2'::uuid]) $$,
  $$ values ('invalid_name'::text) $$,
  'nome vazio não cria squad (CA11)'
);

select results_eq(
  $$ select status from public.create_squad(repeat('a', 41), array['00000000-0000-0000-0000-0000000008b2'::uuid]) $$,
  $$ values ('invalid_name'::text) $$,
  'nome com mais de 40 caracteres não cria squad (CA11)'
);

select results_eq(
  $$ select status from public.create_squad('Só eu', array[]::uuid[]) $$,
  $$ values ('no_members'::text) $$,
  'squad precisa de um amigo (CA11)'
);

select results_eq(
  $$ select status from public.create_squad('Com Duda', array['00000000-0000-0000-0000-0000000008d4'::uuid]) $$,
  $$ values ('not_friends'::text) $$,
  'só amigos entram no squad (CA11, CA17)'
);

insert into ids values (
  'squad',
  (select conversation_id from public.create_squad(
    'Squad da Sexta',
    array['00000000-0000-0000-0000-0000000008b2'::uuid, '00000000-0000-0000-0000-0000000008c3'::uuid]))
);

select results_eq(
  $$ select title, is_owner, member_count from public.my_conversations()
     where conversation_id = (select id from ids where name = 'squad') $$,
  $$ values ('Squad da Sexta'::text, true, 3) $$,
  'o squad nasce com quem criou como dono (CA11)'
);

select results_eq(
  $$ select status from public.send_message((select id from ids where name = 'squad'), gen_random_uuid(), 'bora') $$,
  $$ values ('sent'::text) $$,
  'dono envia mensagem no squad (CA12)'
);

select is(public.rename_squad((select id from ids where name = 'squad'), 'Squad novo'), true, 'dono renomeia (CA13)');

-- Bia, que não é dona.
select pg_temp.as_user('00000000-0000-0000-0000-0000000008b2');

select is(
  (select title from public.my_conversations() where conversation_id = (select id from ids where name = 'squad')),
  'Squad novo',
  'membro vê o squad, com o nome novo (CA11, CA13)'
);

select is(public.rename_squad((select id from ids where name = 'squad'), 'Meu'), false, 'quem não é dono não renomeia (CA13)');

select is(
  public.add_squad_member((select id from ids where name = 'squad'), '00000000-0000-0000-0000-0000000008d4'),
  'not_owner',
  'quem não é dono não adiciona (CA13)'
);

select is(
  public.remove_squad_member((select id from ids where name = 'squad'), '00000000-0000-0000-0000-0000000008c3'),
  false,
  'quem não é dono não remove (CA13)'
);

select results_eq(
  $$ select array_length(member_ids, 1) from public.my_squads() $$,
  $$ values (2) $$,
  'my_squads traz os outros membros'
);

-- Ana torna-se amiga de Duda, adiciona ao squad e Duda lê o histórico.
reset role;
insert into public.friendships (user_low, user_high) values
  ('00000000-0000-0000-0000-0000000008a1', '00000000-0000-0000-0000-0000000008d4');
set local role authenticated;

select pg_temp.as_user('00000000-0000-0000-0000-0000000008a1');

select is(
  public.add_squad_member((select id from ids where name = 'squad'), '00000000-0000-0000-0000-0000000008d4'),
  'added',
  'dono adiciona um amigo (CA13)'
);

select is(
  public.add_squad_member((select id from ids where name = 'squad'), '00000000-0000-0000-0000-0000000008d4'),
  'already',
  'não adiciona duas vezes (CA13)'
);

select pg_temp.as_user('00000000-0000-0000-0000-0000000008d4');

select is(
  (select count(*)::integer from public.conversation_messages((select id from ids where name = 'squad'))),
  1,
  'quem entrou depois vê as mensagens antigas (CA12)'
);

-- Ana remove Duda.
select pg_temp.as_user('00000000-0000-0000-0000-0000000008a1');

select is(
  public.remove_squad_member((select id from ids where name = 'squad'), '00000000-0000-0000-0000-0000000008d4'),
  true,
  'dono remove uma pessoa (CA13)'
);

select pg_temp.as_user('00000000-0000-0000-0000-0000000008d4');

select is_empty(
  $$ select * from public.conversation_messages((select id from ids where name = 'squad')) $$,
  'quem foi removido não lê mais (CA15)'
);

-- Dono sai: Bia, mais antiga por empate de hora, ou Caio, assume; sem ninguém, o squad some.
select pg_temp.as_user('00000000-0000-0000-0000-0000000008a1');

select lives_ok($$ select public.leave_squad((select id from ids where name = 'squad')) $$, 'dono sai (CA16)');

select is_empty(
  $$ select * from public.my_conversations() where conversation_id = (select id from ids where name = 'squad') $$,
  'o squad some da lista de quem saiu (CA15)'
);

select pg_temp.as_user('00000000-0000-0000-0000-0000000008b2');

select is(
  (select bool_or(is_owner) from public.squad_members((select id from ids where name = 'squad'))),
  true,
  'outra pessoa vira dona (CA16)'
);

select lives_ok($$ select public.leave_squad((select id from ids where name = 'squad')) $$, 'Bia sai');

select pg_temp.as_user('00000000-0000-0000-0000-0000000008c3');

select lives_ok($$ select public.leave_squad((select id from ids where name = 'squad')) $$, 'a última pessoa sai');

reset role;

select is(
  (select count(*)::integer from public.conversations where id = (select id from ids where name = 'squad')),
  0,
  'sem ninguém, o squad é apagado (CA16)'
);

set local role authenticated;

-- Amizade desfeita: a conversa fica, só para leitura (CA20).
select pg_temp.as_user('00000000-0000-0000-0000-0000000008a1');

select lives_ok($$ select public.remove_friend('00000000-0000-0000-0000-0000000008b2') $$, 'desfaz a amizade');

select results_eq(
  $$ select can_send from public.my_conversations() where conversation_id = (select id from ids where name = 'direct') $$,
  $$ values (false) $$,
  'a conversa fica só para leitura (CA20)'
);

select results_eq(
  $$ select status from public.send_message((select id from ids where name = 'direct'), gen_random_uuid(), 'volta') $$,
  $$ values ('read_only'::text) $$,
  'não envia mais nessa conversa (CA20)'
);

reset role;

select * from finish();

rollback;
