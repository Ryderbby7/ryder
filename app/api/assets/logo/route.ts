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
      return NextResponse.json({ error: "Invalid logo path" }, { status: 400 });
    }

    const config = await getOrCreateAppConfig();
    const newVersion = (config.logo_picture_version || 0) + 1;
    await updateAppConfig({
      logo_picture_version: newVersion,
      logo_path: path,
    });

    return NextResponse.json({
      ok: true,
      version: newVersion,
      url: publicUrlFor(path),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update logo" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const config = await getOrCreateAppConfig();
    return NextResponse.json({
      version: config.logo_picture_version || 0,
      url: config.logo_path ? publicUrlFor(config.logo_path) : null,
    });
  } catch {
    return NextResponse.json({ version: 0, url: null });
  }
}
