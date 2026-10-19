import {
  STEAM_OPENID_LOGIN,
  STILL_PRIVATE_MESSAGE,
  connectMessage,
  isPositiveReturn,
  openIdFromSearch,
  steamLoginUrl,
} from './steam-connect';

describe('steamLoginUrl', () => {
  it('vai para o login da Steam e volta para /steam/retorno do app (CA2)', () => {
    const url = new URL(steamLoginUrl('http://localhost:4200'));
    expect(`${url.origin}${url.pathname}`).toBe(STEAM_OPENID_LOGIN);
    expect(url.searchParams.get('openid.mode')).toBe('checkid_setup');
    expect(url.searchParams.get('openid.return_to')).toBe('http://localhost:4200/steam/retorno');
    expect(url.searchParams.get('openid.realm')).toBe('http://localhost:4200');
    expect(url.searchParams.get('openid.ns')).toBe('http://specs.openid.net/auth/2.0');
    expect(url.searchParams.get('openid.claimed_id')).toBe(
      'http://specs.openid.net/auth/2.0/identifier_select',
    );
    expect(url.searchParams.get('openid.identity')).toBe(url.searchParams.get('openid.claimed_id'));
  });
});

describe('openIdFromSearch', () => {
  it('pega só os campos openid.*, sem o prefixo', () => {
    expect(openIdFromSearch('?openid.mode=id_res&openid.sig=abc%3D&next=%2Finicio')).toEqual({
      mode: 'id_res',
      sig: 'abc=',
    });
  });

  it('sem campos, devolve vazio', () => {
    expect(openIdFromSearch('')).toEqual({});
  });
});

describe('isPositiveReturn', () => {
  it('só a resposta positiva, com conta e assinatura, vai ao servidor', () => {
    expect(isPositiveReturn({ mode: 'id_res', claimed_id: 'x', sig: 'y' })).toBe(true);
  });

  it.each([
    [{ mode: 'cancel' }],
    [{ mode: 'id_res', sig: 'y' }],
    [{ mode: 'id_res', claimed_id: 'x' }],
    [{}],
  ])('cancelada ou incompleta não vai: %o (CA5)', (openid) => {
    expect(isPositiveReturn(openid)).toBe(false);
  });
});

describe('connectMessage', () => {
  it('avisa cada resultado (CA4, CA5)', () => {
    expect(connectMessage('connected')).toBe('Steam conectada.');
    expect(connectMessage('taken')).toBe('Essa conta Steam já está ligada a outro perfil.');
    expect(connectMessage('failed')).toBe('Não foi possível conectar a Steam. Tente de novo.');
  });

  it('tem o aviso de perfil ainda privado (CA7)', () => {
    expect(STILL_PRIVATE_MESSAGE).toContain('Ainda está privado');
  });
});
