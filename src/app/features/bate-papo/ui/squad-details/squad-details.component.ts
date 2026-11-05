import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PoButtonModule, PoButtonType, PoFieldModule } from '@po-ui/ng-components';

import { Player } from '../../../amigos/domain/friends';
import { PersonRowComponent } from '../../../amigos/ui/person-row/person-row.component';
import { Conversation, SquadMember, squadNameError } from '../../domain/chat';

/** Quem está no squad (spec 007, CA13): o dono renomeia, adiciona e remove; todos podem sair. */
@Component({
  selector: 'app-squad-details',
  imports: [FormsModule, PoButtonModule, PoFieldModule, PersonRowComponent],
  templateUrl: './squad-details.component.html',
  styleUrl: './squad-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SquadDetailsComponent {
  readonly conversation = input.required<Conversation>();
  readonly members = input.required<readonly SquadMember[]>();
  readonly friends = input.required<readonly Player[]>();
  readonly busy = input(false);
  readonly rename = output<string>();
  readonly add = output<Player>();
  readonly remove = output<SquadMember>();
  readonly leave = output<void>();
  readonly closed = output<void>();

  protected readonly submitType = PoButtonType.Submit;
  protected readonly name = signal('');
  protected readonly problem = signal<string | null>(null);
  /** Amigos que ainda não estão no squad. */
  protected readonly addable = computed(() => {
    const inside = new Set(this.members().map((member) => member.id));
    return this.friends().filter((friend) => !inside.has(friend.id));
  });

  constructor() {
    effect(() => {
      const title = this.conversation().title;
      untracked(() => this.name.set(title));
    });
  }

  protected submitName(): void {
    const problem = squadNameError(this.name());
    this.problem.set(problem);
    if (!problem) {
      this.rename.emit(this.name().trim());
    }
  }

  protected memberStatus(member: SquadMember): string | null {
    return member.isOwner ? 'Dono do squad' : null;
  }
}
