import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "HackRails | Organizer Control Plane",
  description: "Sponsored MCP tools on Hedera",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
