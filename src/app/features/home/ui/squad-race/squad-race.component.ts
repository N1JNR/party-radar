import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { PoButtonModule } from '@po-ui/ng-components';

/**
 * Espaço do placar entre amigos (spec 004, CA13). Até a spec de amigos, só explica o que vem e
 * convida, sem nenhum nome ou número de exemplo.
 */
@Component({
  selector: 'app-squad-race',
  imports: [PoButtonModule],
  templateUrl: './squad-race.component.html',
  styleUrl: './squad-race.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SquadRaceComponent {
  readonly invite = output<void>();
}
