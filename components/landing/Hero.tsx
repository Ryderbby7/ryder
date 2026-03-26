"use client";

import { useUiStore } from "@/lib/store/useUiStore";
import Image from "next/image";

export default function Hero() {
  const { logoUrl, logoPictureVersion } = useUiStore();

  // Use blob URL if available, fallback to local file
  // ?v=version busts browser cache when logo changes
  const baseUrl = logoUrl || "/assets/logo.png";
  const imageSrc = `${baseUrl}?v=${logoPictureVersion}`;

  return (
    <div className="relative w-screen h-[50vh]">
      {/*<RotatingThreeJSModel />*/}
      <Image
        src={imageSrc}
        alt="Logo Image"
        fill
        sizes="100vw"
        className="object-cover object-center"
        priority
      />
    </div>
  );
}
