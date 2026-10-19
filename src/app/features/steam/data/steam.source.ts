import { InjectionToken } from '@angular/core';

import type { SteamConnectOutcome } from '../domain/steam-connect';

export type SteamVisibility = 'public' | 'private';

/** A conta Steam de quem está logado (spec 003). */
export interface SteamAccountState {
  connected: boolean;
  /** `null` enquanto a primeira leitura não terminou (CA2: "Lendo seus dados da Steam…"). */
  visibility: SteamVisibility | null;
  personaName: string | null;
  lastSyncedAt: string | null;
}

export const NOT_CONNECTED: SteamAccountState = {
  connected: false,
  visibility: null,
  personaName: null,
  lastSyncedAt: null,
};

/** Resultado de ler a Steam de novo ("Já deixei público", CA7). */
export type SteamRecheck = SteamVisibility | 'unavailable';

/** Contrato entre as telas e a Steam. Real: Supabase e Edge Functions. Simulado: em memória. */
export interface SteamSource {
  account(): Promise<SteamAccountState>;
  /** Manda a volta da Steam (`openid.*`) para o servidor conferir e ligar a conta. */
  connect(openid: Record<string, string>): Promise<SteamConnectOutcome>;
  recheck(): Promise<SteamRecheck>;
}

export const STEAM_SOURCE = new InjectionToken<SteamSource>('STEAM_SOURCE');
