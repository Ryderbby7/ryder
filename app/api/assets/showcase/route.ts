import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { ASSETS_BUCKET, extractAssetsPath, publicUrlFor } from "@/lib/supabase/utils";

export const dynamic = "force-dynamic";

type ShowcaseItemType = "image" | "video";

type ShowcaseItem = {
  id: string;
  url: string;
  type: ShowcaseItemType;
  uploadedAt: string;
};

const IMAGE_EXT_RE = /\.(jpg|jpeg|png|webp|gif)$/i;
const VIDEO_EXT_RE = /\.(mp4|mov)$/i;

const SHOWCASE_FOLDER = "showcase";

function inferTypeFromName(name: string): ShowcaseItemType | null {
  if (VIDEO_EXT_RE.test(name)) return "video";
  if (IMAGE_EXT_RE.test(name)) return "image";
  return null;
}

// GET - List all showcase media (images + videos)
export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin().storage
      .from(ASSETS_BUCKET)
      .list(SHOWCASE_FOLDER, {
        limit: 200,
        offset: 0,
        sortBy: { column: "updated_at", order: "desc" },
      });

    if (error) throw error;

    const items: ShowcaseItem[] = (data ?? [])
      .map((obj) => {
        const type = inferTypeFromName(obj.name);
        if (!type) return null;
        const path = `${SHOWCASE_FOLDER}/${obj.name}`;
        const uploadedAt =
          obj.updated_at || obj.created_at || new Date().toISOString();

        return {
          id: path,
          url: publicUrlFor(path),
          type,
          uploadedAt: new Date(uploadedAt).toISOString(),
        } satisfies ShowcaseItem;
      })
      .filter((v): v is ShowcaseItem => Boolean(v));

    // Keep `images` for backwards-compat (older clients may expect it).
    const images = items.filter((i) => i.type === "image");

    return NextResponse.json({ items, images });
  } catch {
    return NextResponse.json({ items: [], images: [] });
  }
}

// DELETE - Remove a showcase media item
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const itemUrl = searchParams.get("url");

    if (!itemUrl) {
      return NextResponse.json(
        { error: "No media URL provided" },
        { status: 400 }
      );
    }

    const path = extractAssetsPath(itemUrl);
    if (!path || !path.startsWith(`${SHOWCASE_FOLDER}/`)) {
      return NextResponse.json({ error: "Invalid media path" }, { status: 400 });
    }

    const { error } = await getSupabaseAdmin().storage
      .from(ASSETS_BUCKET)
      .remove([path]);
    if (error) throw error;

    return NextResponse.json({ ok: true, deleted: itemUrl });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 }
    );
  }
}
