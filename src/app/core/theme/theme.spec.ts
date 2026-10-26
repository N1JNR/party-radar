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

/** Contraste WCAG 2.x entre duas cores hex (#RRGGBB). */
function contrast(a: string, b: string): number {
  const luminance = (hex: string): number => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

describe('partyRadarTheme', () => {
  const dark = Array.isArray(partyRadarTheme.type) ? undefined : partyRadarTheme.type.dark;
  const page = dark?.color?.neutral?.light?.['00'] ?? '';

  it('mantém o violeta da marca e usa um violeta mais claro para as ações', () => {
    expect(dark?.color?.brand?.['01']?.base).toBe('#6E4BFF');
    expect(dark?.color?.action).toMatchObject({
      default: '#8B6CFF',
      hover: '#A996FF',
      pressed: '#9A82FF',
    });
  });

  // Regressão da T11a: o texto do botão secundário (cor de ação sobre o fundo) e o do primário
  // (fundo escuro sobre a cor de ação) davam 3,7:1 com #6E4BFF.
  it.each(['default', 'hover', 'pressed'] as const)(
    'ação %s tem contraste mínimo de 4,5:1 com o fundo da página',
    (state) => {
      const action = dark?.color?.action?.[state] ?? '';
      expect(contrast(action, page)).toBeGreaterThanOrEqual(4.5);
    },
  );

  // Regressão da 000-contraste-toasts: só o `base` dos avisos estava no tema, então o fundo do
  // toast (`lightest`) ficava no rosa-claro padrão do PO UI, sob o texto claro do tema (1,02:1).
  describe.each(['negative', 'positive', 'warning', 'info'] as const)('aviso %s', (kind) => {
    const tone = dark?.color?.feedback?.[kind];
    const text = dark?.color?.neutral?.dark?.['90'] ?? '';
    const icon = dark?.color?.neutral?.light?.['00'] ?? '';

    it('tem a escala inteira no tema, sem depender do padrão claro do PO UI', () => {
      for (const step of ['lightest', 'lighter', 'light', 'base', 'dark', 'darker', 'darkest']) {
        expect(tone?.[step as keyof typeof tone]).toMatch(/^#[0-9A-F]{6}$/);
      }
    });

    it('texto do toast sobre o fundo dele: mínimo de 4,5:1', () => {
      expect(contrast(text, tone?.lightest ?? '')).toBeGreaterThanOrEqual(4.5);
    });

    it('texto de tag (darker) sobre o fundo dela: mínimo de 4,5:1', () => {
      expect(contrast(tone?.darker ?? '', tone?.lightest ?? '')).toBeGreaterThanOrEqual(4.5);
    });

    it('ícone do toast sobre a cor do aviso: mínimo de 4,5:1', () => {
      expect(contrast(icon, tone?.base ?? '')).toBeGreaterThanOrEqual(4.5);
    });
  });

  it('o cálculo de contraste confere com valores conhecidos', () => {
    expect(contrast('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
    expect(contrast('#6E4BFF', '#0E1117')).toBeCloseTo(3.7, 1);
  });

  it('começa no modo escuro', () => {
    expect(partyRadarTheme.active).toBe(PoThemeTypeEnum.dark);
  });
});
