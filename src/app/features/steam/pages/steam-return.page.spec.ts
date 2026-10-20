import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { PoNotificationService } from '@po-ui/ng-components';

import { STEAM_SOURCE, SteamSource } from '../data/steam.source';
import { SteamReturnPage } from './steam-return.page';

const positive = {
  'openid.mode': 'id_res',
  'openid.claimed_id': 'https://steamcommunity.com/openid/id/76561198000000001',
  'openid.sig': 'assinatura=',
  next: '/inicio',
};

describe('SteamReturnPage', () => {
  async function render(query: Record<string, string>, connect: SteamSource['connect']) {
    const success = vi.fn();
    const error = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PoNotificationService, useValue: { success, error } },
        { provide: STEAM_SOURCE, useValue: { connect } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(query) } },
        },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(SteamReturnPage);
    fixture.detectChanges();
    await vi.waitFor(() => expect(navigate).toHaveBeenCalled());
    return { success, error, navigate, element: fixture.nativeElement as HTMLElement };
  }

  it('mostra que está conectando enquanto o servidor confere', async () => {
    const { element } = await render(positive, () => Promise.resolve('connected'));
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Conectando sua Steam');
  });

  it('manda só os campos openid.* e volta ao Meu card com "Steam conectada." (CA2)', async () => {
    const connect = vi.fn<SteamSource['connect']>(() => Promise.resolve('connected'));
    const { success, navigate } = await render(positive, connect);
    expect(connect).toHaveBeenCalledWith({
      mode: 'id_res',
      claimed_id: 'https://steamcommunity.com/openid/id/76561198000000001',
      sig: 'assinatura=',
    });
    expect(success).toHaveBeenCalledWith('Steam conectada.');
    expect(navigate).toHaveBeenCalledWith('/inicio', { replaceUrl: true });
  });

  it('conta já ligada a outro perfil (CA4)', async () => {
    const { error } = await render(positive, () => Promise.resolve('taken'));
    expect(error).toHaveBeenCalledWith('Essa conta Steam já está ligada a outro perfil.');
  });

  it('cancelou na Steam: nem chama o servidor e avisa a falha (CA5)', async () => {
    const connect = vi.fn<SteamSource['connect']>();
    const { error, navigate } = await render({ 'openid.mode': 'cancel' }, connect);
    expect(connect).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith('Não foi possível conectar a Steam. Tente de novo.');
    expect(navigate).toHaveBeenCalledWith('/inicio', { replaceUrl: true });
  });

  it('erro inesperado ao conectar também é falha (CA5)', async () => {
    const { error } = await render(positive, () => Promise.reject(new Error('rede')));
    expect(error).toHaveBeenCalledWith('Não foi possível conectar a Steam. Tente de novo.');
  });
});
