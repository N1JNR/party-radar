import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageComposerComponent } from './message-composer.component';

describe('MessageComposerComponent', () => {
  let fixture: ComponentFixture<MessageComposerComponent>;
  let element: HTMLElement;
  let sent: string[];

  async function render(title = 'Bia'): Promise<void> {
    fixture = TestBed.createComponent(MessageComposerComponent);
    fixture.componentRef.setInput('conversationTitle', title);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
    sent = [];
    fixture.componentInstance.send.subscribe((text) => sent.push(text));
  }

  async function type(text: string): Promise<HTMLTextAreaElement> {
    const area = element.querySelector('textarea') as HTMLTextAreaElement;
    area.value = text;
    area.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return area;
  }

  const enter = (area: HTMLElement, shiftKey = false) => {
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      shiftKey,
      bubbles: true,
      cancelable: true,
    });
    area.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };

  it('tem rótulo dizendo para quem vai (spec 007, CA24)', async () => {
    await render();
    expect(element.textContent).toContain('Mensagem para Bia');
  });

  it('sem nome da conversa, o rótulo é genérico', async () => {
    await render('');
    expect(element.textContent).toContain('Mensagem');
    expect(element.textContent).not.toContain('Mensagem para');
  });

  it('Enter envia sem os espaços das pontas e limpa o campo (CA3, CA24)', async () => {
    await render();
    const area = await type('  oi  ');
    const event = enter(area);
    expect(event.defaultPrevented).toBe(true);
    expect(sent).toEqual(['oi']);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(area.value).toBe('');
  });

  it('Shift + Enter quebra a linha, sem enviar (CA24)', async () => {
    await render();
    const area = await type('oi');
    const event = enter(area, true);
    expect(event.defaultPrevented).toBe(false);
    expect(sent).toEqual([]);
  });

  it('o botão também envia', async () => {
    await render();
    await type('oi');
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    expect(sent).toEqual(['oi']);
  });

  it('vazio ou só com espaços não envia e explica (CA4)', async () => {
    await render();
    const area = await type('    ');
    enter(area);
    expect(sent).toEqual([]);
    expect(element.querySelector('.composer__error')?.textContent).toBe(
      'Escreva uma mensagem antes de enviar.',
    );
  });

  it('não reclama do campo vazio antes de tentar (CA4)', async () => {
    await render();
    expect(element.querySelector('.composer__error')).toBeNull();
  });

  it('passar de 2.000 caracteres avisa enquanto digita e não envia (CA4)', async () => {
    await render();
    const area = await type('a'.repeat(2001));
    expect(element.querySelector('.composer__error')?.textContent).toContain('2000');
    enter(area);
    expect(sent).toEqual([]);
  });

  it('o campo pode voltar vazio do formulário', async () => {
    await render();
    (fixture.componentInstance as unknown as { text: { set(v: string): void } }).text.set('');
    fixture.detectChanges();
    expect(element.querySelector('.composer__error')).toBeNull();
  });
});
