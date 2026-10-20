import { Injectable, inject } from '@angular/core';

import { FAKE_HOME_OPTIONS } from '../../home/data/fake-home.source';
import type { SteamConnectOutcome } from '../domain/steam-connect';
import { NOT_CONNECTED, SteamAccountState, SteamRecheck, SteamSource } from './steam.source';

/**
 * Steam simulada, para revisar a tela sem a Steam. Segue os cenários de `?simular=` da home:
 * `primeiro-acesso` começa sem Steam, `steam-privada` começa com o perfil privado.
 */
@Injectable()
export class FakeSteamSource implements SteamSource {
  private readonly scenario = inject(FAKE_HOME_OPTIONS).scenario;
  private state: SteamAccountState = this.initial();

  account(): Promise<SteamAccountState> {
    return Promise.resolve(this.state);
  }

  connect(): Promise<SteamConnectOutcome> {
    this.state = this.connected('public');
    return Promise.resolve('connected');
  }

  /** Na simulação, "Já deixei público" sempre encontra o perfil público. */
  recheck(): Promise<SteamRecheck> {
    this.state = this.connected('public');
    return Promise.resolve('public');
  }

  private initial(): SteamAccountState {
    if (this.scenario === 'first-access') {
      return NOT_CONNECTED;
    }
    return this.connected(this.scenario === 'steam-private' ? 'private' : 'public');
  }

  private connected(visibility: 'public' | 'private'): SteamAccountState {
    return {
      connected: true,
      visibility,
      personaName: 'jogador_simulado',
      lastSyncedAt: new Date().toISOString(),
    };
  }
}
