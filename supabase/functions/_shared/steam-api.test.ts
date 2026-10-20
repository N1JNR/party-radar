import { assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@1';

import {
  Fetch,
  SteamUnavailableError,
  parseOwnedGames,
  parsePlayerSummary,
  readSteam,
  recentMinutes,
  withTimeout,
} from './steam-api.ts';

/** `fetch` que nunca responde: só termina quando o pedido é cancelado. */
function hangingFetch(_url: string, init?: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
  });
}

const STEAM_ID = '76561198000000001';

const summary = (fields: Record<string, unknown>) => ({
  response: { players: [{ steamid: STEAM_ID, personaname: 'ana_steam', ...fields }] },
});

const owned = {
  response: {
    game_count: 3,
    games: [
      { appid: 1245620, name: 'ELDEN RING', playtime_forever: 1200, playtime_2weeks: 300 },
      { appid: 730, name: 'Counter-Strike 2', playtime_forever: 90.7 },
      { name: 'sem appid', playtime_forever: 5 },
    ],
  },
};

/** `fetch` falso: responde por trecho da URL e guarda as URLs pedidas. */
function fakeFetch(routes: Record<string, () => Response>): Fetch & { urls: string[] } {
  const urls: string[] = [];
  const fetch = (url: string) => {
    urls.push(url);
    const route = Object.keys(routes).find((part) => url.includes(part));
    return route ? Promise.resolve(routes[route]()) : Promise.reject(new Error('sem rota'));
  };
  return Object.assign(fetch, { urls });
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

Deno.test('perfil público com jogo aberto', () => {
  assertEquals(
    parsePlayerSummary(
      summary({ communityvisibilitystate: 3, gameextrainfo: 'ELDEN RING' }),
      STEAM_ID,
    ),
    { personaName: 'ana_steam', visibility: 'public', currentGame: 'ELDEN RING' },
  );
});

Deno.test('perfil privado não mostra o jogo aberto (CA6)', () => {
  assertEquals(
    parsePlayerSummary(
      summary({ communityvisibilitystate: 1, gameextrainfo: 'ELDEN RING' }),
      STEAM_ID,
    ),
    { personaName: 'ana_steam', visibility: 'private', currentGame: null },
  );
});

Deno.test('perfil sem nome nem jogo', () => {
  assertEquals(
    parsePlayerSummary(
      { response: { players: [{ steamid: STEAM_ID, communityvisibilitystate: 3 }] } },
      STEAM_ID,
    ),
    { personaName: null, visibility: 'public', currentGame: null },
  );
});

Deno.test('conta que não está na resposta', () => {
  assertEquals(parsePlayerSummary({ response: { players: [] } }, STEAM_ID), null);
  assertEquals(parsePlayerSummary({}, STEAM_ID), null);
  assertEquals(parsePlayerSummary(null, STEAM_ID), null);
});

Deno.test('jogos com tempo total e das últimas 2 semanas, em minutos inteiros', () => {
  assertEquals(parseOwnedGames(owned), [
    { appId: 1245620, name: 'ELDEN RING', minutesTotal: 1200, minutes2Weeks: 300 },
    { appId: 730, name: 'Counter-Strike 2', minutesTotal: 90, minutes2Weeks: 0 },
  ]);
});

Deno.test('jogo sem nome usa o número do app', () => {
  assertEquals(parseOwnedGames({ response: { game_count: 1, games: [{ appid: 10 }] } }), [
    { appId: 10, name: 'App 10', minutesTotal: 0, minutes2Weeks: 0 },
  ]);
});

Deno.test('detalhes de jogos privados: a Steam responde vazio (CA6)', () => {
  assertEquals(parseOwnedGames({ response: {} }), null);
  assertEquals(parseOwnedGames({}), null);
});

Deno.test('conta pública sem jogos', () => {
  assertEquals(parseOwnedGames({ response: { game_count: 0 } }), []);
});

Deno.test('ponto de partida: soma das últimas 2 semanas', () => {
  assertEquals(recentMinutes(parseOwnedGames(owned) ?? []), 300);
  assertEquals(recentMinutes([]), 0);
});

Deno.test(
  'readSteam lê perfil e jogos de uma conta pública, com a chave nas duas chamadas',
  async () => {
    const fetch = fakeFetch({
      GetPlayerSummaries: () => jsonResponse(summary({ communityvisibilitystate: 3 })),
      GetOwnedGames: () => jsonResponse(owned),
    });
    const reading = await readSteam(fetch, 'chave-de-teste', STEAM_ID);
    assertEquals(reading.visibility, 'public');
    assertEquals(reading.games.length, 2);
    assertEquals(fetch.urls.length, 2);
    assertStringIncludes(fetch.urls[0], 'key=chave-de-teste');
    assertStringIncludes(fetch.urls[1], `steamid=${STEAM_ID}`);
  },
);

Deno.test('readSteam: perfil privado não pede os jogos (CA6)', async () => {
  const fetch = fakeFetch({
    GetPlayerSummaries: () => jsonResponse(summary({ communityvisibilitystate: 1 })),
  });
  const reading = await readSteam(fetch, 'k', STEAM_ID);
  assertEquals(reading, {
    personaName: 'ana_steam',
    visibility: 'private',
    currentGame: null,
    games: [],
  });
  assertEquals(fetch.urls.length, 1);
});

Deno.test(
  'readSteam: perfil público com detalhes de jogos privados conta como privado (CA6)',
  async () => {
    const fetch = fakeFetch({
      GetPlayerSummaries: () =>
        jsonResponse(summary({ communityvisibilitystate: 3, gameextrainfo: 'CS2' })),
      GetOwnedGames: () => jsonResponse({ response: {} }),
    });
    const reading = await readSteam(fetch, 'k', STEAM_ID);
    assertEquals(reading.visibility, 'private');
    assertEquals(reading.currentGame, null);
    assertEquals(reading.games, []);
  },
);

Deno.test(
  'readSteam: erro HTTP, JSON inválido, rede ou conta sumida viram Steam indisponível (CA15)',
  async () => {
    const cases: Fetch[] = [
      fakeFetch({ GetPlayerSummaries: () => jsonResponse({}, 500) }),
      fakeFetch({ GetPlayerSummaries: () => new Response('<html>', { status: 200 }) }),
      fakeFetch({}),
      fakeFetch({ GetPlayerSummaries: () => jsonResponse({ response: { players: [] } }) }),
      fakeFetch({
        GetPlayerSummaries: () => jsonResponse(summary({ communityvisibilitystate: 3 })),
        GetOwnedGames: () => jsonResponse({}, 503),
      }),
    ];
    for (const fetch of cases) {
      await assertRejects(() => readSteam(fetch, 'k', STEAM_ID), SteamUnavailableError);
    }
  },
);

Deno.test('withTimeout: Steam que não responde vira Steam indisponível (CA20)', async () => {
  await assertRejects(
    () => readSteam(withTimeout(hangingFetch, 10), 'k', STEAM_ID),
    SteamUnavailableError,
  );
});

Deno.test('withTimeout: repassa o pedido e devolve a resposta a tempo', async () => {
  const seen: RequestInit[] = [];
  const fetch = withTimeout((_url, init) => {
    seen.push(init ?? {});
    return Promise.resolve(new Response('ok'));
  }, 1_000);
  const response = await fetch('https://steam.test', { method: 'POST' });
  assertEquals(await response.text(), 'ok');
  assertEquals(seen[0].method, 'POST');
  assertEquals(seen[0].signal instanceof AbortSignal, true);
});
