import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ASSETS_BUCKET = "assets";
const IMAGE_EXTS = ["png", "jpg", "jpeg", "webp", "gif"] as const;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Partial<{ ext: string }>;
    const ext = typeof body.ext === "string" ? body.ext.toLowerCase() : "";
    if (!ext) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    if (!(IMAGE_EXTS as readonly string[]).includes(ext)) {
      return NextResponse.json(
        { error: "Unsupported image type." },
        { status: 400 }
      );
    }

    const normalizedExt = ext === "jpeg" ? "jpg" : ext;
    const path = `logo/logo.${normalizedExt}`;

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

