"use client";

import Hero from "@/components/landing/Hero";
import MenuItem from "@/components/landing/MenuItem";
import Footer from "@/components/landing/Footer";
import { useStartLanding } from "@/lib/hooks/useStartLanding";
import { StartButton } from "@/components/landing/StartButton";
import { motion } from "framer-motion";
import { BookDialog } from "@/components/bookings/BookingDialog";
import { useUiStore } from "@/lib/store/useUiStore";
import { useRouter } from "next/navigation";
import { FloatingIcons } from "@/components/FloatingIcons";
import { DynamicBackground } from "@/components/landing/DynamicBackground";
import { useEffect } from "react";

export default function HomePage() {
  const { isLandingStarted, startLanding } = useStartLanding();
  const {
    setLogoPicture,
    openHaircutBooking,
    openBeardBooking,
    openHaircutAndBeardBooking,
    isHaircutBookingOpen,
    isBeardBookingOpen,
    isHaircutAndBeardBookingOpen,
  } = useUiStore();
  const router = useRouter();

  // Prefetch logo before the user clicks start so the URL is ready when animations begin
  useEffect(() => {
    fetch("/api/assets/logo", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setLogoPicture(data.version, data.url))
      .catch(() => {});
  }, [setLogoPicture]);

  const isBookingOpen =
    isHaircutBookingOpen || isBeardBookingOpen || isHaircutAndBeardBookingOpen;

  return (
    <main
      className="relative min-h-[100dvh] gap-6 flex flex-col items-center justify-center overflow-x-hidden overflow-y-hidden"
      role="main"
    >
      {isLandingStarted ? (
        <DynamicBackground />
      ) : (
        <div className="absolute inset-0 z-0 bg-black" aria-hidden="true" />
      )}
      {isLandingStarted ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="relative z-10 flex flex-col gap-6 items-center px-[clamp(10px,3vw,28px)] text-center"
          >
            <Hero />

            <BookDialog />

            <ul className="flex flex-col items-center gap-[clamp(8px,2.6vh,16px)] m-0 p-0 list-none">
              <MenuItem
                key={1}
                onClickAction={openHaircutBooking}
                label="Haircut"
                animate
              />
              <MenuItem
                key={2}
                onClickAction={openBeardBooking}
                label="Beard"
                animate
              />
              <MenuItem
                key={3}
                onClickAction={openHaircutAndBeardBooking}
                label="Haircut + Beard"
                animate
              />
              <MenuItem
                key={4}
                onClickAction={() => router.push("/work")}
                label="Ryder's Work"
                animate
              />
              <MenuItem
                key={5}
                onClickAction={() => router.push("/reviews")}
                label="Reviews"
                animate
              />
            </ul>
          </motion.div>
          {!isBookingOpen ? (
            <>
              <div className="relative z-10">
                <FloatingIcons animate />
              </div>
              <div className="relative z-10">
                <Footer />
              </div>
            </>
          ) : null}
        </>
      ) : (
        <div className="relative z-10">
          <StartButton onClick={startLanding} />
        </div>
      )}
    </main>
  );
}
