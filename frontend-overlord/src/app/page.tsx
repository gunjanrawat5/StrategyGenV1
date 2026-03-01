"use client";

import { useState } from "react";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import CentralPreview from "@/components/CentralPreview";
import RightSettings from "@/components/RightSettings";

type JobStatus = "designing" | "building" | "testing" | "ready" | "failed";

interface CreateJobResponse {
  job_id: string;
  status: JobStatus;
}

interface JobResponse {
  status: JobStatus;
  error: string | null;
  game_url: string | null;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toAbsoluteGameUrl(gameUrl: string): string {
  if (gameUrl.startsWith("http://") || gameUrl.startsWith("https://")) {
    return gameUrl;
  }
  return gameUrl.startsWith("/") ? gameUrl : `/${gameUrl}`;
}

export default function Home() {
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Submit a prompt to generate a game.");
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (prompt: string) => {
    setIsGenerating(true);
    setError(null);
    setGameUrl(null);
    setStatusText("Creating generation job...");

    try {
      const createResponse = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, mode: "new" }),
      });

      if (!createResponse.ok) {
        const bodyText = await createResponse.text();
        throw new Error(bodyText || "Failed to create generation job.");
      }

      const created = (await createResponse.json()) as CreateJobResponse;
      let status = created.status;
      setStatusText(`Job ${created.job_id.slice(0, 8)} started (${status}).`);

      for (let attempt = 0; attempt < 120; attempt += 1) {
        await wait(1500);

        const jobResponse = await fetch(`/api/generate/${created.job_id}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!jobResponse.ok) {
          const bodyText = await jobResponse.text();
          throw new Error(bodyText || "Failed to fetch job status.");
        }

        const job = (await jobResponse.json()) as JobResponse;
        status = job.status;
        setStatusText(`Generating game: ${status}`);

        if (status === "ready") {
          if (!job.game_url) {
            throw new Error("Game finished but no game URL was returned.");
          }
          setGameUrl(toAbsoluteGameUrl(job.game_url));
          setStatusText("Game ready.");
          return;
        }

        if (status === "failed") {
          throw new Error(job.error || "Game generation failed.");
        }
      }

      throw new Error("Timed out while waiting for the game to be ready.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected generation error.";
      setError(message);
      setStatusText("Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#1E1E1E] overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar
          isGenerating={isGenerating}
          statusText={statusText}
          onGenerate={handleGenerate}
          gameUrl={gameUrl}
        />

        {/* Central Area - Full Preview */}
        <div className="flex-1 relative overflow-hidden">
          <CentralPreview
            gameUrl={gameUrl}
            isGenerating={isGenerating}
            statusText={statusText}
            error={error}
          />
        </div>

        {/* Right Settings Panel */}
        <RightSettings />
      </div>
    </div>
  );
}
