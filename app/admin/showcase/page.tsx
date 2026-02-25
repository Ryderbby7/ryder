"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";

type ShowcaseItem = {
  id: string;
  url: string;
  type: "image" | "video";
  uploadedAt: string;
};

export default function ShowcasePage() {
  const router = useRouter();
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch images on mount
  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const res = await fetch("/api/assets/showcase", { cache: "no-store" });
      const data = await res.json();
      const nextItems = (data.items ?? data.images ?? []) as ShowcaseItem[];
      setItems(nextItems);
    } catch {
      setMessage("Failed to load showcase");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setMessage(null);

      const selected = Array.from(files);
      let uploadedCount = 0;

      for (const file of selected) {
        const lowerName = (file.name || "").toLowerCase();
        const isVideo =
          file.type.startsWith("video/") ||
          lowerName.endsWith(".mov") ||
          lowerName.endsWith(".mp4");

        const ext = (() => {
          const fromName = lowerName.includes(".")
            ? lowerName.split(".").pop()
            : null;

          if (isVideo) return fromName === "mov" ? "mov" : "mp4";
          if (fromName === "png") return "png";
          if (fromName === "webp") return "webp";
          if (fromName === "gif") return "gif";
          return "jpg";
        })();

        const randomId = Math.random().toString(36).slice(2, 8);
        const pathname = `assets/showcase/${Date.now()}-${randomId}.${ext}`;

        await upload(pathname, file, {
          access: "public",
          handleUploadUrl: "/api/assets/showcase/upload",
          clientPayload: JSON.stringify({ type: isVideo ? "video" : "image" }),
        });

        uploadedCount += 1;
      }

      setMessage(`Uploaded ${uploadedCount} file(s)!`);
      
      // Refresh the list
      await fetchImages();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong";
      setMessage(msg);
    } finally {
      setUploading(false);
      // Reset the input
      e.target.value = "";
    }
  };

  const handleDelete = async (imageUrl: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      setDeleting(imageUrl);
      setMessage(null);

      const res = await fetch(
        `/api/assets/showcase?url=${encodeURIComponent(imageUrl)}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        setMessage("Failed to delete item");
        return;
      }

      setMessage("Deleted!");
      // Remove from local state
      setItems((prev) => prev.filter((item) => item.url !== imageUrl));
    } catch {
      setMessage("Something went wrong");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <main className="bg-black min-h-screen w-full flex flex-col items-center p-8">
      <div className="w-full max-w-4xl">
        <div className="bg-black border border-white rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-white mb-4">
            Manage Showcase
          </h1>

          {/* Upload Section */}
          <div className="mb-6">
            <label className="flex flex-col gap-2 text-white">
              <span className="text-sm uppercase tracking-wide">
                Upload images / videos
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/quicktime,.mp4,.mov"
                multiple
                disabled={uploading}
                onChange={handleUpload}
                className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200 disabled:opacity-50"
              />
            </label>
            {uploading && (
              <p className="text-sm text-white/70 mt-2">Uploading...</p>
            )}
          </div>

          <Button
            type="button"
            onClick={() => router.push("/admin")}
            variant="outline"
            className="h-10 w-full border border-white bg-black text-white rounded-sm text-sm hover:bg-white hover:text-black transition-colors"
          >
            ← Back to Dashboard
          </Button>

          {message && <p className="text-sm text-white mt-4">{message}</p>}
        </div>

        {/* Image Grid */}
        <div className="bg-black border border-white rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Current Showcase ({items.length})
          </h2>

          {items.length === 0 ? (
            <p className="text-white/50 text-center py-8">
              No showcase items yet. Upload some above!
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="relative group rounded-lg overflow-hidden border border-white/20"
                >
                  <div className="aspect-[3/4] relative">
                    {item.type === "video" ? (
                      <video
                        src={item.url}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                        controls
                      />
                    ) : (
                      <Image
                        src={item.url}
                        alt="Showcase"
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        className="object-cover"
                      />
                    )}
                  </div>

                  {/* Overlay with delete button */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      onClick={() => handleDelete(item.url)}
                      disabled={deleting === item.url}
                      className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1"
                    >
                      {deleting === item.url ? "..." : "🗑️ Delete"}
                    </Button>
                  </div>

                  {/* Upload date */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                    <p className="text-xs text-white/70 truncate">
                      {item.type.toUpperCase()} •{" "}
                      {new Date(item.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
