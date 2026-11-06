import { buildAppMenu } from './app-menu';

function actions() {
  return { soon: vi.fn<(feature: string) => void>(), signOut: vi.fn<() => void>() };
}

describe('buildAppMenu', () => {
  it('tem só Meu card, Perfil e Sair, todos com ícone (CA1; spec 009, CA1)', () => {
    const menu = buildAppMenu(actions());
    expect(menu.map((item) => item.label)).toEqual(['Meu card', 'Perfil', 'Sair']);
    expect(menu.every((item) => item.icon && item.shortLabel)).toBe(true);
    expect(menu[0].link).toBe('/inicio');
  });

  it('o que ainda não existe avisa "Em breve" com o nome certo (CA13)', () => {
    const handlers = actions();
    buildAppMenu(handlers)[1].action?.();
    expect(handlers.soon).toHaveBeenCalledWith('Perfil');
  });

  it('Sair chama a saída (CA3)', () => {
    const handlers = actions();
    buildAppMenu(handlers)[2].action?.();
    expect(handlers.signOut).toHaveBeenCalledTimes(1);
  });
});
