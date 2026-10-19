import { DEFAULT_DESTINATION, returnFailure, returnUrl, safeDestination } from './auth-return';

describe('safeDestination', () => {
  it.each([
    ['/inicio', '/inicio'],
    ['/amigos?aba=pedidos', '/amigos?aba=pedidos'],
    ['/convite/ana#topo', '/convite/ana#topo'],
    ['/inicio/../amigos', '/amigos'],
  ])('mantém o caminho interno %s (CA5)', (next, expected) => {
    expect(safeDestination(next)).toBe(expected);
  });

  it.each([
    [null],
    [undefined],
    [''],
    ['https://malicioso.test/roubar'],
    ['//malicioso.test'],
    ['/\\malicioso.test'],
    // O URL descarta a tabulação e isto vira "//malicioso.test".
    ['/\t/malicioso.test'],
    ['javascript:alert(1)'],
    ['inicio'],
    ['/login'],
    ['/login?next=/inicio'],
    ['/auth/retorno?code=123'],
  ])('troca o destino %s pela tela inicial (CA6)', (next) => {
    expect(safeDestination(next)).toBe(DEFAULT_DESTINATION);
  });
});

describe('returnUrl', () => {
  it('volta para /auth/retorno levando o destino', () => {
    expect(returnUrl('http://localhost:4200', '/amigos?aba=1')).toBe(
      'http://localhost:4200/auth/retorno?next=%2Famigos%3Faba%3D1',
    );
  });

  it('sem destino válido, leva a tela inicial', () => {
    expect(returnUrl('http://localhost:4200', 'https://malicioso.test')).toBe(
      'http://localhost:4200/auth/retorno?next=%2Finicio',
    );
  });
});

describe('returnFailure', () => {
  it('sem erro, não há falha', () => {
    expect(returnFailure(null)).toBeNull();
    expect(returnFailure(undefined)).toBeNull();
    expect(returnFailure('')).toBeNull();
  });

  it('negar a autorização é login cancelado (CA13)', () => {
    expect(returnFailure('access_denied')).toBe('cancelled');
  });

  it('outros erros são falha do provedor ou do servidor (CA14)', () => {
    expect(returnFailure('server_error')).toBe('failed');
    expect(returnFailure('invalid_request')).toBe('failed');
  });
});
