import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareBridge — Understand your discharge instructions",
  description:
    "A simple tool to explain synthetic discharge instructions and trace follow-up tasks to their source text.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
