import type { Metadata, Viewport } from "next";
import "./globals.css";

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
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
