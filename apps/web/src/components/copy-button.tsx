import { Button } from './ui/button'
import { Terminal } from 'lucide-react'
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
      className="rounded-xl px-5 text-base font-mono flex items-center cursor-pointer"
      onClick={handleCopy}>
      <div className="flex items-center gap-2">
        <Terminal className="size-4 animate-bounce" />
        <span className="relative">
          <span className={`absolute left-0 transition-all duration-200 ${copied ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            Copied!
          </span>
          <span className={`transition-all duration-200 ${copied ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}`}>
            npm <span className="text-red-500">install convex-panel@latest</span>
          </span>
        </span>
      </div>
    </Button>
  )
} 