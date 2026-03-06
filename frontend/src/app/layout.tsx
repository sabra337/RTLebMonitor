import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import "./globals.css";

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Lebanon Monitor | Live Situational Awareness",
  description: "Real-time monitoring and situational awareness platform for Lebanon",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={robotoMono.className}>
        <div className="grid-overlay" style={{ position: 'fixed', inset: 0, opacity: 0.05, pointerEvents: 'none', zIndex: -1 }}></div>
        {children}
      </body>
    </html>
  );
}
