import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { PoButtonModule } from '@po-ui/ng-components';

import {
  ChatMessage,
  DELETED_TEXT,
  PendingMessage,
  groupByDay,
  timeLabel,
} from '../../domain/chat';

/** Quão perto das pontas conta como estar nelas, em pixels. */
const NEAR_EDGE_PX = 80;

/**
 * As mensagens de uma conversa (spec 007). O texto entra por interpolação, então HTML e links aparecem
 * como texto puro (CA7). Fica no fim enquanto a pessoa está lá, e não pula ao carregar as anteriores (CA6).
 */
@Component({
  selector: 'app-message-list',
  imports: [PoButtonModule],
  templateUrl: './message-list.component.html',
  styleUrl: './message-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // O teclado do celular encolhe a tela: quem estava no fim continua vendo a última mensagem.
    '(window:resize)': 'keepPosition()',
  },
})
export class MessageListComponent {
  readonly messages = input.required<readonly ChatMessage[]>();
  readonly pending = input<readonly PendingMessage[]>([]);
  readonly hasOlder = input(false);
  readonly loadingOlder = input(false);
  readonly now = input(new Date());
  readonly older = output<void>();
  readonly remove = output<ChatMessage>();
  readonly retry = output<string>();

  private readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');
  private atBottom = true;
  /** Como estava ao pedir as anteriores, para manter a posição quando chegarem (CA6). */
  private beforeOlder: { firstId: string | undefined; height: number } | null = null;
  /** A mensagem com o pedido de apagar: ao sumir o botão, o foco não pode se perder (CA24). */
  private removingId: string | null = null;

  // Por `computed`: na suíte inteira, a constante ainda não existe quando os campos são criados.
  protected readonly deletedText = computed(() => DELETED_TEXT);
  protected readonly timeLabel = timeLabel;
  protected readonly days = computed(() => groupByDay(this.messages(), this.now()));

  constructor() {
    const injector = inject(Injector);
    effect(() => {
      this.messages();
      this.pending();
      afterNextRender(
        () => {
          this.keepPosition();
          this.keepFocusAfterRemoving();
        },
        { injector },
      );
    });
  }

  protected askRemove(message: ChatMessage): void {
    this.removingId = message.id;
    this.remove.emit(message);
  }

  protected onScroll(): void {
    const element = this.scroller().nativeElement;
    this.atBottom = element.scrollHeight - element.scrollTop - element.clientHeight < NEAR_EDGE_PX;
    if (element.scrollTop < NEAR_EDGE_PX) {
      this.askOlder();
    }
  }

  protected askOlder(): void {
    if (this.hasOlder() && !this.loadingOlder()) {
      this.beforeOlder = {
        firstId: this.messages().at(0)?.id,
        height: this.scroller().nativeElement.scrollHeight,
      };
      this.older.emit();
    }
  }

  private keepFocusAfterRemoving(): void {
    const removed = this.messages().some((item) => item.id === this.removingId && item.deleted);
    if (removed) {
      this.removingId = null;
      // Fora da renderização: `focus()` dispara eventos na hora, e eles não podem cair no meio dela.
      setTimeout(() => this.scroller().nativeElement.focus());
    }
  }

  protected keepPosition(): void {
    const element = this.scroller().nativeElement;
    const before = this.beforeOlder;
    if (before && before.firstId !== this.messages().at(0)?.id) {
      element.scrollTop += element.scrollHeight - before.height;
      this.beforeOlder = null;
      return;
    }
    if (before) {
      // Mudou outra coisa, como uma mensagem nova no fim. Sem carga em andamento, ela falhou.
      this.beforeOlder = this.loadingOlder() ? { ...before, height: element.scrollHeight } : null;
    }
    if (this.atBottom) {
      element.scrollTop = element.scrollHeight;
    }
  }
}
