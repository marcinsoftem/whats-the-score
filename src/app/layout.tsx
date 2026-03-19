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
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side check
  console.log('Server-side Supabase check:', {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    urlLength: (process.env.NEXT_PUBLIC_SUPABASE_URL || '').length
  });

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
