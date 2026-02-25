import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const IMAGE_CONTENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

// iPhone library typically uploads videos as video/quicktime (.mov) or video/mp4 (.mp4)
const VIDEO_CONTENT_TYPES = ["video/mp4", "video/quicktime"];

type ClientPayload = { type?: "image" | "video" } | null;

function parseClientPayload(clientPayload: unknown): ClientPayload {
  if (typeof clientPayload !== "string") return null;
  try {
    return JSON.parse(clientPayload) as ClientPayload;
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!pathname.startsWith("assets/showcase/")) {
          throw new Error("Invalid upload pathname.");
        }

        const parsed = parseClientPayload(clientPayload);
        const requestedType = parsed?.type;

        const allowedContentTypes =
          requestedType === "video"
            ? VIDEO_CONTENT_TYPES
            : requestedType === "image"
              ? IMAGE_CONTENT_TYPES
              : [...IMAGE_CONTENT_TYPES, ...VIDEO_CONTENT_TYPES];

        return {
          allowedContentTypes,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ requestedType }),
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}

