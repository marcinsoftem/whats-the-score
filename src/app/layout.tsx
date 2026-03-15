import type { Metadata } from "next";
import { Home as HomeIcon, Trophy, Users, User as UserIcon } from "lucide-react";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "What's the Score? | WTS",
  description: "Track your squash match results with ease.",
  manifest: "/manifest.json",
};

import Navbar from "@/components/layout/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen pb-20">
        <main className="max-w-md mx-auto px-4 pt-6">
          {children}
        </main>
        
        <Navbar />
      </body>
    </html>
  );
}
