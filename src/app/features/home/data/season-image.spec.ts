import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SeasonImage } from '../domain/season';
import { SeasonImageService } from './season-image';

const png = new Blob(['png'], { type: 'image/png' });

const image = (fields: Partial<SeasonImage> = {}): SeasonImage => ({
  username: 'ana',
  season: 1,
  rankId: 'veterano',
  hours: 42,
  topGame: 'ARC Raiders',
  daysLeft: 52,
  ...fields,
});

/** Contexto falso: guarda o texto e mede 0,6 × o tamanho da fonte por letra. */
function fakeContext() {
  const texts: string[] = [];
  const context = {
    font: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    textAlign: '',
    textBaseline: '',
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    measureText(text: string) {
      const size = Number(/(\d+)px/.exec(context.font)?.[1]);
      return { width: text.length * size * 0.6 };
    },
    fillText(text: string) {
      texts.push(text);
    },
  };
  return { context, texts };
}

function setup(context: unknown, blob: Blob | null = png) {
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => context,
    toBlob: (done: (value: Blob | null) => void) => done(blob),
  };
  TestBed.configureTestingModule({
    providers: [
      {
        provide: DOCUMENT,
        useValue: {
          createElement: () => canvas,
          fonts: { load: () => Promise.resolve([]) },
        },
      },
    ],
  });
  return { service: TestBed.inject(SeasonImageService), canvas };
}

describe('SeasonImageService', () => {
  it('gera o PNG com a temporada, a patente, as horas e o jogo principal (spec 005, CA13)', async () => {
    const { context, texts } = fakeContext();
    const { service, canvas } = setup(context);

    await expect(service.create(image())).resolves.toBe(png);

    expect([canvas.width, canvas.height]).toEqual([1080, 1350]);
    expect(texts).toEqual([
      '@ana no Party Radar',
      'Temporada 1',
      'Veterano de lobby',
      '42h',
      'nesta temporada, somando todos os jogos',
      'ARC Raiders',
      'o jogo principal da temporada',
      'Faltam 52 dias',
    ]);
  });

  it('desenha uma marca para cada uma das 6 patentes', async () => {
    const { context } = fakeContext();
    const { service } = setup(context);

    await service.create(image());

    expect(context.closePath).toHaveBeenCalledTimes(6);
  });

  it('no troféu, diz que a temporada terminou (CA13)', async () => {
    const { context, texts } = fakeContext();
    const { service } = setup(context);

    await service.create(image({ daysLeft: null }));

    expect(texts.at(-1)).toBe('Temporada encerrada');
  });

  it('sem jogo principal, não fala dele', async () => {
    const { context, texts } = fakeContext();
    const { service } = setup(context);

    await service.create(image({ topGame: null }));

    expect(texts.join(' ')).not.toContain('jogo principal');
  });

  it('nome de jogo que não cabe é cortado com reticências', async () => {
    const { context, texts } = fakeContext();
    const { service } = setup(context);
    const topGame = 'Um jogo com um nome grande demais para a imagem de compartilhar da temporada';

    await service.create(image({ topGame }));

    expect(texts.find((text) => text.startsWith('Um jogo'))?.endsWith('…')).toBe(true);
  });

  it('rejeita se o canvas não estiver disponível (spec 004, CA16)', async () => {
    const { service } = setup(null);
    await expect(service.create(image())).rejects.toThrow();
  });

  it('rejeita se o PNG não puder ser gerado (spec 004, CA16)', async () => {
    const { context } = fakeContext();
    const { service } = setup(context, null);
    await expect(service.create(image())).rejects.toThrow();
  });
});
