import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PoButtonModule, PoButtonType, PoFieldModule } from '@po-ui/ng-components';

import { Lookup } from '../../data/friends.store';
import { FoundPlayer, NOT_FOUND_MESSAGE, relationLabel } from '../../domain/friends';
import { PersonRowComponent } from '../person-row/person-row.component';

/** "Adicionar amigo": procura pelo @usuário exato e mostra a ação certa para a relação (spec 006). */
@Component({
  selector: 'app-add-friend',
  imports: [FormsModule, PoButtonModule, PoFieldModule, PersonRowComponent],
  templateUrl: './add-friend.component.html',
  styleUrl: './add-friend.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddFriendComponent {
  readonly lookup = input.required<Lookup>();
  readonly busy = input(false);
  readonly find = output<string>();
  readonly send = output<FoundPlayer>();
  readonly accept = output<FoundPlayer>();
  readonly copyInvite = output<void>();

  protected readonly submitType = PoButtonType.Submit;
  protected readonly text = signal('');
  // Por `computed`: na suíte inteira, a constante ainda não existe quando os campos são criados.
  protected readonly notFound = computed(() => NOT_FOUND_MESSAGE);
  protected readonly found = computed(() => {
    const lookup = this.lookup();
    return lookup.status === 'found' ? lookup.player : null;
  });
  protected readonly foundStatus = computed(() => {
    const player = this.found();
    return player ? relationLabel(player.relation) : null;
  });

  protected submit(): void {
    if (this.text().trim()) {
      this.find.emit(this.text());
    }
  }
}
