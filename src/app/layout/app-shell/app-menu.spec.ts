import { PoMenuItem } from '@po-ui/ng-components';

import { buildAppMenu, showNews } from './app-menu';

function actions() {
  return { soon: vi.fn<(feature: string) => void>(), signOut: vi.fn<() => void>() };
}

describe('buildAppMenu', () => {
  it('tem Meu card, Amigos, Conversas, Perfil e Sair, todos com ícone (CA1)', () => {
    const menu = buildAppMenu(actions());
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
    expect(buildAppMenu(actions())[1].link).toBe('/amigos');
  });

  it('Conversas abre o bate-papo (spec 007)', () => {
    expect(buildAppMenu(actions())[2].link).toBe('/conversas');
  });

  it('o que ainda não existe avisa "Em breve" com o nome certo (CA13)', () => {
    const handlers = actions();
    buildAppMenu(handlers)[3].action?.();
    expect(handlers.soon).toHaveBeenCalledWith('Perfil');
  });

  it('Sair chama a saída (CA3)', () => {
    const handlers = actions();
    buildAppMenu(handlers)[4].action?.();
    expect(handlers.signOut).toHaveBeenCalledTimes(1);
  });
});

describe('showNews', () => {
  it('diz em texto quantas têm novidade, no próprio item (spec 007, CA18)', () => {
    const menu = buildAppMenu(actions());
    const item = menu[2];
    showNews(menu, 2);
    expect(menu[2]).toBe(item);
    expect(item.label).toBe('Conversas · 2 com novidade');
    showNews(menu, 0);
    expect(item.label).toBe('Conversas');
  });

  it('sem o item, não faz nada', () => {
    const menu: PoMenuItem[] = [{ label: 'Outro', link: '/outro' }];
    showNews(menu, 2);
    expect(menu[0].label).toBe('Outro');
  });
});
