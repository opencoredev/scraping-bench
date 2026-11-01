import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import localFont from "next/font/local";
import { AUTHOR, HOME_TITLE, SITE_NAME, SITE_URL } from "@/lib/site";
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
// Not preloaded: only the diagrams use them, so other pages never download them and the home page fetches them when a diagram renders.
const excalifont = localFont({ src: "./fonts/Excalifont-Latin.woff2", variable: "--font-excalifont", display: "block", preload: false });
const cascadia = localFont({ src: "./fonts/CascadiaCode-Regular.woff2", variable: "--font-cascadia", display: "block", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: HOME_TITLE, template: `%s · ${SITE_NAME}` },
  description:
    "Web data APIs graded on whether an agent got the right answer: task success, cost per finished task and time, with confidence intervals.",
  applicationName: SITE_NAME,
  authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
  // Bing Webmaster Tools ownership. Google's is the HTML file in public/.
  verification: { other: { "msvalidate.01": "1E50C0153B0B411BB1AF8CDFBEB1DCD9" } },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The page is a dark plate by design, so the dark tokens always apply.
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable} ${excalifont.variable} ${cascadia.variable} dark h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
