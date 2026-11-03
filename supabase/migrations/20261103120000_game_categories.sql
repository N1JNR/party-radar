-- Tipo de cada jogo, para o radar do jogador (spec 004, CA6 a CA8). A loja da Steam é genérica demais
-- (chama quase todo jogo de tiro de "Ação"), então a lista começa com os jogos populares escritos à
-- mão (source = 'curada'). Jogo fora da lista é classificado uma vez pelo gênero da loja, na leitura
-- da Steam (source = 'loja'). Jogo sem linha aqui conta em "Outros".
--
-- Não há dado pessoal: quem está logado lê, e só as Edge Functions gravam, com a secret key.

create table public.game_categories (
  app_id integer primary key check (app_id > 0),
  category text not null check (
    category in ('tiro', 'esporte', 'corrida', 'simulacao', 'arcade', 'rpg', 'aventura', 'outros')
  ),
  source text not null default 'curada' check (source in ('curada', 'loja'))
);

comment on table public.game_categories is
  'Tipo de cada jogo da Steam para o radar (CA6). Quem está logado lê; só as Edge Functions gravam.';

alter table public.game_categories enable row level security;

create policy "quem está logado lê os tipos de jogo"
  on public.game_categories
  for select
  to authenticated
  using (true);

revoke all on public.game_categories from anon, authenticated;
grant select on public.game_categories to authenticated;

insert into public.game_categories (app_id, category) values
  -- Tiro
  (730, 'tiro'), -- Counter-Strike 2
  (440, 'tiro'), -- Team Fortress 2
  (550, 'tiro'), -- Left 4 Dead 2
  (218620, 'tiro'), -- PAYDAY 2
  (359550, 'tiro'), -- Rainbow Six Siege
  (460930, 'tiro'), -- Ghost Recon Wildlands
  (578080, 'tiro'), -- PUBG
  (581320, 'tiro'), -- Insurgency: Sandstorm
  (594650, 'tiro'), -- Hunt: Showdown
  (553850, 'tiro'), -- HELLDIVERS 2
  (976730, 'tiro'), -- Halo: The Master Chief Collection
  (1085660, 'tiro'), -- Destiny 2
  (1172470, 'tiro'), -- Apex Legends
  (1517290, 'tiro'), -- Battlefield 2042
  (1808500, 'tiro'), -- ARC Raiders
  (1938090, 'tiro'), -- Call of Duty
  (2073850, 'tiro'), -- THE FINALS
  (2357570, 'tiro'), -- Overwatch
  (2507950, 'tiro'), -- Delta Force
  (2767030, 'tiro'), -- Marvel Rivals
  (2807960, 'tiro'), -- Battlefield 6
  (4783780, 'tiro'), -- Call of Duty: Modern Warfare 4 - Beta
  -- Esporte
  (252950, 'esporte'), -- Rocket League
  (1665460, 'esporte'), -- eFootball
  (2669320, 'esporte'), -- EA SPORTS FC 25
  (2878980, 'esporte'), -- NBA 2K25
  (3405690, 'esporte'), -- EA SPORTS FC 26
  -- Corrida
  (244210, 'corrida'), -- Assetto Corsa
  (690790, 'corrida'), -- DiRT Rally 2.0
  (805550, 'corrida'), -- Assetto Corsa Competizione
  (1222680, 'corrida'), -- Need for Speed Heat
  (1293830, 'corrida'), -- Forza Horizon 4
  (1551360, 'corrida'), -- Forza Horizon 5
  (1846380, 'corrida'), -- Need for Speed Unbound
  (2488620, 'corrida'), -- F1 24
  (3059520, 'corrida'), -- F1 25
  -- Simulação
  (227300, 'simulacao'), -- Euro Truck Simulator 2
  (255710, 'simulacao'), -- Cities: Skylines
  (270880, 'simulacao'), -- American Truck Simulator
  (413150, 'simulacao'), -- Stardew Valley
  (1222670, 'simulacao'), -- The Sims 4
  (1248130, 'simulacao'), -- Farming Simulator 22
  (1250410, 'simulacao'), -- Microsoft Flight Simulator 2020
  -- Arcade
  (229890, 'arcade'), -- Joe Danger
  (242110, 'arcade'), -- Joe Danger 2: The Movie
  (268910, 'arcade'), -- Cuphead
  (291550, 'arcade'), -- Brawlhalla
  (945360, 'arcade'), -- Among Us
  (1097150, 'arcade'), -- Fall Guys
  (1145360, 'arcade'), -- Hades
  (1364780, 'arcade'), -- Street Fighter 6
  (1778820, 'arcade'), -- TEKKEN 8
  (1794680, 'arcade'), -- Vampire Survivors
  (1971870, 'arcade'), -- Mortal Kombat 1
  -- RPG
  (238960, 'rpg'), -- Path of Exile
  (292030, 'rpg'), -- The Witcher 3
  (374320, 'rpg'), -- DARK SOULS III
  (489830, 'rpg'), -- Skyrim Special Edition
  (814380, 'rpg'), -- Sekiro
  (1086940, 'rpg'), -- Baldur's Gate 3
  (1091500, 'rpg'), -- Cyberpunk 2077
  (1245620, 'rpg'), -- ELDEN RING
  (2246340, 'rpg'), -- Monster Hunter Wilds
  (2344520, 'rpg'), -- Diablo IV
  -- Aventura
  (105600, 'aventura'), -- Terraria
  (242760, 'aventura'), -- The Forest
  (252490, 'aventura'), -- Rust
  (264710, 'aventura'), -- Subnautica
  (271590, 'aventura'), -- Grand Theft Auto V
  (275850, 'aventura'), -- No Man's Sky
  (367520, 'aventura'), -- Hollow Knight
  (892970, 'aventura'), -- Valheim
  (969990, 'aventura'), -- SpongeBob SquarePants: Battle for Bikini Bottom
  (990630, 'aventura'), -- The Last Campfire
  (1174180, 'aventura'), -- Red Dead Redemption 2
  (1326470, 'aventura'), -- Sons Of The Forest
  (1623730, 'aventura'), -- Palworld
  -- Não é jogo
  (431960, 'outros'); -- Wallpaper Engine
