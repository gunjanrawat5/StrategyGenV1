"use client";

import { MoreVertical, Maximize2 } from "lucide-react";

interface CentralPreviewProps {
  gameUrl: string | null;
  isGenerating: boolean;
  statusText: string;
  error: string | null;
}

export default function CentralPreview({ gameUrl, isGenerating, statusText, error }: CentralPreviewProps) {
  return (
    <div className="flex-1 flex flex-col bg-[#1E1E1E] h-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#374151]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-white">Live Preview (Level 1)</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-[#2D3748] rounded-lg transition-colors">
            <Maximize2 className="w-4 h-4 text-[#9CA3AF]" />
          </button>
          <button className="p-1.5 hover:bg-[#2D3748] rounded-lg transition-colors">
            <MoreVertical className="w-4 h-4 text-[#9CA3AF]" />
          </button>
        </div>
      </div>

      {/* Game Preview Window */}
      <div className="flex-1 relative overflow-hidden">
        {gameUrl ? (
          <iframe
            title="Generated Game"
            src={gameUrl}
            className="w-full h-full border-0"
            allow="fullscreen"
          />
        ) : (
          <>
        {/* Cyberpunk cityscape background simulation */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(180deg, 
                #0a0a0a 0%, 
                #1a0a2e 30%, 
                #0d1b2a 60%, 
                #1E1E1E 100%
              )
            `
          }}
        >
          {/* Grid lines for cyberpunk effect */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, #00D4FF 1px, transparent 1px),
                linear-gradient(to bottom, #00D4FF 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
          />
          
          {/* Horizon glow */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-48"
            style={{
              background: 'linear-gradient(to top, rgba(255,0,255,0.2) 0%, transparent 100%)'
            }}
          />

          {/* Neon accent lights */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#00D4FF] rounded-full blur-3xl opacity-10" />
          <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-[#FF00FF] rounded-full blur-3xl opacity-10" />
          <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-[#FFA500] rounded-full blur-3xl opacity-10" />

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-white/80 mb-2 tracking-wider">
                LIVE GAME PREVIEW
              </div>
              <div className="text-sm text-[#9CA3AF]">
                (HTML5/WebGL Canvas)
              </div>
              <div className="text-xs text-[#9CA3AF] mt-2">{statusText}</div>
              {error && <div className="text-xs text-red-400 mt-2 max-w-lg">{error}</div>}
            </div>
          </div>

          {/* Stats overlay */}
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-[#9CA3AF]">FPS:</span>
                <span className="text-green-400 font-mono">60</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[#9CA3AF]">Entities:</span>
                <span className="text-[#00D4FF] font-mono">4</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[#9CA3AF]">Draw Calls:</span>
                <span className="text-[#FFA500] font-mono">128</span>
              </div>
            </div>
          </div>

          {/* Level indicator */}
          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#9CA3AF]">LEVEL</span>
              <span className="text-lg font-bold text-[#FF00FF]">1</span>
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
