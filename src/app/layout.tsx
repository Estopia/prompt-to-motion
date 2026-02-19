import { Metadata, Viewport } from "next";
import "../../styles/global.css";

export const metadata: Metadata = {
  title: "MotionForge - AI Motion Graphics from Prompts",
  description:
    "Create professional motion graphics and animations from a single prompt. AI-powered, powered by Remotion.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background">{children}</body>
    </html>
  );
}
