import type {Metadata, Viewport} from "next";
import {Geist_Mono, Plus_Jakarta_Sans} from "next/font/google";
import {AppChrome} from "@/components/AppChrome";
import {MidnightProvider} from "@/providers/MidnightProvider";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans-ui",
  weight: ["400", "500", "600", "700", "800"],
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Hushh Protocol · send silently.",
  description:
    "Own your .night name, link your X, and send NIGHT on Midnight. Tips are sealed to the recipient and claimed with a zero-knowledge proof.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body
        className={`${sans.variable} ${geistMono.variable} paper-surface min-h-dvh font-sans text-ink antialiased`}
      >
        <MidnightProvider>
          <AppChrome>{children}</AppChrome>
        </MidnightProvider>
      </body>
    </html>
  );
}
