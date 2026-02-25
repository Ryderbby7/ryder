import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { extractAssetsPath, publicUrlFor } from "@/lib/supabase/utils";
import { getOrCreateAppConfig, updateAppConfig } from "@/lib/supabase/appConfig";

export const dynamic = "force-dynamic";

type BackgroundType = "color" | "image" | "video";

type BackgroundConfig = {
  type: BackgroundType;
  value: string;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

// POST - Update background (color, image, or video)
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // Handle JSON body for color backgrounds, or for setting image/video by URL
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { type, value } = body as { type: BackgroundType; value: string };

      if (type === "color") {
        if (!isNonEmptyString(value)) {
          return NextResponse.json(
            { error: "Invalid color background data" },
            { status: 400 }
          );
        }

        const config = await getOrCreateAppConfig();
        const newVersion = (config.background_version || 0) + 1;
        const newBackground: BackgroundConfig = { type: "color", value };
        await updateAppConfig({
          background_version: newVersion,
          background_type: "color",
          background_color: value,
          background_path: null,
        });

        return NextResponse.json({
          ok: true,
          version: newVersion,
          background: newBackground,
        });
      }

      if ((type === "image" || type === "video") && isNonEmptyString(value)) {
        const config = await getOrCreateAppConfig();
        const newVersion = (config.background_version || 0) + 1;

        const newPath = extractAssetsPath(value);
        if (!newPath) {
          return NextResponse.json(
            { error: "Invalid background path" },
            { status: 400 }
          );
        }

        // Delete the previous object if it differs (helps when switching extensions).
        const prevPath = config.background_path;
        if (prevPath && prevPath !== newPath) {
          await getSupabaseAdmin().storage.from("assets").remove([prevPath]);
        }

        await updateAppConfig({
          background_version: newVersion,
          background_type: type,
          background_path: newPath,
        });

        const newBackground: BackgroundConfig = {
          type,
          value: publicUrlFor(newPath),
        };

        return NextResponse.json({
          ok: true,
          version: newVersion,
          background: newBackground,
        });
      }

      // Anything else is invalid
      if (!isNonEmptyString(value)) {
        return NextResponse.json(
          { error: "Invalid background data" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Unsupported request type" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to update background",
      },
      { status: 500 }
    );
  }
}

// GET - Retrieve current background config
export async function GET() {
  try {
    const config = await getOrCreateAppConfig();

    const type = (config.background_type || "color") as BackgroundType;
    const background: BackgroundConfig =
      type === "color"
        ? { type: "color", value: config.background_color || "#000000" }
        : config.background_path
          ? { type, value: publicUrlFor(config.background_path) }
          : { type: "color", value: "#000000" };

    return NextResponse.json({
      version: config.background_version || 0,
      background,
    });
  } catch {
    return NextResponse.json({
      version: 0,
      background: { type: "color", value: "#000000" },
    });
  }
}
