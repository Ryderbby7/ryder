import { NextRequest, NextResponse } from "next/server";
import { getOrCreateAppConfig, updateAppConfig } from "@/lib/supabase/appConfig";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const name =
      typeof body.name === "string" ? body.name.trim() : "";
    const label =
      typeof body.label === "string" ? body.label.trim() : null;
    const comment =
      typeof body.comment === "string" ? body.comment.trim() : "";
    const ratingRaw = Number(body.rating);
    const rating = Number.isFinite(ratingRaw)
      ? Math.min(5, Math.max(1, Math.round(ratingRaw)))
      : 5;

    if (!name || !comment) {
      return NextResponse.json(
        { error: "name and comment are required" },
        { status: 400 }
      );
    }

    const inserted = await getSupabaseAdmin()
      .from("reviews")
      .insert({
        name,
        label,
        rating,
        comment,
      })
      .select("id")
      .single();

    if (inserted.error) {
      return NextResponse.json(
        { error: inserted.error.message },
        { status: 500 }
      );
    }

    const config = await getOrCreateAppConfig();
    const newVersion = (config.reviews_version || 0) + 1;
    await updateAppConfig({ reviews_version: newVersion });

    return NextResponse.json({
      ok: true,
      version: newVersion,
      reviewId: inserted.data.id,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to add review" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { reviewId } = await req.json();

    if (!reviewId) {
      return NextResponse.json(
        { error: "reviewId is required" },
        { status: 400 },
      );
    }

    const deleted = await getSupabaseAdmin()
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (deleted.error) {
      return NextResponse.json(
        { error: deleted.error.message },
        { status: 500 }
      );
    }

    const config = await getOrCreateAppConfig();
    const newVersion = (config.reviews_version || 0) + 1;
    await updateAppConfig({ reviews_version: newVersion });

    return NextResponse.json({
      ok: true,
      version: newVersion,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const config = await getOrCreateAppConfig();
    const { data, error } = await getSupabaseAdmin()
      .from("reviews")
      .select("id,name,label,rating,comment,created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      version: config.reviews_version || 0,
      reviews: (data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        label: r.label,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
      })),
    });
  } catch {
    return NextResponse.json({ version: 0, reviews: [] });
  }
}
