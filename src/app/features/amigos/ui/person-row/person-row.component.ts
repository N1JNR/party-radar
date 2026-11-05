import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PoAvatarModule } from '@po-ui/ng-components';

import { Player } from '../../domain/friends';

/** Uma pessoa numa lista: foto, nome, @usuário, estado em texto e as ações, passadas por conteúdo. */
@Component({
  selector: 'app-person-row',
  imports: [PoAvatarModule],
  templateUrl: './person-row.component.html',
  styleUrl: './person-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonRowComponent {
  readonly person = input.required<Player>();
  /** Estado em texto, como "Jogando Dota 2 agora" (spec 006, CA13 e CA21). */
  readonly status = input<string | null>(null);
}
