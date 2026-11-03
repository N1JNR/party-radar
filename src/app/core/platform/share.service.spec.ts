import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ShareService } from './share.service';

const image = new Blob(['png'], { type: 'image/png' });

function setup(navigator: Partial<Navigator> | undefined) {
  const link = { href: '', download: '', click: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      {
        provide: DOCUMENT,
        useValue: { defaultView: { navigator }, createElement: () => link },
      },
    ],
  });
  return { service: TestBed.inject(ShareService), link };
}

describe('ShareService', () => {
  const createObjectURL = vi.fn(() => 'blob:radar');
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('usa o compartilhamento do aparelho quando ele aceita arquivos (CA14)', async () => {
    const share = vi.fn(() => Promise.resolve());
    const { service, link } = setup({ canShare: () => true, share });
    expect(await service.shareImage(image, 'radar.png', 'Meu radar')).toBe('shared');
    const [data] = share.mock.calls[0] as unknown as [ShareData];
    expect(data.title).toBe('Meu radar');
    expect(data.files?.[0].name).toBe('radar.png');
    expect(data.files?.[0].type).toBe('image/png');
    expect(link.click).not.toHaveBeenCalled();
  });

  it('não baixa se a pessoa desistir de compartilhar', async () => {
    const share = () => Promise.reject(new DOMException('desistiu', 'AbortError'));
    const { service, link } = setup({ canShare: () => true, share });
    expect(await service.shareImage(image, 'radar.png', 'Meu radar')).toBe('cancelled');
    expect(link.click).not.toHaveBeenCalled();
  });

  it('baixa se o aparelho recusar o compartilhamento', async () => {
    const share = () => Promise.reject(new DOMException('negado', 'NotAllowedError'));
    const { service, link } = setup({ canShare: () => true, share });
    expect(await service.shareImage(image, 'radar.png', 'Meu radar')).toBe('downloaded');
    expect(link.click).toHaveBeenCalledTimes(1);
  });

  it('baixa se o aparelho não aceitar arquivos (CA14)', async () => {
    const share = vi.fn();
    const { service, link } = setup({ canShare: () => false, share });
    expect(await service.shareImage(image, 'radar.png', 'Meu radar')).toBe('downloaded');
    expect(share).not.toHaveBeenCalled();
    expect(link.href).toBe('blob:radar');
    expect(link.download).toBe('radar.png');
    expect(link.click).toHaveBeenCalledTimes(1);
  });

  it('baixa se o navegador não tiver compartilhamento, e solta a imagem da memória', async () => {
    const { service, link } = setup(undefined);
    expect(await service.shareImage(image, 'radar.png', 'Meu radar')).toBe('downloaded');
    expect(link.click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:radar');
  });
});
