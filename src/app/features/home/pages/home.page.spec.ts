import { TestBed } from '@angular/core/testing';

import { HomePage } from './home.page';

describe('HomePage', () => {
  async function render(): Promise<HTMLElement> {
    await TestBed.configureTestingModule({ imports: [HomePage] }).compileComponents();
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('mostra o nome do produto como título', async () => {
    const element = await render();
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Party Radar');
  });

  it('informa a próxima etapa', async () => {
    const element = await render();
    expect(element.querySelector('p')?.textContent).toContain('tela de login');
  });

  it('renderiza o botão do PO UI desabilitado', async () => {
    const element = await render();
    const button = element.querySelector('po-button button') as HTMLButtonElement | null;
    expect(button).not.toBeNull();
    expect(button?.disabled).toBe(true);
    expect(button?.textContent).toContain('Tudo certo');
  });
});
