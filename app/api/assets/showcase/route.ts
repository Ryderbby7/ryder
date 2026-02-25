import { NextRequest, NextResponse } from "next/server";
import { put, list, del } from "@vercel/blob";

export const dynamic = "force-dynamic";

const SHOWCASE_PREFIX = "assets/showcase/";

type ShowcaseItemType = "image" | "video";

type ShowcaseItem = {
  id: string;
  url: string;
  type: ShowcaseItemType;
  uploadedAt: string;
};

const IMAGE_EXT_RE = /\.(jpg|jpeg|png|webp|gif)$/i;
const VIDEO_EXT_RE = /\.(mp4|mov)$/i;

const IMAGE_CONTENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

const VIDEO_CONTENT_TYPES = ["video/mp4", "video/quicktime"];

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_BYTES = 25 * 1024 * 1024; // 25MB

function inferExtension(file: Blob): string {
  const maybeName = (file as File | undefined)?.name;
  if (typeof maybeName === "string" && maybeName.includes(".")) {
    const ext = maybeName.split(".").pop()?.toLowerCase();
    if (ext && (IMAGE_EXT_RE.test(`.${ext}`) || VIDEO_EXT_RE.test(`.${ext}`))) {
      return ext === "jpeg" ? "jpg" : ext;
    }
  }

  switch (file.type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "video/mp4":
      return "mp4";
    case "video/quicktime":
      return "mov";
    default:
      return "bin";
  }
}

function inferTypeFromFile(file: Blob): ShowcaseItemType | null {
  if (file.type?.startsWith("image/")) return "image";
  if (file.type?.startsWith("video/")) return "video";

  const ext = inferExtension(file);
  if (IMAGE_EXT_RE.test(`.${ext}`)) return "image";
  if (VIDEO_EXT_RE.test(`.${ext}`)) return "video";
  return null;
}

// GET - List all showcase media (images + videos)
export async function GET() {
  try {
    const { blobs } = await list({ prefix: SHOWCASE_PREFIX });

    const items: ShowcaseItem[] = blobs
      .map((blob) => {
        const isImage = IMAGE_EXT_RE.test(blob.pathname);
        const isVideo = VIDEO_EXT_RE.test(blob.pathname);
        if (!isImage && !isVideo) return null;

        return {
          id: blob.url,
          url: blob.url,
          type: isVideo ? "video" : "image",
          uploadedAt: blob.uploadedAt.toISOString(),
        } satisfies ShowcaseItem;
      })
      .filter((v): v is ShowcaseItem => Boolean(v))
      .sort(
        (a, b) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );

    // Keep `images` for backwards-compat (older clients may expect it).
    const images = items.filter((i) => i.type === "image");

    return NextResponse.json({ items, images });
  } catch {
    return NextResponse.json({ items: [], images: [] });
  }
}

// POST - Upload new showcase media (images/videos)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files");

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const uploadedItems: ShowcaseItem[] = [];

    for (const file of files) {
      if (!(file instanceof Blob)) continue;

      const type = inferTypeFromFile(file);
      if (!type) {
        return NextResponse.json(
          { error: "Unsupported file type. Upload images or videos only." },
          { status: 400 }
        );
      }

      const allowedContentTypes =
        type === "video" ? VIDEO_CONTENT_TYPES : IMAGE_CONTENT_TYPES;
      if (file.type && !allowedContentTypes.includes(file.type)) {
        return NextResponse.json(
          {
            error:
              type === "video"
                ? "Unsupported video type. Use mp4 or mov."
                : "Unsupported image type. Use png, jpg, webp, or gif.",
          },
          { status: 400 }
        );
      }

      const maxBytes = type === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
      if (typeof file.size === "number" && file.size > maxBytes) {
        return NextResponse.json(
          {
            error:
              type === "video"
                ? "Video too large. Keep videos under 25MB."
                : "Image too large. Keep images under 10MB.",
          },
          { status: 400 }
        );
      }

      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const extension = inferExtension(file);
      const filename = `${SHOWCASE_PREFIX}${timestamp}-${randomId}.${extension}`;

      const { url } = await put(filename, file, {
        access: "public",
        contentType:
          file.type || (type === "video" ? "video/mp4" : "image/jpeg"),
      });

      uploadedItems.push({
        id: url,
        url,
        type,
        uploadedAt: new Date().toISOString(),
      });
    }

    if (uploadedItems.length === 0) {
      return NextResponse.json(
        { error: "No valid files uploaded" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      uploaded: uploadedItems,
      count: uploadedItems.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to upload media" },
      { status: 500 }
    );
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

    await del(itemUrl);

    return NextResponse.json({ ok: true, deleted: itemUrl });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 }
    );
  }
}
