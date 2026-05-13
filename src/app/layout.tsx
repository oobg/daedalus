import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Space Raven — Building Guide Editor",
  description: "2.5D floor plan guide editor",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
