"use client";

import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import CentralPreview from "@/components/CentralPreview";
import CodeEditor from "@/components/CodeEditor";
import RightSettings from "@/components/RightSettings";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-[#1E1E1E] overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar />

        {/* Central Area - Preview + Code Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Game Preview */}
          <CentralPreview />

          {/* Code Editor */}
          <CodeEditor />
        </div>

        {/* Right Settings Panel */}
        <RightSettings />
      </div>
    </div>
  );
}
