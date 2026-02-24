"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import TypingText from "@/components/TypingText";
import Footer from "@/components/landing/Footer";
import { Navbar } from "@/components/Navbar";
import { useUiStore, ShowcaseItem } from "@/lib/store/useUiStore";
import { useEffect, useState } from "react";

export default function WorkShowcase() {
  const { showcaseItems, setShowcaseItems } = useUiStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchShowcase = async () => {
      try {
        const res = await fetch("/api/assets/showcase", { cache: "no-store" });
        const data = await res.json();
        const items = (data.items ?? data.images ?? []) as ShowcaseItem[];
        setShowcaseItems(items);
      } catch {
        // Keep empty array on error
      }
      setIsLoading(false);
    };
    fetchShowcase();
  }, [setShowcaseItems]);

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen w-full bg-[#1a1000] text-white">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(1200px_500px_at_10%_0%,rgba(0,160,255,0.12),transparent_60%),radial-gradient(800px_500px_at_90%_10%,rgba(255,0,200,0.10),transparent_60%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_30%),repeating-linear-gradient(45deg,rgba(255,255,255,0.03)_0_10px,rgba(255,255,255,0.05)_10px_20px),linear-gradient(180deg,#0a0a0a,#0c0c0c)]" />
          <div className="absolute inset-0 opacity-25 mix-blend-multiply bg-[repeating-linear-gradient(to_bottom,rgba(0,0,0,0.18),rgba(0,0,0,0.18)_1px,rgba(0,0,0,0)_3px,rgba(0,0,0,0)_4px)]" />
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.55)]" />
        </div>

        <header className="mx-auto max-w-7xl px-4 py-10 flex flex-col text-center">
          <TypingText
            className="[font-family:var(--font-press)] text-3xl font-black tracking-tight drop-shadow-[0_0_14px_rgba(255,255,0,1.0)]"
            text="WORK SHOWCASE"
          />
        </header>

        <main className="mx-auto max-w-7xl px-4 pb-24">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-white/50 text-lg">Loading...</div>
            </div>
          ) : showcaseItems.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-white/50 text-lg">No images yet</div>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-24">
              {showcaseItems.map((item, i) => (
                <li key={item.id} className="relative">
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.1, delay: i * 0.05 }}
                    whileHover={{ scale: 1.015, rotate: 0.15 }}
                    className="group relative rounded-2xl"
                  >
                    <div className="relative w-full max-h-150 mx-auto">
                      {item.type === "video" ? (
                        <video
                          src={item.url}
                          className="
                            h-auto w-full max-h-150
                            object-contain
                            drop-shadow-[0_0_0_rgba(0,0,0,0)]
                            group-hover:drop-shadow-[0_0_18px_rgba(255,255,0,0.8)]
                            rounded-2xl
                          "
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <Image
                          src={item.url}
                          alt={`Work ${i + 1}`}
                          width={800}
                          height={1200}
                          className="
                            h-auto w-full max-h-150
                            object-contain
                            drop-shadow-[0_0_0_rgba(0,0,0,0)]
                            hover:drop-shadow-[0_0_18px_rgba(255,255,0,0.8)]
                            rounded-2xl
                          "
                          priority={i < 2}
                        />
                      )}
                    </div>
                  </motion.div>
                </li>
              ))}
            </ul>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
}
