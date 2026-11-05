import { Injectable, inject } from '@angular/core';

import { SUPABASE } from '../../../core/supabase/supabase.client';
import {
  AddMemberStatus,
  ChatMessage,
  Conversation,
  CreateSquadStatus,
  SendStatus,
  SquadMember,
} from '../domain/chat';
import { ChatSource } from './chat.source';

/**
 * Linhas das funções do bate-papo. Escritas à mão de propósito: o `database.types.ts` gerado diz que
 * as colunas de funções SQL nunca vêm nulas, mas várias vêm.
 */
interface ConversationRow {
  conversation_id: string;
  kind: 'direct' | 'squad';
  title: string;
  avatar_url: string | null;
  is_owner: boolean | null;
  member_count: number;
  can_send: boolean;
  last_body: string | null;
  last_deleted: boolean;
  last_sender_name: string | null;
  last_at: string | null;
  unread: number;
}

interface MessageRow {
  message_id: string;
  sender_id: string | null;
  sender_name: string | null;
  sender_avatar_url: string | null;
  client_id: string;
  body: string | null;
  created_at: string;
  deleted: boolean;
  mine: boolean;
}

interface MemberRow {
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  is_owner: boolean | null;
}

/** Bate-papo de verdade (spec 007): tudo passa pelas funções do banco, que conferem as regras. */
@Injectable()
export class SupabaseChatSource implements ChatSource {
  private readonly supabase = inject(SUPABASE);

  async conversations(): Promise<Conversation[]> {
    const { data, error } = await this.supabase.rpc('my_conversations');
    if (error) {
      throw error;
    }
    return ((data ?? []) as unknown as ConversationRow[]).map((row) => ({
      id: row.conversation_id,
      kind: row.kind,
      title: row.title,
      avatarUrl: row.avatar_url,
      isOwner: row.is_owner === true,
      memberCount: row.member_count,
      canSend: row.can_send,
      lastBody: row.last_body,
      lastDeleted: row.last_deleted,
      lastSenderName: row.last_sender_name,
      lastAt: row.last_at,
      unread: row.unread,
    }));
  }

  async messages(conversationId: string, before?: ChatMessage): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase.rpc('conversation_messages', {
      p_conversation: conversationId,
      ...(before ? { p_before_at: before.createdAt, p_before_id: before.id } : {}),
    });
    if (error) {
      throw error;
    }
    return ((data ?? []) as unknown as MessageRow[]).map((row) => ({
      id: row.message_id,
      clientId: row.client_id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      senderAvatarUrl: row.sender_avatar_url,
      body: row.body,
      createdAt: row.created_at,
      deleted: row.deleted,
      mine: row.mine,
    }));
  }

  async send(conversationId: string, clientId: string, body: string): Promise<SendStatus> {
    const { data, error } = await this.supabase.rpc('send_message', {
      p_conversation: conversationId,
      p_client_id: clientId,
      p_body: body,
    });
    if (error) {
      throw error;
    }
    return ((data ?? []) as unknown as { status: SendStatus }[]).at(0)?.status ?? 'not_member';
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('delete_message', { p_message: messageId });
    if (error) {
      throw error;
    }
    return data === true;
  }

  async markRead(conversationId: string): Promise<void> {
    const { error } = await this.supabase.rpc('mark_conversation_read', {
      p_conversation: conversationId,
    });
    if (error) {
      throw error;
    }
  }

  async openDirect(friendId: string): Promise<string | null> {
    const { data, error } = await this.supabase.rpc('open_direct', { p_friend: friendId });
    if (error) {
      throw error;
    }
    return (data as string | null) ?? null;
  }

  async createSquad(
    name: string,
    memberIds: readonly string[],
  ): Promise<{ status: CreateSquadStatus; id: string | null }> {
    const { data, error } = await this.supabase.rpc('create_squad', {
      p_name: name,
      p_members: [...memberIds],
    });
    if (error) {
      throw error;
    }
    const row = (
      (data ?? []) as unknown as {
        status: CreateSquadStatus;
        conversation_id: string | null;
      }[]
    ).at(0);
    return { status: row?.status ?? 'invalid_name', id: row?.conversation_id ?? null };
  }

  async renameSquad(conversationId: string, name: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('rename_squad', {
      p_conversation: conversationId,
      p_name: name,
    });
    if (error) {
      throw error;
    }
    return data === true;
  }

  async addMember(conversationId: string, userId: string): Promise<AddMemberStatus> {
    const { data, error } = await this.supabase.rpc('add_squad_member', {
      p_conversation: conversationId,
      p_user: userId,
    });
    if (error) {
      throw error;
    }
    return data as AddMemberStatus;
  }

  async removeMember(conversationId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('remove_squad_member', {
      p_conversation: conversationId,
      p_user: userId,
    });
    if (error) {
      throw error;
    }
    return data === true;
  }

  async leaveSquad(conversationId: string): Promise<void> {
    const { error } = await this.supabase.rpc('leave_squad', { p_conversation: conversationId });
    if (error) {
      throw error;
    }
  }

  async squadMembers(conversationId: string): Promise<SquadMember[]> {
    const { data, error } = await this.supabase.rpc('squad_members', {
      p_conversation: conversationId,
    });
    if (error) {
      throw error;
    }
    return ((data ?? []) as unknown as MemberRow[])
      .map((row) => ({
        id: row.user_id,
        name: row.display_name,
        username: row.username,
        avatarUrl: row.avatar_url,
        isOwner: row.is_owner === true,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  /**
   * O Realtime confere o RLS de quem assina (CA23). O aviso não traz os dados: quem ouve relê pelas
   * funções, então reconectar (`SUBSCRIBED`) não perde nem repete mensagens (CA8).
   */
  subscribe(listener: () => void): () => void {
    const channel = this.supabase
      .channel('bate-papo')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () =>
        listener(),
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () =>
        listener(),
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          listener();
        }
      });
    return () => void this.supabase.removeChannel(channel);
  }
}
