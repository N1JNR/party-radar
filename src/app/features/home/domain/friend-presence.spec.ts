import { playingForLabel } from './friend-presence';

const now = new Date('2026-10-16T22:00:00Z');

describe('playingForLabel', () => {
  it.each([
    ['2026-10-16T22:00:00Z', 'agora mesmo'],
    ['2026-10-16T21:59:30Z', 'agora mesmo'],
    ['2026-10-16T21:55:00Z', 'há 5 min'],
    ['2026-10-16T21:00:01Z', 'há 59 min'],
    ['2026-10-16T20:00:00Z', 'há 2h'],
    ['2026-10-16T20:40:00Z', 'há 1h20'],
    ['2026-10-16T21:55:00-03:00', 'agora mesmo'],
    ['data inválida', 'agora mesmo'],
  ])('%s vira "%s"', (startedAt, label) => {
    expect(playingForLabel(startedAt, now)).toBe(label);
  });
});
