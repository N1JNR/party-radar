import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppThemeService } from './theme';
import { initTheme } from './theme.initializer';

describe('initTheme', () => {
  function setup(platform: 'browser' | 'server'): ReturnType<typeof vi.fn> {
    const apply = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: platform },
        { provide: AppThemeService, useValue: { apply } },
      ],
    });
    return apply;
  }

  it('aplica o tema quando roda no navegador', async () => {
    const apply = setup('browser');
    await TestBed.runInInjectionContext(() => initTheme());
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('não faz nada no servidor (SSR)', () => {
    const apply = setup('server');
    const result = TestBed.runInInjectionContext(() => initTheme());
    expect(result).toBeUndefined();
    expect(apply).not.toHaveBeenCalled();
  });
});
