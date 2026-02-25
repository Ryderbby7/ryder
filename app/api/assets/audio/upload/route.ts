import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ASSETS_BUCKET = "assets";

export async function POST(): Promise<NextResponse> {
  try {
    const path = "audio/audio.m4a";
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

