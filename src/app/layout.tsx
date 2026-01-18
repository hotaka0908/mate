import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orchestra - LLM Interface",
  description: "LLM chat interface with app connections",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
