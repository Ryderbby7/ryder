import { getSupabaseAdmin } from "./server";

export type AppConfigRow = {
  id: number;
  background_version: number;
  background_type: "color" | "image" | "video";
  background_path: string | null;
  background_color: string;
  logo_picture_version: number;
  logo_path: string | null;
  audio_version: number;
  audio_path: string | null;
  reviews_version: number;
  updated_at: string;
};

const CONFIG_ID = 1;

export async function getOrCreateAppConfig(): Promise<AppConfigRow> {
  const { data, error } = await getSupabaseAdmin()
    .from("app_config")
    .select("*")
    .eq("id", CONFIG_ID)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as AppConfigRow;

  const inserted = await getSupabaseAdmin()
    .from("app_config")
    .insert({ id: CONFIG_ID })
    .select("*")
    .single();

  if (inserted.error) throw inserted.error;
  return inserted.data as AppConfigRow;
}

export async function updateAppConfig(
  patch: Partial<Omit<AppConfigRow, "id">>
): Promise<AppConfigRow> {
  const { data, error } = await getSupabaseAdmin()
    .from("app_config")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", CONFIG_ID)
    .select("*")
    .single();

  if (error) throw error;
  return data as AppConfigRow;
}

