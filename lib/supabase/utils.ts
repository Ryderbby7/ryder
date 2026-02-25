import { getSupabaseAdmin } from "./server";

export const ASSETS_BUCKET = "assets";

export function extractAssetsPath(value: string): string {
  // Accept either a raw path like "showcase/123.mp4" or a Supabase public URL.
  const v = value.trim();
  if (!v) return "";

  // Supabase public URL pattern:
  // https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
  const marker = `/storage/v1/object/public/${ASSETS_BUCKET}/`;
  const idx = v.indexOf(marker);
  if (idx !== -1) {
    return v.slice(idx + marker.length);
  }

  // Also accept "assets/<path>"
  if (v.startsWith(`${ASSETS_BUCKET}/`)) return v.slice(`${ASSETS_BUCKET}/`.length);

  // No leading slash paths
  return v.startsWith("/") ? v.slice(1) : v;
}

export function publicUrlFor(path: string): string {
  const cleaned = extractAssetsPath(path);
  if (!cleaned) return "";
  const { data } = getSupabaseAdmin().storage
    .from(ASSETS_BUCKET)
    .getPublicUrl(cleaned);
  return data.publicUrl;
}

