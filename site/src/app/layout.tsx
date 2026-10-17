import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// Excalidraw's own fonts, for the hand-drawn diagrams: Excalifont (Latin subset) and Cascadia Code. Both OFL-1.1.
const excalifont = localFont({ src: "./fonts/Excalifont-Latin.woff2", variable: "--font-excalifont", display: "block" });
const cascadia = localFont({ src: "./fonts/CascadiaCode-Regular.woff2", variable: "--font-cascadia", display: "block" });

export const metadata: Metadata = {
  title: "Web data API benchmark for agents: search, scrape, map and crawl",
  description:
    "Nine web data APIs graded on whether an agent got the right answer: task success, cost per finished task and time, with confidence intervals.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The page is a dark plate by design, so the dark tokens always apply.
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable} ${excalifont.variable} ${cascadia.variable} dark h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
