import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const display = localFont({
  src: "./fonts/BigShouldersDisplay.woff2",
  variable: "--font-display-next",
  weight: "100 900",
  display: "swap",
  preload: true,
});

const body = localFont({
  src: "./fonts/BricolageGrotesque.woff2",
  variable: "--font-body-next",
  weight: "200 800",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Abhishek Kumar T | Aspiring Full Stack Developer",
  description:
    "Abhishek Kumar T builds full-stack web apps and machine-learning tools with Python, Flask, React and Next.js, and ships them in public.",
  openGraph: {
    type: "website",
    title: "Abhishek Kumar T | Aspiring Full Stack Developer",
    description:
      "Full-stack web apps and machine-learning tools, built in public from Mandya, Karnataka.",
    url: siteUrl,
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Abhishek Kumar T" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Abhishek Kumar T | Aspiring Full Stack Developer",
    description: "Full-stack web apps and machine-learning tools, built in public.",
    images: ["/og-image.webp"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicons/favicon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/favicons/apple-touch-icon.png",
  },
  manifest: "/favicons/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#050506",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} locked`}>
      <head>
        {/* Without JS the page must still scroll and read. */}
        <noscript>
          <style>{`html.locked{overflow:auto}`}</style>
        </noscript>
      </head>
      <body>
        <a className="skip" href="#page">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
