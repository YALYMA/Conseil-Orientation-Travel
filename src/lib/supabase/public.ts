import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

/** Client anonyme SANS cookies : permet de mettre en cache les pages publiques (la RLS limite aux contenus publiés). */
export const createPublicClient = () =>
  createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } });
