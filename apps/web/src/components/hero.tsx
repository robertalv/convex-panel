import { Button } from "./ui/button";
import { HeroImage } from "./hero-image";
import { Metrics } from "./metrics";
import { WordAnimation } from "./word-animation";
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01FreeIcons } from '@hugeicons/core-free-icons'
import { Link, useRouterState } from "@tanstack/react-router";
import { CopyButton } from "./copy-button";
import { AnimatedGroup } from "./motion-primitives/animated-group";
import { EmailSignup } from "./email-signup";
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
  const { location } = useRouterState();
  const currentPath = location.pathname || "/";

  return (
    <section className="mt-[60px] lg:mt-[140px] min-h-[530px] relative lg:h-[calc(100vh-260px)]">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12">
        <div className="max-w-xl space-y-6">
          <Link to="/">
            <Button
              variant="outline"
              className="rounded-full border-border flex space-x-2 items-center bg-background-secondary/40 backdrop-blur-sm hover:bg-background-secondary/70"
            >
              <span className="text-xs tracking-wide uppercase text-[#878787]">
                Updates for Convex Panel - v0.3.0
              </span>
              <span className="inline-flex items-center gap-1 text-xs">
                Release notes
                <HugeiconsIcon icon={ArrowRight01FreeIcons} className="w-4 h-4" />
              </span>
            </Button>
          </Link>

          <h1 className="mt-4 md:mt-6 text-[28px] md:text-[40px] leading-tight font-serif text-content-primary">
            The debugging and observability panel{" "}
            <span className="text-primary">for your Convex apps.</span>
            <span className="block mt-2 text-[22px] md:text-[28px] text-[#878787]">
              Built for <WordAnimation /> who want to ship faster with less
              guesswork.
            </span>
          </h1>

          <p className="text-sm md:text-base text-[#878787] max-w-md">
            Inspect queries and mutations, watch live logs and schedules, and
            understand what&apos;s happening in your Convex data without adding
            a single console.log.
          </p>

          <div className="flex flex-col items-start gap-3">
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
              className="mt-6 flex flex-col items-center justify-center gap-2 md:flex-row">
              <div className="p-[2px] rounded-[calc(var(--radius-xl)+0.40rem)] border-2 border-dashed border-foreground/20">
                <div
                  key={1}
                  className="bg-foreground/10 rounded-[calc(var(--radius-xl)+0.125rem)] border p-0.5 flex items-center">
                  <CopyButton />
                </div>
              </div>
            </AnimatedGroup>
            <span className="text-xs md:text-sm text-[#707070] font-mono max-w-md">
              <a
                href="https://github.com/robertalv/convex-panel"
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                Open source
              </a>{" "}
              ·{" "}
              <a
                href="https://convex.link/cpanel"
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                Works with any Convex project
              </a>
            </span>
            {/* <EmailSignup /> */}
          </div>
        </div>

        <HeroImage />
      </div>

      <div className="mt-16">
        <Metrics />
      </div>
    </section>
  );
}
