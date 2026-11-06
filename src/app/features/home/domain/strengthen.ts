/** Onde a Steam da pessoa está (spec 003): não conectada, lendo, privada ou pública. */
export type SteamStepState = 'not-connected' | 'reading' | 'private' | 'public';

export type StepStatus = 'done' | 'pending' | 'reading';

export interface StrengthenStep {
  id: 'discord' | 'steam-connected' | 'steam-public';
  label: string;
  status: StepStatus;
}

/**
 * "Deixe seu card mais forte" (spec 002, CA7; spec 003, CA1 e CA2): o Discord já está conectado
 * (é obrigatório para entrar); faltam conectar a Steam e deixá-la pública.
 */
export function strengthenSteps(steam: SteamStepState): StrengthenStep[] {
  const steamPublic: StepStatus =
    steam === 'public' ? 'done' : steam === 'reading' ? 'reading' : 'pending';
  return [
    { id: 'discord', label: 'Discord conectado', status: 'done' },
    {
      id: 'steam-connected',
      label: 'Conectar Steam',
      status: steam === 'not-connected' ? 'pending' : 'done',
    },
    { id: 'steam-public', label: 'Steam pública', status: steamPublic },
  ];
}

/** Texto do estado do passo: nunca só a cor ou o ícone (CA17 da spec 002). */
export function stepStatusLabel(status: StepStatus): string {
  switch (status) {
    case 'done':
      return 'Feito';
    case 'pending':
      return 'Falta';
    case 'reading':
      return 'Lendo seus dados da Steam…';
  }
}
