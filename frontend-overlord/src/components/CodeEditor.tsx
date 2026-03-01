"use client";

import { useState } from "react";
import { Code, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const pythonCode = `# Game Logic - game_logic.py
import pygame
from entities import Player, Enemy, Platform, Coin

class GameEngine:
    def __init__(self):
        self.player = Player()
        self.enemies = []
        self.platforms = []
        self.coins = []
        self.score = 0
        self.gravity_enabled = True
        self.double_jump_enabled = True
        
    def update(self, delta_time):
        # Apply gravity
        if self.gravity_enabled:
            self.player.apply_gravity(delta_time)
        
        # Update player position
        self.player.update(delta_time)
        
        # Check collisions
        self.check_collisions()
        
        # Update enemies
        for enemy in self.enemies:
            enemy.update(delta_time)
            
    def handle_jump(self):
        if self.player.on_ground:
            self.player.jump()
        elif self.double_jump_enabled:
            self.player.double_jump()`;

export default function CodeEditor() {
  const [prompt, setPrompt] = useState("");
  const [activeTab, setActiveTab] = useState("game_logic.py");

  const tabs = ["game_logic.py", "entities.py", "config.py"];

  return (
    <div className="bg-[#1E1E1E] border-t border-[#374151]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#374151]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FF00FF]" />
          <span className="text-sm font-medium text-white">Omnibar & Code Editor</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#FF00FF]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#FFA500]" />
        </div>
      </div>

      {/* Omnibar Input */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Create a double jump for the player..."
              className="w-full bg-[#2D3748] border-2 border-[#3B82F6] rounded-lg px-4 py-2.5 text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50 transition-all"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#3B82F6] hover:bg-[#3B82F6]/80 rounded-lg transition-colors">
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#2D3748] hover:bg-[#374151] border border-[#374151] rounded-lg transition-colors">
            <Code className="w-4 h-4 text-[#00D4FF]" />
            <span className="text-sm text-[#9CA3AF]">Code</span>
          </button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="border-t border-[#374151]">
        {/* Tabs */}
        <div className="flex items-center bg-[#2D3748] border-b border-[#374151]">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 text-sm transition-colors border-b-2",
                activeTab === tab
                  ? "text-white border-[#00D4FF] bg-[#1E1E1E]"
                  : "text-[#9CA3AF] border-transparent hover:text-gray-300"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Code Area */}
        <div className="p-4 font-mono text-sm overflow-x-auto max-h-64 overflow-y-auto">
          <pre className="text-[#9CA3AF]">
            {pythonCode.split('\n').map((line, i) => (
              <div key={i} className="flex">
                <span className="select-none text-gray-600 w-8 mr-4 text-right">
                  {i + 1}
                </span>
                <span
                  dangerouslySetInnerHTML={{
                    __html: highlightPython(line)
                  }}
                />
              </div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  );
}

function highlightPython(line: string): string {
  // Simple syntax highlighting
  const keywords = ['import', 'from', 'class', 'def', 'if', 'elif', 'else', 'for', 'while', 'return', 'True', 'False', 'None', 'self'];
  const builtins = ['print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict'];
  
  let result = line
    // Comments
    .replace(/(#.*)$/gm, '<span class="text-gray-500">$1</span>')
    // Strings
    .replace(/(["'])(.*?)\1/g, '<span class="text-green-400">$&</span>')
    // Numbers
    .replace(/\b(\d+)\b/g, '<span class="text-[#FFA500]">$1</span>');
  
  // Keywords
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
    result = result.replace(regex, '<span class="text-[#FF00FF]">$1</span>');
  });
  
  // Builtins
  builtins.forEach(builtin => {
    const regex = new RegExp(`\\b(${builtin})\\b`, 'g');
    result = result.replace(regex, '<span class="text-[#00D4FF]">$1</span>');
  });
  
  // Class names
  result = result.replace(/\b([A-Z][a-zA-Z]+)\b/g, '<span class="text-yellow-300">$1</span>');
  
  return result;
}
