import { TestBed } from '@angular/core/testing';
import { PoThemeService, PoThemeTypeEnum } from '@po-ui/ng-components';

import { partyRadarTheme } from '../../../theme/party-radar.theme';
import { AppThemeService } from './theme';

describe('AppThemeService', () => {
  function setup(setTheme: ReturnType<typeof vi.fn>): AppThemeService {
    TestBed.configureTestingModule({
      providers: [{ provide: PoThemeService, useValue: { setTheme } }],
    });
    return TestBed.inject(AppThemeService);
  }

  it('aplica o tema do Party Radar no modo escuro', async () => {
    const setTheme = vi.fn().mockResolvedValue(undefined);
    await setup(setTheme).apply();
    expect(setTheme).toHaveBeenCalledWith(partyRadarTheme, PoThemeTypeEnum.dark);
  });

  it('propaga o erro quando o PO UI não consegue aplicar o tema', async () => {
    const setTheme = vi.fn().mockRejectedValue(new Error('falhou'));
    await expect(setup(setTheme).apply()).rejects.toThrow('falhou');
  });
});

describe('partyRadarTheme', () => {
  it('usa o violeta da marca como ação principal', () => {
    const dark = Array.isArray(partyRadarTheme.type) ? undefined : partyRadarTheme.type.dark;
    expect(dark?.color?.action?.default).toBe('#6E4BFF');
    expect(dark?.color?.brand?.['01']?.base).toBe('#6E4BFF');
  });

  it('começa no modo escuro', () => {
    expect(partyRadarTheme.active).toBe(PoThemeTypeEnum.dark);
  });
});
