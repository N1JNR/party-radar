import { PoMenuItem } from '@po-ui/ng-components';

import { menuLabel } from '../../features/bate-papo/domain/chat';

export interface AppMenuActions {
  /** Destino que ainda não existe: mostra "Em breve" (spec 002, CA13). */
  soon(feature: string): void;
  signOut(): void;
}

/**
 * Itens do menu do app (spec 002, CA1 e CA3; spec 007, CA18). Todos têm ícone, exigência do
 * `po-menu`. A novidade vai no texto, porque o badge do `po-menu` não chega ao leitor de tela.
 */
export function buildAppMenu(withNews: number, actions: AppMenuActions): PoMenuItem[] {
  return [
    { label: 'Meu card', shortLabel: 'Card', icon: 'an an-identification-card', link: '/inicio' },
    { label: 'Amigos', shortLabel: 'Amigos', icon: 'an an-users', link: '/amigos' },
    {
      label: menuLabel(withNews),
      shortLabel: 'Conversas',
      icon: 'an an-chats',
      link: '/conversas',
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
