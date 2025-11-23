export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author_id: string
          author_name: string
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          author_name: string
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversation_threads: {
        Row: {
          conversation_id: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean | null
          thread_name: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean | null
          thread_name: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean | null
          thread_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_threads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          conversation_secret: string | null
          created_at: string
          id: string
          is_threaded: boolean | null
          last_activity_at: string | null
          status: string
          thread_id: string | null
          timeout_at: string | null
          updated_at: string
          user_email: string
          user_name: string
          user_role: string | null
        }
        Insert: {
          conversation_secret?: string | null
          created_at?: string
          id?: string
          is_threaded?: boolean | null
          last_activity_at?: string | null
          status?: string
          thread_id?: string | null
          timeout_at?: string | null
          updated_at?: string
          user_email: string
          user_name: string
          user_role?: string | null
        }
        Update: {
          conversation_secret?: string | null
          created_at?: string
          id?: string
          is_threaded?: boolean | null
          last_activity_at?: string | null
          status?: string
          thread_id?: string | null
          timeout_at?: string | null
          updated_at?: string
          user_email?: string
          user_name?: string
          user_role?: string | null
        }
        Relationships: []
      }
      dim_user: {
        Row: {
          created_at: string
          email_address: string
          id: number
          message_description: string
          user_name: string
        }
        Insert: {
          created_at?: string
          email_address: string
          id?: number
          message_description?: string
          user_name: string
        }
        Update: {
          created_at?: string
          email_address?: string
          id?: number
          message_description?: string
          user_name?: string
        }
        Relationships: []
      }
      DIM_USER: {
        Row: {
          created_at: string
          email_address: string
          id: number
          message_description: string
          user_name: string
        }
        Insert: {
          created_at?: string
          email_address?: string
          id?: number
          message_description?: string
          user_name?: string
        }
        Update: {
          created_at?: string
          email_address?: string
          id?: number
          message_description?: string
          user_name?: string
        }
        Relationships: []
      }
      function_rate_limits: {
        Row: {
          created_at: string | null
          function_name: string
          id: string
          ip_address: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          function_name: string
          id?: string
          ip_address: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          function_name?: string
          id?: string
          ip_address?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          admin_notes: string | null
          cover_letter: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          job_id: string
          linkedin_profile: string | null
          phone: string
          portfolio_website: string | null
          preferred_location: string | null
          resume_file_name: string
          resume_file_path: string
          status: string
          updated_at: string
          visa_status: string | null
        }
        Insert: {
          admin_notes?: string | null
          cover_letter?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          job_id: string
          linkedin_profile?: string | null
          phone: string
          portfolio_website?: string | null
          preferred_location?: string | null
          resume_file_name: string
          resume_file_path: string
          status?: string
          updated_at?: string
          visa_status?: string | null
        }
        Update: {
          admin_notes?: string | null
          cover_letter?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          job_id?: string
          linkedin_profile?: string | null
          phone?: string
          portfolio_website?: string | null
          preferred_location?: string | null
          resume_file_name?: string
          resume_file_path?: string
          status?: string
          updated_at?: string
          visa_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          application_deadline: string | null
          company: string | null
          created_at: string
          created_by: string | null
          department: string
          description: string
          employment_type: string
          experience_level: string
          id: string
          is_active: boolean
          location: string
          qualifications: string[]
          responsibilities: string[]
          salary_range: string | null
          title: string
          updated_at: string
          work_status: string | null
        }
        Insert: {
          application_deadline?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          department: string
          description: string
          employment_type: string
          experience_level: string
          id?: string
          is_active?: boolean
          location: string
          qualifications?: string[]
          responsibilities?: string[]
          salary_range?: string | null
          title: string
          updated_at?: string
          work_status?: string | null
        }
        Update: {
          application_deadline?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          department?: string
          description?: string
          employment_type?: string
          experience_level?: string
          id?: string
          is_active?: boolean
          location?: string
          qualifications?: string[]
          responsibilities?: string[]
          salary_range?: string | null
          title?: string
          updated_at?: string
          work_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          thread_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          thread_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "conversation_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_conversations: { Args: never; Returns: number }
      is_admin: { Args: { user_id_param: string }; Returns: boolean }
      verify_conversation_access: {
        Args: {
          conversation_id_param: string
          conversation_secret_param: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
