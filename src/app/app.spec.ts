import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';
import { AUTH_GATEWAY, RestoredSession } from './core/auth/auth.gateway';

describe('App', () => {
  let resolveSession: (session: RestoredSession) => void;

  beforeEach(async () => {
    const restoreSession = () =>
      new Promise<RestoredSession>((resolve) => (resolveSession = resolve));
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: AUTH_GATEWAY,
          useValue: { restoreSession, onSessionEnded: () => () => undefined },
        },
      ],
    }).compileComponents();
  });

  it('cria o componente raiz', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('mostra só o carregamento enquanto verifica a sessão (CA11)', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const status = element.querySelector('[role="status"]');
    expect(status?.textContent).toContain('Verificando sua sessão…');
    expect(element.querySelector('router-outlet')).toBeNull();
  });

  it('mostra as rotas depois de verificar a sessão', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    resolveSession({ user: null });
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('router-outlet')).not.toBeNull();
    expect(element.querySelector('[role="status"]')).toBeNull();
  });
});
