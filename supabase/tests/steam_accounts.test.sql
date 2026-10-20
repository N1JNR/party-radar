-- Conta Steam ligada ao perfil: uma conta por pessoa e cada um lê só a sua (spec 003, CA4, CA16).
begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'ana.steam@exemplo.test', '{"full_name": "Ana"}'),
  ('00000000-0000-0000-0000-0000000000b2', 'bia.steam@exemplo.test', '{"full_name": "Bia"}'),
  ('00000000-0000-0000-0000-0000000000c3', 'caio.steam@exemplo.test', '{"full_name": "Caio"}');

-- Como as Edge Functions, com a secret key (papel com acesso total).
insert into public.steam_accounts (user_id, steam_id, persona_name, visibility) values
  ('00000000-0000-0000-0000-0000000000a1', '76561198000000001', 'ana_steam', 'public'),
  ('00000000-0000-0000-0000-0000000000b2', '76561198000000002', 'bia_steam', 'private');

-- CA4: a mesma conta Steam não fica ligada a dois perfis.
select throws_ok(
  $$ insert into public.steam_accounts (user_id, steam_id)
     values ('00000000-0000-0000-0000-0000000000c3', '76561198000000001') $$,
  '23505',
  null,
  'uma conta Steam fica ligada a um perfil só'
);

select throws_ok(
  $$ insert into public.steam_accounts (user_id, steam_id)
     values ('00000000-0000-0000-0000-0000000000c3', '123') $$,
  '23514',
  null,
  'o SteamID tem 17 dígitos'
);

select throws_ok(
  $$ insert into public.steam_accounts (user_id, steam_id, visibility)
     values ('00000000-0000-0000-0000-0000000000c3', '76561198000000003', 'amigos') $$,
  '23514',
  null,
  'a visibilidade é public ou private'
);

select is(
  (select connected_at is not null from public.steam_accounts
   where user_id = '00000000-0000-0000-0000-0000000000a1'),
  true,
  'guarda quando a conta foi conectada'
);

-- CA20: a última tentativa de leitura começa vazia.
select is(
  (select sync_attempted_at from public.steam_accounts
   where user_id = '00000000-0000-0000-0000-0000000000a1'),
  null,
  'conta nova ainda não tentou ler a Steam'
);

-- CA16: Ana logada.
select set_config('teste.contas', (select count(*)::text from public.steam_accounts), true);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}', true);

select results_eq(
  $$ select steam_id, persona_name from public.steam_accounts $$,
  $$ values ('76561198000000001'::text, 'ana_steam'::text) $$,
  'cada um lê só a própria conta Steam'
);

select is(
  (select count(*)::integer from public.steam_accounts
   where user_id = '00000000-0000-0000-0000-0000000000b2'),
  0,
  'não lê a conta Steam de outra pessoa'
);

select throws_ok(
  $$ insert into public.steam_accounts (user_id, steam_id)
     values ('00000000-0000-0000-0000-0000000000a1', '76561198000000009') $$,
  '42501',
  null,
  'não conecta conta pela API (só as Edge Functions)'
);

select throws_ok(
  $$ update public.steam_accounts set steam_id = '76561198000000009'
     where user_id = '00000000-0000-0000-0000-0000000000a1' $$,
  '42501',
  null,
  'não troca a própria conta Steam pela API'
);

select throws_ok(
  $$ delete from public.steam_accounts where user_id = '00000000-0000-0000-0000-0000000000b2' $$,
  '42501',
  null,
  'não apaga a conta Steam de outra pessoa'
);

-- Quem não está logado.
reset role;
set local role anon;

select throws_ok(
  $$ select * from public.steam_accounts $$,
  '42501',
  null,
  'quem não está logado não lê contas Steam'
);

reset role;

-- Apagar o usuário apaga a conta Steam dele.
delete from auth.users where id = '00000000-0000-0000-0000-0000000000b2';

select is(
  (select count(*)::integer from public.steam_accounts
   where user_id = '00000000-0000-0000-0000-0000000000b2'),
  0,
  'apagar o usuário apaga a conta Steam'
);

select is(
  (select count(*)::integer from public.steam_accounts),
  current_setting('teste.contas')::integer - 1,
  'as outras contas continuam'
);

select * from finish();

rollback;
