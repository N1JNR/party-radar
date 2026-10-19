import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SUPABASE } from '../supabase/supabase.client';
import { AUTH_GATEWAY } from './auth.gateway';
import { authGatewayKind, provideAuthGateway } from './auth-gateway.provider';
import { FakeAuthGateway } from './fake-auth.gateway';
import { SupabaseAuthGateway } from './supabase-auth.gateway';

describe('authGatewayKind', () => {
  it.each(['', '?simular-login=erro', '?simular-login', '?simular=erro'])(
    'em produção é sempre o Supabase, mesmo com "%s" (CA22)',
    (search) => {
      expect(authGatewayKind(true, search)).toBe('supabase');
    },
  );

  it('em desenvolvimento, sem o parâmetro, também é o Supabase', () => {
    expect(authGatewayKind(false, '')).toBe('supabase');
  });

  it('o ?simular= da home não liga o login simulado', () => {
    expect(authGatewayKind(false, '?simular=erro')).toBe('supabase');
  });

  it.each(['?simular-login=erro', '?simular-login', '?outro=1&simular-login=cancelado'])(
    'em desenvolvimento, "%s" liga o login simulado',
    (search) => {
      expect(authGatewayKind(false, search)).toBe('simulado');
    },
  );
});

describe('provideAuthGateway', () => {
  function gatewayFor(production: boolean, search: string): unknown {
    TestBed.configureTestingModule({
      providers: [
        provideAuthGateway(production),
        { provide: DOCUMENT, useValue: { defaultView: { location: { search } } } },
        { provide: SUPABASE, useValue: {} },
      ],
    });
    return TestBed.inject(AUTH_GATEWAY);
  }

  it('fornece o gateway do Supabase por padrão', () => {
    expect(gatewayFor(false, '')).toBeInstanceOf(SupabaseAuthGateway);
  });

  it('fornece o simulado com ?simular-login= em desenvolvimento', () => {
    expect(gatewayFor(false, '?simular-login=erro')).toBeInstanceOf(FakeAuthGateway);
  });

  it('em produção, ignora o ?simular-login= (CA22)', () => {
    expect(gatewayFor(true, '?simular-login=erro')).toBeInstanceOf(SupabaseAuthGateway);
  });

  it('sem janela (SSR), usa o Supabase', () => {
    TestBed.configureTestingModule({
      providers: [
        provideAuthGateway(false),
        { provide: DOCUMENT, useValue: { defaultView: null } },
        { provide: SUPABASE, useValue: {} },
      ],
    });
    expect(TestBed.inject(AUTH_GATEWAY)).toBeInstanceOf(SupabaseAuthGateway);
  });

  it('por padrão, segue o environment do build', () => {
    TestBed.configureTestingModule({
      providers: [
        provideAuthGateway(),
        { provide: DOCUMENT, useValue: { defaultView: { location: { search: '' } } } },
        { provide: SUPABASE, useValue: {} },
      ],
    });
    expect(TestBed.inject(AUTH_GATEWAY)).toBeInstanceOf(SupabaseAuthGateway);
  });
});
