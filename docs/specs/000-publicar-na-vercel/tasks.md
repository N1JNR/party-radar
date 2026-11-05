# 000 — Publicar na Vercel

Tarefa de manutenção, nível Pequena: colocar o app no ar para testar fora do ambiente local.

A Vercel hospeda só as telas. Login, banco, tempo real e leitura da Steam vêm de um projeto Supabase na nuvem, que
ainda não existe. Todas as rotas renderizam no navegador (`app.routes.server.ts`), então a Vercel serve arquivos
estáticos, sem servidor. Quando existirem páginas públicas com prévia de link (Wrapped), isso muda.

Criar contas e digitar senhas e segredos é com o Jorge. Segredo nenhum vai para o Git nem para o chat; a URL do projeto
e a publishable key (`sb_publishable_…`) são públicas e entram no `environment.ts`.

## Tarefas

**Repositório**

- [x] T1 — `vercel.json`: build, pasta de saída e toda rota caindo no `index.csr.html`
- [ ] T2 — `environment.ts` com a URL e a publishable key do projeto novo
- [ ] T3 — PR com T1 e T2

**Supabase na nuvem (projeto novo, região São Paulo)**

- [ ] T4 — Jorge: criar o projeto e guardar a senha do banco
- [ ] T5 — Jorge: `npx supabase login` e `npx supabase link --project-ref <ref>`
- [ ] T6 — Aplicar as migrations com `npx supabase db push`. A Temporada 1 começa aqui
- [ ] T7 — Publicar as funções com `npx supabase functions deploy`
- [ ] T8 — Jorge: girar o Client Secret do Discord e ligar o provedor Discord no painel com o segredo novo
- [ ] T9 — Jorge: no Discord, acrescentar `https://<ref>.supabase.co/auth/v1/callback` em OAuth2 > Redirects
- [ ] T10 — Jorge: `npx supabase secrets set` com `STEAM_WEB_API_KEY` e `APP_ORIGINS=https://<endereço-na-vercel>`
- [ ] T11 — Jorge: no Vault, gravar `project_url` e `service_role_key`. Tem de ser a chave `service_role` (JWT), não a
      `sb_secret_…`: com ela, os agendamentos falham em silêncio (`docs/specs/003-steam/plan.md`)

**Vercel**

- [ ] T12 — Jorge: entrar com o GitHub e importar `N1JNR/party-radar`
- [ ] T13 — Jorge: no Supabase, em Authentication > URL Configuration, usar o endereço da Vercel como Site URL e
      acrescentar `https://<endereço-na-vercel>/**` nos Redirects

**Conferência**

- [ ] T14 — Abrir uma rota direto (`/conversas`) e recarregar, sem 404
- [ ] T15 — Entrar com o Discord, conectar a Steam e ver o card
- [ ] T16 — Duas contas reais: amizade, conversa em tempo real e squad, em dois aparelhos (falta da spec 007)
- [ ] T17 — Celular de verdade: teclado aberto, com a caixa de texto à vista (CA25 da spec 007)
- [ ] T18 — Agendamentos: `steam-presence` a cada 5 minutos, a leitura das 23h55 e os troféus, em `net._http_response`
- [ ] T19 — Conferir que o build publicado não aceita `?simular-login=`

## Riscos

- **Sem moderação:** não há denúncia no bate-papo. Até existir, só convide amigos.
- **Temporada:** ela começa quando a migration é aplicada, e todos recomeçam do zero na nuvem.
- **Os dados locais não vão para a nuvem:** cada pessoa entra e conecta a Steam de novo.
- **Endereço:** usando o da Vercel, trocar por um domínio próprio depois pede repetir T9, T10 e T13.
