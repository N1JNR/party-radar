import { TestBed } from '@angular/core/testing';

import { PartnershipQuestionComponent } from './partnership-question.component';

const buttons = (element: HTMLElement) => [
  ...element.querySelectorAll<HTMLButtonElement>('po-button button'),
];

describe('PartnershipQuestionComponent', () => {
  function render(answering = false) {
    const fixture = TestBed.createComponent(PartnershipQuestionComponent);
    fixture.componentRef.setInput('question', {
      id: 'q1',
      friendId: 'rafa',
      friendName: 'Rafa',
      game: 'CS2',
      startedAt: new Date(2026, 9, 15, 22, 0).toISOString(),
      endedAt: new Date(2026, 9, 15, 23, 40).toISOString(),
    });
    fixture.componentRef.setInput('now', new Date(2026, 9, 16, 21, 0));
    fixture.componentRef.setInput('answering', answering);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('pergunta com o jogo, o amigo e o horário, com Joguei e Não joguei (CA11)', () => {
    const { fixture, element } = render();
    const answered = vi.fn();
    fixture.componentInstance.answered.subscribe(answered);
    expect(element.querySelector('.question__text')?.textContent?.trim()).toBe(
      'Você jogou CS2 com Rafa ontem, das 22h às 23h40?',
    );
    const [played, notPlayed] = buttons(element);
    expect(played.textContent).toContain('Joguei');
    expect(notPlayed.textContent).toContain('Não joguei');
    played.click();
    notPlayed.click();
    expect(answered.mock.calls).toEqual([[true], [false]]);
  });

  it('desabilita os botões enquanto salva a resposta', () => {
    const { element } = render(true);
    expect(buttons(element).every((button) => button.disabled)).toBe(true);
  });
});
