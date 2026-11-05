import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PoButtonModule, PoButtonType, PoFieldModule } from '@po-ui/ng-components';

import { Player } from '../../../amigos/domain/friends';
import { squadNameError } from '../../domain/chat';

export interface NewSquad {
  name: string;
  memberIds: string[];
}

/** "Criar squad" (spec 007, CA11): um nome e os amigos que já entram. */
@Component({
  selector: 'app-squad-form',
  imports: [FormsModule, PoButtonModule, PoFieldModule],
  templateUrl: './squad-form.component.html',
  styleUrl: './squad-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SquadFormComponent {
  readonly friends = input.required<readonly Player[]>();
  readonly busy = input(false);
  /** O servidor recusou, em texto. */
  readonly failure = input<string | null>(null);
  readonly create = output<NewSquad>();
  readonly cancelled = output<void>();

  protected readonly submitType = PoButtonType.Submit;
  protected readonly name = signal('');
  private readonly chosen = signal<readonly string[]>([]);
  protected readonly problem = signal<string | null>(null);
  protected readonly message = computed(() => this.problem() ?? this.failure());

  protected isChosen(id: string): boolean {
    return this.chosen().includes(id);
  }

  /** O aviso some quando a pessoa começa a corrigir. */
  protected editName(name: string): void {
    this.name.set(name);
    this.problem.set(null);
  }

  protected toggle(id: string, on: boolean): void {
    this.problem.set(null);
    this.chosen.update((current) =>
      on ? [...current, id] : current.filter((other) => other !== id),
    );
  }

  protected submit(): void {
    const problem =
      squadNameError(this.name()) ??
      (this.chosen().length === 0 ? 'Escolha pelo menos um amigo.' : null);
    this.problem.set(problem);
    if (!problem) {
      this.create.emit({ name: this.name().trim(), memberIds: [...this.chosen()] });
    }
  }
}
