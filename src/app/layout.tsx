import type { Metadata } from "next";
import "./globals.css";
import "./empty-state.css";

export const metadata: Metadata = {
  title: "NicheFlow OS",
  description: "Content orchestration for governed, SEO-ready publishing.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
