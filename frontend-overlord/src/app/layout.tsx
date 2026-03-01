import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Overlord - Creator Studio",
  description: "Advanced game development dashboard powered by AI. Create, iterate, and deploy games with intelligent assistance.",
  keywords: ["Overlord", "Game Development", "Creator Studio", "AI", "Next.js", "TypeScript"],
  authors: [{ name: "Overlord Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Overlord - Creator Studio",
    description: "Advanced game development dashboard powered by AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#1E1E1E] text-white`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
