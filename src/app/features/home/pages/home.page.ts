import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PoButtonModule, PoNotificationService } from '@po-ui/ng-components';

import { ClipboardService } from '../../../core/platform/clipboard.service';
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

  protected async markSteamPublic(): Promise<void> {
    if (!(await this.store.markSteamPublic())) {
      this.notification.error('Não foi possível salvar. Tente de novo.');
    }
  }
}
