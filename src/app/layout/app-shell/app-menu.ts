import { PoMenuItem } from '@po-ui/ng-components';

/** Um squad na lista do menu, com quantos estão jogando agora. */
export interface MenuSquad {
  id: string;
  name: string;
  playing: number;
}

export interface AppMenuActions {
  /** Destino que ainda não existe: mostra "Em breve" (spec 002, CA13). */
  soon(feature: string): void;
  signOut(): void;
}

/** Texto, não só badge: o badge do `po-menu` é escondido do leitor de tela (CA17). */
function squadLabel(squad: MenuSquad): string {
  return squad.playing > 0 ? `${squad.name} · ${squad.playing} jogando` : squad.name;
}

/** Itens do menu do app (spec 002, CA1, CA3 e CA10). Todos têm ícone, exigência do `po-menu`. */
export function buildAppMenu(squads: readonly MenuSquad[], actions: AppMenuActions): PoMenuItem[] {
  const formSquad: PoMenuItem = {
    label: 'Formar squad',
    action: () => actions.soon('Formar squad'),
  };
  const squadItems: PoMenuItem[] =
    squads.length > 0
      ? squads.map((squad) => ({
          label: squadLabel(squad),
          action: () => actions.soon(squad.name),
        }))
      : [{ label: 'Nenhum squad ainda', action: () => actions.soon('Formar squad') }];

  return [
    { label: 'Meu card', shortLabel: 'Card', icon: 'an an-identification-card', link: '/inicio' },
    {
      label: 'Amigos',
      shortLabel: 'Amigos',
      icon: 'an an-users',
      action: () => actions.soon('Amigos'),
    },
    {
      label: 'Squads',
      shortLabel: 'Squads',
      icon: 'an an-users-three',
      action: () => actions.soon('Squads'),
    },
    {
      label: 'Seus squads',
      shortLabel: 'Seus',
      icon: 'an an-game-controller',
      subItems: [...squadItems, formSquad],
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
