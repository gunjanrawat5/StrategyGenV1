"use client";

import { useState } from "react";
import { Send, Sparkles } from "lucide-react";

interface CodeEditorProps {
  isGenerating: boolean;
  statusText: string;
  onGenerate: (prompt: string) => void;
  className?: string;
}

export default function CodeEditor({ isGenerating, statusText, onGenerate, className }: CodeEditorProps) {
  const [prompt, setPrompt] = useState("");

  const handleGenerate = () => {
    const trimmed = prompt.trim();
    if (!trimmed || isGenerating) return;
    onGenerate(trimmed);
  };

  return (
    <div className={className}>
      <div className="mx-4 mb-4 rounded-xl border border-[#374151] bg-[#1E1E1E]/95 backdrop-blur-sm">
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <Sparkles className="w-4 h-4 text-[#FF00FF]" />
          <span className="text-sm font-medium text-white">Omnibar</span>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <input
              type="text"
              value={prompt}
              disabled={isGenerating}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the game you want to generate..."
              className="w-full bg-[#2D3748] border-2 border-[#3B82F6] rounded-lg px-4 py-2.5 text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50 transition-all"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleGenerate();
                }
              }}
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#3B82F6] hover:bg-[#3B82F6]/80 disabled:bg-[#374151] disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="mt-2 text-xs text-[#9CA3AF]">{statusText}</div>
        </div>
      </div>
    </div>
  );
}
