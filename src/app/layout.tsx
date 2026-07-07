import type { Metadata, Viewport } from "next";
import { Crimson_Pro, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-crimson",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-sserif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jbmono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NATURALIS FUTURA — A Bestiary of AI Risk",
  description:
    "An interactive cartographic bestiary mapping AI threats through myth, nature, and science fiction. Every danger that advanced AI systems could pose to humanity has already appeared, in some form, in nature, myth, or story.",
};

export const viewport: Viewport = {
  // Matches the intro screen and dungeon map — the app's default surfaces.
  themeColor: "#0e0c0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${crimsonPro.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
