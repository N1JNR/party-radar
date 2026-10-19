-- Perfil básico de quem entra no Party Radar (spec 001, CA4, CA16 e CA18).
-- O perfil nasce por um gatilho em auth.users, na mesma transação do cadastro; o app só lê.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  avatar_url text,
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Perfil básico (nome, @usuário e foto), visível para quem está logado. Sem e-mail (CA18).';

-- RLS: quem está logado lê todos os perfis; ninguém cria, altera ou apaga pela API.
-- Criar é do gatilho abaixo; editar será da spec 006-perfil.
alter table public.profiles enable row level security;

create policy "perfis visíveis para quem está logado"
  on public.profiles
  for select
  to authenticated
  using (true);

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

-- @usuário a partir de um nome: minúsculas, sem acentos, só a-z, 0-9 e _, até 20 caracteres.
create function public.username_base(source text)
returns text
language sql
immutable
set search_path = ''
as $$
  select left(
    regexp_replace(
      translate(
        lower(coalesce(source, '')),
        'áàâãäåéèêëíìîïóòôõöúùûüçñý',
        'aaaaaaeeeeiiiiooooouuuucny'
      ),
      '[^a-z0-9_]',
      '',
      'g'
    ),
    20
  );
$$;

revoke execute on function public.username_base(text) from public, anon, authenticated;

-- Cria o perfil de quem acabou de se cadastrar (CA4, CA16).
-- Nome: o de exibição do provedor, depois o usuário, depois o e-mail antes do "@".
-- @usuário: base do nome; menos de 3 caracteres vira "jogador"; se já existir, ganha 2, 3…
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  profile_name text := coalesce(
    nullif(btrim(meta ->> 'full_name'), ''),
    nullif(btrim(meta ->> 'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Jogador'
  );
  base text := public.username_base(profile_name);
  candidate text;
  attempt integer := 1;
begin
  if char_length(base) < 3 then
    base := 'jogador';
  end if;

  loop
    candidate := case
      when attempt = 1 then base
      else left(base, 20 - char_length(attempt::text)) || attempt::text
    end;
    begin
      insert into public.profiles (id, display_name, username, avatar_url)
      values (new.id, left(profile_name, 80), candidate, nullif(meta ->> 'avatar_url', ''))
      on conflict (id) do nothing;
      return new;
    exception when unique_violation then
      -- Outro perfil já usa este @usuário (inclusive num cadastro simultâneo): tenta o próximo.
      attempt := attempt + 1;
    end;
  end loop;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
