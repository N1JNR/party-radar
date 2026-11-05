/** Uma conversa da lista: com um amigo ou um squad (spec 007). */
export interface Conversation {
  id: string;
  kind: 'direct' | 'squad';
  title: string;
  avatarUrl: string | null;
  isOwner: boolean;
  memberCount: number;
  /** `false` quando a amizade acabou: a conversa fica só para leitura (CA20). */
  canSend: boolean;
  lastBody: string | null;
  lastDeleted: boolean;
  lastSenderName: string | null;
  /** ISO 8601; `null` em squad que ainda não tem mensagem. */
  lastAt: string | null;
  unread: number;
}

export interface ChatMessage {
  id: string;
  clientId: string;
  /** `null` se a conta foi apagada. */
  senderId: string | null;
  senderName: string | null;
  senderAvatarUrl: string | null;
  /** `null` depois de apagada (CA5). */
  body: string | null;
  createdAt: string;
  deleted: boolean;
  /** Foi quem está logado que enviou. */
  mine: boolean;
}

/** Mensagem que ainda não voltou do servidor (CA9). */
export interface PendingMessage {
  clientId: string;
  body: string;
  status: 'sending' | 'failed';
  /** Por que não foi, em texto. */
  reason: string | null;
}

export interface SquadMember {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  isOwner: boolean;
}

export type SendStatus = 'sent' | 'invalid' | 'read_only' | 'rate_limited' | 'not_member';
export type CreateSquadStatus = 'created' | 'invalid_name' | 'no_members' | 'not_friends' | 'full';
export type AddMemberStatus = 'added' | 'not_owner' | 'not_friends' | 'already' | 'full';

export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_SQUAD_NAME_LENGTH = 40;
/** Mensagens por vez: uma página cheia indica que pode haver mais (CA6). */
export const PAGE_SIZE = 50;

export const DELETED_TEXT = 'Mensagem apagada';
export const READ_ONLY_TEXT = 'Não é possível enviar mensagens nesta conversa.';
export const PRIVACY_TEXT =
  'As mensagens ficam guardadas no banco do Party Radar, sem criptografia de ponta a ponta.';

const TIME_ZONE = 'America/Sao_Paulo';

/**
 * O id que evita duplicar ao tentar de novo (CA9), um UUID v4. `crypto.randomUUID` só existe com HTTPS,
 * e o celular na rede local usa HTTP.
 */
export function newClientId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

/** Junta mensagens por `id`, sem repetir, da mais antiga para a mais nova (CA6, CA8). */
export function mergeMessages(
  current: readonly ChatMessage[],
  incoming: readonly ChatMessage[],
): ChatMessage[] {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) {
    byId.set(message.id, message);
  }
  return [...byId.values()].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
}

/** Tira do que está pendente o que já voltou do servidor, sem mostrar duas vezes (CA9). */
export function withoutDelivered(
  pending: readonly PendingMessage[],
  messages: readonly ChatMessage[],
): PendingMessage[] {
  const delivered = new Set(messages.map((message) => message.clientId));
  return pending.filter((item) => !delivered.has(item.clientId));
}

/** O problema do texto digitado, em texto; `null` se pode enviar (CA4). */
export function messageError(text: string): string | null {
  const length = text.trim().length;
  if (length === 0) {
    return 'Escreva uma mensagem antes de enviar.';
  }
  return length > MAX_MESSAGE_LENGTH
    ? `A mensagem passou de ${MAX_MESSAGE_LENGTH} caracteres. Encurte para enviar.`
    : null;
}

/** Por que a mensagem não foi enviada, em texto (CA4, CA10, CA20). */
export function sendFailureText(status: Exclude<SendStatus, 'sent'> | 'failed'): string {
  switch (status) {
    case 'invalid':
      return `A mensagem precisa ter de 1 a ${MAX_MESSAGE_LENGTH} caracteres.`;
    case 'rate_limited':
      return 'Muitas mensagens seguidas. Espere um instante e tente de novo.';
    case 'read_only':
    case 'not_member':
      return READ_ONLY_TEXT;
    default:
      return 'Não enviada.';
  }
}

/** O problema do nome do squad, em texto; `null` se pode usar (CA11). */
export function squadNameError(name: string): string | null {
  const length = name.trim().length;
  if (length === 0) {
    return 'Dê um nome ao squad.';
  }
  return length > MAX_SQUAD_NAME_LENGTH
    ? `O nome pode ter até ${MAX_SQUAD_NAME_LENGTH} caracteres.`
    : null;
}

/** O aviso quando o squad não foi criado (CA11, CA14, CA17). */
export function createSquadFailureText(status: Exclude<CreateSquadStatus, 'created'>): string {
  switch (status) {
    case 'invalid_name':
      return `Dê ao squad um nome de 1 a ${MAX_SQUAD_NAME_LENGTH} caracteres.`;
    case 'no_members':
      return 'Escolha pelo menos um amigo.';
    case 'full':
      return 'Um squad pode ter até 50 pessoas.';
    default:
      return 'Só seus amigos podem entrar no squad.';
  }
}

/** O aviso ao adicionar alguém; `null` quando deu certo (CA13, CA14, CA17). */
export function addMemberFailureText(status: AddMemberStatus): string | null {
  switch (status) {
    case 'added':
      return null;
    case 'already':
      return 'Essa pessoa já está no squad.';
    case 'full':
      return 'Este squad está cheio: são 50 pessoas no máximo.';
    case 'not_owner':
      return 'Só o dono do squad pode adicionar pessoas.';
    default:
      return 'Só seus amigos podem entrar no squad.';
  }
}

/** Quantas conversas têm mensagem por ler (CA18). */
export function conversationsWithNews(conversations: readonly Conversation[]): number {
  return conversations.filter((conversation) => conversation.unread > 0).length;
}

/** O nome no menu: em texto, porque o badge do `po-menu` não chega ao leitor de tela (CA18). */
export function menuLabel(withNews: number): string {
  if (withNews === 0) {
    return 'Conversas';
  }
  return withNews === 1 ? 'Conversas · 1 com novidade' : `Conversas · ${withNews} com novidade`;
}

/** "1 não lida", "12 não lidas" (CA18). */
export function unreadLabel(unread: number): string {
  return unread === 1 ? '1 não lida' : `${unread} não lidas`;
}

/** A última mensagem na lista (CA19). */
export function lastPreview(conversation: Conversation): string {
  if (conversation.lastDeleted) {
    return DELETED_TEXT;
  }
  if (conversation.lastBody === null) {
    return 'Nenhuma mensagem ainda.';
  }
  return conversation.kind === 'squad' && conversation.lastSenderName
    ? `${conversation.lastSenderName}: ${conversation.lastBody}`
    : conversation.lastBody;
}

function dayKey(date: Date): string {
  // `en-CA` formata a data como AAAA-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** O horário em São Paulo: "14:32". */
export function timeLabel(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/** "Hoje", "Ontem" ou "03/11/2026". */
export function dayLabel(iso: string, now: Date): string {
  const date = new Date(iso);
  const key = dayKey(date);
  if (key === dayKey(now)) {
    return 'Hoje';
  }
  if (key === dayKey(new Date(now.getTime() - 86_400_000))) {
    return 'Ontem';
  }
  return new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE }).format(date);
}

/** O horário na lista: a hora, se foi hoje; o dia, nos outros casos (CA19). */
export function listTimeLabel(iso: string | null, now: Date): string {
  if (!iso) {
    return '';
  }
  const day = dayLabel(iso, now);
  return day === 'Hoje' ? timeLabel(iso) : day;
}

export interface MessageDay<T> {
  day: string;
  messages: T[];
}

/** Agrupa por dia, para mostrar "Hoje" e "Ontem" entre as mensagens. */
export function groupByDay<T extends { createdAt: string }>(
  messages: readonly T[],
  now: Date,
): MessageDay<T>[] {
  const days: MessageDay<T>[] = [];
  for (const message of messages) {
    const day = dayLabel(message.createdAt, now);
    const last = days.at(-1);
    if (last?.day === day) {
      last.messages.push(message);
    } else {
      days.push({ day, messages: [message] });
    }
  }
  return days;
}
