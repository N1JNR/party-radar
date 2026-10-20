import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PoButtonModule, PoNotificationService } from '@po-ui/ng-components';

import { ClipboardService } from '../../../core/platform/clipboard.service';
import { ExternalNavigation } from '../../../core/platform/external-navigation';
import { STILL_PRIVATE_MESSAGE, steamLoginUrl } from '../../steam/domain/steam-connect';
import { HomeStore } from '../data/home.store';
import { PartnershipQuestionComponent } from '../ui/partnership-question/partnership-question.component';
import { PlayerCardComponent } from '../ui/player-card/player-card.component';
import { PlayingNowComponent } from '../ui/playing-now/playing-now.component';
import { SquadOpportunityComponent } from '../ui/squad-opportunity/squad-opportunity.component';
import { SteamNoticeComponent } from '../ui/steam-notice/steam-notice.component';
import { StrengthenCardComponent } from '../ui/strengthen-card/strengthen-card.component';

/** "Meu card": a home do app (spec 002). Orquestra o estado da home e os componentes. */
@Component({
  selector: 'app-home-page',
  imports: [
    PoButtonModule,
    PlayerCardComponent,
    StrengthenCardComponent,
    SteamNoticeComponent,
    PartnershipQuestionComponent,
    PlayingNowComponent,
    SquadOpportunityComponent,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly store = inject(HomeStore);
  private readonly clipboard = inject(ClipboardService);
  private readonly navigation = inject(ExternalNavigation);
  private readonly notification = inject(PoNotificationService);
  protected readonly now = signal(new Date());

  constructor() {
    void this.store.load();
  }

  protected reload(): void {
    this.now.set(new Date());
    void this.store.load();
  }

  /** Telas que são entregas próprias (CA13). */
  protected soon(feature: string): void {
    this.notification.information(`Em breve: ${feature}.`);
  }

  protected async copyInvite(link: string): Promise<void> {
    if (await this.clipboard.copy(link)) {
      this.notification.success('Link de convite copiado.');
    } else {
      this.notification.information(`Não deu para copiar. Seu link de convite: ${link}`);
    }
  }

  protected async answer(played: boolean): Promise<void> {
    if (!(await this.store.answerPartnership(played))) {
      this.notification.error('Não foi possível salvar sua resposta. Tente de novo.');
    }
  }

  /** Vai para o login da própria Steam; a volta chega em /steam/retorno (spec 003, CA2). */
  protected connectSteam(): void {
    this.navigation.go(steamLoginUrl(this.navigation.origin()));
  }

  /** "Já deixei público": lê a Steam de novo e avisa o resultado (spec 003, CA7). */
  protected async recheckSteam(): Promise<void> {
    const result = await this.store.recheckSteam();
    if (result === 'public') {
      this.notification.success('Steam pública. Seus dados vão aparecer no card.');
    } else if (result === 'private') {
      this.notification.information(STILL_PRIVATE_MESSAGE);
    } else if (result === 'unavailable') {
      this.notification.error('Não foi possível verificar a Steam agora. Tente de novo.');
    }
  }
}
