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
  title: "AI Technical Interviewer - Practice Smarter",
  description: "Practice technical interviews with an AI interviewer that adapts to your skill level in real-time. DSA, System Design, and HR questions.",
  keywords: ["interview", "technical interview", "AI interviewer", "DSA", "system design", "practice", "mock interview"],
  authors: [{ name: "AI Interviewer" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "AI Technical Interviewer",
    description: "Practice technical interviews with adaptive AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Technical Interviewer",
    description: "Practice technical interviews with adaptive AI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
