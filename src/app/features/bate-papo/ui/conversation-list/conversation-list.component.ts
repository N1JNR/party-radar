import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PoAvatarModule } from '@po-ui/ng-components';

import { Conversation, lastPreview, listTimeLabel, unreadLabel } from '../../domain/chat';

/** A lista da tela Conversas (spec 007, CA18 e CA19): da mais recente para a mais antiga. */
@Component({
  selector: 'app-conversation-list',
  imports: [PoAvatarModule, RouterLink],
  templateUrl: './conversation-list.component.html',
  styleUrl: './conversation-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationListComponent {
  readonly conversations = input.required<readonly Conversation[]>();
  readonly selectedId = input<string | null>(null);
  readonly now = input(new Date());

  protected readonly rows = computed(() =>
    this.conversations().map((conversation) => ({
      conversation,
      preview: lastPreview(conversation),
      time: listTimeLabel(conversation.lastAt, this.now()),
      unread: conversation.unread > 0 ? unreadLabel(conversation.unread) : null,
    })),
  );
}
