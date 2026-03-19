import type { Metadata } from "next";
import { Home as HomeIcon, Trophy, Users, User as UserIcon } from "lucide-react";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "What's the Score? | WTS",
  description: "Track your squash match results with ease.",
  manifest: "/manifest.json",
  themeColor: "#C6FF00",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WTS",
  },
  icons: {
    apple: [
      { url: "/icons/squash-ball-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/squash-ball-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

import Navbar from "@/components/layout/Navbar";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className="antialiased min-h-screen pb-20">
        <LanguageProvider>
          <main className="max-w-md mx-auto px-4 pt-6">
            {children}
          </main>
          
          <Navbar />
        </LanguageProvider>
      </body>
    </html>
  );
}
