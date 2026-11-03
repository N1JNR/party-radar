import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { PoButtonModule, PoNotificationService } from '@po-ui/ng-components';

import { ClipboardService } from '../../../core/platform/clipboard.service';
import { ExternalNavigation } from '../../../core/platform/external-navigation';
import { ShareService } from '../../../core/platform/share.service';
import { STILL_PRIVATE_MESSAGE, steamLoginUrl } from '../../steam/domain/steam-connect';
import { HomeData } from '../data/home.source';
import { HomeStore } from '../data/home.store';
import { RadarImageService } from '../data/radar-image';
import { SeasonImageService } from '../data/season-image';
import { radarSummary } from '../domain/player-radar';
import { SeasonImage, SeasonTrophy, seasonImage, trophyImage } from '../domain/season';
import { MonthSummaryComponent } from '../ui/month-summary/month-summary.component';
import { PartnershipQuestionComponent } from '../ui/partnership-question/partnership-question.component';
import { PlayerHeaderComponent } from '../ui/player-header/player-header.component';
import { PlayerRadarComponent } from '../ui/player-radar/player-radar.component';
import { PlayingNowComponent } from '../ui/playing-now/playing-now.component';
import { RankTrackComponent } from '../ui/rank-track/rank-track.component';
import { SeasonTrophiesComponent } from '../ui/season-trophies/season-trophies.component';
import { SquadOpportunityComponent } from '../ui/squad-opportunity/squad-opportunity.component';
import { SquadRaceComponent } from '../ui/squad-race/squad-race.component';
import { SteamNoticeComponent } from '../ui/steam-notice/steam-notice.component';
import { StrengthenCardComponent } from '../ui/strengthen-card/strengthen-card.component';

/** De quanto em quanto tempo a página relê o card (spec 003, CA10). */
export const REFRESH_EVERY_MS = 60_000;

/** "Meu card": a home do app (specs 002 e 004). Orquestra o estado da home e os componentes. */
@Component({
  selector: 'app-home-page',
  imports: [
    PoButtonModule,
    PlayerHeaderComponent,
    RankTrackComponent,
    SeasonTrophiesComponent,
    PlayerRadarComponent,
    MonthSummaryComponent,
    SquadRaceComponent,
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
  private readonly radarImage = inject(RadarImageService);
  private readonly seasonImage = inject(SeasonImageService);
  private readonly sharer = inject(ShareService);
  protected readonly now = signal(new Date());
  protected readonly sharing = signal(false);

  constructor() {
    void this.store.load();
    // Só no navegador: relê o card a cada minuto, para o "jogando agora" acompanhar a Steam
    // (spec 003, CA10; o servidor lê a Steam a cada 5 minutos).
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const timer = setInterval(() => this.tick(), REFRESH_EVERY_MS);
      destroyRef.onDestroy(() => clearInterval(timer));
    });
  }

  private tick(): void {
    this.now.set(new Date());
    void this.store.refreshCard();
  }

  protected reload(): void {
    this.now.set(new Date());
    void this.store.load();
  }

  /** "Compartilhar meu radar" (spec 004, CA14). */
  protected shareRadar(data: HomeData): Promise<void> {
    return this.shareImage(
      () => this.radarImage.create(radarSummary(data.card.username, data.games)),
      'meu-radar-party-radar.png',
      'Meu radar no Party Radar',
    );
  }

  /** "Compartilhar temporada" (spec 005, CA13). */
  protected shareSeason(data: HomeData): Promise<void> {
    const season = data.season;
    return season
      ? this.shareSeasonImage(seasonImage(data.card.username, season))
      : Promise.resolve();
  }

  /** O compartilhar de um troféu (spec 005, CA13). */
  protected shareTrophy(data: HomeData, trophy: SeasonTrophy): Promise<void> {
    return this.shareSeasonImage(trophyImage(data.card.username, trophy));
  }

  private shareSeasonImage(image: SeasonImage): Promise<void> {
    return this.shareImage(
      () => this.seasonImage.create(image),
      `temporada-${image.season}-party-radar.png`,
      `Temporada ${image.season} no Party Radar`,
    );
  }

  /** Gera a imagem e entrega ao aparelho ou baixa (spec 004, CA14 e CA16). */
  private async shareImage(
    create: () => Promise<Blob>,
    fileName: string,
    title: string,
  ): Promise<void> {
    this.sharing.set(true);
    try {
      const result = await this.sharer.shareImage(await create(), fileName, title);
      if (result === 'downloaded') {
        this.notification.success('Imagem baixada.');
      }
    } catch {
      this.notification.error('Não foi possível gerar a imagem. Tente de novo.');
    } finally {
      this.sharing.set(false);
    }
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

  /**
   * "Tentar de novo" enquanto a primeira leitura não terminou (spec 003, CA19). Se a Steam
   * responder, o card mostra o resultado sozinho (o quadro some ou aparece o aviso de privada).
   */
  protected async retrySteam(): Promise<void> {
    const result = await this.store.recheckSteam();
    if (result === 'unavailable') {
      this.notification.error('Não foi possível verificar a Steam agora. Tente de novo.');
    } else if (result === 'public') {
      void this.store.refreshCard();
    }
  }

  /** "Já deixei público": lê a Steam de novo e avisa o resultado (spec 003, CA7). */
  protected async recheckSteam(): Promise<void> {
    const result = await this.store.recheckSteam();
    if (result === 'public') {
      this.notification.success('Steam pública. Seus dados vão aparecer no card.');
      void this.store.refreshCard();
    } else if (result === 'private') {
      this.notification.information(STILL_PRIVATE_MESSAGE);
    } else if (result === 'unavailable') {
      this.notification.error('Não foi possível verificar a Steam agora. Tente de novo.');
    }
  }
}
