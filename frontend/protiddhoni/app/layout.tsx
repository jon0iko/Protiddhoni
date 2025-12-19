import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { AuthProvider } from "@/contexts/AuthContext";

const kalpurush = localFont({
  src: "../public/fonts/Kalpurush.ttf",
  variable: "--font-kalpurush",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "প্রতিধ্বনি - Protiddhoni",
  description: "বাংলা সাহিত্যের ডিজিটাল প্ল্যাটফর্ম - Bengali Digital Storytelling Platform",
  keywords: "বাংলা সাহিত্য, গল্প, কবিতা, ধারাবাহিক, Bengali literature, stories, poems",
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode;}>) {
  return (
    <html lang="bn" className="scroll-smooth">
      <body
        className={`${kalpurush.variable} font-kalpurush antialiased min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
