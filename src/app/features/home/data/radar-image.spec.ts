import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { PlayedGame, radarSummary } from '../domain/player-radar';
import { RadarImageService } from './radar-image';

const png = new Blob(['png'], { type: 'image/png' });

const game = (overrides: Partial<PlayedGame> = {}): PlayedGame => ({
  appId: 1,
  name: 'ARC Raiders',
  kind: 'tiro',
  totalHours: 313,
  monthHours: 15,
  previousMonthHours: 46,
  ...overrides,
});

/** Contexto falso: guarda o texto e mede 0,6 × o tamanho da fonte por letra. */
function fakeContext() {
  const texts: { text: string; font: string }[] = [];
  const context = {
    font: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineJoin: '',
    globalAlpha: 1,
    textAlign: '',
    textBaseline: '',
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    measureText(text: string) {
      const size = Number(/(\d+)px/.exec(context.font)?.[1]);
      return { width: text.length * size * 0.6 };
    },
    fillText(text: string) {
      texts.push({ text, font: context.font });
    },
  };
  return { context, texts };
}

function setup(options: { context?: unknown; blob?: Blob | null; fonts?: () => Promise<unknown> }) {
  const { context = fakeContext().context, blob = png, fonts } = options;
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => context),
    toBlob: vi.fn((done: (value: Blob | null) => void) => done(blob)),
  };
  const load = vi.fn(fonts ?? (() => Promise.resolve([])));
  TestBed.configureTestingModule({
    providers: [
      {
        provide: DOCUMENT,
        useValue: { createElement: () => canvas, fonts: { load } },
      },
    ],
  });
  return { service: TestBed.inject(RadarImageService), canvas, load };
}

describe('RadarImageService', () => {
  it('gera o PNG com título, radar, horas, jogos e jogo principal (CA14)', async () => {
    const { context, texts } = fakeContext();
    const { service, canvas, load } = setup({ context });
    const summary = radarSummary('ana', [game()]);

    await expect(service.create(summary)).resolves.toBe(png);

    expect([canvas.width, canvas.height]).toEqual([1080, 1350]);
    expect(load).toHaveBeenCalled();
    expect(texts.map((entry) => entry.text)).toEqual([
      '@ana no Party Radar',
      'Atirador nato',
      'Tiro',
      'Esporte',
      'Corrida',
      'Simulação',
      'Arcade',
      'RPG',
      'Aventura',
      '313h',
      'em 1 jogo',
      'ARC Raiders',
      'o jogo da vida: 313h',
    ]);
    expect(context.lineTo).toHaveBeenCalled();
  });

  it('traz só o @usuário e os dados de jogo (CA15)', () => {
    expect(Object.keys(radarSummary('ana', [game()])).sort()).toEqual([
      'axes',
      'games',
      'hours',
      'title',
      'top',
      'username',
    ]);
  });

  it('mostra horas inteiras, para caber ao lado do jogo principal', async () => {
    const { context, texts } = fakeContext();
    const { service } = setup({ context });

    await service.create(radarSummary('ana', [game({ totalHours: 313.4 })]));

    const all = texts.map((entry) => entry.text);
    expect(all).toContain('313h');
    expect(all).toContain('o jogo da vida: 313h');
  });

  it('diminui o título longo até caber', async () => {
    const { context, texts } = fakeContext();
    const { service } = setup({ context });

    await service.create(radarSummary('ana', [game({ kind: 'simulacao' })]));

    const title = texts.find((entry) => entry.text === 'Mestre da simulação');
    const size = Number(/(\d+)px/.exec(title?.font ?? '')?.[1]);
    expect(size).toBeLessThan(112);
    expect('Mestre da simulação'.length * size * 0.6).toBeLessThanOrEqual(920);
  });

  it('corta com reticências o nome de jogo que não cabe', async () => {
    const { context, texts } = fakeContext();
    const { service } = setup({ context });
    const name = 'Um jogo com um nome grande demais para a imagem de compartilhar';

    await service.create(radarSummary('ana', [game({ name })]));

    const cut = texts.find((entry) => entry.text.startsWith('Um jogo'))?.text;
    expect(cut).not.toBe(name);
    expect(cut?.endsWith('…')).toBe(true);
  });

  it('sem jogos, mostra "Seu radar" e não fala de jogo principal', async () => {
    const { context, texts } = fakeContext();
    const { service } = setup({ context });

    await service.create(radarSummary('ana', []));

    const all = texts.map((entry) => entry.text);
    expect(all).toContain('Seu radar');
    expect(all.join(' ')).not.toContain('o jogo da vida');
  });

  it('sem as fontes do tema, a imagem sai do mesmo jeito', async () => {
    const { service } = setup({ fonts: () => Promise.reject(new Error('rede')) });
    await expect(service.create(radarSummary('ana', [game()]))).resolves.toBe(png);
  });

  it('rejeita se o canvas não estiver disponível (CA16)', async () => {
    const { service } = setup({ context: null });
    await expect(service.create(radarSummary('ana', [game()]))).rejects.toThrow();
  });

  it('rejeita se o PNG não puder ser gerado (CA16)', async () => {
    const { service } = setup({ blob: null });
    await expect(service.create(radarSummary('ana', [game()]))).rejects.toThrow();
  });
});
