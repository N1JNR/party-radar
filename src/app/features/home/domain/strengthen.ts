export interface StrengthenStep {
  id: 'discord' | 'steam' | 'friends';
  label: string;
  done: boolean;
}

/**
 * "Deixe seu card mais forte" (spec 002, CA7): o Discord já está conectado (é obrigatório para
 * entrar); faltam a Steam pública e os amigos.
 */
export function strengthenSteps(steamPublic: boolean, friendsCount: number): StrengthenStep[] {
  return [
    { id: 'discord', label: 'Discord conectado', done: true },
    { id: 'steam', label: 'Steam pública', done: steamPublic },
    { id: 'friends', label: 'Convidar amigos', done: friendsCount > 0 },
  ];
}
