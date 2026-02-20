import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DocuMind - AI Knowledge Base",
  description: "Upload documents and chat with your knowledge base using AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider>
          <Sidebar />
          {/* Main content offset by sidebar width on desktop, by top bar height on mobile */}
          <main className="min-h-screen pt-14 md:pt-0 md:pl-60">
            <div className="mx-auto max-w-6xl p-6">{children}</div>
          </main>
        </TooltipProvider>
      </body>
    </html>
  );
}
