import { NextRequest, NextResponse } from "next/server";
import { extractAssetsPath, publicUrlFor } from "@/lib/supabase/utils";
import { getOrCreateAppConfig, updateAppConfig } from "@/lib/supabase/appConfig";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Expected application/json" },
        { status: 400 }
      );
    }

    const body = (await req.json()) as { value?: string; path?: string };
    const raw = (body.path ?? body.value ?? "").toString();
    const path = extractAssetsPath(raw);
    if (!path) {
      return NextResponse.json({ error: "Invalid audio path" }, { status: 400 });
    }

    const config = await getOrCreateAppConfig();
    const newVersion = (config.audio_version || 0) + 1;
    await updateAppConfig({ audio_version: newVersion, audio_path: path });

    return NextResponse.json({ ok: true, version: newVersion, url: publicUrlFor(path) });
  } catch {
    return NextResponse.json(
      { error: "Failed to update audio" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const config = await getOrCreateAppConfig();
    return NextResponse.json({
      version: config.audio_version || 0,
      url: config.audio_path ? publicUrlFor(config.audio_path) : null,
    });
  } catch {
    return NextResponse.json({ version: 0, url: null });
  }
}
