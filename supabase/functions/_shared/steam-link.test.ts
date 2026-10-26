import { assertEquals, assertRejects } from 'jsr:@std/assert@1';

import { SteamGame, SteamReading, SteamUnavailableError } from './steam-api.ts';
import {
  ConnectDeps,
  MIN_SYNC_INTERVAL_MS,
  ReadingPatch,
  cardDay,
  connectSteam,
  recheckAccount,
  syncAllAccounts,
  syncAccount,
} from './steam-link.ts';
import { OpenIdParams, STEAM_OPENID_ENDPOINT } from './steam-openid.ts';

const NOW = new Date('2026-10-19T18:02:00Z');
const USER = 'usuario-1';
const STEAM_ID = '76561198000000001';

const publicReading: SteamReading = {
  personaName: 'ana_steam',
  visibility: 'public',
  currentGame: 'ELDEN RING',
  games: [
    { appId: 1, name: 'ELDEN RING', minutesTotal: 1200, minutes2Weeks: 300 },
    { appId: 2, name: 'CS2', minutesTotal: 90, minutes2Weeks: 30 },
  ],
};

function openId(overrides: Record<string, string> = {}): OpenIdParams {
  return {
    ns: 'http://specs.openid.net/auth/2.0',
    mode: 'id_res',
    op_endpoint: STEAM_OPENID_ENDPOINT,
    claimed_id: `https://steamcommunity.com/openid/id/${STEAM_ID}`,
    identity: `https://steamcommunity.com/openid/id/${STEAM_ID}`,
    return_to: 'http://localhost:4200/steam/retorno',
    response_nonce: '2026-10-19T18:00:00Zabc',
    assoc_handle: '1',
    signed: 'signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle',
    sig: 'assinatura=',
    ...overrides,
  };
}

interface SavedSnapshots {
  userId: string;
  day: string;
  games: readonly SteamGame[];
}

function deps(overrides: Partial<ConnectDeps> = {}): ConnectDeps & {
  saved: ReadingPatch[];
  linked: string[];
  snapshots: SavedSnapshots[];
  cleared: string[];
} {
  const saved: ReadingPatch[] = [];
  const linked: string[] = [];
  const snapshots: SavedSnapshots[] = [];
  const cleared: string[] = [];
  return {
    saved,
    linked,
    cleared,
    snapshots,
    saveSnapshots: (userId, day, games) => {
      snapshots.push({ userId, day, games });
      return Promise.resolve();
    },
    allowedOrigins: ['http://localhost:4200'],
    confirmWithSteam: () => Promise.resolve(true),
    useNonce: () => Promise.resolve(true),
    findOwner: () => Promise.resolve(null),
    onSyncError: () => undefined,
    clearSnapshots: (userId) => {
      cleared.push(userId);
      return Promise.resolve();
    },
    saveLink: (_userId, steamId) => {
      linked.push(steamId);
      return Promise.resolve('linked');
    },
    readSteam: () => Promise.resolve(publicReading),
    saveReading: (_userId, patch) => {
      saved.push(patch);
      return Promise.resolve();
    },
    now: () => NOW,
    ...overrides,
  };
}

Deno.test('conecta a conta confirmada pela Steam e faz a primeira leitura (CA2, CA3)', async () => {
  const d = deps();
  assertEquals(await connectSteam(d, USER, openId()), {
    status: 'connected',
    sync: { status: 'synced', visibility: 'public' },
  });
  assertEquals(d.linked, [STEAM_ID]);
  assertEquals(d.saved, [
    {
      personaName: 'ana_steam',
      visibility: 'public',
      currentGame: 'ELDEN RING',
      lastSyncedAt: NOW.toISOString(),
      baselineMinutes: 330,
    },
  ]);
});

Deno.test('volta para uma origem que não é do app não conecta (CA3)', async () => {
  const d = deps();
  for (const return_to of ['https://malicioso.test/steam/retorno', 'sem endereço']) {
    assertEquals(await connectSteam(d, USER, openId({ return_to })), { status: 'invalid' });
  }
  const semVolta = openId();
  delete (semVolta as Record<string, string>)['return_to'];
  assertEquals(await connectSteam(d, USER, semVolta), { status: 'invalid' });
  assertEquals(d.linked, []);
});

Deno.test(
  'resposta que não passa nas regras locais não chega a perguntar à Steam (CA3)',
  async () => {
    let asked = false;
    const d = deps({
      confirmWithSteam: () => {
        asked = true;
        return Promise.resolve(true);
      },
    });
    assertEquals(await connectSteam(d, USER, openId({ mode: 'cancel' })), { status: 'invalid' });
    assertEquals(asked, false);
  },
);

Deno.test('resposta que a Steam não confirma não conecta (CA3)', async () => {
  const d = deps({ confirmWithSteam: () => Promise.resolve(false) });
  assertEquals(await connectSteam(d, USER, openId()), { status: 'invalid' });
  assertEquals(d.linked, []);
});

Deno.test('volta já usada não conecta de novo (CA3, revisão 2)', async () => {
  const used = new Set<string>();
  const d = deps({
    useNonce: (nonce) => {
      if (used.has(nonce)) {
        return Promise.resolve(false);
      }
      used.add(nonce);
      return Promise.resolve(true);
    },
  });
  assertEquals((await connectSteam(d, USER, openId())).status, 'connected');
  assertEquals(await connectSteam(d, 'outra-pessoa', openId()), { status: 'invalid' });
  assertEquals(d.linked, [STEAM_ID]);
  assertEquals([...used], ['2026-10-19T18:00:00Zabc']);
});

Deno.test('só marca a volta como usada depois de a Steam confirmar (CA3)', async () => {
  const nonces: string[] = [];
  const d = deps({
    confirmWithSteam: () => Promise.resolve(false),
    useNonce: (nonce) => {
      nonces.push(nonce);
      return Promise.resolve(true);
    },
  });
  assertEquals(await connectSteam(d, USER, openId()), { status: 'invalid' });
  assertEquals(nonces, []);
});

Deno.test('conta Steam já ligada a outro perfil (CA4)', async () => {
  const d = deps({
    findOwner: () => Promise.resolve({ userId: 'outra-pessoa', baselineMinutes: 50 }),
  });
  assertEquals(await connectSteam(d, USER, openId()), { status: 'taken' });
  assertEquals(d.linked, []);
  assertEquals(d.saved, []);
});

Deno.test('outro perfil ligou a mesma conta ao mesmo tempo (CA4)', async () => {
  const d = deps({ saveLink: () => Promise.resolve('taken') });
  assertEquals(await connectSteam(d, USER, openId()), { status: 'taken' });
  assertEquals(d.saved, []);
});

Deno.test('reconectar a mesma conta mantém o ponto de partida (CA19)', async () => {
  const d = deps({ findOwner: () => Promise.resolve({ userId: USER, baselineMinutes: 120 }) });
  assertEquals((await connectSteam(d, USER, openId())).status, 'connected');
  assertEquals(d.linked, []);
  assertEquals('baselineMinutes' in d.saved[0], false);
  assertEquals(d.cleared, []);
});

Deno.test('trocar de conta liga a nova do zero e lê o ponto de partida dela (CA19)', async () => {
  const d = deps();
  assertEquals((await connectSteam(d, USER, openId())).status, 'connected');
  assertEquals(d.linked, [STEAM_ID]);
  assertEquals(d.cleared, [USER]);
  assertEquals(d.snapshots.length, 1);
  assertEquals(d.saved[0].baselineMinutes, 330);
});

Deno.test(
  'conecta mesmo se a primeira leitura falhar; a leitura fica para depois (CA15)',
  async () => {
    const d = deps({ readSteam: () => Promise.reject(new SteamUnavailableError('fora do ar')) });
    assertEquals(await connectSteam(d, USER, openId()), {
      status: 'connected',
      sync: { status: 'unavailable' },
    });
    assertEquals(d.saved, []);
  },
);

Deno.test(
  'erro inesperado na primeira leitura: continua conectada e registra o erro (CA19)',
  async () => {
    const errors: unknown[] = [];
    const d = deps({
      saveReading: () => Promise.reject(new Error('banco fora')),
      onSyncError: (error) => errors.push(error),
    });
    assertEquals(await connectSteam(d, USER, openId()), {
      status: 'connected',
      sync: { status: 'unavailable' },
    });
    assertEquals(d.linked, [STEAM_ID]);
    assertEquals((errors[0] as Error).message, 'banco fora');
  },
);

Deno.test('perfil privado: guarda a visibilidade, sem ponto de partida (CA6)', async () => {
  const d = deps({
    readSteam: () =>
      Promise.resolve({ personaName: 'x', visibility: 'private', currentGame: null, games: [] }),
  });
  assertEquals(await syncAccount(d, { userId: USER, steamId: STEAM_ID, baselineMinutes: null }), {
    status: 'synced',
    visibility: 'private',
  });
  assertEquals(d.saved[0].visibility, 'private');
  assertEquals('baselineMinutes' in d.saved[0], false);
});

Deno.test('leituras seguintes não mexem no ponto de partida', async () => {
  const d = deps();
  await syncAccount(d, { userId: USER, steamId: STEAM_ID, baselineMinutes: 120 });
  assertEquals('baselineMinutes' in d.saved[0], false);
});

Deno.test('erro que não é da Steam sobe, para a função responder erro', async () => {
  const d = deps({ readSteam: () => Promise.reject(new Error('bug')) });
  await assertRejects(
    () => syncAccount(d, { userId: USER, steamId: STEAM_ID, baselineMinutes: null }),
    Error,
    'bug',
  );
});

Deno.test(
  '"Já deixei público": lê a Steam se a última tentativa passou do intervalo (CA20)',
  async () => {
    const befores: Date[] = [];
    const d = {
      ...deps(),
      claimSync: (_userId: string, before: Date) => (befores.push(before), Promise.resolve(true)),
    };
    const account = {
      userId: USER,
      steamId: STEAM_ID,
      baselineMinutes: 120,
      visibility: 'private' as const,
    };
    assertEquals(await recheckAccount(d, account), { status: 'synced', visibility: 'public' });
    assertEquals(befores, [new Date(NOW.getTime() - MIN_SYNC_INTERVAL_MS)]);
    assertEquals(d.saved.length, 1);
  },
);

Deno.test('dentro do intervalo, devolve a última leitura sem chamar a Steam (CA20)', async () => {
  let read = false;
  const d = {
    ...deps({ readSteam: () => ((read = true), Promise.resolve(publicReading)) }),
    claimSync: () => Promise.resolve(false),
  };
  const account = { userId: USER, steamId: STEAM_ID, baselineMinutes: 120 };
  assertEquals(await recheckAccount(d, { ...account, visibility: 'private' }), {
    status: 'synced',
    visibility: 'private',
  });
  assertEquals(await recheckAccount(d, { ...account, visibility: null }), {
    status: 'unavailable',
  });
  assertEquals(read, false);
  assertEquals(d.saved, []);
});

Deno.test('leitura pública grava a foto do dia com o tempo de cada jogo (CA14)', async () => {
  const d = deps();
  await syncAccount(d, { userId: USER, steamId: STEAM_ID, baselineMinutes: 120 });
  assertEquals(d.snapshots, [{ userId: USER, day: '2026-10-19', games: publicReading.games }]);
});

Deno.test(
  'detalhes de jogos privados ou Steam fora do ar: sem foto do dia (CA6, CA15)',
  async () => {
    const privada = deps({
      readSteam: () =>
        Promise.resolve({ personaName: 'x', visibility: 'private', currentGame: null, games: [] }),
    });
    await syncAccount(privada, { userId: USER, steamId: STEAM_ID, baselineMinutes: null });
    assertEquals(privada.snapshots, []);

    const fora = deps({ readSteam: () => Promise.reject(new SteamUnavailableError('fora')) });
    await syncAccount(fora, { userId: USER, steamId: STEAM_ID, baselineMinutes: null });
    assertEquals(fora.snapshots, []);
  },
);

Deno.test('conta pública sem jogos: guarda a leitura, sem foto', async () => {
  const d = deps({
    readSteam: () =>
      Promise.resolve({ personaName: 'x', visibility: 'public', currentGame: null, games: [] }),
  });
  await syncAccount(d, { userId: USER, steamId: STEAM_ID, baselineMinutes: null });
  assertEquals(d.snapshots, []);
  assertEquals(d.saved.length, 1);
});

Deno.test('se a foto falhar, a última leitura não avança (CA15)', async () => {
  const d = deps({ saveSnapshots: () => Promise.reject(new Error('banco fora')) });
  await assertRejects(
    () => syncAccount(d, { userId: USER, steamId: STEAM_ID, baselineMinutes: 120 }),
    Error,
    'banco fora',
  );
  assertEquals(d.saved, []);
});

Deno.test('o dia do card segue o fuso de São Paulo', () => {
  assertEquals(cardDay(new Date('2026-10-19T18:02:00Z')), '2026-10-19');
  // 01h30 UTC ainda é 22h30 do dia anterior em São Paulo.
  assertEquals(cardDay(new Date('2026-10-20T01:30:00Z')), '2026-10-19');
  assertEquals(cardDay(new Date('2026-10-20T03:00:00Z')), '2026-10-20');
  assertEquals(cardDay(new Date('2026-11-01T02:59:00Z')), '2026-10-31');
});

function contas(total: number) {
  return Array.from({ length: total }, (_, i) => ({
    userId: `u${String(i).padStart(3, '0')}`,
    steamId: `7656119800000${String(i).padStart(4, '0')}`,
    baselineMinutes: 10,
  }));
}

Deno.test('leitura agendada: lê todas as contas, em lotes (CA14)', async () => {
  const todas = contas(5);
  const pedidos: (string | null)[] = [];
  const d = {
    ...deps(),
    listAccounts: (after: string | null, limit: number) => {
      pedidos.push(after);
      const start = after === null ? 0 : todas.findIndex((c) => c.userId === after) + 1;
      return Promise.resolve(todas.slice(start, start + limit));
    },
    onAccountError: () => undefined,
  };
  assertEquals(await syncAllAccounts(d, 2), { synced: 5, unavailable: 0, failed: 0 });
  assertEquals(pedidos, [null, 'u001', 'u003']);
  assertEquals(
    d.snapshots.map((s) => s.userId),
    ['u000', 'u001', 'u002', 'u003', 'u004'],
  );
});

Deno.test('lote cheio no fim: pede mais uma vez e para no vazio', async () => {
  const todas = contas(4);
  const pedidos: (string | null)[] = [];
  const d = {
    ...deps(),
    listAccounts: (after: string | null, limit: number) => {
      pedidos.push(after);
      const start = after === null ? 0 : todas.findIndex((c) => c.userId === after) + 1;
      return Promise.resolve(todas.slice(start, start + limit));
    },
    onAccountError: () => undefined,
  };
  assertEquals(await syncAllAccounts(d, 2), { synced: 4, unavailable: 0, failed: 0 });
  assertEquals(pedidos, [null, 'u001', 'u003']);
});

Deno.test('Steam fora do ar ou erro de uma conta não param as outras (CA15)', async () => {
  const erros: string[] = [];
  const d = {
    ...deps({
      readSteam: (steamId) => {
        if (steamId.endsWith('0001')) {
          return Promise.reject(new SteamUnavailableError('fora'));
        }
        if (steamId.endsWith('0002')) {
          return Promise.reject(new Error('bug'));
        }
        return Promise.resolve(publicReading);
      },
    }),
    listAccounts: (after: string | null) => Promise.resolve(after === null ? contas(4) : []),
    onAccountError: (userId: string) => erros.push(userId),
  };
  assertEquals(await syncAllAccounts(d, 50), { synced: 2, unavailable: 1, failed: 1 });
  assertEquals(erros, ['u002']);
});

Deno.test('sem contas: não lê nada', async () => {
  const d = {
    ...deps(),
    listAccounts: () => Promise.resolve([]),
    onAccountError: () => undefined,
  };
  assertEquals(await syncAllAccounts(d), { synced: 0, unavailable: 0, failed: 0 });
});
