-- Perfil básico criado no cadastro e regras de acesso (spec 001, CA4, CA16 e CA18).
begin;

create extension if not exists pgtap with schema extensions;

select plan(18);

-- Cadastro de quatro pessoas, como o Supabase Auth faz depois do login.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@exemplo.test',
    '{"full_name": "Ana", "name": "ana_gamer", "avatar_url": "https://cdn.exemplo.test/ana.png"}'),
  ('00000000-0000-0000-0000-00000000000b', 'outra.ana@exemplo.test', '{"full_name": "Ana"}'),
  ('00000000-0000-0000-0000-00000000000c', 'joao@exemplo.test', '{"full_name": "João Ávila"}'),
  ('00000000-0000-0000-0000-00000000000d', 'carla.dias@exemplo.test', '{}'),
  ('00000000-0000-0000-0000-00000000000e', 'jo@exemplo.test', '{"name": "Jo"}'),
  ('00000000-0000-0000-0000-00000000000f', 'longo@exemplo.test',
    '{"full_name": "Maximiliano Bartolomeu Silva"}'),
  ('00000000-0000-0000-0000-000000000010', 'longo2@exemplo.test',
    '{"full_name": "Maximiliano Bartolomeu Silva"}');

-- CA4: perfil com nome, foto e @usuário a partir do nome de exibição.
select results_eq(
  $$ select display_name, username, avatar_url from public.profiles
     where id = '00000000-0000-0000-0000-00000000000a' $$,
  $$ values ('Ana'::text, 'ana'::text, 'https://cdn.exemplo.test/ana.png'::text) $$,
  'cria o perfil com nome, @usuário e foto do provedor'
);

select is(
  (select username from public.profiles where id = '00000000-0000-0000-0000-00000000000b'),
  'ana2',
  '@usuário repetido ganha número'
);

select is(
  (select avatar_url from public.profiles where id = '00000000-0000-0000-0000-00000000000b'),
  null,
  'sem foto do provedor, a foto fica vazia (o app mostra a inicial)'
);

select is(
  (select username from public.profiles where id = '00000000-0000-0000-0000-00000000000c'),
  'joaoavila',
  '@usuário sem acentos e sem espaços'
);

-- CA16: sem nome do provedor, usa o e-mail antes do "@".
select results_eq(
  $$ select display_name, username from public.profiles
     where id = '00000000-0000-0000-0000-00000000000d' $$,
  $$ values ('carla.dias'::text, 'carladias'::text) $$,
  'sem nome, usa o e-mail antes do "@" como nome e base do @usuário'
);

select is(
  (select username from public.profiles where id = '00000000-0000-0000-0000-00000000000e'),
  'jogador',
  'nome curto demais vira "jogador"'
);

select is(
  (select username from public.profiles where id = '00000000-0000-0000-0000-00000000000f'),
  'maximilianobartolome',
  '@usuário com no máximo 20 caracteres'
);

select is(
  (select username from public.profiles where id = '00000000-0000-0000-0000-000000000010'),
  'maximilianobartolom2',
  'com o número, o @usuário continua com 20 caracteres'
);

select hasnt_column('public', 'profiles', 'email', 'o perfil não guarda e-mail');

-- CA18: Ana logada.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

select is(
  (select count(*)::integer from public.profiles),
  7,
  'quem está logado vê todos os perfis'
);

select is(
  (select username from public.profiles where id = '00000000-0000-0000-0000-00000000000c'),
  'joaoavila',
  'quem está logado vê o perfil de outra pessoa'
);

select throws_ok(
  $$ update public.profiles set display_name = 'Hackeado'
     where id = '00000000-0000-0000-0000-00000000000c' $$,
  '42501',
  null,
  'não altera o perfil de outra pessoa'
);

select throws_ok(
  $$ delete from public.profiles where id = '00000000-0000-0000-0000-00000000000c' $$,
  '42501',
  null,
  'não apaga o perfil de outra pessoa'
);

select throws_ok(
  $$ insert into public.profiles (id, display_name, username)
     values ('00000000-0000-0000-0000-00000000000c', 'Falso', 'falso') $$,
  '42501',
  null,
  'não cria perfil pela API'
);

select throws_ok(
  $$ update public.profiles set display_name = 'Ana B'
     where id = '00000000-0000-0000-0000-00000000000a' $$,
  '42501',
  null,
  'também não altera o próprio perfil (editar é da 006-perfil)'
);

select throws_ok(
  $$ select public.username_base('teste') $$,
  '42501',
  null,
  'a função de @usuário não é exposta pela API'
);

-- Quem não está logado.
reset role;
set local role anon;

select throws_ok(
  $$ select * from public.profiles $$,
  '42501',
  null,
  'quem não está logado não lê perfis'
);

select throws_ok(
  $$ update public.profiles set display_name = 'Anônimo' $$,
  '42501',
  null,
  'quem não está logado não altera perfis'
);

select * from finish();

rollback;
