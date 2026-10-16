import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ClipboardService } from './clipboard.service';

function setup(clipboard: Partial<Clipboard> | undefined): ClipboardService {
  TestBed.configureTestingModule({
    providers: [{ provide: DOCUMENT, useValue: { defaultView: { navigator: { clipboard } } } }],
  });
  return TestBed.inject(ClipboardService);
}

describe('ClipboardService', () => {
  it('copia o texto', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    expect(await setup({ writeText }).copy('link')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('link');
  });

  it('devolve false se o navegador negar', async () => {
    const writeText = () => Promise.reject(new Error('negado'));
    expect(await setup({ writeText }).copy('link')).toBe(false);
  });

  it('devolve false se não houver área de transferência', async () => {
    expect(await setup(undefined).copy('link')).toBe(false);
  });
});
