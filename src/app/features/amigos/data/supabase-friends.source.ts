import { Injectable, inject } from '@angular/core';

import { SUPABASE } from '../../../core/supabase/supabase.client';
import {
  FoundPlayer,
  FriendsData,
  Player,
  Relation,
  SendResult,
  sortPlayers,
} from '../domain/friends';
import { FriendsSource } from './friends.source';

/**
 * Linhas das funções de amizade. Escritas à mão de propósito: o `database.types.ts` gerado diz que
 * as colunas de funções SQL nunca vêm nulas, mas a foto e o jogo vêm.
 */
interface PlayerRow {
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
}

interface FriendRow extends PlayerRow {
  current_game: string | null;
}

interface RequestRow extends PlayerRow {
  direction: 'sent' | 'received';
}

interface FoundRow extends PlayerRow {
  relation: Relation;
}

const toPlayer = (row: PlayerRow): Player => ({
  id: row.user_id,
  name: row.display_name,
  username: row.username,
  avatarUrl: row.avatar_url,
});

/** Amigos de verdade (spec 006): tudo passa pelas funções do banco, que conferem as regras. */
@Injectable()
export class SupabaseFriendsSource implements FriendsSource {
  private readonly supabase = inject(SUPABASE);

  async load(): Promise<FriendsData> {
    const [friends, requests, blocks] = await Promise.all([
      this.supabase.rpc('my_friends'),
      this.supabase.rpc('my_friend_requests'),
      this.supabase.rpc('my_blocks'),
    ]);
    const failure = friends.error ?? requests.error ?? blocks.error;
    if (failure) {
      throw failure;
    }
    const requestRows = (requests.data ?? []) as unknown as RequestRow[];
    return {
      friends: ((friends.data ?? []) as unknown as FriendRow[]).map((row) => ({
        ...toPlayer(row),
        playing: row.current_game,
      })),
      received: sortPlayers(
        requestRows.filter((row) => row.direction === 'received').map(toPlayer),
      ),
      sent: sortPlayers(requestRows.filter((row) => row.direction === 'sent').map(toPlayer)),
      blocked: sortPlayers(((blocks.data ?? []) as unknown as PlayerRow[]).map(toPlayer)),
    };
  }

  async find(username: string): Promise<FoundPlayer | null> {
    const { data, error } = await this.supabase.rpc('find_player', { p_username: username });
    if (error) {
      throw error;
    }
    const row = ((data ?? []) as unknown as FoundRow[]).at(0);
    return row ? { ...toPlayer(row), relation: row.relation } : null;
  }

  async send(userId: string): Promise<SendResult> {
    const { data, error } = await this.supabase.rpc('send_friend_request', { p_user: userId });
    if (error) {
      throw error;
    }
    return data as SendResult;
  }

  async answer(userId: string, accept: boolean): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('answer_friend_request', {
      p_from: userId,
      p_accept: accept,
    });
    if (error) {
      throw error;
    }
    return data === true;
  }

  async cancel(userId: string): Promise<void> {
    const { error } = await this.supabase.rpc('cancel_friend_request', { p_to: userId });
    if (error) {
      throw error;
    }
  }

  async remove(userId: string): Promise<void> {
    const { error } = await this.supabase.rpc('remove_friend', { p_friend: userId });
    if (error) {
      throw error;
    }
  }

  async block(userId: string): Promise<void> {
    const { error } = await this.supabase.rpc('block_user', { p_user: userId });
    if (error) {
      throw error;
    }
  }

  async unblock(userId: string): Promise<void> {
    const { error } = await this.supabase.rpc('unblock_user', { p_user: userId });
    if (error) {
      throw error;
    }
  }
}
