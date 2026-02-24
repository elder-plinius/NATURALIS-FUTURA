import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TABULA LATENTIUM — Map of Hidden Things",
  description:
    "An interactive cartographic interface mapping the territory of AI threats through myth, nature, and science fiction. Every danger that advanced AI systems could pose to humanity has already appeared, in some form, in nature, myth, or story.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
