import { SteamStepState, strengthenSteps, stepStatusLabel } from './strengthen';

const statuses = (steam: SteamStepState) => strengthenSteps(steam).map((step) => step.status);

describe('strengthenSteps', () => {
  it('sem Steam, Discord feito e o resto faltando (spec 003, CA1)', () => {
    expect(strengthenSteps('not-connected')).toEqual([
      { id: 'discord', label: 'Discord conectado', status: 'done' },
      { id: 'steam-connected', label: 'Conectar Steam', status: 'pending' },
      { id: 'steam-public', label: 'Steam pública', status: 'pending' },
    ]);
  });

  it('Steam conectada, primeira leitura em andamento (spec 003, CA2)', () => {
    expect(statuses('reading')).toEqual(['done', 'done', 'reading']);
  });

  it('Steam conectada e privada (spec 003, CA6)', () => {
    expect(statuses('private')).toEqual(['done', 'done', 'pending']);
  });

  it('Steam pública: tudo feito', () => {
    expect(statuses('public')).toEqual(['done', 'done', 'done']);
  });
});

describe('stepStatusLabel', () => {
  it('diz o estado em texto', () => {
    expect(stepStatusLabel('done')).toBe('Feito');
    expect(stepStatusLabel('pending')).toBe('Falta');
    expect(stepStatusLabel('reading')).toBe('Lendo seus dados da Steam…');
  });
});
