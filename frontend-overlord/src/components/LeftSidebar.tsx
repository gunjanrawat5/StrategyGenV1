"use client";

import { useState } from "react";
import {
  LayoutGrid,
  User,
  Box,
  Pencil,
  HelpCircle,
  Settings,
  ChevronDown,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  Music,
  User as UserIcon,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Entity {
  id: string;
  name: string;
  type: "player" | "enemy" | "platform" | "coin";
  active: boolean;
}

const entities: Entity[] = [
  { id: "1", name: "Player", type: "player", active: true },
  { id: "2", name: "Enemy_Bot", type: "enemy", active: false },
  { id: "3", name: "Platform_Base", type: "platform", active: false },
  { id: "4", name: "Coin_Pickup", type: "coin", active: false },
];

const navItems = [
  { icon: LayoutGrid, label: "Assets", active: true },
  { icon: User, label: "Profile" },
  { icon: Box, label: "Models" },
  { icon: Pencil, label: "Editor" },
  { icon: HelpCircle, label: "Help" },
  { icon: Settings, label: "Settings" },
];

function getEntityIcon(type: Entity["type"]) {
  switch (type) {
    case "player":
      return <UserIcon className="w-4 h-4 text-[#3B82F6]" />;
    case "enemy":
      return <Box className="w-4 h-4 text-red-500" />;
    case "platform":
      return <Box className="w-4 h-4 text-gray-400" />;
    case "coin":
      return <Box className="w-4 h-4 text-orange-500" />;
  }
}

export default function LeftSidebar() {
  const [entitiesExpanded, setEntitiesExpanded] = useState(true);
  const [activeNav, setActiveNav] = useState("Assets");

  return (
    <aside className="w-72 bg-[#1E1E1E] border-r border-[#374151] flex flex-col h-full">
      {/* Title */}
      <div className="px-4 py-3 border-b border-[#374151]">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-[#9CA3AF] tracking-wider uppercase">
            Assets & Entities
          </h2>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF00FF]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#FFA500]" />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex gap-1 p-2 border-b border-[#374151]">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => setActiveNav(item.label)}
            className={cn(
              "p-2 rounded-lg transition-all duration-200",
              activeNav === item.label
                ? "bg-[#3B82F6] text-white"
                : "text-gray-500 hover:bg-[#2D3748] hover:text-gray-300"
            )}
            title={item.label}
          >
            <item.icon className="w-4 h-4" />
          </button>
        ))}
      </nav>

      {/* Entities Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2">
          <button
            onClick={() => setEntitiesExpanded(!entitiesExpanded)}
            className="flex items-center gap-2 w-full text-left hover:bg-[#2D3748] px-2 py-1.5 rounded-lg transition-colors"
          >
            {entitiesExpanded ? (
              <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
            )}
            <span className="text-sm font-medium text-white">Entities</span>
            <span className="ml-auto text-xs text-[#9CA3AF] bg-[#2D3748] px-2 py-0.5 rounded-full">
              {entities.length}
            </span>
          </button>

          {entitiesExpanded && (
            <div className="mt-2 space-y-1 ml-6">
              {entities.map((entity) => (
                <button
                  key={entity.id}
                  className={cn(
                    "flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg transition-all duration-200",
                    entity.active
                      ? "bg-[#3B82F6]/20 border border-[#3B82F6]/50"
                      : "hover:bg-[#2D3748] border border-transparent"
                  )}
                >
                  {getEntityIcon(entity.type)}
                  <span className={cn(
                    "text-sm",
                    entity.active ? "text-white" : "text-[#9CA3AF]"
                  )}>
                    {entity.name}
                  </span>
                  {entity.active && (
                    <span className="ml-auto text-xs text-[#00D4FF] bg-[#00D4FF]/10 px-2 py-0.5 rounded">
                      Active
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Upload Assets Section */}
        <div className="px-4 py-4 border-t border-[#374151] mt-4">
          <div className="border-2 border-dashed border-[#374151] rounded-lg p-6 text-center hover:border-[#3B82F6] transition-colors cursor-pointer">
            <Upload className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
            <p className="text-sm text-[#9CA3AF]">Drag & Drop</p>
            <p className="text-xs text-gray-600 mt-1">or click to upload</p>
          </div>

          <div className="flex gap-2 mt-4">
            <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#2D3748] hover:bg-[#374151] rounded-lg transition-colors">
              <ImageIcon className="w-4 h-4 text-[#00D4FF]" />
              <span className="text-xs text-[#9CA3AF]">Image</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#2D3748] hover:bg-[#374151] rounded-lg transition-colors">
              <Package className="w-4 h-4 text-[#FF00FF]" />
              <span className="text-xs text-[#9CA3AF]">3D Model</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#2D3748] hover:bg-[#374151] rounded-lg transition-colors">
              <Music className="w-4 h-4 text-[#FFA500]" />
              <span className="text-xs text-[#9CA3AF]">Audio</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
