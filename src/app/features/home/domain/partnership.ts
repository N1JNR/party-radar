/** Partida em que o app não tem certeza se a pessoa jogou junto com o amigo (CA11). */
export interface PartnershipQuestion {
  id: string;
  /** Id do amigo, para confirmar a parceria certa (nomes podem se repetir). */
  friendId: string;
  friendName: string;
  game: string;
  /** Início e fim da partida, em ISO 8601. */
  startedAt: string;
  endedAt: string;
}

/** "22h", "23h40", no horário local. */
function clock(date: Date): string {
  const minutes = date.getMinutes();
  return minutes === 0
    ? `${date.getHours()}h`
    : `${date.getHours()}h${String(minutes).padStart(2, '0')}`;
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** "hoje", "ontem" ou "em 12/10". */
function dayLabel(date: Date, now: Date): string {
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (days === 0) {
    return 'hoje';
  }
  if (days === 1) {
    return 'ontem';
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `em ${day}/${month}`;
}

/**
 * A pergunta de parceria (spec 002, CA11): "Você jogou CS2 com Rafa ontem, das 22h às 23h40?".
 * Sem artigo antes do nome, para não supor o gênero de ninguém.
 */
export function partnershipQuestionText(
  question: Pick<PartnershipQuestion, 'friendName' | 'game' | 'startedAt' | 'endedAt'>,
  now: Date,
): string {
  const started = new Date(question.startedAt);
  const ended = new Date(question.endedAt);
  if (Number.isNaN(started.getTime()) || Number.isNaN(ended.getTime())) {
    return `Você jogou ${question.game} com ${question.friendName}?`;
  }
  return `Você jogou ${question.game} com ${question.friendName} ${dayLabel(started, now)}, das ${clock(started)} às ${clock(ended)}?`;
}
