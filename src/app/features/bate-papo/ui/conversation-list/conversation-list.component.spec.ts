import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Conversation } from '../../domain/chat';
import { ConversationListComponent } from './conversation-list.component';

const conversation = (id: string, unread = 0): Conversation => ({
  id,
  kind: 'squad',
  title: `Squad ${id}`,
  avatarUrl: null,
  isOwner: false,
  memberCount: 3,
  canSend: true,
  lastBody: 'bora',
  lastDeleted: false,
  lastSenderName: 'Bia',
  lastAt: '2026-11-05T15:30:00Z',
  unread,
});

function render(selectedId: string | null = null) {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(ConversationListComponent);
  fixture.componentRef.setInput('conversations', [conversation('a', 2), conversation('b')]);
  fixture.componentRef.setInput('selectedId', selectedId);
  fixture.componentRef.setInput('now', new Date('2026-11-05T16:00:00Z'));
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('ConversationListComponent', () => {
  it('mostra nome, última mensagem e horário (spec 007, CA19)', () => {
    const row = render().querySelector('.row');
    expect(row?.querySelector('.row__title')?.textContent).toBe('Squad a');
    expect(row?.querySelector('.row__preview')?.textContent).toBe('Bia: bora');
    expect(row?.querySelector('.row__time')?.textContent).toBe('12:30');
  });

  it('diz em texto quantas faltam ler, só em quem tem (CA18)', () => {
    const element = render();
    expect([...element.querySelectorAll('.row__unread')].map((n) => n.textContent)).toEqual([
      '2 não lidas',
    ]);
  });

  it('cada conversa é um link (CA24)', () => {
    const links = [...render().querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(links).toEqual(['/conversas/a', '/conversas/b']);
  });

  it('marca a conversa aberta', () => {
    const links = [...render('b').querySelectorAll('a')];
    expect(links[1].getAttribute('aria-current')).toBe('page');
    expect(links[0].hasAttribute('aria-current')).toBe(false);
  });
});
