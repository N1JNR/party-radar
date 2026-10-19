import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PoNotificationService } from '@po-ui/ng-components';

import { STEAM_SOURCE } from '../data/steam.source';
import { SteamConnectOutcome, connectMessage, isPositiveReturn } from '../domain/steam-connect';

/**
 * Volta do "Entrar pela Steam" (spec 003, CA2–CA5). Manda a resposta para o servidor conferir
 * com a Steam e volta ao Meu card com o aviso, sem deixar esta tela no histórico.
 */
@Component({
  selector: 'app-steam-return-page',
  templateUrl: './steam-return.page.html',
  styleUrl: './steam-return.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SteamReturnPage {
  private readonly steam = inject(STEAM_SOURCE);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notification = inject(PoNotificationService);

  constructor() {
    void this.finish();
  }

  private async finish(): Promise<void> {
    const query = this.route.snapshot.queryParamMap;
    const openid: Record<string, string> = {};
    for (const key of query.keys.filter((name) => name.startsWith('openid.'))) {
      openid[key.slice('openid.'.length)] = query.get(key) ?? '';
    }
    let outcome: SteamConnectOutcome = 'failed';
    if (isPositiveReturn(openid)) {
      try {
        outcome = await this.steam.connect(openid);
      } catch {
        outcome = 'failed';
      }
    }
    const message = connectMessage(outcome);
    if (outcome === 'connected') {
      this.notification.success(message);
    } else {
      this.notification.error(message);
    }
    await this.router.navigateByUrl('/inicio', { replaceUrl: true });
  }
}
