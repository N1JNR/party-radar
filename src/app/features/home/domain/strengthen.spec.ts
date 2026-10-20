import { SteamStepState, strengthenSteps, stepStatusLabel } from './strengthen';

const statuses = (steam: SteamStepState, friends: number) =>
  strengthenSteps(steam, friends).map((step) => step.status);

describe('strengthenSteps', () => {
  it('sem Steam, Discord feito e o resto faltando (spec 003, CA1)', () => {
    expect(strengthenSteps('not-connected', 0)).toEqual([
      { id: 'discord', label: 'Discord conectado', status: 'done' },
      { id: 'steam-connected', label: 'Conectar Steam', status: 'pending' },
      { id: 'steam-public', label: 'Steam pública', status: 'pending' },
      { id: 'friends', label: 'Convidar amigos', status: 'pending' },
    ]);
  });

  it('Steam conectada, primeira leitura em andamento (spec 003, CA2)', () => {
    expect(statuses('reading', 0)).toEqual(['done', 'done', 'reading', 'pending']);
  });

  it('Steam conectada e privada (spec 003, CA6)', () => {
    expect(statuses('private', 0)).toEqual(['done', 'done', 'pending', 'pending']);
  });

  it('Steam pública e com amigos: tudo feito', () => {
    expect(statuses('public', 3)).toEqual(['done', 'done', 'done', 'done']);
  });
});

describe('stepStatusLabel', () => {
  it('diz o estado em texto', () => {
    expect(stepStatusLabel('done')).toBe('Feito');
    expect(stepStatusLabel('pending')).toBe('Falta');
    expect(stepStatusLabel('reading')).toBe('Lendo seus dados da Steam…');
  });
});
