import { Platform } from './player-card';

/** Um amigo que está jogando agora (seção "Jogando agora"). */
export interface FriendPresence {
  id: string;
  name: string;
  avatarUrl: string | null;
  game: string;
  platform: Platform;
  /** Quando começou a jogar, em ISO 8601. */
  startedAt: string;
}

/** "agora mesmo", "há 5 min", "há 2h", "há 1h20". Datas inválidas ou futuras viram "agora mesmo". */
export function playingForLabel(startedAt: string, now: Date): string {
  const elapsed = now.getTime() - new Date(startedAt).getTime();
  const minutes = Number.isFinite(elapsed) ? Math.floor(elapsed / 60_000) : 0;
  if (minutes < 1) {
    return 'agora mesmo';
  }
  if (minutes < 60) {
    return `há ${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `há ${hours}h` : `há ${hours}h${String(rest).padStart(2, '0')}`;
}
