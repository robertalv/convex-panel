"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DynamicImage } from "./dynamic-image";

const heroImageLight = "/hero3-light.png";
const heroImageDark = "/hero3.png";

export function HeroImage() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="scale-100 sm:scale-100 md:scale-[0.95] lg:scale-[0.9] xl:scale-100 mt-20 md:mt-30 lg:absolute -right-[460px] -top-[60px] 2xl:scale-[1.45] 2xl:-top-[10px] z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div>
          <DynamicImage
            lightSrc={heroImageLight}
            darkSrc={heroImageDark}
            alt="Dashboard showing data table from Convex"
            width={1200}
            height={841}
            className="rounded-xl dark:[box-shadow:0px_80px_60px_0px_rgba(0,0,0,0.35),0px_35px_28px_0px_rgba(0,0,0,0.25),0px_18px_15px_0px_rgba(0,0,0,0.20),0px_10px_8px_0px_rgba(0,0,0,0.17),0px_5px_4px_0px_rgba(0,0,0,0.14),0px_2px_2px_0px_rgba(0,0,0,0.10)] [box-shadow:0px_82px_105px_0px_#E3E2DF7A,0px_29.93px_38.33px_0px_#E3E2DF54,0px_14.53px_18.61px_0px_#E3E2DF44,0px_7.12px_9.12px_0px_#E3E2DF36,0px_2.82px_3.61px_0px_#E3E2DF26]"
            onLoad={() => setIsLoaded(true)}
          />
        </div>
      </motion.div>
    </div>
  );
}
