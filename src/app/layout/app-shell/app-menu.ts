import { PoMenuItem } from '@po-ui/ng-components';

export interface AppMenuActions {
  /** Destino que ainda não existe: mostra "Em breve" (spec 002, CA13). */
  soon(feature: string): void;
  signOut(): void;
}

/** Itens do menu do app (spec 002, CA1 e CA3; spec 009, CA1). Todos têm ícone, exigência do `po-menu`. */
export function buildAppMenu(actions: AppMenuActions): PoMenuItem[] {
  return [
    { label: 'Meu card', shortLabel: 'Card', icon: 'an an-identification-card', link: '/inicio' },
    {
      label: 'Perfil',
      shortLabel: 'Perfil',
      icon: 'an an-user-circle',
      action: () => actions.soon('Perfil'),
    },
    { label: 'Sair', shortLabel: 'Sair', icon: 'an an-sign-out', action: () => actions.signOut() },
  ];
}
