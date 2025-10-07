import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const kalpurush = localFont({
  src: "../public/fonts/Kalpurush.ttf",
  variable: "--font-kalpurush",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "প্রতিধ্বনি - Protiddhoni",
  description: "বাংলা সাহিত্যের ডিজিটাল প্ল্যাটফর্ম - Bengali Digital Storytelling Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body
        className={`${kalpurush.variable} font-kalpurush antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
