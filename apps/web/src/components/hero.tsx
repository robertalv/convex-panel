import { Button } from "./ui/button";
import { HeroImage } from "./hero-image";
import { Metrics } from "./metrics";
import { WordAnimation } from "./word-animation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01FreeIcons } from "@hugeicons/core-free-icons";
import { Link } from "@tanstack/react-router";
import { CopyButton } from "./copy-button";
import { AnimatedGroup } from "./motion-primitives/animated-group";
import type { Variants } from "motion/react";

const transitionVariants: { item: Variants } = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring",
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export function Hero() {
  return (
    <section className="mt-[80px] lg:mt-[140px] min-h-[530px] relative lg:h-[calc(100vh-145px)]">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-12 relative">
        <div className="max-w-xl space-y-6 px-4 py-6 md:px-8 md:py-8 rounded-3xl relative z-20 bg-background-primary/60 backdrop-blur-xl border border-transparent lg:border-transparent">
          <Link to="/">
            <Button
              variant="outline"
              className="rounded-full border-border flex space-x-2 items-center bg-background-secondary/40 backdrop-blur-sm hover:bg-background-secondary/70 max-w-full"
            >
              <span className="text-[10px] md:text-xs tracking-wide uppercase text-content-secondary truncate">
                Updates for Convex Panel - v0.3.0
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] md:text-xs whitespace-nowrap">
                Release notes
                <HugeiconsIcon icon={ArrowRight01FreeIcons} className="w-3 h-3 md:w-4 md:h-4" />
              </span>
            </Button>
          </Link>

          <h1 className="mt-4 md:mt-6 text-3xl md:text-[40px] leading-tight font-serif text-content-primary">
            The debugging and observability panel{" "}
            <span className="text-primary">for your Convex apps.</span>
            <span className="block mt-2 text-xl md:text-[28px] text-content-secondary">
              Built for <WordAnimation /> who want to ship faster with less
              guesswork.
            </span>
          </h1>

          <p className="text-sm md:text-base text-content-secondary max-w-md leading-relaxed">
            Inspect queries and mutations, watch live logs and schedules, and
            understand what&apos;s happening in your Convex data without adding
            a single console.log.
          </p>

          <div className="flex flex-col items-start gap-4">
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                ...transitionVariants,
              }}
              className="mt-2 flex flex-col items-center justify-center gap-2 md:flex-row w-full md:w-auto">
              <div className="p-[2px] rounded-[calc(var(--radius-xl)+0.40rem)] border-2 border-dashed border-border w-full md:w-auto">
                <div
                  key={1}
                  className="bg-foreground/5 rounded-[calc(var(--radius-xl)+0.125rem)] border border-border p-0.5 flex items-center w-full md:w-auto">
                  <CopyButton />
                </div>
              </div>
            </AnimatedGroup>
            <span className="text-[10px] md:text-xs text-content-tertiary font-mono max-w-md">
              <a
                href="https://github.com/robertalv/convex-panel"
                target="_blank"
                rel="noreferrer"
                className="hover:underline hover:text-content-primary transition-colors"
              >
                Open source
              </a>{" "}
              ·{" "}
              <a
                href="https://convex.link/cpanel"
                target="_blank"
                rel="noreferrer"
                className="hover:underline hover:text-content-primary transition-colors"
              >
                Works with any Convex project
              </a>
            </span>
            {/* <EmailSignup /> */}
          </div>
        </div>

        <div className="w-full lg:w-auto flex justify-center lg:block">
          <HeroImage />
        </div>
      </div>

      <div>
        <Metrics />
      </div>
    </section>
  );
}
