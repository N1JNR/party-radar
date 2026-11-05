import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PoButtonModule, PoButtonType, PoFieldModule } from '@po-ui/ng-components';

import { messageError } from '../../domain/chat';

/** A caixa de texto (spec 007, CA4 e CA24): Enter envia, e Shift + Enter quebra a linha. */
@Component({
  selector: 'app-message-composer',
  imports: [FormsModule, PoButtonModule, PoFieldModule],
  templateUrl: './message-composer.component.html',
  styleUrl: './message-composer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageComposerComponent {
  readonly conversationTitle = input('');
  readonly send = output<string>();

  protected readonly submitType = PoButtonType.Submit;
  protected readonly text = signal('');
  private readonly tried = signal(false);
  protected readonly error = computed(() => {
    const problem = messageError(this.text());
    // Vazio só avisa depois de tentar; passar do limite avisa enquanto digita.
    return this.tried() || this.text().trim().length > 0 ? problem : null;
  });
  protected readonly label = computed(() =>
    this.conversationTitle() ? `Mensagem para ${this.conversationTitle()}` : 'Mensagem',
  );

  protected onEnter(event: Event): void {
    if (!(event as KeyboardEvent).shiftKey) {
      event.preventDefault();
      this.submit();
    }
  }

  protected submit(): void {
    if (messageError(this.text())) {
      this.tried.set(true);
      return;
    }
    this.send.emit(this.text().trim());
    this.text.set('');
    this.tried.set(false);
  }
}
