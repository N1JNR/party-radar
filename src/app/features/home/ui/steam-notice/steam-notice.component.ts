import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PoButtonModule, PoIconModule } from '@po-ui/ng-components';

/** Aviso da Steam privada, com o caminho na Steam e "Já deixei público" (spec 002, CA8). */
@Component({
  selector: 'app-steam-notice',
  imports: [PoButtonModule, PoIconModule],
  templateUrl: './steam-notice.component.html',
  styleUrl: './steam-notice.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SteamNoticeComponent {
  /** Salvando a resposta. */
  readonly marking = input(false);
  readonly confirmed = output<void>();
}
