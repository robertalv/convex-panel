import { Button } from './ui/button'
import { useState } from 'react'

export function ConvexCopyButton() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText("npm create convex@latest");
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
      <div className="flex items-center gap-2 flex-row">
        <div className="animate-pulse">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M7.5 5.54199H9.50079V7.54279H11.5015V9.54358H13.5023V11.5444H11.5015V13.5452H9.50079V15.546H7.5V13.5452H9.50073V11.5444H11.5015V9.54358H9.50073V7.54279H7.5V5.54199Z" fill="#292929"/>
        </svg>
        </div>
        <span className="relative">
          <span className={`absolute left-0 transition-all duration-200 ${copied ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            Copied!
          </span>
          <span className={`transition-all duration-200 ${copied ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}`}>
            npm <span className="text-red-500">create convex@latest</span>
          </span>
        </span>
      </div>
    </Button>
  )
} 