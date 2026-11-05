import { buildAppMenu } from './app-menu';

function actions() {
  return { soon: vi.fn<(feature: string) => void>(), signOut: vi.fn<() => void>() };
}

describe('buildAppMenu', () => {
  it('tem Meu card, Amigos, Conversas, Perfil e Sair, todos com ícone (CA1)', () => {
    const menu = buildAppMenu(0, actions());
    expect(menu.map((item) => item.label)).toEqual([
      'Meu card',
      'Amigos',
      'Conversas',
      'Perfil',
      'Sair',
    ]);
    expect(menu.every((item) => item.icon && item.shortLabel)).toBe(true);
    expect(menu[0].link).toBe('/inicio');
  });

  it('Amigos abre a tela de amigos (spec 006)', () => {
    expect(buildAppMenu(0, actions())[1].link).toBe('/amigos');
  });

  it('Conversas abre o bate-papo e diz em texto quantas têm novidade (spec 007, CA18)', () => {
    const item = buildAppMenu(2, actions())[2];
    expect(item.link).toBe('/conversas');
    expect(item.label).toBe('Conversas · 2 com novidade');
  });

  it('o que ainda não existe avisa "Em breve" com o nome certo (CA13)', () => {
    const handlers = actions();
    buildAppMenu(0, handlers)[3].action?.();
    expect(handlers.soon).toHaveBeenCalledWith('Perfil');
  });

  it('Sair chama a saída (CA3)', () => {
    const handlers = actions();
    buildAppMenu(0, handlers)[4].action?.();
    expect(handlers.signOut).toHaveBeenCalledTimes(1);
  });
});
