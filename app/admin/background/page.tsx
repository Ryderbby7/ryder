"use client";

import { Button } from "@/components/ui/button";
import {
  useUiStore,
  BackgroundType,
  BackgroundConfig,
} from "@/lib/store/useUiStore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function BackgroundPage() {
  const router = useRouter();
  const { background, setBackground } = useUiStore();
  
  const [activeType, setActiveType] = useState<BackgroundType>("color");
  const [colorValue, setColorValue] = useState("#000000");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [currentBackground, setCurrentBackground] = useState<BackgroundConfig | null>(null);

  // Fetch current background on mount
  useEffect(() => {
    const fetchBackground = async () => {
      try {
        const res = await fetch("/api/assets/background", { cache: "no-store" });
        const data = await res.json();
        if (data.background) {
          setCurrentBackground(data.background);
          setActiveType(data.background.type);
          if (data.background.type === "color") {
            setColorValue(data.background.value);
          }
        }
      } catch {
        // Use defaults
      }
    };
    fetchBackground();
  }, []);

  const handleColorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUploading(true);
      setMessage(null);

      const res = await fetch("/api/assets/background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "color", value: colorValue }),
      });

      if (!res.ok) {
        setMessage("Failed to update background.");
        return;
      }

      const data = await res.json();
      setBackground(data.version, data.background);
      setCurrentBackground(data.background);
      setMessage("Background updated to color!");
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setMessage(`Please choose ${activeType === "image" ? "an image" : "a video"}.`);
      return;
    }

    try {
      setUploading(true);
      setMessage(null);

      const lowerName = (file.name || "").toLowerCase();

      const getExt = () => {
        if (activeType === "image") {
          if (
            file.type === "image/jpeg" ||
            lowerName.endsWith(".jpg") ||
            lowerName.endsWith(".jpeg")
          ) {
            return "jpg";
          }
          if (file.type === "image/webp" || lowerName.endsWith(".webp")) {
            return "webp";
          }
          if (file.type === "image/gif" || lowerName.endsWith(".gif")) {
            return "gif";
          }
          return "png";
        }

        // video
        if (file.type === "video/quicktime" || lowerName.endsWith(".mov")) {
          return "mov";
        }
        return "mp4";
      };

      const ext = getExt();

      // Get signed upload token (server) then upload to Supabase (browser).
      const tokenRes = await fetch("/api/assets/background/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activeType, ext }),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => null);
        setMessage(err?.error || "Failed to start upload.");
        return;
      }

      const { path, token } = (await tokenRes.json()) as {
        path: string;
        token: string;
      };

      const uploaded = await getSupabaseBrowser().storage
        .from("assets")
        .uploadToSignedUrl(path, token, file, {
          contentType: file.type || undefined,
        });

      if (uploaded.error) {
        setMessage(uploaded.error.message);
        return;
      }

      // Now persist the new background path in DB (small JSON request).
      const res = await fetch("/api/assets/background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activeType, value: path }),
      });

      if (!res.ok) {
        setMessage("Failed to update background.");
        return;
      }

      const data = await res.json();
      setBackground(data.version, data.background);
      setCurrentBackground(data.background);
      setMessage(`Background updated to ${activeType}!`);
      setFile(null);
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="bg-black min-h-screen w-full flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md bg-black border border-white rounded-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-4">Update Background</h1>

        {/* Current Background Preview */}
        {currentBackground && (
          <div className="mb-6 p-4 border border-white/30 rounded-lg">
            <p className="text-sm text-white/70 mb-2">Current Background:</p>
            <div className="flex items-center gap-3">
              {currentBackground.type === "color" && (
                <>
                  <div
                    className="w-10 h-10 rounded border border-white/50"
                    style={{ backgroundColor: currentBackground.value }}
                  />
                  <span className="text-white font-mono">{currentBackground.value}</span>
                </>
              )}
              {currentBackground.type === "image" && (
                <span className="text-white">🖼️ Image uploaded</span>
              )}
              {currentBackground.type === "video" && (
                <span className="text-white">🎬 Video uploaded</span>
              )}
            </div>
          </div>
        )}

        {/* Type Selection Tabs */}
        <div className="flex gap-2 mb-6">
          {(["color", "image", "video"] as BackgroundType[]).map((type) => (
            <button
              key={type}
              onClick={() => {
                setActiveType(type);
                setFile(null);
                setMessage(null);
              }}
              className={`flex-1 py-2 px-3 rounded-sm text-sm font-semibold transition-colors ${
                activeType === type
                  ? "bg-white text-black"
                  : "bg-black text-white border border-white hover:bg-white/10"
              }`}
            >
              {type === "color" && "🎨 Color"}
              {type === "image" && "🖼️ Image"}
              {type === "video" && "🎬 Video"}
            </button>
          ))}
        </div>

        {/* Color Form */}
        {activeType === "color" && (
          <form onSubmit={handleColorSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-white">
              <span className="text-sm uppercase tracking-wide">Choose color</span>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={colorValue}
                  onChange={(e) => setColorValue(e.target.value)}
                  className="w-16 h-12 rounded cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  value={colorValue}
                  onChange={(e) => setColorValue(e.target.value)}
                  placeholder="#000000"
                  className="flex-1 h-12 px-3 bg-black border border-white rounded-sm text-white font-mono"
                />
              </div>
            </label>

            {/* Quick color presets */}
            <div className="flex gap-2 flex-wrap">
              {["#000000", "#FFFFFF", "#1a1a1a", "#0f172a", "#1e3a5f", "#3d0a0a"].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setColorValue(color)}
                  className="w-8 h-8 rounded border border-white/30 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            <Button
              type="submit"
              disabled={uploading}
              className="h-12 w-full bg-white text-black font-bold rounded-sm text-lg hover:bg-white hover:-translate-y-0.5 transition-transform"
            >
              {uploading ? "Saving..." : "Save Color"}
            </Button>
          </form>
        )}

        {/* Image Form */}
        {activeType === "image" && (
          <form onSubmit={handleFileSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-white">
              <span className="text-sm uppercase tracking-wide">Choose image</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>

            <Button
              type="submit"
              disabled={uploading || !file}
              className="h-12 w-full bg-white text-black font-bold rounded-sm text-lg hover:bg-white hover:-translate-y-0.5 transition-transform disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Save Image"}
            </Button>
          </form>
        )}

        {/* Video Form */}
        {activeType === "video" && (
          <form onSubmit={handleFileSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-white">
              <span className="text-sm uppercase tracking-wide">Choose video</span>
              <input
                type="file"
                accept="video/mp4,video/quicktime,.mp4,.mov"
                className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <p className="text-xs text-white/50">
              Tip: Keep videos under 10MB for best performance. The video will loop automatically.
            </p>

            <Button
              type="submit"
              disabled={uploading || !file}
              className="h-12 w-full bg-white text-black font-bold rounded-sm text-lg hover:bg-white hover:-translate-y-0.5 transition-transform disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Save Video"}
            </Button>
          </form>
        )}

        <Button
          type="button"
          onClick={() => router.push("/admin")}
          variant="outline"
          className="h-10 w-full mt-4 border border-white bg-black text-white rounded-sm text-sm hover:bg-white hover:text-black transition-colors"
        >
          ← Back to Dashboard
        </Button>

        {message && <p className="text-sm text-white mt-4">{message}</p>}
      </div>
    </main>
  );
}
