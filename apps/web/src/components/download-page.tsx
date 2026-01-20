import { Button } from "./ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download01FreeIcons, AppleFreeIcons, ComputerFreeIcons, TickDouble01FreeIcons } from "@hugeicons/core-free-icons";
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

const features = [
    "Full desktop experience with native performance",
    "Works with any Convex project",
    "Auto-updates to the latest version",
    "Secure local authentication storage",
];

export function DownloadPage() {
    const version = "1.0.0";
    const macDownloadUrl = `https://github.com/robertalv/convex-panel/releases/download/v${version}/Convex.Panel_${version}_aarch64.dmg`;
    const windowsDownloadUrl = `https://github.com/robertalv/convex-panel/releases/download/v${version}/Convex.Panel_${version}_x64-setup.exe`;
    const androidDownloadUrl = `https://github.com/robertalv/convex-panel/releases/download/v${version}/convex-panel-mobile-${version}.apk`;

    return (
        <section className="mt-[80px] lg:mt-[140px] min-h-[530px] relative">
            <div className="max-w-4xl mx-auto px-4">
                <AnimatedGroup
                    variants={{
                        container: {
                            visible: {
                                transition: {
                                    staggerChildren: 0.1,
                                    delayChildren: 0.2,
                                },
                            },
                        },
                        ...transitionVariants,
                    }}
                    className="flex flex-col items-center text-center"
                >
                    {/* Header */}
                    <div className="space-y-4 mb-12">
                        <h1 className="text-4xl md:text-5xl font-serif text-content-primary">
                            Download Convex Panel
                        </h1>
                        <p className="text-lg text-content-secondary max-w-2xl mx-auto">
                            Get the full desktop experience. Debug your Convex apps with a native application that&apos;s always ready when you need it.
                        </p>
                        <p className="text-sm text-content-tertiary">
                            Version {version} · Free and open source
                        </p>
                    </div>

                    {/* Download Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-12 w-full sm:w-auto">
                        <a
                            href={macDownloadUrl}
                            className="w-full sm:w-auto"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button
                                size="lg"
                                className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-white px-8 py-6 text-lg gap-3"
                            >
                                <HugeiconsIcon icon={AppleFreeIcons} className="w-6 h-6" />
                                <span className="flex flex-col items-start">
                                    <span className="text-xs opacity-80">Download for</span>
                                    <span>macOS (Apple Silicon)</span>
                                </span>
                                <HugeiconsIcon icon={Download01FreeIcons} className="w-5 h-5 ml-2" />
                            </Button>
                        </a>

                        <a
                            href={windowsDownloadUrl}
                            className="w-full sm:w-auto"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full sm:w-auto border-border hover:bg-background-secondary px-8 py-6 text-lg gap-3"
                            >
                                <HugeiconsIcon icon={ComputerFreeIcons} className="w-6 h-6" />
                                <span className="flex flex-col items-start">
                                    <span className="text-xs opacity-80">Download for</span>
                                    <span>Windows (x64)</span>
                                </span>
                                <HugeiconsIcon icon={Download01FreeIcons} className="w-5 h-5 ml-2" />
                            </Button>
                        </a>

                        <a
                            href={androidDownloadUrl}
                            className="w-full sm:w-auto"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full sm:w-auto border-border hover:bg-background-secondary px-8 py-6 text-lg gap-3"
                            >
                                <HugeiconsIcon icon={ComputerFreeIcons} className="w-6 h-6" />
                                <span className="flex flex-col items-start">
                                    <span className="text-xs opacity-80">Download for</span>
                                    <span>Android</span>
                                </span>
                                <HugeiconsIcon icon={Download01FreeIcons} className="w-5 h-5 ml-2" />
                            </Button>
                        </a>
                    </div>

                    {/* Features */}
                    <div className="bg-background-secondary/50 backdrop-blur-sm border border-border rounded-2xl p-8 w-full max-w-lg">
                        <h2 className="text-lg font-semibold text-content-primary mb-4">
                            What you get
                        </h2>
                        <ul className="space-y-3 text-left">
                            {features.map((feature, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <HugeiconsIcon
                                        icon={TickDouble01FreeIcons}
                                        className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"
                                    />
                                    <span className="text-content-secondary">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* System Requirements */}
                    <div className="mt-12 text-sm text-content-tertiary space-y-2">
                        <p>
                            <strong className="text-content-secondary">macOS:</strong>{" "}
                            macOS 10.15 (Catalina) or later, Apple Silicon (M1/M2/M3)
                        </p>
                        <p>
                            <strong className="text-content-secondary">Windows:</strong>{" "}
                            Windows 10 or later, 64-bit
                        </p>
                        <p>
                            <strong className="text-content-secondary">Android:</strong>{" "}
                            Android 6.0 (API level 23) or later
                        </p>
                    </div>

                    {/* Alternative */}
                    <div className="mt-8 p-4 bg-background-tertiary/30 rounded-lg border border-border/50">
                        <p className="text-sm text-content-secondary">
                            Prefer using the browser version?{" "}
                            <a
                                href="/docs"
                                className="text-accent hover:underline"
                            >
                                Check out our installation guide
                            </a>{" "}
                            for the npm package.
                        </p>
                    </div>
                </AnimatedGroup>
            </div>
        </section>
    );
}
