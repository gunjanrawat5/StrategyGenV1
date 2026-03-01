"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      richColors
      theme="dark"
      position="bottom-right"
      toastOptions={{
        style: {
          background: "#1E1E1E",
          border: "1px solid #2a2a2a",
          color: "#fff",
        },
      }}
    />
  );
}
