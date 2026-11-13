import { isSupabaseConfigured } from "../supabase/service";
import { getDemoStore } from "./demo-store";
import { SupabaseStore } from "./supabase-store";

export function getStore() {
  return isSupabaseConfigured() ? new SupabaseStore() : getDemoStore();
}

export type TutoringStore = ReturnType<typeof getStore>;
