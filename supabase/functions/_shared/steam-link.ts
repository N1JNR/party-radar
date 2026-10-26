// Conectar a Steam e ler a conta (spec 003, CA2–CA7). A lógica recebe as dependências de fora
// (Steam, banco), para ser testada sem rede; as Edge Functions só ligam as peças.

import {
  SteamGame,
  SteamReading,
  SteamUnavailableError,
  Visibility,
  recentMinutes,
} from './steam-api.ts';
import { OpenIdParams, checkAssertion } from './steam-openid.ts';

/** Caminho da volta da Steam no app. */
export const STEAM_RETURN_PATH = '/steam/retorno';
const MAX_ASSERTION_AGE_MS = 5 * 60_000;

export interface SteamAccount {
  userId: string;
  steamId: string;
  /** `null` até a primeira leitura bem-sucedida guardar o ponto de partida. */
  baselineMinutes: number | null;
}

export interface ReadingPatch {
  personaName: string | null;
  visibility: Visibility;
  currentGame: string | null;
  lastSyncedAt: string;
  /** Só na primeira leitura: "últimas 2 semanas" como ponto de partida do primeiro mês. */
  baselineMinutes?: number;
}

export interface SyncDeps {
  readSteam(steamId: string): Promise<SteamReading>;
  saveReading(userId: string, patch: ReadingPatch): Promise<void>;
  /** Grava a foto do dia (`AAAA-MM-DD`) do tempo de cada jogo; a do mesmo dia é atualizada. */
  saveSnapshots(userId: string, day: string, games: readonly SteamGame[]): Promise<void>;
  now(): Date;
}

/** Fuso do "dia" e do "mês" do card (ajustes da Parte 3b). */
export const CARD_TIME_ZONE = 'America/Sao_Paulo';

/** O dia de `date` no fuso de São Paulo, como `AAAA-MM-DD`. */
export function cardDay(date: Date): string {
  // `en-CA` formata a data como AAAA-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CARD_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export type SyncResult = { status: 'synced'; visibility: Visibility } | { status: 'unavailable' };

/** Intervalo mínimo entre leituras pedidas pelo app (CA20). */
export const MIN_SYNC_INTERVAL_MS = 30_000;

export interface RecheckDeps extends SyncDeps {
  /**
   * Reserva a leitura se a última tentativa for anterior a `before` (ou se nunca houve).
   * `false` quando outra leitura aconteceu há pouco.
   */
  claimSync(userId: string, before: Date): Promise<boolean>;
}

/**
 * "Já deixei público" e "Tentar de novo" (CA7, CA19): lê a Steam no máximo a cada 30 segundos
 * por pessoa (CA20). Dentro do intervalo, devolve a última leitura guardada, sem chamar a Steam.
 */
export async function recheckAccount(
  deps: RecheckDeps,
  account: SteamAccount & { visibility: Visibility | null },
): Promise<SyncResult> {
  const before = new Date(deps.now().getTime() - MIN_SYNC_INTERVAL_MS);
  if (!(await deps.claimSync(account.userId, before))) {
    return account.visibility
      ? { status: 'synced', visibility: account.visibility }
      : { status: 'unavailable' };
  }
  return syncAccount(deps, account);
}

/**
 * Lê a Steam de uma conta e guarda o resultado. Se a Steam falhar, nada é sobrescrito: o card
 * continua com a última leitura (CA15).
 */
export async function syncAccount(deps: SyncDeps, account: SteamAccount): Promise<SyncResult> {
  let reading: SteamReading;
  try {
    reading = await deps.readSteam(account.steamId);
  } catch (error) {
    if (error instanceof SteamUnavailableError) {
      return { status: 'unavailable' };
    }
    throw error;
  }
  const now = deps.now();
  const patch: ReadingPatch = {
    personaName: reading.personaName,
    visibility: reading.visibility,
    currentGame: reading.currentGame,
    lastSyncedAt: now.toISOString(),
  };
  if (account.baselineMinutes === null && reading.visibility === 'public') {
    patch.baselineMinutes = recentMinutes(reading.games);
  }
  // A foto vem antes: a "última leitura" só avança quando o tempo de jogo também foi guardado.
  // Com os detalhes de jogos privados não há jogos, e a foto do dia fica de fora (CA14).
  if (reading.visibility === 'public' && reading.games.length > 0) {
    await deps.saveSnapshots(account.userId, cardDay(now), reading.games);
  }
  await deps.saveReading(account.userId, patch);
  return { status: 'synced', visibility: reading.visibility };
}

/** Contas lidas por vez na leitura agendada (ajustes da Parte 3b). */
export const SYNC_BATCH_SIZE = 50;

export interface SyncAllDeps extends SyncDeps {
  /** Próximas contas, em ordem de `userId`, depois de `after` (`null` = do começo). */
  listAccounts(after: string | null, limit: number): Promise<SteamAccount[]>;
  /** Registra o erro inesperado de uma conta; a leitura segue para as outras. */
  onAccountError(userId: string, error: unknown): void;
}

export interface SyncAllResult {
  synced: number;
  unavailable: number;
  failed: number;
}

/**
 * Leitura diária de todas as contas (CA14), agendada no banco. Lê em lotes, uma conta por vez;
 * Steam fora do ar ou erro de uma conta não param as outras (CA15).
 */
export async function syncAllAccounts(
  deps: SyncAllDeps,
  batchSize = SYNC_BATCH_SIZE,
): Promise<SyncAllResult> {
  const result: SyncAllResult = { synced: 0, unavailable: 0, failed: 0 };
  let after: string | null = null;
  for (;;) {
    const accounts = await deps.listAccounts(after, batchSize);
    for (const account of accounts) {
      try {
        const sync = await syncAccount(deps, account);
        result[sync.status === 'synced' ? 'synced' : 'unavailable']++;
      } catch (error) {
        result.failed++;
        deps.onAccountError(account.userId, error);
      }
    }
    if (accounts.length < batchSize) {
      return result;
    }
    after = accounts[accounts.length - 1].userId;
  }
}

export interface ConnectDeps extends SyncDeps {
  /** Origens em que o app roda (ex.: `http://localhost:4200`); a volta só vale para elas. */
  allowedOrigins: readonly string[];
  /** Pergunta à Steam se a resposta é dela (`check_authentication`). */
  confirmWithSteam(params: OpenIdParams): Promise<boolean>;
  /** Marca a volta (`response_nonce`) como usada; `false` se ela já tinha sido usada (CA3). */
  useNonce(nonce: string): Promise<boolean>;
  /** Quem já tem esta conta Steam ligada, com o ponto de partida dela; `null` se ninguém. */
  findOwner(steamId: string): Promise<{ userId: string; baselineMinutes: number | null } | null>;
  /**
   * Liga a conta Steam ao usuário como nova, sem nada da conta que ele tinha antes (CA19);
   * `taken` quando outro perfil ligou a mesma conta ao mesmo tempo (CA4).
   */
  saveLink(userId: string, steamId: string): Promise<'linked' | 'taken'>;
  /** Apaga as fotos de tempo de jogo do usuário: são da conta Steam anterior (CA19). */
  clearSnapshots(userId: string): Promise<void>;
  /** Registra uma falha inesperada na primeira leitura (a conta continua conectada). */
  onSyncError(error: unknown): void;
}

export type ConnectResult =
  { status: 'connected'; sync: SyncResult } | { status: 'invalid' } | { status: 'taken' };

function expectedReturnTo(params: OpenIdParams, allowed: readonly string[]): string | null {
  try {
    const origin = new URL(params['return_to'] ?? '').origin;
    return allowed.includes(origin) ? `${origin}${STEAM_RETURN_PATH}` : null;
  } catch {
    return null;
  }
}

/**
 * Conecta a conta Steam que a própria Steam confirmar (CA3): regras locais, depois a conferência
 * com a Steam, a volta usada uma vez só, a ligação ao perfil (uma conta Steam por perfil, CA4) e
 * a primeira leitura (CA2).
 */
export async function connectSteam(
  deps: ConnectDeps,
  userId: string,
  params: OpenIdParams,
): Promise<ConnectResult> {
  const expected = expectedReturnTo(params, deps.allowedOrigins);
  if (!expected) {
    return { status: 'invalid' };
  }
  const check = checkAssertion(params, {
    expectedReturnTo: expected,
    now: deps.now(),
    maxAgeMs: MAX_ASSERTION_AGE_MS,
  });
  if (!check.ok || !(await deps.confirmWithSteam(params))) {
    return { status: 'invalid' };
  }
  // Depois da Steam confirmar, para guardar só voltas de verdade. Duas voltas iguais ao mesmo
  // tempo: só uma passa pela chave primária.
  if (!(await deps.useNonce(params['response_nonce'] ?? ''))) {
    return { status: 'invalid' };
  }
  const owner = await deps.findOwner(check.steamId);
  if (owner && owner.userId !== userId) {
    return { status: 'taken' };
  }
  // Reconectar a mesma conta mantém o ponto de partida das horas (CA19).
  const baselineMinutes = owner ? owner.baselineMinutes : null;
  if (!owner && (await deps.saveLink(userId, check.steamId)) === 'taken') {
    return { status: 'taken' };
  }
  // A conta já está ligada: se a primeira leitura falhar, ela fica pendente, e o app mostra
  // "Lendo seus dados da Steam…" com "Tentar de novo" (CA19), em vez de dizer que não conectou.
  let sync: SyncResult;
  try {
    // Conta nova para este perfil: as fotos da conta anterior não podem somar no card (CA19).
    if (!owner) {
      await deps.clearSnapshots(userId);
    }
    sync = await syncAccount(deps, { userId, steamId: check.steamId, baselineMinutes });
  } catch (error) {
    deps.onSyncError(error);
    sync = { status: 'unavailable' };
  }
  return { status: 'connected', sync };
}
