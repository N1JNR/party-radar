import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  PoButtonModule,
  PoModalAction,
  PoModalComponent,
  PoModalModule,
  PoNotificationService,
} from '@po-ui/ng-components';

import { Player } from '../../amigos/domain/friends';
import { FriendsStore } from '../../amigos/data/friends.store';
import { CHAT_SOURCE } from '../data/chat.source';
import { ChatStore } from '../data/chat.store';
import { ConversationStore } from '../data/conversation.store';
import {
  ChatMessage,
  PRIVACY_TEXT,
  READ_ONLY_TEXT,
  SquadMember,
  addMemberFailureText,
  createSquadFailureText,
} from '../domain/chat';
import { ConversationListComponent } from '../ui/conversation-list/conversation-list.component';
import { MessageComposerComponent } from '../ui/message-composer/message-composer.component';
import { MessageListComponent } from '../ui/message-list/message-list.component';
import { SquadDetailsComponent } from '../ui/squad-details/squad-details.component';
import { NewSquad, SquadFormComponent } from '../ui/squad-form/squad-form.component';

const FAILURE = 'Não foi possível concluir. Tente de novo.';

interface Confirmation {
  title: string;
  text: string;
  label: string;
  run(): Promise<void>;
}

/** "Conversas" (spec 007): a lista, a conversa aberta e os squads. No celular, uma tela de cada vez. */
@Component({
  selector: 'app-conversations-page',
  imports: [
    PoButtonModule,
    PoModalModule,
    RouterLink,
    ConversationListComponent,
    MessageComposerComponent,
    MessageListComponent,
    SquadDetailsComponent,
    SquadFormComponent,
  ],
  providers: [ConversationStore, FriendsStore],
  templateUrl: './conversations.page.html',
  styleUrl: './conversations.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationsPage {
  protected readonly chat = inject(ChatStore);
  protected readonly conversation = inject(ConversationStore);
  protected readonly friends = inject(FriendsStore);
  private readonly source = inject(CHAT_SOURCE);
  private readonly router = inject(Router);
  private readonly notification = inject(PoNotificationService);
  private readonly modal = viewChild.required(PoModalComponent);

  /** Da rota `/conversas/:id`. */
  readonly id = input<string>();

  /** A lista de conversas sobe a versão a cada minuto: "Hoje" e "Ontem" acompanham o relógio. */
  protected readonly now = computed(() => {
    this.chat.version();
    return new Date();
  });
  protected readonly pane = signal<'conversation' | 'create' | 'details'>('conversation');
  protected readonly busy = signal(false);
  protected readonly createFailure = signal<string | null>(null);
  protected readonly members = signal<SquadMember[]>([]);
  // Por `computed`: na suíte inteira, as constantes ainda não existem quando os campos são criados.
  protected readonly privacyText = computed(() => PRIVACY_TEXT);
  protected readonly readOnlyText = computed(() => READ_ONLY_TEXT);
  protected readonly current = computed(() => this.chat.conversation(this.id() ?? null));
  /** No celular, abre a segunda tela quando há algo nela. */
  protected readonly paneOpen = computed(() => !!this.id() || this.pane() !== 'conversation');
  protected readonly friendList = computed<Player[]>(() => this.friends.friends());

  private readonly confirmation = signal<Confirmation | null>(null);
  protected readonly modalTitle = computed(() => this.confirmation()?.title ?? '');
  protected readonly modalText = computed(() => this.confirmation()?.text ?? '');
  protected readonly confirmAction = computed<PoModalAction>(() => ({
    label: this.confirmation()?.label ?? 'Confirmar',
    danger: true,
    action: () => void this.confirm(),
  }));
  protected readonly cancelAction: PoModalAction = {
    label: 'Cancelar',
    action: () => this.modal().close(),
  };

  constructor() {
    // Abre a conversa da rota, e fecha ao voltar para a lista.
    effect(() => {
      const id = this.id();
      untracked(() => {
        this.pane.set('conversation');
        if (id) {
          // Abrir marca como lida: a lista e o menu relêem depois disso (CA18).
          void this.conversation.open(id).then(() => this.chat.refresh());
        } else {
          this.conversation.close();
        }
      });
    });
    // Cada novidade do tempo real relê a conversa aberta (CA3, CA8).
    effect(() => {
      this.chat.version();
      untracked(() => {
        if (this.conversation.status() === 'ready') {
          void this.conversation.refresh().then(() => this.chat.refresh());
        }
      });
    });
  }

  protected retryList(): void {
    void this.chat.load();
  }

  protected retryConversation(): void {
    const id = this.id();
    if (id) {
      void this.conversation.open(id);
    }
  }

  protected async send(text: string): Promise<void> {
    await this.conversation.send(text);
    void this.chat.refresh();
  }

  protected askDelete(message: ChatMessage): void {
    this.ask({
      title: 'Apagar esta mensagem?',
      text: 'Ela vira "Mensagem apagada" para todos, e o texto sai do banco.',
      label: 'Apagar',
      run: async () => {
        if (!(await this.conversation.deleteMessage(message.id))) {
          this.notification.error(FAILURE);
        }
        void this.chat.refresh();
      },
    });
  }

  protected openCreate(): void {
    this.createFailure.set(null);
    this.pane.set('create');
    void this.friends.load();
  }

  protected closePane(): void {
    this.pane.set('conversation');
  }

  protected async create(squad: NewSquad): Promise<void> {
    this.busy.set(true);
    this.createFailure.set(null);
    try {
      const { status, id } = await this.source.createSquad(squad.name, squad.memberIds);
      if (status !== 'created' || !id) {
        this.createFailure.set(status === 'created' ? FAILURE : createSquadFailureText(status));
        return;
      }
      await this.chat.refresh();
      this.pane.set('conversation');
      await this.router.navigate(['/conversas', id]);
    } catch {
      this.createFailure.set(FAILURE);
    } finally {
      this.busy.set(false);
    }
  }

  protected async openDetails(): Promise<void> {
    this.pane.set('details');
    void this.friends.load();
    await this.loadMembers();
  }

  protected async rename(name: string): Promise<void> {
    await this.squadAction(async (id) => {
      if (!(await this.source.renameSquad(id, name))) {
        this.notification.error(FAILURE);
      }
    });
  }

  protected async add(friend: Player): Promise<void> {
    await this.squadAction(async (id) => {
      const text = addMemberFailureText(await this.source.addMember(id, friend.id));
      if (text) {
        this.notification.information(text);
      }
    });
  }

  protected askRemove(member: SquadMember): void {
    this.ask({
      title: `Remover ${member.name} do squad?`,
      text: 'Essa pessoa deixa de ler e enviar mensagens aqui.',
      label: 'Remover',
      run: () =>
        this.squadAction(async (id) => {
          if (!(await this.source.removeMember(id, member.id))) {
            this.notification.error(FAILURE);
          }
        }),
    });
  }

  protected askLeave(): void {
    this.ask({
      title: 'Sair do squad?',
      text: 'Ele some da sua lista. Se você for a última pessoa, o squad e as mensagens são apagados.',
      label: 'Sair',
      run: async () => {
        const id = this.id();
        if (!id) {
          return;
        }
        try {
          await this.source.leaveSquad(id);
          await this.chat.refresh();
          await this.router.navigateByUrl('/conversas');
        } catch {
          this.notification.error(FAILURE);
        }
      },
    });
  }

  private ask(confirmation: Confirmation): void {
    this.confirmation.set(confirmation);
    this.modal().open();
  }

  private async confirm(): Promise<void> {
    this.modal().close();
    await this.confirmation()?.run();
  }

  private async squadAction(action: (id: string) => Promise<void>): Promise<void> {
    const id = this.id();
    if (!id) {
      return;
    }
    this.busy.set(true);
    try {
      await action(id);
      await Promise.all([this.chat.refresh(), this.loadMembers()]);
    } catch {
      this.notification.error(FAILURE);
    } finally {
      this.busy.set(false);
    }
  }

  private async loadMembers(): Promise<void> {
    const id = this.id();
    if (id) {
      const members = await this.source.squadMembers(id).catch(() => null);
      if (members) {
        this.members.set(members);
      } else {
        this.notification.error(FAILURE);
      }
    }
  }
}
