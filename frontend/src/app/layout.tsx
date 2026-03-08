import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lebanon Monitor | Live Situational Awareness",
  description: "Real-time monitoring and situational awareness platform for Lebanon",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="grid-overlay" style={{ position: 'fixed', inset: 0, opacity: 0.05, pointerEvents: 'none', zIndex: -1 }}></div>
        {children}
      </body>
    </html>
  );
}
