import { partnershipQuestionText } from './partnership';

const now = new Date(2026, 9, 16, 21, 0);
const at = (day: number, hours: number, minutes: number) =>
  new Date(2026, 9, day, hours, minutes).toISOString();

describe('partnershipQuestionText', () => {
  it('ontem, com minutos no fim (CA11)', () => {
    expect(
      partnershipQuestionText(
        { friendName: 'Rafa', game: 'CS2', startedAt: at(15, 22, 0), endedAt: at(15, 23, 40) },
        now,
      ),
    ).toBe('Você jogou CS2 com Rafa ontem, das 22h às 23h40?');
  });

  it('hoje', () => {
    expect(
      partnershipQuestionText(
        { friendName: 'Bia', game: 'Fortnite', startedAt: at(16, 14, 5), endedAt: at(16, 15, 0) },
        now,
      ),
    ).toBe('Você jogou Fortnite com Bia hoje, das 14h05 às 15h?');
  });

  it('dias antes mostra a data', () => {
    expect(
      partnershipQuestionText(
        { friendName: 'Caio', game: 'Valorant', startedAt: at(2, 20, 0), endedAt: at(2, 21, 30) },
        now,
      ),
    ).toBe('Você jogou Valorant com Caio em 02/10, das 20h às 21h30?');
  });

  it('com datas inválidas, pergunta sem o horário', () => {
    expect(
      partnershipQuestionText(
        { friendName: 'Rafa', game: 'CS2', startedAt: 'x', endedAt: at(15, 23, 40) },
        now,
      ),
    ).toBe('Você jogou CS2 com Rafa?');
    expect(
      partnershipQuestionText(
        { friendName: 'Rafa', game: 'CS2', startedAt: at(15, 22, 0), endedAt: '' },
        now,
      ),
    ).toBe('Você jogou CS2 com Rafa?');
  });
});
