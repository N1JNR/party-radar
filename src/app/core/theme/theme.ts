import { Injectable, inject } from '@angular/core';
import { PoThemeService, PoThemeTypeEnum } from '@po-ui/ng-components';

import { partyRadarTheme } from '../../../theme/party-radar.theme';

/** Aplica o tema do Party Radar no PO UI. */
@Injectable({ providedIn: 'root' })
export class AppThemeService {
  private readonly poTheme = inject(PoThemeService);

  apply(): Promise<void> {
    return this.poTheme.setTheme(partyRadarTheme, PoThemeTypeEnum.dark);
  }
}
