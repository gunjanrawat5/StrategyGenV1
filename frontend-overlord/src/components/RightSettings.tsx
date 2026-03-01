"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Gamepad2,
  Brain,
  Sliders,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function RightSettings() {
  const [aiSettingsExpanded, setAiSettingsExpanded] = useState(true);
  const [gravityEnabled, setGravityEnabled] = useState(true);
  const [enemiesEnabled, setEnemiesEnabled] = useState(true);
  const [doubleJumpEnabled, setDoubleJumpEnabled] = useState(true);
  const [temperature, setTemperature] = useState([0.7]);
  const [topP, setTopP] = useState([0.9]);
  const [contextLength, setContextLength] = useState([32]);

  return (
    <aside className="w-80 bg-[#1E1E1E] border-l border-[#374151] flex flex-col h-full overflow-y-auto">
      {/* Title */}
      <div className="px-4 py-3 border-b border-[#374151]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#00D4FF]" />
            <h2 className="text-xs font-semibold text-[#9CA3AF] tracking-wider uppercase">
              Game Studio Settings
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF00FF]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#FFA500]" />
          </div>
        </div>
      </div>

      {/* Game Rules Section */}
      <div className="px-4 py-4 border-b border-[#374151]">
        <div className="flex items-center gap-2 mb-4">
          <Gamepad2 className="w-4 h-4 text-[#FF00FF]" />
          <h3 className="text-sm font-medium text-white">Game Rules</h3>
        </div>

        {/* Dropdowns */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-[#9CA3AF] uppercase tracking-wider">Genre</Label>
            <Select defaultValue="platformer">
              <SelectTrigger className="bg-[#2D3748] border-[#374151] text-white">
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent className="bg-[#2D3748] border-[#374151]">
                <SelectItem value="platformer">Platformer</SelectItem>
                <SelectItem value="rpg">RPG</SelectItem>
                <SelectItem value="shooter">Shooter</SelectItem>
                <SelectItem value="puzzle">Puzzle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-[#9CA3AF] uppercase tracking-wider">Theme</Label>
            <Select defaultValue="cyberpunk">
              <SelectTrigger className="bg-[#2D3748] border-[#374151] text-white">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent className="bg-[#2D3748] border-[#374151]">
                <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
                <SelectItem value="fantasy">Fantasy</SelectItem>
                <SelectItem value="scifi">Sci-Fi</SelectItem>
                <SelectItem value="retro">Retro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-[#9CA3AF] uppercase tracking-wider">Perspective</Label>
            <Select defaultValue="2d-side">
              <SelectTrigger className="bg-[#2D3748] border-[#374151] text-white">
                <SelectValue placeholder="Select perspective" />
              </SelectTrigger>
              <SelectContent className="bg-[#2D3748] border-[#374151]">
                <SelectItem value="2d-side">2D Side-Scroller</SelectItem>
                <SelectItem value="2d-top">2D Top-Down</SelectItem>
                <SelectItem value="3d-third">3D Third Person</SelectItem>
                <SelectItem value="3d-first">3D First Person</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Toggle Switches */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-[#9CA3AF]">Enable Gravity</Label>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs",
                gravityEnabled ? "text-[#3B82F6]" : "text-gray-500"
              )}>
                {gravityEnabled ? "ON" : "OFF"}
              </span>
              <Switch
                checked={gravityEnabled}
                onCheckedChange={setGravityEnabled}
                className="data-[state=checked]:bg-[#3B82F6]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm text-[#9CA3AF]">Enable Enemies</Label>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs",
                enemiesEnabled ? "text-[#3B82F6]" : "text-gray-500"
              )}>
                {enemiesEnabled ? "ON" : "OFF"}
              </span>
              <Switch
                checked={enemiesEnabled}
                onCheckedChange={setEnemiesEnabled}
                className="data-[state=checked]:bg-[#3B82F6]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm text-[#9CA3AF]">Double Jump</Label>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs",
                doubleJumpEnabled ? "text-[#3B82F6]" : "text-gray-500"
              )}>
                {doubleJumpEnabled ? "ON" : "OFF"}
              </span>
              <Switch
                checked={doubleJumpEnabled}
                onCheckedChange={setDoubleJumpEnabled}
                className="data-[state=checked]:bg-[#3B82F6]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Settings Section */}
      <div className="px-4 py-4">
        <button
          onClick={() => setAiSettingsExpanded(!aiSettingsExpanded)}
          className="flex items-center gap-2 w-full text-left hover:bg-[#2D3748] px-2 py-1.5 rounded-lg transition-colors"
        >
          {aiSettingsExpanded ? (
            <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          )}
          <Brain className="w-4 h-4 text-[#FFA500]" />
          <span className="text-sm font-medium text-white">AI Settings</span>
        </button>

        {aiSettingsExpanded && (
          <div className="mt-4 space-y-4 ml-6">
            <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
              Hyperparameters
            </h4>

            {/* Temperature Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-[#9CA3AF]">Temperature</Label>
                <span className="text-xs text-[#00D4FF] font-mono bg-[#2D3748] px-2 py-0.5 rounded">
                  {temperature[0].toFixed(1)}
                </span>
              </div>
              <Slider
                value={temperature}
                onValueChange={setTemperature}
                min={0}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Top P Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-[#9CA3AF]">Top P</Label>
                <span className="text-xs text-[#FF00FF] font-mono bg-[#2D3748] px-2 py-0.5 rounded">
                  {topP[0].toFixed(1)}
                </span>
              </div>
              <Slider
                value={topP}
                onValueChange={setTopP}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Context Length Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-[#9CA3AF]">Context Length</Label>
                <span className="text-xs text-[#FFA500] font-mono bg-[#2D3748] px-2 py-0.5 rounded">
                  {contextLength[0]}k
                </span>
              </div>
              <Slider
                value={contextLength}
                onValueChange={setContextLength}
                min={4}
                max={128}
                step={4}
                className="w-full"
              />
            </div>

            {/* System Prompt Override */}
            <div className="space-y-2">
              <Label className="text-sm text-[#9CA3AF]">System Prompt Override</Label>
              <Textarea
                placeholder="Enter custom system prompt..."
                className="bg-[#2D3748] border-[#374151] text-white placeholder-gray-500 min-h-[80px] resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
