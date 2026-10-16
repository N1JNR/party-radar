import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { AuthProvider } from '../../../core/auth/auth.gateway';
import { ProviderButtonComponent } from './provider-button.component';

describe('ProviderButtonComponent', () => {
  function render(
    provider: AuthProvider,
    inputs: { opening?: boolean; disabled?: boolean } = {},
  ): { fixture: ComponentFixture<ProviderButtonComponent>; button: HTMLButtonElement } {
    const fixture = TestBed.createComponent(ProviderButtonComponent);
    fixture.componentRef.setInput('provider', provider);
    if (inputs.opening !== undefined) fixture.componentRef.setInput('opening', inputs.opening);
    if (inputs.disabled !== undefined) fixture.componentRef.setInput('disabled', inputs.disabled);
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    if (!button) throw new Error('botão não renderizado');
    return { fixture, button };
  }

  it('Discord: texto, cor da marca e logo oficial (CA1)', () => {
    const { button } = render('discord');
    expect(button.textContent?.trim()).toBe('Continuar com Discord');
    expect(button.classList).toContain('provider-button');
    expect(button.classList).toContain('provider-button--discord');
    expect(button.querySelector('img')?.getAttribute('src')).toBe(
      'brands/discord-symbol-white.svg',
    );
  });

  it('Google: texto aprovado pelas diretrizes e logo oficial (CA1)', () => {
    const { button } = render('google');
    expect(button.textContent?.trim()).toBe('Continuar com o Google');
    expect(button.classList).toContain('provider-button--google');
    expect(button.querySelector('img')?.getAttribute('src')).toBe('brands/google-g.svg');
  });

  it('é um <button> real, com o logo decorativo escondido do leitor de tela (CA20)', () => {
    const { button } = render('discord');
    expect(button.type).toBe('button');
    expect(button.querySelector('img')?.getAttribute('alt')).toBe('');
  });

  it('avisa quando é tocado', () => {
    const { fixture, button } = render('google');
    const pressed = vi.fn();
    fixture.componentInstance.pressed.subscribe(pressed);
    button.click();
    expect(pressed).toHaveBeenCalledTimes(1);
  });

  it('enquanto abre, mostra para onde vai e fica ocupado e desabilitado (CA12)', () => {
    const { button } = render('discord', { opening: true });
    expect(button.textContent?.trim()).toBe('Abrindo Discord…');
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
  });

  it('fica desabilitado enquanto outro login está em andamento (CA12)', () => {
    const { fixture, button } = render('google', { disabled: true });
    const pressed = vi.fn();
    fixture.componentInstance.pressed.subscribe(pressed);
    button.click();
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('false');
    expect(pressed).not.toHaveBeenCalled();
  });
});
