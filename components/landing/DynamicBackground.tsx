"use client";

import { useUiStore, BackgroundConfig } from "@/lib/store/useUiStore";
import { useEffect, useState } from "react";
import Image from "next/image";

export function DynamicBackground() {
  const { background, setBackground } = useUiStore();
  const [isReady, setIsReady] = useState(false);
  const [showFallback, setShowFallback] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchBackground = async () => {
      try {
        const res = await fetch("/api/assets/background", { cache: "no-store" });
        const data = await res.json();
        if (data.background) {
          setBackground(data.version, data.background as BackgroundConfig);
        }
      } catch {
        // Use default background on error
      }
      setIsReady(true);
    };
    fetchBackground();
  }, [setBackground]);

  useEffect(() => {
    if (!isReady) return;
    // Ensure the opacity transition triggers (avoid same-tick style batching).
    const raf = requestAnimationFrame(() => setIsVisible(true));
    const FADE_MS = 1000;
    const t = setTimeout(() => setShowFallback(false), FADE_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [isReady]);

  const content = (() => {
    // Color background
    if (background.type === "color") {
      return (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: background.value }}
        />
      );
    }

    // Image background
    if (background.type === "image") {
      return (
        <div className="absolute inset-0">
          <div className="relative h-full w-full">
            <Image
              src={background.value}
              alt=""
              fill
              sizes="100vw"
              unoptimized
              className="object-cover"
              priority
            />
          </div>
        </div>
      );
    }

    // Video background
    if (background.type === "video") {
      return (
        <div className="absolute inset-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute min-w-full min-h-full w-auto h-auto top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-cover"
          >
            <source src={background.value} />
          </video>
        </div>
      );
    }

    return null;
  })();

  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    >
      {showFallback ? <div className="absolute inset-0 bg-black" /> : null}

      {isReady ? (
        <div
          className={[
            "absolute inset-0 transition-opacity duration-1000 ease-out",
            isVisible ? "opacity-100" : "opacity-0",
            "motion-reduce:opacity-100 motion-reduce:transition-none",
          ].join(" ")}
        >
          {content}
        </div>
      ) : null}
    </div>
  );
}
