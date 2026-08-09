export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      plans: {
        Row: {
          id: string
          plan_name: string
          max_photos: number
          price: number
          premium_features: Json
          created_at: string
        }
        Insert: {
          id?: string
          plan_name: string
          max_photos: number
          price: number
          premium_features?: Json
          created_at?: string
        }
        Update: {
          id?: string
          plan_name?: string
          max_photos?: number
          price?: number
          premium_features?: Json
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          full_name: string | null
          email: string
          avatar_url: string | null
          provider: string | null
          referral_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email: string
          avatar_url?: string | null
          provider?: string | null
          referral_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string
          avatar_url?: string | null
          provider?: string | null
          referral_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      surprises: {
        Row: {
          id: string
          user_id: string
          recipient_name: string
          relationship_type: string | null
          occasion: string | null
          special_note: string | null
          custom_message: string | null
          selected_theme: string
          selected_music: string | null
          plan_type: string
          surprise_slug: string
          status: 'draft' | 'active' | 'expired'
          password_lock: string | null
          countdown_enabled: boolean
          countdown_date: string | null
          midnight_unlock: boolean
          cute_no_button: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipient_name: string
          relationship_type?: string | null
          occasion?: string | null
          special_note?: string | null
          custom_message?: string | null
          selected_theme?: string
          selected_music?: string | null
          plan_type: string
          surprise_slug: string
          status?: 'draft' | 'active' | 'expired'
          password_lock?: string | null
          countdown_enabled?: boolean
          countdown_date?: string | null
          midnight_unlock?: boolean
          cute_no_button?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipient_name?: string
          relationship_type?: string | null
          occasion?: string | null
          special_note?: string | null
          custom_message?: string | null
          selected_theme?: string
          selected_music?: string | null
          plan_type?: string
          surprise_slug?: string
          status?: 'draft' | 'active' | 'expired'
          password_lock?: string | null
          countdown_enabled?: boolean
          countdown_date?: string | null
          midnight_unlock?: boolean
          cute_no_button?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      photos: {
        Row: {
          id: string
          surprise_id: string
          image_url: string
          caption: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          surprise_id: string
          image_url: string
          caption?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          surprise_id?: string
          image_url?: string
          caption?: string | null
          sort_order?: number
          created_at?: string
        }
      }
      music_uploads: {
        Row: {
          id: string
          surprise_id: string
          music_url: string
          music_type: 'default' | 'custom'
          created_at: string
        }
        Insert: {
          id?: string
          surprise_id: string
          music_url: string
          music_type: 'default' | 'custom'
          created_at?: string
        }
        Update: {
          id?: string
          surprise_id?: string
          music_url?: string
          music_type?: 'default' | 'custom'
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          surprise_id: string | null
          amount: number
          currency: string
          payment_status: 'pending' | 'captured' | 'failed'
          razorpay_payment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          surprise_id?: string | null
          amount: number
          currency?: string
          payment_status: 'pending' | 'captured' | 'failed'
          razorpay_payment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          surprise_id?: string | null
          amount?: number
          currency?: string
          payment_status?: 'pending' | 'captured' | 'failed'
          razorpay_payment_id?: string | null
          created_at?: string
        }
      }
      drafts: {
        Row: {
          id: string
          user_id: string
          draft_data: Json
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          draft_data?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          draft_data?: Json
          updated_at?: string
        }
      }
      surprise_views: {
        Row: {
          id: string
          surprise_id: string
          viewed_at: string
          device_type: string | null
        }
        Insert: {
          id?: string
          surprise_id: string
          viewed_at?: string
          device_type?: string | null
        }
        Update: {
          id?: string
          surprise_id?: string
          viewed_at?: string
          device_type?: string | null
        }
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_user_id: string
          referral_code: string
          is_rewarded: boolean
          rewarded_at: string | null
          trigger_order_id: string | null
          refund_review_required: boolean
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_user_id: string
          referral_code: string
          is_rewarded?: boolean
          rewarded_at?: string | null
          trigger_order_id?: string | null
          refund_review_required?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_user_id?: string
          referral_code?: string
          is_rewarded?: boolean
          rewarded_at?: string | null
          trigger_order_id?: string | null
          refund_review_required?: boolean
          created_at?: string
        }
      }
      reward_credits: {
        Row: {
          user_id: string
          basic_credits: number
          lifetime_credits: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          basic_credits?: number
          lifetime_credits?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          basic_credits?: number
          lifetime_credits?: number
          created_at?: string
          updated_at?: string
        }
      }
      reward_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          transaction_type: 'earn' | 'spend' | 'revoke'
          referral_id: string | null
          surprise_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          transaction_type: 'earn' | 'spend' | 'revoke'
          referral_id?: string | null
          surprise_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          transaction_type?: 'earn' | 'spend' | 'revoke'
          referral_id?: string | null
          surprise_id?: string | null
          created_at?: string
        }
      }
      free_plan_usage: {
        Row: {
          user_id: string
          surprise_id: string
          consumed_at: string
        }
        Insert: {
          user_id: string
          surprise_id: string
          consumed_at?: string
        }
        Update: {
          user_id?: string
          surprise_id?: string
          consumed_at?: string
        }
      }
    }
  }
}
