export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      conversation_members: {
        Row: {
          conversation_id: string;
          joined_at: string;
          last_read_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          conversation_id: string;
          joined_at?: string;
          last_read_at?: string;
          user_id: string;
        };
        Update: {
          conversation_id?: string;
          joined_at?: string;
          last_read_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversation_members_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      conversations: {
        Row: {
          created_at: string;
          direct_high: string | null;
          direct_low: string | null;
          id: string;
          kind: string;
          last_message_at: string | null;
          name: string | null;
          owner_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          direct_high?: string | null;
          direct_low?: string | null;
          id?: string;
          kind: string;
          last_message_at?: string | null;
          name?: string | null;
          owner_id?: string | null;
        };
        Update: {
          created_at?: string;
          direct_high?: string | null;
          direct_low?: string | null;
          id?: string;
          kind?: string;
          last_message_at?: string | null;
          name?: string | null;
          owner_id?: string | null;
        };
        Relationships: [];
      };
      friend_requests: {
        Row: {
          created_at: string;
          declined_at: string | null;
          from_id: string;
          to_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          declined_at?: string | null;
          from_id: string;
          to_id: string;
        };
        Update: {
          created_at?: string;
          declined_at?: string | null;
          from_id?: string;
          to_id?: string;
        };
        Relationships: [];
      };
      friendships: {
        Row: {
          created_at: string;
          user_high: string;
          user_low: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          user_high: string;
          user_low: string;
        };
        Update: {
          created_at?: string;
          user_high?: string;
          user_low?: string;
        };
        Relationships: [];
      };
      game_categories: {
        Row: {
          app_id: number;
          category: string;
          source: string;
        };
        ComputedFields: never;
        Insert: {
          app_id: number;
          category: string;
          source?: string;
        };
        Update: {
          app_id?: number;
          category?: string;
          source?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          body: string | null;
          client_id: string;
          conversation_id: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          sender_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          body?: string | null;
          client_id: string;
          conversation_id: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          sender_id?: string | null;
        };
        Update: {
          body?: string | null;
          client_id?: string;
          conversation_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          sender_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string;
          id: string;
          username: string;
        };
        ComputedFields: never;
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name: string;
          id: string;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          username?: string;
        };
        Relationships: [];
      };
      season_config: {
        Row: {
          first_day: string;
          id: boolean;
        };
        ComputedFields: never;
        Insert: {
          first_day: string;
          id?: boolean;
        };
        Update: {
          first_day?: string;
          id?: boolean;
        };
        Relationships: [];
      };
      season_trophies: {
        Row: {
          awarded_at: string;
          minutes: number;
          rank_id: string;
          season_number: number;
          top_game: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          awarded_at?: string;
          minutes: number;
          rank_id: string;
          season_number: number;
          top_game?: string | null;
          user_id: string;
        };
        Update: {
          awarded_at?: string;
          minutes?: number;
          rank_id?: string;
          season_number?: number;
          top_game?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      steam_accounts: {
        Row: {
          baseline_minutes: number | null;
          connected_at: string;
          current_game: string | null;
          last_synced_at: string | null;
          persona_name: string | null;
          steam_id: string;
          sync_attempted_at: string | null;
          user_id: string;
          visibility: string | null;
        };
        ComputedFields: never;
        Insert: {
          baseline_minutes?: number | null;
          connected_at?: string;
          current_game?: string | null;
          last_synced_at?: string | null;
          persona_name?: string | null;
          steam_id: string;
          sync_attempted_at?: string | null;
          user_id: string;
          visibility?: string | null;
        };
        Update: {
          baseline_minutes?: number | null;
          connected_at?: string;
          current_game?: string | null;
          last_synced_at?: string | null;
          persona_name?: string | null;
          steam_id?: string;
          sync_attempted_at?: string | null;
          user_id?: string;
          visibility?: string | null;
        };
        Relationships: [];
      };
      steam_openid_nonces: {
        Row: {
          nonce: string;
          used_at: string;
        };
        ComputedFields: never;
        Insert: {
          nonce: string;
          used_at?: string;
        };
        Update: {
          nonce?: string;
          used_at?: string;
        };
        Relationships: [];
      };
      steam_playtime_snapshots: {
        Row: {
          app_id: number;
          game_name: string;
          minutes_2weeks: number;
          minutes_total: number;
          taken_on: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          app_id: number;
          game_name: string;
          minutes_2weeks?: number;
          minutes_total: number;
          taken_on: string;
          user_id: string;
        };
        Update: {
          app_id?: number;
          game_name?: string;
          minutes_2weeks?: number;
          minutes_total?: number;
          taken_on?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      steam_reading_days: {
        Row: {
          day: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          day: string;
          user_id: string;
        };
        Update: {
          day?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_blocks: {
        Row: {
          blocked_id: string;
          blocker_id: string;
          created_at: string;
        };
        ComputedFields: never;
        Insert: {
          blocked_id: string;
          blocker_id: string;
          created_at?: string;
        };
        Update: {
          blocked_id?: string;
          blocker_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_squad_member: { Args: { p_conversation: string; p_user: string }; Returns: string };
      answer_friend_request: { Args: { p_accept: boolean; p_from: string }; Returns: boolean };
      block_user: { Args: { p_user: string }; Returns: undefined };
      cancel_friend_request: { Args: { p_to: string }; Returns: undefined };
      conversation_messages: {
        Args: { p_before_at?: string; p_before_id?: string; p_conversation: string };
        Returns: {
          body: string;
          client_id: string;
          created_at: string;
          deleted: boolean;
          message_id: string;
          mine: boolean;
          sender_avatar_url: string;
          sender_id: string;
          sender_name: string;
        }[];
      };
      create_squad: {
        Args: { p_members: string[]; p_name: string };
        Returns: {
          conversation_id: string;
          status: string;
        }[];
      };
      delete_message: { Args: { p_message: string }; Returns: boolean };
      find_player: {
        Args: { p_username: string };
        Returns: {
          avatar_url: string;
          display_name: string;
          relation: string;
          user_id: string;
          username: string;
        }[];
      };
      is_conversation_member: { Args: { p_conversation: string }; Returns: boolean };
      latest_playtime: {
        Args: { p_user_id: string };
        Returns: {
          app_id: number;
          minutes_total: number;
        }[];
      };
      leave_squad: { Args: { p_conversation: string }; Returns: undefined };
      mark_conversation_read: { Args: { p_conversation: string }; Returns: undefined };
      my_blocks: {
        Args: Record<PropertyKey, never>;
        Returns: {
          avatar_url: string;
          display_name: string;
          user_id: string;
          username: string;
        }[];
      };
      my_card_stats: {
        Args: { p_now?: string };
        Returns: {
          current_game: string;
          estimate: boolean;
          game_of_month: string;
          game_of_month_minutes: number;
          last_synced_at: string;
          month_games: number;
          month_minutes: number;
          steam_name: string;
          total_minutes: number;
          visibility: string;
        }[];
      };
      my_conversations: {
        Args: Record<PropertyKey, never>;
        Returns: {
          avatar_url: string;
          can_send: boolean;
          conversation_id: string;
          is_owner: boolean;
          kind: string;
          last_at: string;
          last_body: string;
          last_deleted: boolean;
          last_sender_name: string;
          member_count: number;
          title: string;
          unread: number;
        }[];
      };
      my_friend_requests: {
        Args: Record<PropertyKey, never>;
        Returns: {
          avatar_url: string;
          created_at: string;
          direction: string;
          display_name: string;
          user_id: string;
          username: string;
        }[];
      };
      my_friends: {
        Args: Record<PropertyKey, never>;
        Returns: {
          avatar_url: string;
          current_game: string;
          display_name: string;
          user_id: string;
          username: string;
        }[];
      };
      my_games: {
        Args: { p_now?: string };
        Returns: {
          app_id: number;
          category: string;
          game_name: string;
          month_minutes: number;
          previous_is_estimate: boolean;
          previous_month_minutes: number;
          total_minutes: number;
        }[];
      };
      my_season: {
        Args: { p_now?: string };
        Returns: {
          days_left: number;
          ends_on: string;
          minutes: number;
          season_number: number;
          starts_on: string;
          top_game: string;
        }[];
      };
      my_squads: {
        Args: Record<PropertyKey, never>;
        Returns: {
          conversation_id: string;
          member_ids: string[];
          name: string;
        }[];
      };
      open_direct: { Args: { p_friend: string }; Returns: string };
      remove_friend: { Args: { p_friend: string }; Returns: undefined };
      remove_squad_member: { Args: { p_conversation: string; p_user: string }; Returns: boolean };
      rename_squad: { Args: { p_conversation: string; p_name: string }; Returns: boolean };
      season_at: {
        Args: { p_day: string };
        Returns: {
          ends_on: string;
          season_number: number;
          starts_on: string;
        }[];
      };
      season_minutes: {
        Args: { p_ends_on: string; p_starts_on: string; p_today: string; p_user_id: string };
        Returns: {
          minutes: number;
          top_game: string;
        }[];
      };
      season_rank: { Args: { p_minutes: number }; Returns: string };
      send_friend_request: { Args: { p_user: string }; Returns: string };
      send_message: {
        Args: { p_body: string; p_client_id: string; p_conversation: string };
        Returns: {
          message_id: string;
          status: string;
        }[];
      };
      squad_members: {
        Args: { p_conversation: string };
        Returns: {
          avatar_url: string;
          display_name: string;
          is_owner: boolean;
          user_id: string;
          username: string;
        }[];
      };
      unblock_user: { Args: { p_user: string }; Returns: undefined };
      username_base: { Args: { source: string }; Returns: string };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
