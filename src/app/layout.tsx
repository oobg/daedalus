import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Space Raven — Building Guide Editor",
  description: "2.5D floor plan guide editor",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
