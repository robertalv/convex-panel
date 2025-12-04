'use client'

import { Button } from './ui/button'
import { ComputerTerminal01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useState } from 'react'

export function CopyButton() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText("npm install convex-panel@latest");
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <Button
      asChild
      size="lg"
      className="rounded-xl px-5 text-base font-mono flex items-center cursor-pointer bg-background-primary dark:bg-white backdrop-blur-sm hover:bg-black/5 dark:hover:bg-white/90 transition-colors"
      onClick={handleCopy}>
      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={ComputerTerminal01Icon} className="size-4 animate-bounce text-black" />
        <span className="relative">
          <span className={`absolute left-0 text-black transition-all duration-200 ${copied ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            Copied!
          </span>
          <span className={`text-black transition-all duration-200 ${copied ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}`}>
            npm <span className="text-accent">install convex-panel@latest</span>
          </span>
        </span>
      </div>
    </Button>
  )
} 