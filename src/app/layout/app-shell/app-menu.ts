import { PoMenuItem } from '@po-ui/ng-components';

import { menuLabel } from '../../features/bate-papo/domain/chat';

const CONVERSATIONS_LINK = '/conversas';

export interface AppMenuActions {
  /** Destino que ainda não existe: mostra "Em breve" (spec 002, CA13). */
  soon(feature: string): void;
  signOut(): void;
}

/** Itens do menu do app (spec 002, CA1 e CA3). Todos têm ícone, exigência do `po-menu`. */
export function buildAppMenu(actions: AppMenuActions): PoMenuItem[] {
  return [
    { label: 'Meu card', shortLabel: 'Card', icon: 'an an-identification-card', link: '/inicio' },
    { label: 'Amigos', shortLabel: 'Amigos', icon: 'an an-users', link: '/amigos' },
    {
      label: menuLabel(0),
      shortLabel: 'Conversas',
      icon: 'an an-chats',
      link: CONVERSATIONS_LINK,
    },
    {
      label: 'Perfil',
      shortLabel: 'Perfil',
      icon: 'an an-user-circle',
      action: () => actions.soon('Perfil'),
    },
    { label: 'Sair', shortLabel: 'Sair', icon: 'an an-sign-out', action: () => actions.signOut() },
  ];
}

/**
 * Diz no item quantas conversas têm novidade (spec 007, CA18). Vai no texto porque o badge do
 * `po-menu` não chega ao leitor de tela, e muda o próprio item: um item novo perderia o destaque.
 */
export function showNews(menu: readonly PoMenuItem[], withNews: number): void {
  const item = menu.find((other) => other.link === CONVERSATIONS_LINK);
  if (item) {
    item.label = menuLabel(withNews);
  }
}
