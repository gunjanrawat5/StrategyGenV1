"use client";

import { Cpu, Zap } from "lucide-react";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-[#1E1E1E] border-b border-[#374151]">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-[#00D4FF]" />
          <h1 className="text-xl font-bold text-white tracking-wider">OVERLORD</h1>
        </div>
        <span className="text-sm text-[#9CA3AF] font-light">Creator Studio</span>
      </div>

      {/* Right: Status Indicator */}
      <div className="flex items-center gap-3 bg-[#2D3748] px-4 py-2 rounded-lg">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#00D4FF]" />
          <span className="text-sm text-white font-medium">H200 Online</span>
        </div>
        <div className="w-px h-4 bg-[#374151]" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-[#9CA3AF]">VRAM: 98/141GB</span>
        </div>
      </div>
    </header>
  );
}
