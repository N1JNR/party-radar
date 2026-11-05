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
- [x] T2 — `environment.ts` com a URL e a publishable key do projeto novo
- [x] T3 — PR com T1 e T2 (#39)

**Supabase na nuvem (projeto novo, região São Paulo)**

- [x] T4 — Jorge: criar o projeto e guardar a senha do banco (`vxwnmcsuqphwohddxrlv`, em São Paulo)
- [x] T5 — Jorge: `npx supabase login` e `npx supabase link --project-ref vxwnmcsuqphwohddxrlv`
- [x] T6 — Aplicar as migrations com `npx supabase db push`. A Temporada 1 começa aqui
- [x] T7 — Publicar as funções com `npx supabase functions deploy`
- [x] T8 — Jorge: girar o Client Secret do Discord e ligar o provedor Discord no painel com o segredo novo
- [x] T9 — Jorge: no Discord, acrescentar `https://vxwnmcsuqphwohddxrlv.supabase.co/auth/v1/callback` em OAuth2 > Redirects
- [x] T10 — `STEAM_WEB_API_KEY` e `APP_ORIGINS=https://party-radar-kappa.vercel.app` nas funções
- [x] T11 — `npm run db:agendamentos:nuvem`: grava `project_url` e `service_role_key` no Vault e a mesma JWT no segredo
      `SCHEDULE_KEY` das funções; sem ele, toda chamada agendada recebe 401 (`docs/specs/003-steam/plan.md`)

**Vercel**

- [x] T12 — Entrar com o GitHub e importar `N1JNR/party-radar`
- [x] T13 — No Supabase, em Authentication > URL Configuration, usar o endereço da Vercel como Site URL e
      acrescentar `https://<endereço-na-vercel>/**` nos Redirects

- [x] T20 — No Supabase, desligar o provedor Email: o app só entra com Discord, e, ligado, qualquer um cria
      conta por fora, sem passar pelo Discord

**Conferência**

- [x] T14 — Abrir uma rota direto (`/conversas`) e recarregar, sem 404
- [x] T15 — Entrar com o Discord, conectar a Steam e ver o card
- [ ] T16 — Duas contas reais: amizade, conversa em tempo real e squad, em dois aparelhos (falta da spec 007)
- [ ] T17 — Celular de verdade: teclado aberto, com a caixa de texto à vista (CA25 da spec 007)
- [ ] T18 — Agendamentos: `steam-presence` a cada 5 minutos, a leitura das 23h55 e os troféus, em `net._http_response`
- [ ] T19 — Sem sessão, abrir `/login?simular-login=sucesso` no site, tocar em "Continuar com Discord" e ir para o Discord
      de verdade. `?simular=` já foi conferido e não tem efeito; este parâmetro só foi visto até a tela de login

## Riscos

- **Falha silenciosa dos agendamentos:** o cron marca "succeeded" mesmo com 401, e nada avisa. Confira com
  `npm run db:agendamentos:nuvem -- --conferir`. Depois de girar a JWT, rode `npm run db:agendamentos:nuvem`: ele grava o
  Vault e o `SCHEDULE_KEY` juntos.
- **E-mail da conta na Vercel:** o principal é um Outlook a que o Jorge não tem mais acesso. O botão de implantar do painel pede
  um código nele; o deploy pelo Git, ao chegar algo na `main`, é o caminho usado. Outras ações do painel podem pedir o mesmo
  código. Solução: recuperar o Outlook ou falar com o suporte da Vercel.
- **Sem moderação:** não há denúncia no bate-papo. Até existir, só convide amigos.
- **Temporada:** ela começa quando a migration é aplicada, e todos recomeçam do zero na nuvem.
- **Os dados locais não vão para a nuvem:** cada pessoa entra e conecta a Steam de novo.
- **Endereço:** usando o da Vercel, trocar por um domínio próprio depois pede repetir T9, T10 e T13.
