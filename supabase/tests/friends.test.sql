-- Amigos: pedidos, amizade, bloqueio e o que cada um vê (spec 006).
begin;

create extension if not exists pgtap with schema extensions;

select plan(46);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000007a1', 'ana.amigos@exemplo.test', '{"full_name": "Ana Amigos"}'),
  ('00000000-0000-0000-0000-0000000007b2', 'bia.amigos@exemplo.test', '{"full_name": "Bia Amigos"}'),
  ('00000000-0000-0000-0000-0000000007c3', 'caio.amigos@exemplo.test', '{"full_name": "Caio Amigos"}'),
  ('00000000-0000-0000-0000-0000000007d4', 'duda.amigos@exemplo.test', '{"full_name": "Duda Amigos"}');

update public.profiles set username = 'ana_amigos' where id = '00000000-0000-0000-0000-0000000007a1';
update public.profiles set username = 'bia_amigos' where id = '00000000-0000-0000-0000-0000000007b2';
update public.profiles set username = 'caio_amigos' where id = '00000000-0000-0000-0000-0000000007c3';
update public.profiles set username = 'duda_amigos' where id = '00000000-0000-0000-0000-0000000007d4';

insert into public.steam_accounts (user_id, steam_id, visibility, current_game) values
  ('00000000-0000-0000-0000-0000000007b2', '76561198000000071', 'public', 'Dota 2');

-- Muda quem está logado.
create function pg_temp.as_user(p_id uuid) returns void language plpgsql as $f$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
end;
$f$;

grant execute on function pg_temp.as_user(uuid) to authenticated;

set local role authenticated;

-- Ana.
select pg_temp.as_user('00000000-0000-0000-0000-0000000007a1');

select results_eq(
  $$ select username, relation from public.find_player('BIA_amigos') $$,
  $$ values ('bia_amigos'::text, 'none'::text) $$,
  'acha pelo @usuário exato, sem diferenciar maiúsculas (CA3)'
);

select results_eq(
  $$ select username from public.find_player(' @bia_amigos ') $$,
  $$ values ('bia_amigos'::text) $$,
  'aceita o @ e espaços em volta (CA3)'
);

select is_empty($$ select * from public.find_player('bia') $$, 'parte do nome não acha ninguém (CA3)');
select is_empty($$ select * from public.find_player('nao_existe') $$, '@usuário que não existe (CA4)');

select results_eq(
  $$ select relation from public.find_player('ana_amigos') $$,
  $$ values ('self'::text) $$,
  'o próprio @usuário é marcado (CA5)'
);

select is(
  public.send_friend_request('00000000-0000-0000-0000-0000000007a1'),
  'self',
  'não dá para pedir amizade a si mesmo (CA5)'
);

select is(
  public.send_friend_request('00000000-0000-0000-0000-000000000fff'),
  'not_found',
  'pedido para quem não existe (CA4)'
);

select is(public.send_friend_request('00000000-0000-0000-0000-0000000007b2'), 'sent', 'envia o pedido (CA3)');

select is(
  public.send_friend_request('00000000-0000-0000-0000-0000000007b2'),
  'already_sent',
  'não duplica o pedido (CA6)'
);

select results_eq(
  $$ select relation from public.find_player('bia_amigos') $$,
  $$ values ('sent'::text) $$,
  'o pedido aparece como enviado (CA6)'
);

select results_eq(
  $$ select direction, username from public.my_friend_requests() $$,
  $$ values ('sent'::text, 'bia_amigos'::text) $$,
  'quem pediu vê o pedido enviado (CA12)'
);

select throws_ok(
  $$ insert into public.friendships (user_low, user_high)
     values ('00000000-0000-0000-0000-0000000007a1', '00000000-0000-0000-0000-0000000007c3') $$,
  '42501',
  null,
  'ninguém cria amizade direto na tabela (CA20)'
);

select throws_ok(
  $$ insert into public.friend_requests (from_id, to_id)
     values ('00000000-0000-0000-0000-0000000007c3', '00000000-0000-0000-0000-0000000007a1') $$,
  '42501',
  null,
  'ninguém cria pedido em nome de outra pessoa (CA20)'
);

select throws_ok(
  $$ select declined_at from public.friend_requests $$,
  '42501',
  null,
  'quem pediu não consegue ler a recusa (CA9)'
);

-- Caio tenta aceitar um pedido que não é dele.
select pg_temp.as_user('00000000-0000-0000-0000-0000000007c3');

select is(
  public.answer_friend_request('00000000-0000-0000-0000-0000000007a1', true),
  false,
  'não aceita pedido que não recebeu (CA20)'
);

select is_empty($$ select from_id, to_id from public.friend_requests $$, 'não lê pedidos de outras pessoas (CA20)');
select is_empty($$ select * from public.my_friends() $$, 'não vira amigo por tentar aceitar (CA20)');

-- Bia recusa: some para ela e continua como enviado para Ana.
select pg_temp.as_user('00000000-0000-0000-0000-0000000007b2');

select results_eq(
  $$ select direction, username from public.my_friend_requests() $$,
  $$ values ('received'::text, 'ana_amigos'::text) $$,
  'quem recebe vê o pedido (CA12)'
);

select is(
  public.answer_friend_request('00000000-0000-0000-0000-0000000007a1', false),
  true,
  'recusa o pedido (CA9)'
);

select is_empty($$ select * from public.my_friend_requests() $$, 'o pedido recusado some para quem recebeu (CA9)');

select pg_temp.as_user('00000000-0000-0000-0000-0000000007a1');

select results_eq(
  $$ select direction, username from public.my_friend_requests() $$,
  $$ values ('sent'::text, 'bia_amigos'::text) $$,
  'quem pediu não é avisado da recusa (CA9)'
);

-- Bia muda de ideia e pede amizade: vira amizade, porque Ana já tinha pedido.
select pg_temp.as_user('00000000-0000-0000-0000-0000000007b2');

select is(
  public.send_friend_request('00000000-0000-0000-0000-0000000007a1'),
  'friends',
  'pedir a quem já pediu vira amizade (CA7)'
);

select is_empty($$ select * from public.my_friend_requests() $$, 'os pedidos entre os dois somem (CA7)');

select pg_temp.as_user('00000000-0000-0000-0000-0000000007a1');

select results_eq(
  $$ select username, current_game from public.my_friends() $$,
  $$ values ('bia_amigos'::text, 'Dota 2'::text) $$,
  'o amigo aparece com o jogo aberto (CA13)'
);

select is(
  public.send_friend_request('00000000-0000-0000-0000-0000000007b2'),
  'already_friends',
  'quem já é amigo não recebe pedido (CA6)'
);

select results_eq(
  $$ select relation from public.find_player('bia_amigos') $$,
  $$ values ('friend'::text) $$,
  'o amigo aparece como amigo (CA6)'
);

select is_empty(
  $$ select steam_id from public.steam_accounts where user_id = '00000000-0000-0000-0000-0000000007b2' $$,
  'amizade não expõe o SteamID (CA20)'
);

-- Ana pede amizade a Caio, e ele aceita.
select is(public.send_friend_request('00000000-0000-0000-0000-0000000007c3'), 'sent', 'pede amizade a Caio (CA3)');

select pg_temp.as_user('00000000-0000-0000-0000-0000000007c3');

select is(
  public.answer_friend_request('00000000-0000-0000-0000-0000000007a1', true),
  true,
  'aceita o pedido (CA8)'
);

select results_eq(
  $$ select username from public.my_friends() $$,
  $$ values ('ana_amigos'::text) $$,
  'viram amigos (CA8)'
);

-- Duda pede e cancela.
select pg_temp.as_user('00000000-0000-0000-0000-0000000007d4');

select is(public.send_friend_request('00000000-0000-0000-0000-0000000007a1'), 'sent', 'Duda pede amizade');

select lives_ok(
  $$ select public.cancel_friend_request('00000000-0000-0000-0000-0000000007a1') $$,
  'cancela o pedido (CA10)'
);

select is_empty($$ select * from public.my_friend_requests() $$, 'o pedido cancelado some (CA10)');

-- Remover.
select pg_temp.as_user('00000000-0000-0000-0000-0000000007a1');

select lives_ok(
  $$ select public.remove_friend('00000000-0000-0000-0000-0000000007c3') $$,
  'desfaz a amizade (CA15)'
);

select results_eq(
  $$ select username from public.my_friends() $$,
  $$ values ('bia_amigos'::text) $$,
  'Caio sai da lista de Ana (CA15)'
);

select pg_temp.as_user('00000000-0000-0000-0000-0000000007c3');

select is_empty($$ select * from public.my_friends() $$, 'Ana sai da lista de Caio (CA15)');

-- Bloquear: Ana bloqueia Bia.
select pg_temp.as_user('00000000-0000-0000-0000-0000000007a1');

select lives_ok(
  $$ select public.block_user('00000000-0000-0000-0000-0000000007b2') $$,
  'bloqueia (CA16)'
);

select is_empty($$ select * from public.my_friends() $$, 'bloquear desfaz a amizade (CA16)');

select results_eq(
  $$ select username from public.my_blocks() $$,
  $$ values ('bia_amigos'::text) $$,
  'o bloqueio aparece na lista de quem bloqueou (CA17)'
);

select is(
  public.send_friend_request('00000000-0000-0000-0000-0000000007b2'),
  'blocked',
  'quem bloqueou precisa desbloquear para pedir (CA17)'
);

select pg_temp.as_user('00000000-0000-0000-0000-0000000007b2');

select is_empty(
  $$ select * from public.find_player('ana_amigos') $$,
  'quem foi bloqueado não encontra quem bloqueou (CA4, CA16)'
);

select is(
  public.send_friend_request('00000000-0000-0000-0000-0000000007a1'),
  'not_found',
  'quem foi bloqueado não consegue pedir amizade (CA16)'
);

select is_empty($$ select * from public.user_blocks $$, 'quem foi bloqueado não lê o bloqueio (CA20)');

-- Desbloquear não refaz a amizade.
select pg_temp.as_user('00000000-0000-0000-0000-0000000007a1');

select lives_ok(
  $$ select public.unblock_user('00000000-0000-0000-0000-0000000007b2') $$,
  'desbloqueia (CA17)'
);

select is_empty($$ select * from public.my_friends() $$, 'desbloquear não refaz a amizade (CA17)');

reset role;
set local role anon;

select throws_ok($$ select * from public.my_friends() $$, '42501', null, 'quem não está logado não lê amigos');

reset role;

select * from finish();

rollback;
