import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ExternalNavigation } from './external-navigation';

describe('ExternalNavigation', () => {
  function setup(defaultView: unknown): ExternalNavigation {
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: { defaultView } }],
    });
    return TestBed.inject(ExternalNavigation);
  }

  it('diz a origem do app e sai para o endereço pedido', () => {
    const assign = vi.fn();
    const navigation = setup({ location: { origin: 'http://localhost:4200', assign } });
    expect(navigation.origin()).toBe('http://localhost:4200');
    navigation.go('https://steamcommunity.com/openid/login');
    expect(assign).toHaveBeenCalledWith('https://steamcommunity.com/openid/login');
  });

  it('fora do navegador, não quebra', () => {
    const navigation = setup(null);
    expect(navigation.origin()).toBe('');
    expect(() => navigation.go('https://exemplo.test')).not.toThrow();
  });
});
