import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ASSETS_BUCKET = "assets";
const IMAGE_EXTS = ["png", "jpg", "jpeg", "webp", "gif"] as const;
const VIDEO_EXTS = ["mp4", "mov"] as const;

type Body = {
  type: "image" | "video";
  ext: string;
};

function isAllowedExt(type: Body["type"], ext: string) {
  const lower = ext.toLowerCase();
  return type === "video"
    ? (VIDEO_EXTS as readonly string[]).includes(lower)
    : (IMAGE_EXTS as readonly string[]).includes(lower);
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Partial<Body>;
    const type = body.type;
    const ext = body.ext;

    if ((type !== "image" && type !== "video") || typeof ext !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    if (!isAllowedExt(type, ext)) {
      return NextResponse.json(
        { error: type === "video" ? "Use mp4 or mov." : "Unsupported image type." },
        { status: 400 }
      );
    }

    const normalizedExt = ext.toLowerCase() === "jpeg" ? "jpg" : ext.toLowerCase();
    const path = `background/background.${normalizedExt}`;

    const { data, error } = await getSupabaseAdmin().storage
      .from(ASSETS_BUCKET)
      .createSignedUploadUrl(path, { upsert: true });

    if (error || !data?.token) {
      return NextResponse.json(
        { error: error?.message || "Failed to create upload URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ path: data.path ?? path, token: data.token });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload token error" },
      { status: 400 }
    );
  }
}

