import { assertEquals, assertRejects } from 'jsr:@std/assert@1';

import { SteamUnavailableError } from './steam-api.ts';
import { PresenceAccount, PresenceDeps, refreshPresence } from './steam-presence.ts';

function contas(jogos: (string | null)[]): PresenceAccount[] {
  return jogos.map((currentGame, i) => ({
    userId: `u${i}`,
    steamId: `s${i}`,
    currentGame,
  }));
}

function deps(
  todas: PresenceAccount[],
  steam: (ids: readonly string[]) => Promise<Map<string, string | null>>,
): PresenceDeps & { saved: [string, string | null][]; calls: (readonly string[])[] } {
  const saved: [string, string | null][] = [];
  const calls: (readonly string[])[] = [];
  return {
    saved,
    calls,
    listAccounts: (after, limit) => {
      const start = after === null ? 0 : todas.findIndex((c) => c.userId === after) + 1;
      return Promise.resolve(todas.slice(start, start + limit));
    },
    readPresence: (ids) => {
      calls.push(ids);
      return steam(ids);
    },
    savePresence: (userId, game) => {
      saved.push([userId, game]);
      return Promise.resolve();
    },
  };
}

Deno.test('grava só o jogo aberto que mudou (CA10)', async () => {
  const d = deps(contas([null, 'CS2', 'Hades', null]), () =>
    Promise.resolve(
      new Map([
        ['s0', 'ELDEN RING'], // abriu um jogo
        ['s1', null], // fechou o jogo
        ['s2', 'Hades'], // continua no mesmo
        ['s3', null], // continua sem jogar
      ]),
    ),
  );
  assertEquals(await refreshPresence(d), { changed: 2, unavailableBatches: 0 });
  assertEquals(d.saved, [
    ['u0', 'ELDEN RING'],
    ['u1', null],
  ]);
});

Deno.test('lê em lotes, uma chamada à Steam por lote', async () => {
  const d = deps(contas([null, null, null, null, null]), (ids) =>
    Promise.resolve(new Map(ids.map((id) => [id, null]))),
  );
  await refreshPresence(d, 2);
  assertEquals(d.calls, [['s0', 's1'], ['s2', 's3'], ['s4']]);
});

Deno.test('conta que a Steam não devolveu fica como está', async () => {
  const d = deps(contas(['CS2']), () => Promise.resolve(new Map()));
  assertEquals(await refreshPresence(d), { changed: 0, unavailableBatches: 0 });
  assertEquals(d.saved, []);
});

Deno.test('Steam fora do ar num lote: segue para os outros (CA15)', async () => {
  let call = 0;
  const d = deps(contas([null, null, 'CS2']), (ids) => {
    call++;
    return call === 1
      ? Promise.reject(new SteamUnavailableError('fora'))
      : Promise.resolve(new Map(ids.map((id) => [id, null])));
  });
  assertEquals(await refreshPresence(d, 2), { changed: 1, unavailableBatches: 1 });
  assertEquals(d.saved, [['u2', null]]);
});

Deno.test('erro inesperado sobe, para a função responder erro', async () => {
  const d = deps(contas([null]), () => Promise.reject(new Error('bug')));
  await assertRejects(() => refreshPresence(d), Error, 'bug');
});

Deno.test('sem contas: não chama a Steam', async () => {
  const d = deps([], () => Promise.resolve(new Map()));
  assertEquals(await refreshPresence(d), { changed: 0, unavailableBatches: 0 });
  assertEquals(d.calls, []);
});
