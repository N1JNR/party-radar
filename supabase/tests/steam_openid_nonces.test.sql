-- Voltas da Steam já usadas: cada uma vale uma vez só e ninguém mexe pela API (spec 003, CA3).
begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

-- Como as Edge Functions, com a secret key (papel com acesso total).
insert into public.steam_openid_nonces (nonce) values ('2026-10-20T15:00:00Zabc123');

select throws_ok(
  $$ insert into public.steam_openid_nonces (nonce) values ('2026-10-20T15:00:00Zabc123') $$,
  '23505',
  null,
  'a mesma volta da Steam não é aceita duas vezes'
);

select throws_ok(
  $$ insert into public.steam_openid_nonces (nonce) values ('curto') $$,
  '23514',
  null,
  'o nonce tem o formato da Steam'
);

select is(
  (select used_at is not null from public.steam_openid_nonces
   where nonce = '2026-10-20T15:00:00Zabc123'),
  true,
  'guarda quando a volta foi usada'
);

-- Logado: não lê nem grava nonces.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-0000000000a1", "role": "authenticated"}', true);

select throws_ok(
  $$ select * from public.steam_openid_nonces $$,
  '42501',
  null,
  'quem está logado não lê as voltas usadas'
);

select throws_ok(
  $$ insert into public.steam_openid_nonces (nonce) values ('2026-10-20T15:00:00Zoutro1') $$,
  '42501',
  null,
  'quem está logado não grava voltas'
);

reset role;
set local role anon;

select throws_ok(
  $$ select * from public.steam_openid_nonces $$,
  '42501',
  null,
  'quem não está logado não lê as voltas usadas'
);

reset role;

select * from finish();

rollback;
