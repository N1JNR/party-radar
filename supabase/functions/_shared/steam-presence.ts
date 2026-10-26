// "Jogando agora" de todas as contas (spec 003, CA10), agendado a cada 5 minutos. Lê a Steam em
// lotes de 100 contas por chamada e grava só o que mudou. A lógica recebe as dependências de fora,
// para ser testada sem rede; a Edge Function steam-presence só liga as peças.

import { SUMMARIES_PER_CALL, SteamUnavailableError } from './steam-api.ts';

export interface PresenceAccount {
  userId: string;
  steamId: string;
  /** Jogo aberto que está gravado agora. */
  currentGame: string | null;
}

export interface PresenceDeps {
  /** Próximas contas, em ordem de `userId`, depois de `after` (`null` = do começo). */
  listAccounts(after: string | null, limit: number): Promise<PresenceAccount[]>;
  /** Jogo aberto de cada conta (até 100); contas que a Steam não devolveu ficam de fora. */
  readPresence(steamIds: readonly string[]): Promise<Map<string, string | null>>;
  savePresence(userId: string, currentGame: string | null): Promise<void>;
}

export interface PresenceResult {
  changed: number;
  /** Lotes em que a Steam não respondeu: os jogos gravados ficam como estavam (CA15). */
  unavailableBatches: number;
}

export async function refreshPresence(
  deps: PresenceDeps,
  batchSize = SUMMARIES_PER_CALL,
): Promise<PresenceResult> {
  const result: PresenceResult = { changed: 0, unavailableBatches: 0 };
  let after: string | null = null;
  for (;;) {
    const accounts = await deps.listAccounts(after, batchSize);
    if (accounts.length > 0) {
      let presence: Map<string, string | null> | null = null;
      try {
        presence = await deps.readPresence(accounts.map((account) => account.steamId));
      } catch (error) {
        if (!(error instanceof SteamUnavailableError)) {
          throw error;
        }
        result.unavailableBatches++;
      }
      for (const account of accounts) {
        if (!presence?.has(account.steamId)) {
          continue;
        }
        const game = presence.get(account.steamId) ?? null;
        if (game !== account.currentGame) {
          await deps.savePresence(account.userId, game);
          result.changed++;
        }
      }
    }
    if (accounts.length < batchSize) {
      return result;
    }
    after = accounts[accounts.length - 1].userId;
  }
}
