import { strengthenSteps } from './strengthen';

describe('strengthenSteps', () => {
  it('no primeiro acesso, só o Discord está feito (CA7)', () => {
    expect(strengthenSteps(false, 0)).toEqual([
      { id: 'discord', label: 'Discord conectado', done: true },
      { id: 'steam', label: 'Steam pública', done: false },
      { id: 'friends', label: 'Convidar amigos', done: false },
    ]);
  });

  it('marca a Steam pública e os amigos quando existem', () => {
    expect(strengthenSteps(true, 3).every((step) => step.done)).toBe(true);
  });
});
