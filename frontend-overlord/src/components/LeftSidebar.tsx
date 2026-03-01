"use client";

import CodeEditor from "@/components/CodeEditor";

interface LeftSidebarProps {
  isGenerating: boolean;
  statusText: string;
  onGenerate: (prompt: string) => void;
}

export default function LeftSidebar({ isGenerating, statusText, onGenerate }: LeftSidebarProps) {
  return (
    <aside className="w-80 bg-[#1E1E1E] border-r border-[#374151] flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[#374151]">
        <h2 className="text-xs font-semibold text-[#9CA3AF] tracking-wider uppercase">Prompt</h2>
      </div>
      <div className="py-4">
        <CodeEditor isGenerating={isGenerating} statusText={statusText} onGenerate={onGenerate} />
      </div>
    </aside>
  );
}
