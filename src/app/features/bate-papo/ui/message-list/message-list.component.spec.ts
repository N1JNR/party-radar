import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatMessage, PendingMessage } from '../../domain/chat';
import { MessageListComponent } from './message-list.component';

const message = (id: string, fields: Partial<ChatMessage> = {}): ChatMessage => ({
  id,
  clientId: id,
  senderId: 'bia',
  senderName: 'Bia',
  senderAvatarUrl: null,
  body: `texto ${id}`,
  createdAt: '2026-11-05T15:30:00Z',
  deleted: false,
  mine: false,
  ...fields,
});

function render(
  messages: ChatMessage[],
  pending: PendingMessage[] = [],
  hasOlder = false,
): { fixture: ComponentFixture<MessageListComponent>; element: HTMLElement } {
  const fixture = TestBed.createComponent(MessageListComponent);
  fixture.componentRef.setInput('messages', messages);
  fixture.componentRef.setInput('pending', pending);
  fixture.componentRef.setInput('hasOlder', hasOlder);
  fixture.componentRef.setInput('now', new Date('2026-11-05T16:00:00Z'));
  fixture.detectChanges();
  return { fixture, element: fixture.nativeElement as HTMLElement };
}

describe('MessageListComponent', () => {
  it('é anunciada ao leitor de tela (spec 007, CA24)', () => {
    const log = render([]).element.querySelector('[role="log"]');
    expect(log?.getAttribute('aria-live')).toBe('polite');
  });

  it('mostra autor, texto, hora e o dia (CA3)', () => {
    const { element } = render([message('a')]);
    expect(element.querySelector('.message__author')?.textContent).toBe('Bia');
    expect(element.querySelector('.message__body')?.textContent).toBe('texto a');
    expect(element.querySelector('time')?.textContent).toBe('12:30');
    expect(element.querySelector('.messages__day')?.textContent).toBe('Hoje');
  });

  it('HTML e links aparecem como texto puro (CA7)', () => {
    const body = '<img src=x onerror=alert(1)> https://exemplo.test';
    const { element } = render([message('a', { body })]);
    const shown = element.querySelector('.message__body');
    expect(shown?.textContent).toBe(body);
    expect(shown?.querySelector('img')).toBeNull();
    expect(shown?.querySelector('a')).toBeNull();
  });

  it('a própria mensagem não repete o autor e pode ser apagada (CA5)', () => {
    const mine = message('a', { mine: true });
    const { fixture, element } = render([mine]);
    expect(element.querySelector('.message__author')).toBeNull();
    const removed: ChatMessage[] = [];
    fixture.componentInstance.remove.subscribe((item) => removed.push(item));
    const button = element.querySelector('.message__action') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Apagar esta mensagem');
    button.click();
    expect(removed).toEqual([mine]);
  });

  it('não dá para apagar a mensagem de outra pessoa (CA5)', () => {
    expect(render([message('a')]).element.querySelector('.message__action')).toBeNull();
  });

  it('mensagem apagada mostra só o aviso (CA5)', () => {
    const { element } = render([message('a', { body: null, deleted: true, mine: true })]);
    expect(element.querySelector('.message__body')?.textContent).toBe('Mensagem apagada');
    expect(element.querySelector('.message__action')).toBeNull();
  });

  it('conta apagada aparece como removida', () => {
    const { element } = render([message('a', { senderId: null, senderName: null })]);
    expect(element.querySelector('.message__author')?.textContent).toBe('Conta removida');
  });

  it('o que está saindo mostra "Enviando…" (CA9)', () => {
    const { element } = render(
      [],
      [{ clientId: 'k', body: 'oi', status: 'sending', reason: null }],
    );
    expect(element.querySelector('.message--pending')?.textContent).toContain('Enviando…');
  });

  it('o que falhou explica e deixa tentar de novo (CA9, CA10)', () => {
    const { fixture, element } = render(
      [],
      [{ clientId: 'k', body: 'oi', status: 'failed', reason: 'Não enviada.' }],
    );
    const retried: string[] = [];
    fixture.componentInstance.retry.subscribe((id) => retried.push(id));
    expect(element.querySelector('[role="alert"]')?.textContent).toBe('Não enviada.');
    (element.querySelector('.message__action') as HTMLButtonElement).click();
    expect(retried).toEqual(['k']);
  });

  describe('rolagem (CA6)', () => {
    function layout(element: HTMLElement, fields: { top: number; height: number; client: number }) {
      const scroller = element.querySelector('.messages') as HTMLElement;
      Object.defineProperty(scroller, 'scrollHeight', { configurable: true, value: fields.height });
      Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: fields.client });
      scroller.scrollTop = fields.top;
      return scroller;
    }

    it('ao rolar para cima, pede as anteriores', () => {
      const { fixture, element } = render([message('a')], [], true);
      let asked = 0;
      fixture.componentInstance.older.subscribe(() => (asked += 1));
      const scroller = layout(element, { top: 10, height: 1000, client: 400 });
      scroller.dispatchEvent(new Event('scroll'));
      expect(asked).toBe(1);
    });

    it('longe do topo, ou sem mais mensagens, não pede', () => {
      const { fixture, element } = render([message('a')], [], true);
      let asked = 0;
      fixture.componentInstance.older.subscribe(() => (asked += 1));
      layout(element, { top: 300, height: 1000, client: 400 }).dispatchEvent(new Event('scroll'));
      fixture.componentRef.setInput('hasOlder', false);
      fixture.detectChanges();
      layout(element, { top: 0, height: 1000, client: 400 }).dispatchEvent(new Event('scroll'));
      expect(asked).toBe(0);
    });

    it('enquanto carrega, não pede de novo', () => {
      const { fixture, element } = render([message('a')], [], true);
      fixture.componentRef.setInput('loadingOlder', true);
      fixture.detectChanges();
      let asked = 0;
      fixture.componentInstance.older.subscribe(() => (asked += 1));
      layout(element, { top: 0, height: 1000, client: 400 }).dispatchEvent(new Event('scroll'));
      expect(asked).toBe(0);
    });

    it('não pula ao chegarem as anteriores', async () => {
      const { fixture, element } = render([message('b')], [], true);
      const scroller = layout(element, { top: 10, height: 1000, client: 400 });
      scroller.dispatchEvent(new Event('scroll'));
      Object.defineProperty(scroller, 'scrollHeight', { configurable: true, value: 1500 });
      fixture.componentRef.setInput('messages', [message('a'), message('b')]);
      fixture.detectChanges();
      TestBed.tick();
      await fixture.whenStable();
      expect(scroller.scrollTop).toBe(510);
    });

    it('no fim, acompanha a mensagem nova (CA3)', async () => {
      const { fixture, element } = render([message('a')]);
      const scroller = layout(element, { top: 600, height: 1000, client: 400 });
      scroller.dispatchEvent(new Event('scroll'));
      Object.defineProperty(scroller, 'scrollHeight', { configurable: true, value: 1200 });
      fixture.componentRef.setInput('messages', [message('a'), message('b')]);
      fixture.detectChanges();
      TestBed.tick();
      await fixture.whenStable();
      expect(scroller.scrollTop).toBe(1200);
    });

    it('lendo mensagens antigas, não é puxada para o fim', async () => {
      const { fixture, element } = render([message('a')]);
      const scroller = layout(element, { top: 300, height: 1000, client: 400 });
      scroller.dispatchEvent(new Event('scroll'));
      fixture.componentRef.setInput('messages', [message('a'), message('b')]);
      fixture.detectChanges();
      TestBed.tick();
      await fixture.whenStable();
      expect(scroller.scrollTop).toBe(300);
    });
  });
});
