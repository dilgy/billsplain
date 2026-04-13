import type { Metadata } from "next";
import { Outfit, Syne, Space_Grotesk, DM_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "BillSplain — Don't Read Bills. Let Us BillSplain.",
  description:
    "Legislation intelligence for your business. Every bill that could affect your operations — monitored, analyzed, and explained before it becomes law.",
  openGraph: {
    title: "BillSplain — Legislation Intelligence for Your Business",
    description:
      "Don't read bills. Let us BillSplain. AI-powered monitoring across 50 states.",
    siteName: "BillSplain",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${syne.variable} ${spaceGrotesk.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-space-grotesk)]">
        {children}
      </body>
    </html>
  );
}
