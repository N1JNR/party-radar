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
  /** Altura antes de pedir as anteriores, para manter a posição quando chegarem (CA6). */
  private heightBeforeOlder: number | null = null;

  // Por `computed`: na suíte inteira, a constante ainda não existe quando os campos são criados.
  protected readonly deletedText = computed(() => DELETED_TEXT);
  protected readonly timeLabel = timeLabel;
  protected readonly days = computed(() => groupByDay(this.messages(), this.now()));

  constructor() {
    const injector = inject(Injector);
    effect(() => {
      this.messages();
      this.pending();
      afterNextRender(() => this.keepPosition(), { injector });
    });
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
      this.heightBeforeOlder = this.scroller().nativeElement.scrollHeight;
      this.older.emit();
    }
  }

  private keepPosition(): void {
    const element = this.scroller().nativeElement;
    if (this.heightBeforeOlder !== null) {
      element.scrollTop += element.scrollHeight - this.heightBeforeOlder;
      this.heightBeforeOlder = null;
    } else if (this.atBottom) {
      element.scrollTop = element.scrollHeight;
    }
  }
}
