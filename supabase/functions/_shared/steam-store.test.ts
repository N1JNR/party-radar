import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';

import { Fetch, SteamGame } from './steam-api.ts';
import {
  MAX_STORE_LOOKUPS,
  categoryFromGenres,
  gamesToClassify,
  readStoreGenres,
} from './steam-store.ts';

const game = (appId: number, minutesTotal: number): SteamGame => ({
  appId,
  name: `Jogo ${appId}`,
  minutesTotal,
  minutes2Weeks: 0,
});

Deno.test('o gênero da loja vira tipo, na ordem de prioridade (CA7)', () => {
  assertEquals(categoryFromGenres(['Racing', 'Sports']), 'corrida');
  assertEquals(categoryFromGenres(['Action', 'Sports', 'Simulation']), 'esporte');
  assertEquals(categoryFromGenres(['Action', 'RPG', 'Adventure']), 'rpg');
  assertEquals(categoryFromGenres(['Simulation', 'Adventure']), 'simulacao');
  assertEquals(categoryFromGenres(['Action', 'Adventure', 'Indie']), 'aventura');
});

Deno.test('"Action" sozinho não decide, e sem gênero vira outros (CA8)', () => {
  assertEquals(categoryFromGenres(['Action']), 'outros');
  assertEquals(categoryFromGenres(['Indie', 'Casual']), 'outros');
  assertEquals(categoryFromGenres([]), 'outros');
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

Deno.test('lê os gêneros da loja, em inglês', async () => {
  const urls: string[] = [];
  const fetch: Fetch = (url) => {
    urls.push(url);
    return Promise.resolve(
      json({
        '730': {
          success: true,
          data: {
            genres: [
              { id: '1', description: 'Action' },
              { id: '2', description: 'Free To Play' },
            ],
          },
        },
      }),
    );
  };
  assertEquals(await readStoreGenres(fetch, 730), ['Action', 'Free To Play']);
  assertStringIncludes(urls[0], 'appids=730');
  assertStringIncludes(urls[0], 'l=english');
});

Deno.test(
  'jogo removido da loja: lista vazia, para gravar "outros" e não consultar de novo',
  async () => {
    const fetch: Fetch = () => Promise.resolve(json({ '7': { success: false } }));
    assertEquals(await readStoreGenres(fetch, 7), []);
  },
);

Deno.test('gênero com formato errado é ignorado', async () => {
  const fetch: Fetch = () =>
    Promise.resolve(json({ '7': { success: true, data: { genres: [{ description: 1 }, {}] } } }));
  assertEquals(await readStoreGenres(fetch, 7), []);
});

Deno.test(
  'loja fora do ar, erro HTTP ou resposta estranha: null, para tentar de novo (CA8)',
  async () => {
    const cases: Fetch[] = [
      () => Promise.reject(new Error('fora do ar')),
      () => Promise.resolve(json({}, 429)),
      () => Promise.resolve(new Response('<html>')),
      () => Promise.resolve(json({})),
      () => Promise.resolve(json({ '7': {} })),
    ];
    for (const fetch of cases) {
      assertEquals(await readStoreGenres(fetch, 7), null);
    }
  },
);

Deno.test('classifica só jogos jogados, sem tipo, de mais horas primeiro', () => {
  const games = [game(1, 10), game(2, 500), game(3, 0), game(4, 90)];
  assertEquals(
    gamesToClassify(games, new Set([4])).map((g) => g.appId),
    [2, 1],
  );
});

Deno.test('respeita o limite de consultas por leitura', () => {
  const games = Array.from({ length: MAX_STORE_LOOKUPS + 5 }, (_, i) => game(i + 1, i + 1));
  const picked = gamesToClassify(games, new Set());
  assertEquals(picked.length, MAX_STORE_LOOKUPS);
  assertEquals(picked[0].appId, MAX_STORE_LOOKUPS + 5);
});
