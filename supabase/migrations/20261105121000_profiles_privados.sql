-- Cada um lê só o próprio perfil (spec 006, CA20). Antes, qualquer pessoa logada listava todos os perfis, o que
-- deixava varrer quem está no app. Os outros perfis chegam só pelas funções de amizade, com o @usuário exato ou
-- para amigos e pedidos. Substitui o CA18 da spec 001.

drop policy "perfis visíveis para quem está logado" on public.profiles;

create policy "cada um lê o próprio perfil"
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

comment on table public.profiles is
  'Perfil básico (nome, @usuário e foto). Cada um lê o próprio; os outros, só pelas funções de amizade. Sem e-mail.';
