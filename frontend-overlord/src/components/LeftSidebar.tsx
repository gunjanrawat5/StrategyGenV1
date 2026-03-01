"use client";

import { useState } from "react";
import CodeEditor from "@/components/CodeEditor";

interface LeftSidebarProps {
  isGenerating: boolean;
  statusText: string;
  onGenerate: (prompt: string) => void;
  gameUrl: string | null;
}

const PUBLIC_SHARE_ORIGIN = process.env.NEXT_PUBLIC_SHARE_ORIGIN?.replace(/\/$/, "");

function toShareUrl(gameUrl: string): string {
  if (gameUrl.startsWith("http://") || gameUrl.startsWith("https://")) {
    return gameUrl;
  }
  if (PUBLIC_SHARE_ORIGIN) {
    return `${PUBLIC_SHARE_ORIGIN}${gameUrl.startsWith("/") ? "" : "/"}${gameUrl}`;
  }
  if (typeof window === "undefined") {
    return gameUrl;
  }
  return `${window.location.origin}${gameUrl.startsWith("/") ? "" : "/"}${gameUrl}`;
}

export default function LeftSidebar({ isGenerating, statusText, onGenerate, gameUrl }: LeftSidebarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!gameUrl) return;
    const shareUrl = toShareUrl(gameUrl);
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const shareUrl = gameUrl ? toShareUrl(gameUrl) : null;

  return (
    <aside className="w-80 bg-[#1E1E1E] border-r border-[#374151] flex flex-col h-full">
      <div className="py-4">
        <CodeEditor isGenerating={isGenerating} statusText={statusText} onGenerate={onGenerate} />
      </div>
      {shareUrl && (
        <div className="mx-4 mt-2 rounded-xl border border-[#374151] bg-[#1E1E1E] p-3">
          <div className="text-xs text-[#9CA3AF] mb-2 uppercase tracking-wider">Share Game Link</div>
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="block text-xs text-[#60A5FA] hover:text-[#93C5FD] break-all"
          >
            {shareUrl}
          </a>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 rounded-md bg-[#2D3748] px-3 py-1.5 text-xs text-white hover:bg-[#374151]"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-md bg-[#2563EB] px-3 py-1.5 text-center text-xs text-white hover:bg-[#1D4ED8]"
            >
              Open
            </a>
          </div>
        </div>
      )}
    </aside>
  );
}
