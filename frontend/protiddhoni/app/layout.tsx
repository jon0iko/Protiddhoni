import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className="scroll-smooth">
      <body
        className={`${kalpurush.variable} font-kalpurush antialiased min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
