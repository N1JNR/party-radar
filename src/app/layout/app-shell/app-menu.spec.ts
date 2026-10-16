import { buildAppMenu } from './app-menu';

function actions() {
  return { soon: vi.fn<(feature: string) => void>(), signOut: vi.fn<() => void>() };
}

describe('buildAppMenu', () => {
  it('tem Meu card, Amigos, Squads, Seus squads, Perfil e Sair, todos com ícone (CA1)', () => {
    const menu = buildAppMenu([], actions());
    expect(menu.map((item) => item.label)).toEqual([
      'Meu card',
      'Amigos',
      'Squads',
      'Seus squads',
      'Perfil',
      'Sair',
    ]);
    expect(menu.every((item) => item.icon && item.shortLabel)).toBe(true);
    expect(menu[0].link).toBe('/inicio');
  });

  it('lista os squads com quantos estão jogando, em texto', () => {
    const menu = buildAppMenu(
      [
        { id: 's1', name: 'Squad da Sexta', playing: 3 },
        { id: 's2', name: 'Almas Sofridas', playing: 0 },
      ],
      actions(),
    );
    expect(menu[3].subItems?.map((item) => item.label)).toEqual([
      'Squad da Sexta · 3 jogando',
      'Almas Sofridas',
      'Formar squad',
    ]);
  });

  it('sem squads mostra "Nenhum squad ainda" e "Formar squad" (CA10)', () => {
    const menu = buildAppMenu([], actions());
    expect(menu[3].subItems?.map((item) => item.label)).toEqual([
      'Nenhum squad ainda',
      'Formar squad',
    ]);
  });

  it('destinos que ainda não existem avisam "Em breve" com o nome certo (CA13)', () => {
    const handlers = actions();
    const menu = buildAppMenu([{ id: 's1', name: 'Squad da Sexta', playing: 1 }], handlers);
    const subItems = menu[3].subItems ?? [];
    for (const item of [menu[1], menu[2], menu[4], subItems[0], subItems[1]]) {
      item.action?.();
    }
    expect(handlers.soon.mock.calls.map(([feature]) => feature)).toEqual([
      'Amigos',
      'Squads',
      'Perfil',
      'Squad da Sexta',
      'Formar squad',
    ]);

    buildAppMenu([], handlers)[3].subItems?.[0].action?.();
    expect(handlers.soon).toHaveBeenLastCalledWith('Formar squad');
  });

  it('Sair chama a saída (CA3)', () => {
    const handlers = actions();
    buildAppMenu([], handlers)[5].action?.();
    expect(handlers.signOut).toHaveBeenCalledTimes(1);
  });
});
