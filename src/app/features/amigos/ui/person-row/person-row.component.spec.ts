import { TestBed } from '@angular/core/testing';

import { PersonRowComponent } from './person-row.component';

function render(status: string | null) {
  const fixture = TestBed.createComponent(PersonRowComponent);
  fixture.componentRef.setInput('person', {
    id: '1',
    name: 'Bia',
    username: 'bia_souls',
    avatarUrl: null,
  });
  fixture.componentRef.setInput('status', status);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('PersonRowComponent', () => {
  it('mostra o nome, o @usuário e o estado em texto (spec 006, CA13, CA21)', () => {
    const element = render('Jogando Dota 2 agora');
    expect(element.querySelector('.person__name')?.textContent).toBe('Bia');
    expect(element.querySelector('.person__line')?.textContent).toBe('@bia_souls');
    expect(element.querySelector('.person__status')?.textContent).toBe('Jogando Dota 2 agora');
  });

  it('sem estado, não mostra a linha', () => {
    expect(render(null).querySelector('.person__status')).toBeNull();
  });
});
