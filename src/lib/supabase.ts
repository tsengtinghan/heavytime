import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Story {
  id: string;
  title: string;
  poem_text: string | null;
  poem_audio: string | null;
  camera_image: string | null;
  comic_image: string | null;
  created_at?: string;
}
